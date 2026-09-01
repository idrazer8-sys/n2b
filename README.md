# Restaurant Table Ordering Platform

QR/NFC → menu → order → pay, no app download. Multi-tenant SaaS for restaurants, built with
Next.js (App Router), PostgreSQL/Prisma, and Stripe + Stripe Connect.

## 1. Architecture

**Stack**
- **Frontend/Backend**: Next.js 14 App Router — one codebase for the customer-facing pages,
  the restaurant dashboard, and the API (as Route Handlers). Chosen over a separate backend
  because the whole product is CRUD + a few real-time/payment flows; a split API service would
  add deploy/ops complexity without a corresponding benefit at this scale, and Vercel's
  serverless model handles the traffic pattern (bursty, per-restaurant) well.
- **Database**: PostgreSQL + Prisma. Relational because orders/payments/menus have real
  referential integrity requirements (see §3) that a document store would make you re-implement
  by hand.
- **Payments**: Stripe Checkout (customer-facing) + Stripe Connect Express (restaurant payouts).
  Checkout instead of a raw Payment Element integration because it gives card + Apple Pay +
  Google Pay with Stripe hosting the sensitive card-entry UI — we never touch card data, which
  also shrinks our PCI scope to "SAQ A."
- **Realtime**: Server-Sent Events (one-directional push from server → dashboard). Simpler than
  WebSockets to run (plain HTTP, no separate socket server, browser auto-reconnects via
  `EventSource`), and orders only ever need to flow one direction: server tells staff "new order."
  **Caveat**: the current implementation (`src/lib/order-events.ts`) is an in-process
  `EventEmitter`, which only works for a single Node.js instance. It's correct for the MVP
  (`next start` on one server) — the moment you run multiple serverless instances/regions, swap
  it for Postgres `LISTEN/NOTIFY` or a hosted pub/sub (Supabase Realtime, Pusher). The
  publish/subscribe call sites are already isolated in that one file so the swap is contained.
- **Auth**: Custom JWT-in-httpOnly-cookie for both staff and customers (`src/lib/auth.ts`,
  `src/lib/customer-session.ts`) rather than a full auth framework — two very different session
  types (long-lived staff login vs. ephemeral no-account customer session) with different
  guarantees needed, and the logic is small enough that a framework would add more surface area
  than it saves.

## 2. Tenant isolation strategy

Every restaurant-scoped table carries a `restaurantId` column. The rule, enforced everywhere:

> **Every query that reads or writes restaurant-owned data filters by `restaurantId`, and that
> `restaurantId` is re-derived from an authorization check — never taken as a trusted client
> input.**

Concretely:
- Staff routes (`/api/restaurants/[restaurantId]/...`) call `requireRestaurantAccess(restaurantId, minRole)`
  (`src/lib/auth.ts`) first. It checks the `RestaurantStaff` join table for the *current session's*
  user — a JWT only ever proves "which user," never "which restaurant" or "what role." A user with
  no membership row for that restaurant gets a 403, identical to the "restaurant doesn't exist"
  response, so IDs can't be enumerated by response-shape.
- Every subsequent `db.*.findFirst`/`update`/`delete` inside that route includes
  `restaurantId: params.restaurantId` in its `where` clause, even after the access check — e.g.
  `db.menuItem.findFirst({ where: { id: params.itemId, restaurantId } })`. This means a valid
  item/table/order ID that belongs to a *different* restaurant simply doesn't match and 404s,
  rather than relying on the access check alone.
- Customer-side isolation uses a different mechanism (§4): a signed session cookie scoped to one
  `restaurantId` + `tableId`, checked against the order's actual `restaurantId`/`customerSessionId`
  before any read or the checkout call.

## 3. Database schema (Prisma — see `prisma/schema.prisma`)

```
User ─┬─< RestaurantStaff >─┬─ Restaurant ─┬─< Table
      │  (role: OWNER/      │              ├─< MenuCategory ─< MenuItem ─< MenuModifier ─< MenuModifierOption
      │   MANAGER/STAFF)    │              ├─< Order
      │                     │              └── StripeAccount (1:1, Connect)
      └─────────────────────┘
Table ──< CustomerSession ──< Order ─┬─< OrderItem ─< OrderItemModifier
                                      └── Payment (1:1)
```

