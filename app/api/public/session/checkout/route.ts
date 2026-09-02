import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/src/lib/db';
import { stripe } from '@/src/lib/stripe';
import {
  readSessionTokenFromCookies,
  verifyCustomerSession,
} from '@/src/lib/customer-session';
import { errorResponse } from '@/src/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const paymentMethod =
      body.paymentMethod === 'PAY_AT_RESTAURANT'
        ? 'PAY_AT_RESTAURANT'
        : 'ONLINE';

    const collectionMethod =
      paymentMethod === 'PAY_AT_RESTAURANT' &&
      ['CASH', 'CARD', 'OTHER'].includes(body.collectionMethod)
        ? (body.collectionMethod as 'CASH' | 'CARD' | 'OTHER')
        : null;

    // Cash-only extras: either a single tendered amount, or — when the
    // table is splitting the bill — a per-person breakdown. The customer
    // enters what each person is paying; we store it as-is and let the
    // waiter read off the change owed per person.
    type ParsedSplit = {
      personIndex: number;
      label: string | null;
      shareCents: number;
      tenderedCents: number | null;
    };

    const rawSplits: unknown[] = Array.isArray(body.splits) ? body.splits : [];

    const parsedSplits: ParsedSplit[] = [];

    if (collectionMethod === 'CASH' && rawSplits.length > 0) {
      for (let index = 0; index < rawSplits.length; index += 1) {
        const entry = rawSplits[index];

        if (!entry || typeof entry !== 'object') continue;

        const record = entry as Record<string, unknown>;
        const shareCents = Math.round(Number(record.shareCents));
        const tenderedCentsRaw = record.tenderedCents;
        const tenderedCents: number | null =
          tenderedCentsRaw === undefined ||
          tenderedCentsRaw === null ||
          Number.isNaN(Number(tenderedCentsRaw))
            ? null
            : Math.round(Number(tenderedCentsRaw));
        const label: string | null =
          typeof record.label === 'string' && record.label.trim()
            ? record.label.trim().slice(0, 60)
            : null;

        if (!Number.isFinite(shareCents) || shareCents <= 0) continue;

        parsedSplits.push({ personIndex: index, label, shareCents, tenderedCents });
      }
    }

    const isSplit = parsedSplits.length > 1;

    const cashTenderedCents =
      collectionMethod === 'CASH' &&
      !isSplit &&
      typeof body.cashTenderedCents === 'number' &&
      Number.isFinite(body.cashTenderedCents)
        ? Math.round(body.cashTenderedCents)
        : null;

    // The client always knows which restaurant it's paying for — resolve
    // the session against that one restaurant only. Guessing by scanning
    // every active restaurant's cookie (as this used to do) could match a
    // stale or unrelated session from a different restaurant the same
    // browser had visited, silently blocking checkout on the wrong table's
    // orders.
    const restaurantSlug =
      typeof body.restaurantSlug === 'string'
        ? body.restaurantSlug.trim()
        : '';

    if (!restaurantSlug) {
      return NextResponse.json(
        { error: 'Missing restaurant' },
        { status: 400 }
      );
    }

    const restaurantForSession =
      await db.restaurant.findUnique({
        where: { slug: restaurantSlug },
        select: { id: true, isActive: true },
      });

    let resolvedSession:
      | {
          id: string;
          restaurantId: string;
          tableId: string;
        }
      | null = null;

    if (
      restaurantForSession &&
      restaurantForSession.isActive
    ) {
      const token = readSessionTokenFromCookies(
        restaurantForSession.id
      );

      const verified = await verifyCustomerSession(
        restaurantForSession.id,
        token
      );

      if (verified) {
        resolvedSession = {
          id: verified.id,
          restaurantId:
            restaurantForSession.id,
          tableId: verified.tableId,
        };
      }
    }

    if (!resolvedSession) {
      return NextResponse.json(
        {
          error:
            'Session expired — please rescan the table QR code',
        },
        { status: 401 }
      );
    }

    const [session, restaurant, table] =
      await Promise.all([
        db.customerSession.findUnique({
          where: {
            id: resolvedSession.id,
          },
          include: {
            orders: {
              where: {
                paidAt: null,
                status: {
                  notIn: [
                    'REJECTED',
                    'CANCELLED',
                  ],
                },
              },
              include: {
                items: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
            sessionPayment: true,
          },
        }),

        db.restaurant.findUnique({
          where: {
            id: resolvedSession.restaurantId,
          },
          include: {
            stripeAccount: true,
          },
        }),

        db.table.findUnique({
          where: {
            id: resolvedSession.tableId,
          },
        }),
      ]);

    if (!session || !restaurant || !table) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const unpaidOrders = session.orders;

    if (unpaidOrders.length === 0) {
      return NextResponse.json(
        { error: 'There is nothing to pay' },
        { status: 409 }
      );
    }

    const waitingOrders = unpaidOrders.filter(
      (order) => order.status !== 'COMPLETED'
    );

    if (waitingOrders.length > 0) {
      return NextResponse.json(
        {
          error:
            'All orders must be served before the meal can be finalized',
          waitingOrders: waitingOrders.map(
            (order) => ({
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
            })
          ),
        },
        { status: 409 }
      );
    }

    const amountCents = unpaidOrders.reduce(
      (sum, order) =>
        sum + order.totalCents,
      0
    );

    // The platform no longer takes a per-order commission — restaurants
    // keep 100% of order revenue under the membership billing model (see
    // /api/restaurants/[id]/membership). Connect still routes funds
    // straight to the restaurant's own account via transfer_data below.
    const applicationFeeCents = 0;

    /*
     * PAY AT RESTAURANT
     *
     * We do not create a Stripe checkout session.
     * The session remains unpaid until a waiter/manager
     * confirms collection.
     */
    if (
      paymentMethod ===
      'PAY_AT_RESTAURANT'
    ) {
      if (!restaurant.allowPayAtRestaurant) {
        return NextResponse.json(
          {
            error:
              'This restaurant only accepts online payment',
          },
          { status: 409 }
        );
      }

      if (
        isSplit &&
        Math.abs(
          parsedSplits.reduce(
            (sum: number, item: ParsedSplit) => sum + item.shareCents,
            0
          ) -
            amountCents
        ) > parsedSplits.length
      ) {
        return NextResponse.json(
          {
            error:
              'The split amounts must add up to the total bill',
          },
          { status: 400 }
        );
      }

      const payment = await db.$transaction(async (tx) => {
        const created = await tx.sessionPayment.upsert({
          where: {
            customerSessionId:
              session.id,
          },
          create: {
            customerSessionId:
              session.id,
            status:
              'REQUIRES_PAYMENT',
            paymentMethod:
              'PAY_AT_RESTAURANT',
            collectionMethod:
              collectionMethod ?? undefined,
            isSplit,
            cashTenderedCents,
            amountCents,
            currency:
              restaurant.currency,
            applicationFeeCents,
          },
          update: {
            status:
              'REQUIRES_PAYMENT',
            paymentMethod:
              'PAY_AT_RESTAURANT',
            collectionMethod:
              collectionMethod ?? undefined,
            isSplit,
            cashTenderedCents,
            amountCents,
            currency:
              restaurant.currency,
            applicationFeeCents,
          },
        });

        await tx.sessionPaymentSplit.deleteMany({
          where: { sessionPaymentId: created.id },
        });

        if (isSplit) {
          await tx.sessionPaymentSplit.createMany({
            data: parsedSplits.map((item: ParsedSplit) => ({
              sessionPaymentId: created.id,
              personIndex: item.personIndex,
              label: item.label,
              shareCents: item.shareCents,
              tenderedCents: item.tenderedCents,
            })),
          });
        }

        return created;
      });

      await db.customerSession.update({
        where: {
          id: session.id,
        },
        data: {
          finalizedAt:
            new Date(),
        },
      });

      return NextResponse.json({
        paymentMethod:
          'PAY_AT_RESTAURANT',
        paymentStatus:
          payment.status,
        collectionMethod:
          payment.collectionMethod,
        message:
          'Payment requested at the restaurant',
      });
    }

    /*
     * ONLINE PAYMENT
     */
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error(
        'Missing NEXT_PUBLIC_APP_URL'
      );
    }

    if (
      session.sessionPayment?.status ===
        'REQUIRES_PAYMENT' &&
      session.sessionPayment
        .paymentMethod ===
        'ONLINE' &&
      session.sessionPayment
        .stripeCheckoutSessionId
    ) {
      try {
        const existing =
          await stripe.checkout.sessions.retrieve(
            session.sessionPayment
              .stripeCheckoutSessionId
          );

        if (
          existing.status === 'open' &&
          existing.url
        ) {
          return NextResponse.json({
            checkoutUrl:
              existing.url,
            paymentMethod: 'ONLINE',
          });
        }
      } catch {
        // Create a fresh checkout session below.
      }
    }

    const lastOrder =
      unpaidOrders[
        unpaidOrders.length - 1
      ];

    const line_items =
      unpaidOrders.map((order) => ({
        price_data: {
          currency:
            order.currency.toLowerCase(),
          product_data: {
            name:
              `${restaurant.name} — Order #${order.orderNumber}`,
          },
          unit_amount:
            order.totalCents,
        },
        quantity: 1,
      }));

    const sessionParams: Stripe.Checkout.SessionCreateParams =
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items,
        success_url:
          `${appUrl}/r/${restaurant.slug}/order/${lastOrder.id}?paid=1`,
        cancel_url:
          `${appUrl}/r/${restaurant.slug}?t=${table.token}`,
        metadata: {
          sessionId: session.id,
          restaurantId:
            restaurant.id,
        },
      };

    if (
      restaurant.stripeAccount
        ?.chargesEnabled
    ) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination:
            restaurant.stripeAccount
              .stripeAccountId,
        },
      };
    } else if (
      process.env.NODE_ENV ===
      'production'
    ) {
      return NextResponse.json(
        {
          error:
            'This restaurant has not finished payment setup yet',
        },
        { status: 409 }
      );
    }

    const checkoutSession =
      await stripe.checkout.sessions.create(
        sessionParams
      );

    await db.$transaction([
      db.sessionPayment.upsert({
        where: {
          customerSessionId:
            session.id,
        },
        create: {
          customerSessionId:
            session.id,
          stripeCheckoutSessionId:
            checkoutSession.id,
          status:
            'REQUIRES_PAYMENT',
          paymentMethod:
            'ONLINE',
          amountCents,
          currency:
            restaurant.currency,
          applicationFeeCents,
        },
        update: {
          stripeCheckoutSessionId:
            checkoutSession.id,
          status:
            'REQUIRES_PAYMENT',
          paymentMethod:
            'ONLINE',
          amountCents,
          currency:
            restaurant.currency,
          applicationFeeCents,
        },
      }),

      db.customerSession.update({
        where: {
          id: session.id,
        },
        data: {
          finalizedAt:
            new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      checkoutUrl:
        checkoutSession.url,
      paymentMethod: 'ONLINE',
    });
  } catch (err) {
    return errorResponse(err);
  }
}