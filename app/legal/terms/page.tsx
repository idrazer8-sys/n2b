'use client';

import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

const LAST_UPDATED = '2026-09-03';

export default function TermsOfServicePage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-paper text-ink px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-xs text-ink/50 hover:text-ink transition-colors">
          ← {t('legal.backLink')}
        </Link>

        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40 mt-6">
          {t('legal.terms.eyebrow')}
        </p>
        <h1 className="font-display text-3xl mt-2">{t('legal.terms.title')}</h1>
        <p className="text-xs text-ink/40 mt-2">
          {t('legal.lastUpdated')}: {LAST_UPDATED}
        </p>

        <div className="mt-6 border border-amber-600/30 bg-amber-50 text-amber-900 text-sm px-4 py-3 rounded-lg">
          ⚠️ {t('legal.disclaimerBanner')}
        </div>

        <article className="mt-10 space-y-8 text-sm leading-relaxed text-ink/80 [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-ink [&_h2]:mb-2 [&_h2]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          <section>
            <h2>1. Agreement</h2>
            <p>
              These Terms govern use of the N2B platform (the &ldquo;Service&rdquo;) by restaurants
              (&ldquo;Restaurants&rdquo;) and their staff, and by diners placing orders through it
              (&ldquo;Diners&rdquo;). Creating a restaurant account, or placing an order, means you
              accept these Terms.
            </p>
          </section>

          <section>
            <h2>2. What the Service does</h2>
            <p>
              N2B lets a Restaurant publish a digital menu accessible via QR/NFC codes at each
              table, receive and manage orders through kitchen and waiter dashboards, and collect
              payment from Diners either online (via Stripe) or in person. We are a software
              provider — we are not a party to the sale of food or drink itself, which remains
              solely between the Restaurant and the Diner.
            </p>
          </section>

          <section>
            <h2>3. Restaurant accounts</h2>
            <ul>
              <li>You are responsible for the accuracy of your menu, prices, and availability.</li>
              <li>You are responsible for keeping staff credentials confidential and for what your staff do while logged in.</li>
              <li>You must have the legal right to sell the products you list, and to comply with applicable food-safety, allergen-labeling, and consumer-protection law in your jurisdiction.</li>
              <li>You are responsible for setting accurate tax handling for your menu (see §6).</li>
            </ul>
          </section>

          <section>
            <h2>4. Diner orders</h2>
            <p>
              An order is a direct transaction between the Diner and the Restaurant. Prices shown
              are recomputed server-side at the moment of ordering from the Restaurant&rsquo;s own
              menu data — the amount charged is the amount confirmed at checkout, not an estimate.
              Refunds, cancellations, and substitutions (e.g. for an item that turns out to be
              unavailable) are handled by the Restaurant according to its own policies and
              applicable consumer law, not by N2B.
            </p>
          </section>

          <section>
            <h2>5. Payments and subscription billing</h2>
            <p>
              Online Diner payments and Restaurant payouts are processed by Stripe under
              Stripe&rsquo;s own terms; by accepting online payments you also agree to those. N2B
              itself is monetized through a recurring platform subscription paid by the Restaurant
              (see the Billing page in your dashboard for current tiers and pricing) — Restaurants
              keep 100% of their own order revenue. Subscription payments, trials, and cancellations
              are also handled via Stripe&rsquo;s billing tools.
            </p>
          </section>

          <section>
            <h2>6. Taxes</h2>
            <p>
              You are solely responsible for determining, charging, and remitting any taxes
              applicable to your sales (VAT, sales tax, etc.). The platform&rsquo;s default pricing
              model assumes tax-inclusive menu prices unless you configure it otherwise — confirm
              the correct approach for your jurisdiction before relying on it.
            </p>
          </section>

          <section>
            <h2>7. Acceptable use</h2>
            <p>
              You agree not to misuse the Service — including attempting to bypass rate limits or
              authentication, accessing another Restaurant&rsquo;s data without authorization, or
              using the Service for anything unlawful.
            </p>
          </section>

          <section>
            <h2>8. Availability and liability</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo;. We aim for high availability but do not
              guarantee uninterrupted service, and are not liable for losses arising from downtime,
              bugs, or third-party service failures (including Stripe). This section is a
              placeholder liability clause pending legal review — do not rely on it as a real
              limitation of liability before that review happens.
            </p>
          </section>

          <section>
            <h2>9. Termination</h2>
            <p>
              Either party may stop using the Service at any time; a Restaurant may cancel its
              subscription from the Billing page. We may suspend an account for a clear Terms
              violation or non-payment, with notice where practicable.
            </p>
          </section>

          <section>
            <h2>10. Governing law</h2>
            <p>
              [Insert your company&rsquo;s legal name, jurisdiction, and governing-law clause here
              before real launch — this is a placeholder pending legal review.]
            </p>
          </section>

          <section>
            <h2>11. Contact</h2>
            <p>[Insert a contact email for legal/Terms questions here before real launch.]</p>
          </section>
        </article>
      </div>
    </main>
  );
}