Notable decisions:
- **Money is stored in integer cents** (`priceCents`, `totalCents`, …) everywhere — never floats —
  to avoid rounding drift across cart → order → Stripe.
- **`OrderItem`/`OrderItemModifier` snapshot the name and price at order time**
  (`nameSnapshot`, `unitPriceCents`, `priceDeltaCentsSnapshot`). Menu items can change price
  tomorrow without rewriting yesterday's order history.
- **`Table.token`** (not `Table.id`) is what appears in the public URL — a separate, unguessable
  identifier so table URLs can't be enumerated by walking sequential IDs.
- **`CustomerSession`** is the join between "one visit to one table" and "possibly several
  concurrent `Order`s" — this is what makes §14 (multiple customers, one table, separate
  orders/payments) work: each browser gets its own `CustomerSession`, each session can create
  multiple `Order`s, each `Order` has its own `Payment`.
- **`onDelete: Restrict`** on `Order → Table`, `Order → CustomerSession`, `OrderItem → MenuItem`,
  and `OrderItemModifier → MenuModifierOption` — you cannot delete a table or menu item that has
  order history out from under it; the API instead soft-deletes (`isActive`/`isAvailable = false`)
  once history exists (see the `DELETE` handlers).
- Indexes: `@@index([restaurantId])` on every tenant-owned table (the access-check filter above),
  plus `@@unique([restaurantId, orderNumber])` for human-facing order numbers,
  `@@unique([userId, restaurantId])` on `RestaurantStaff` (one role per user per restaurant), and
  `@@index([token])` on `Table` for the O(1) QR/NFC lookup.

## 4. Table / QR / NFC architecture

- A `Table` row is created with a random `token` (default `cuid()`, distinct from its primary
  key). The public URL is always `{APP_URL}/r/{restaurant.slug}?t={table.token}`.
- **QR**: `GET /api/restaurants/[id]/tables/[tableId]/qr` (staff-only) generates a PNG on the fly
  with the `qrcode` package encoding that exact URL — download or print from the Tables tab.
- **NFC**: the tag is written with the *same* URL using any standard NFC-writer app (NTAG213/215/216
  stickers + a free app like NFC Tools) — no custom NFC payload format, no app required to *read*
  it, since every modern phone opens a URL from an NFC tag in the default browser automatically.
  Step-by-step instructions are rendered on the Tables dashboard page.
- On visit, `GET /api/public/restaurants/[slug]/menu?t=...` resolves `slug` → `Restaurant` and
  `token` → `Table`, confirms the table actually belongs to that restaurant (defense in depth —
  see §2), and mints a `CustomerSession` cookie scoped to that exact `restaurantId` + `tableId`.

## 5. Ordering architecture — server-side pricing (critical)

The browser never sends a price. The cart payload is only
`{ menuItemId, quantity, selectedOptionIds[], notes }`. `src/lib/pricing.ts` (`priceCart`) is the
**single place** that turns that into money:

1. Re-reads the `MenuItem` and its `MenuModifier`/`MenuModifierOption` rows from the DB, scoped
   to the order's `restaurantId` — an ID from another restaurant simply won't be found.
2. Re-validates every modifier group's own rules (required / min / max / single-vs-multiple)
   against what was actually selected — a client can't submit two options for a "choose one" size
   selector, or skip a required "size" group.
3. Rejects any selected option ID that isn't one of that specific item's own options (blocks
   splicing in a cheaper/free option from an unrelated item).
4. Sums to `subtotalCents` → `taxCents` → `totalCents`, and that's what gets written to `Order`
   and later charged via Stripe. This function is called once at order-creation time; nothing
   downstream (checkout, webhook) re-derives price from client input again.

## 6. Stripe architecture

- **Checkout Session**, `mode: payment`, one line item for the order total (`/api/public/orders/[id]/checkout`).
  Card, Apple Pay, and Google Pay all surface automatically through Stripe's hosted page.
- **Webhook is the only source of truth for "paid."** `checkout.session.completed` moves the order
  `PENDING_PAYMENT → NEW`; the success-page redirect is UX only. `/api/stripe/webhook` verifies
  `stripe-signature` against `STRIPE_WEBHOOK_SECRET` before touching the DB, and is idempotent
  (it no-ops if the order isn't still `PENDING_PAYMENT`, since Stripe redelivers events).
- **No card data ever reaches our servers or database** — `Payment` stores only Stripe IDs
  (`stripeCheckoutSessionId`, `stripePaymentIntentId`) and status.

## 7. Stripe Connect architecture

- Each restaurant gets a Stripe **Express** connected account (`/api/restaurants/[id]/stripe/connect`,
  OWNER-only) — Stripe hosts KYC/bank-details collection, so that data never touches this app.
- Once `chargesEnabled` is true, checkout attaches `transfer_data.destination` so the full order
  amount routes straight to the restaurant's connected account — Connect is used purely to keep
  each restaurant's funds separate and payable to their own bank account.
- **The platform does not take a per-order commission.** Monetization is a recurring membership
  instead (see §7a below) — restaurants keep 100% of their order revenue.

### 7a. Membership billing (Stripe Subscriptions)

- Restaurants pay the platform a recurring subscription — Basic/Pro/Business, monthly or annual —
  managed entirely through Stripe Checkout (`mode: 'subscription'`) and the Stripe Billing Portal.
  See `app/api/restaurants/[id]/membership/*` and `app/dashboard/[id]/billing/page.tsx`.
- New restaurants get a 7-day free trial (card required upfront) at signup, with full Pro-tier
  access during the trial regardless of which tier they picked — see
  `subscription_data.trial_period_days` in `membership/checkout/route.ts`.
- `Membership.status` (`INCOMPLETE/TRIALING/ACTIVE/PAST_DUE/CANCELED`) gates dashboard/portal
  access — enforced centrally in `requireRestaurantAccess`/`requireRestaurantPortalAccess`
  (`src/lib/auth.ts`), not per-route, since every protected route already funnels through those
  two functions. `customer.subscription.*` webhook events are the single source of truth for this
  status (idempotent snapshot upserts — see `app/api/stripe/webhook/route.ts`).
- **Known limitation:** no per-tier feature enforcement exists yet (table/staff limits, hiding AI
  import for Basic, etc.) — Basic and Business currently unlock identical functionality. Tracked as
  a fast-follow once the billing loop itself is proven.
- In development, checkout works without a connected account (single platform Stripe account) so
  the flow can be tested end-to-end before onboarding a real restaurant; in production it fails
  closed instead of silently taking 100% of the payment.

## 8. Required environment variables

See `.env.example`. Summary:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Signs staff dashboard session JWTs |
| `CUSTOMER_SESSION_SECRET` | Signs customer (no-account) session JWTs — **different** secret from the above, deliberately, so a leaked staff secret can't forge customer sessions or vice versa |
| `STRIPE_SECRET_KEY` | Server-side Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook payload signatures |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe key (Checkout redirect only needs the secret key server-side today; kept here for when Payment Element is added) |
| `STRIPE_PRICE_{BASIC,PRO,BUSINESS}[_ANNUAL]` | Membership Price IDs — create with `npx tsx scripts/setup-stripe-products.ts` |
| `NEXT_PUBLIC_APP_URL` | Used to build table URLs, QR payloads, Stripe redirect URLs |

## 9. Security checklist (implemented)

- [x] Passwords hashed with bcrypt (cost 12), never stored/logged in plaintext
- [x] Staff and customer sessions are separate httpOnly, `Secure` (in prod), `SameSite=Lax` cookies
- [x] Role-based access (`OWNER` > `MANAGER` > `STAFF`) enforced server-side on every dashboard route
- [x] Tenant isolation via `restaurantId` filters on every query, not just the initial access check
- [x] Zod validation on every request body
- [x] Rate limiting on login, registration, and order creation (in-memory — see note in
      `src/lib/rate-limit.ts` about swapping to Redis for multi-instance deploys)
- [x] Stripe webhook signature verification; webhook is the only path that marks an order paid
- [x] Order status transitions constrained to an explicit allow-list state machine
      (`ALLOWED_TRANSITIONS` in the order PATCH route) — no illegal jumps
- [x] All prices computed server-side from the DB; client price/total fields are never read
- [x] No card data touches our servers/DB (Stripe Checkout hosts card entry)
- [x] Generic error messages on auth endpoints (no user-enumeration via error text)

## 10. What's built vs. what's next (mapped to your phase plan)

| Phase | Status |
|---|---|
| 1 — Restaurant account, create restaurant, create menu, create tables | **Built** |
| 2 — Table URLs, QR codes, NFC-compatible URLs | **Built** |
| 3 — Customer menu, cart, order creation | **Built** |
| 4 — Stripe payment | **Built** (needs your live/test Stripe keys — can't be tested inside this sandbox, which has no network access) |
| 5 — Restaurant order dashboard | **Built** |
| 6 — Realtime order status | **Built via SSE** — see the single-instance caveat in §1 |
| 7 — Stripe Connect | **Built** (onboarding flow + fee split logic; needs live Stripe Connect to actually test) |
| 8 — Advanced analytics, split bill, AI menu import (OCR) | **Not built** — out of scope for MVP per your own instructions (§13, §22) |

Not yet wired into the dashboard UI (available via the API, documented inline in the route files):
modifier-group editing (`POST /api/restaurants/[id]/menu/items` accepts a full `modifiers[]`
array — the dashboard's "Add item" form only sends the base item today).

## 11. Setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, AUTH_SECRET, CUSTOMER_SESSION_SECRET, Stripe keys
npx prisma migrate dev --name init
npm run db:seed             # creates "Test Restaurant" with tables 1–3 and a sample menu
npm run dev
```

Seed output prints the owner login (`owner@testrestaurant.com` / `TestPassword123!`) and each
table's full URL — open one of those URLs to hit the customer flow, or log into `/dashboard/login`
to see the owner side.

For Stripe: `stripe listen --forward-to localhost:3000/api/stripe/webhook` during local dev, and
put the CLI's printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

## 12. Manual test plan (from your §25/§26)

- [ ] Table 2's QR/URL correctly identifies Table 2 in the menu response
- [ ] Add Burger + Coca-Cola to cart, confirm subtotal/total match menu prices
- [ ] Complete Stripe test-card checkout (`4242 4242 4242 4242`) → webhook fires → order flips to `NEW`
- [ ] Order appears on `/dashboard/[id]/orders` in real time (SSE), with a chime
- [ ] Accept → Preparing → Ready → Completed transitions, each rejects an out-of-order jump
- [ ] Customer's `/r/[slug]/order/[id]` page reflects each status change within ~4s
- [ ] **Invalid table**: unknown `?t=` token → 404, not a crash
- [ ] **Payment failure**: use Stripe's decline test card, confirm order does *not* become `NEW`
- [ ] **Payment cancellation**: abandon Checkout → `checkout.session.expired` → order → `PAYMENT_FAILED`
- [ ] **Unavailable item**: mark an item unavailable mid-cart, submit anyway → 400 with a clear message
- [ ] **Price change**: edit a menu item's price after a customer opened the menu but before they
      submit → the *new* price is charged (pricing is re-read at submit time, not cached client-side)
- [ ] **Restaurant closed**: toggle `Restaurant.isOpen = false` → order creation 409s
- [ ] **Two customers, one table**: open the same table URL in two different browser profiles
      (so each gets its own `CustomerSession` cookie) → two independent orders, both tagged to
      the same `Table`, each with its own `Payment`

## 13. Legal / compliance notes (research before going live — not legal advice)

- **GDPR**: `CustomerSession` intentionally stores no PII — just restaurant/table IDs and an
  expiry. If you later add receipts-by-email or loyalty accounts, that introduces personal data
  and a lawful basis / retention policy for it.
- **PCI DSS**: routing all card entry through Stripe Checkout keeps you at the lightest tier
  (SAQ A) — don't build a custom card form without re-evaluating this.
- **VAT/tax**: this MVP assumes tax-inclusive menu pricing (`TAX_RATE_BPS = 0` in `pricing.ts`,
  i.e. the tax is already baked into `priceCents`), common for EU restaurant menus. If you need
  tax-exclusive pricing or multiple tax rates (dine-in vs. takeaway, per-category rates), that
  belongs in `priceCart()` and should be reviewed against your specific jurisdiction(s) — Stripe
  Tax can also compute this instead of hand-rolling it.
- **Stripe Connect**: Express accounts still require you (the platform) to accept the
  [Connect account agreement] and, depending on volume/region, may trigger platform-level
  obligations. Review Stripe's current Connect and EU requirements before onboarding a real
  restaurant — these move independently of this codebase.
- **Consumer rights / distance selling**: an in-restaurant food order is generally treated
  differently from e-commerce distance selling in EU consumer law, but confirm for your
  jurisdiction before launch, particularly around refund/cancellation obligations once food
  prep has started.
