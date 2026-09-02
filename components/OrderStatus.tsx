'use client';

import { useEffect, useState } from 'react';
import { formatCents } from '@/src/lib/format';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type CollectionMethod =
  | 'CASH'
  | 'CARD'
  | 'OTHER';

type SessionOrder = {
  id: string;
  orderNumber: number;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  completedAt: string | null;
  paidAt: string | null;
};

type PaymentInfo = {
  id: string;
  status: string;
  paymentMethod:
    | 'ONLINE'
    | 'PAY_AT_RESTAURANT';
  collectionMethod:
    | CollectionMethod
    | null;
  confirmedAt: string | null;
};

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  totalCents: number;
  currency: string;
  items: {
    nameSnapshot: string;
    quantity: number;
    lineTotalCents: number;
  }[];
  restaurant: {
    slug: string;
    name: string;
    allowPayAtRestaurant: boolean;
  };
  table: {
    token: string;
    label: string;
  };
  session: {
    id: string;
    orders: SessionOrder[];
    allOrdersServed: boolean;
    payableTotalCents: number;
    paid: boolean;
    paidAt: string | null;
    payment: PaymentInfo | null;
  };
  googleReviewUrl: string | null;
};

type T = (key: string, vars?: Record<string, string | number>) => string;

function getSteps(t: T) {
  return [
    { key: 'NEW', label: t('customerFlow.order.stepSentToKitchen') },
    { key: 'ACCEPTED', label: t('customerFlow.order.stepAccepted') },
    { key: 'PREPARING', label: t('customerFlow.order.stepPreparing') },
    { key: 'READY', label: t('customerFlow.order.stepReady') },
    { key: 'COMPLETED', label: t('customerFlow.order.stepServed') },
  ];
}

function statusIndex(status: string, steps: ReturnType<typeof getSteps>) {
  const index = steps.findIndex(
    (step) => step.key === status
  );

  return index < 0 ? 0 : index;
}

function statusText(status: string, t: T) {
  switch (status) {
    case 'PENDING_PAYMENT':
      return t('customerFlow.order.statusWaitingForPayment');

    case 'NEW':
      return t('customerFlow.order.stepSentToKitchen');

    case 'ACCEPTED':
      return t('customerFlow.order.stepAccepted');

    case 'PREPARING':
      return t('customerFlow.order.stepPreparing');

    case 'READY':
      return t('customerFlow.order.stepReady');

    case 'COMPLETED':
      return t('customerFlow.order.stepServed');

    case 'REJECTED':
      return t('customerFlow.order.statusRejected');

    case 'CANCELLED':
      return t('customerFlow.order.statusCancelled');

    default:
      return status;
  }
}

function collectionMethodLabel(
  method: CollectionMethod | null,
  t: T
) {
  switch (method) {
    case 'CASH':
      return t('customerFlow.order.collectionCash');

    case 'CARD':
      return t('customerFlow.order.collectionCard');

    case 'OTHER':
      return t('customerFlow.order.collectionOther');

    default:
      return t('customerFlow.order.collectionNotSelected');
  }
}

export default function OrderStatus({
  orderId,
}: {
  orderId: string;
}) {
  const [order, setOrder] =
    useState<Order | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [finishing, setFinishing] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [savedRestaurant, setSavedRestaurant] =
    useState(false);

  const [paymentChoice, setPaymentChoice] =
    useState<
      'ONLINE' | 'PAY_AT_RESTAURANT'
    >('ONLINE');

  const [
    collectionChoice,
    setCollectionChoice,
  ] = useState<CollectionMethod | null>(
    null
  );

  const [splitBill, setSplitBill] =
    useState(false);
  const [splitCount, setSplitCount] =
    useState(2);
  const [personAmounts, setPersonAmounts] =
    useState<string[]>(['', '']);
  const [personTendered, setPersonTendered] =
    useState<string[]>(['', '']);
  const [cashTendered, setCashTendered] =
    useState('');
  const [splitError, setSplitError] =
    useState<string | null>(null);

  const { t, locale } = useI18n();
  const steps = getSteps(t);

  function parseAmountToCents(value: string): number | null {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) return null;
    const num = Number(normalized);
    if (!Number.isFinite(num) || num < 0) return null;
    return Math.round(num * 100);
  }

  function resizeSplit(count: number) {
    const safeCount = Math.max(2, Math.min(20, count));
    setSplitCount(safeCount);
    setPersonAmounts((prev) => {
      const next = prev.slice(0, safeCount);
      while (next.length < safeCount) next.push('');
      return next;
    });
    setPersonTendered((prev) => {
      const next = prev.slice(0, safeCount);
      while (next.length < safeCount) next.push('');
      return next;
    });
  }

  async function loadOrder() {
    try {
      const cacheBuster =
        `${Date.now()}-${Math.random()}`;

      const response = await fetch(
        `/api/public/orders/${orderId}?_=${cacheBuster}`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Cache-Control':
              'no-cache',
            Pragma: 'no-cache',
          },
        }
      );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.error ??
            'Could not load order'
        );
      }

      setOrder(json);
      setError(null);
      setLastUpdated(new Date());

      // Keep the local selector synchronized with
      // the server value when one already exists.
      if (
        json.session?.payment
          ?.collectionMethod
      ) {
        setCollectionChoice(
          json.session.payment
            .collectionMethod
        );
      }

      try {
        const key =
          'saved-restaurant-' +
          json.restaurant.slug;

        setSavedRestaurant(
          localStorage.getItem(
            key
          ) === '1'
        );
      } catch {
        setSavedRestaurant(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('customerFlow.order.couldNotLoad')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let stopped = false;

    async function refresh() {
      if (stopped) return;
      await loadOrder();
    }

    void refresh();

    const interval =
      window.setInterval(
        refresh,
        2000
      );

    const onFocus = () => {
      void refresh();
    };

    window.addEventListener(
      'focus',
      onFocus
    );

    return () => {
      stopped = true;
      window.clearInterval(
        interval
      );
      window.removeEventListener(
        'focus',
        onFocus
      );
    };
  }, [orderId]);

  function toggleSaveRestaurant() {
    if (!order) return;

    try {
      const key =
        'saved-restaurant-' +
        order.restaurant.slug;

      const currentlySaved =
        localStorage.getItem(
          key
        ) === '1';

      if (currentlySaved) {
        localStorage.removeItem(
          key
        );
        setSavedRestaurant(false);
      } else {
        localStorage.setItem(
          key,
          '1'
        );
        setSavedRestaurant(true);
      }
    } catch {
      setSavedRestaurant(false);
    }
  }

  async function finishMeal() {
    if (
      paymentChoice ===
        'PAY_AT_RESTAURANT' &&
      !collectionChoice
    ) {
      setError(
        t('customerFlow.order.chooseCashCardOther')
      );
      return;
    }

    setSplitError(null);

    let cashExtras: Record<string, unknown> = {};

    if (
      paymentChoice === 'PAY_AT_RESTAURANT' &&
      collectionChoice === 'CASH' &&
      order
    ) {
      if (splitBill) {
        const totalCents =
          order.session.payableTotalCents;

        const parsedShares = personAmounts.map(
          (value) => parseAmountToCents(value)
        );

        if (parsedShares.some((cents) => cents === null || cents <= 0)) {
          setSplitError(
            t('customerFlow.order.splitInvalidAmounts')
          );
          return;
        }

        const shareSum = parsedShares.reduce(
          (sum: number, cents) => sum + (cents ?? 0),
          0
        );

        if (Math.abs(shareSum - totalCents) > splitCount) {
          setSplitError(
            t('customerFlow.order.splitDoesNotMatchTotal')
          );
          return;
        }

        cashExtras = {
          splits: parsedShares.map((cents, index) => ({
            label: `${t('customerFlow.order.person')} ${index + 1}`,
            shareCents: cents,
            tenderedCents: parseAmountToCents(
              personTendered[index] ?? ''
            ),
          })),
        };
      } else if (cashTendered.trim()) {
        const tenderedCents = parseAmountToCents(cashTendered);

        if (tenderedCents !== null) {
          cashExtras = { cashTenderedCents: tenderedCents };
        }
      }
    }

    try {
      setFinishing(true);
      setError(null);

      const response = await fetch(
        `/api/public/session/checkout?_=${Date.now()}`,
        {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type':
              'application/json',
            'Cache-Control':
              'no-cache',
          },
          body: JSON.stringify({
            paymentMethod:
              paymentChoice,

            ...(paymentChoice ===
              'PAY_AT_RESTAURANT'
              ? {
                  collectionMethod:
                    collectionChoice,
                  ...cashExtras,
                }
              : {}),
          }),
        }
      );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('customerFlow.order.couldNotStartPayment')
        );
      }

      if (
        json.paymentMethod ===
        'PAY_AT_RESTAURANT'
      ) {
        if (
          json.collectionMethod
        ) {
          setCollectionChoice(
            json.collectionMethod
          );
        }

        await loadOrder();

        setFinishing(false);
        return;
      }

      if (!json.checkoutUrl) {
        throw new Error(
          t('customerFlow.order.noCheckoutUrl')
        );
      }

      window.location.href =
        json.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('customerFlow.order.couldNotStartPayment')
      );

      setFinishing(false);
    }
  }

  if (
    loading &&
    !order
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink/50 text-sm">
          {t('customerFlow.order.loadingOrder')}
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-red-700">
            {error ??
              t('customerFlow.order.couldNotLoad')}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadOrder()
            }
            className="mt-4 border border-line rounded-lg px-4 py-2 text-sm"
          >
            {t('customerFlow.order.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const rejected = [
    'REJECTED',
    'CANCELLED',
  ].includes(order.status);

  const currentIndex =
    statusIndex(order.status, steps);

  const payment =
    order.session.payment;

  const paymentRequested =
    payment?.paymentMethod ===
      'PAY_AT_RESTAURANT' &&
    payment.status ===
      'REQUIRES_PAYMENT';

  const showFinishChoice =
    order.status === 'COMPLETED' &&
    order.session.allOrdersServed &&
    !order.session.paid &&
    !paymentRequested;

  const showWaiting =
    order.status === 'COMPLETED' &&
    !order.session.allOrdersServed &&
    !order.session.paid;

  const paymentReturn =
    new URLSearchParams(
      window.location.search
    ).get('paid') === '1';

  return (
    <div className="min-h-screen max-w-md mx-auto px-6 py-10">
      <div className="flex justify-end mb-4">
        <LanguageSwitcher />
      </div>

      <p className="text-xs uppercase tracking-widest text-ink/40">
        {order.restaurant.name}
      </p>

      <div className="flex items-end justify-between gap-4 mt-1">
        <h1 className="font-display text-3xl">
          {t('customerFlow.order.orderNumber', { number: order.orderNumber })}
        </h1>

        <span className="text-xs text-ink/40">
          {t('customerFlow.order.tableLabel', { label: order.table.label })}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-medium">
          {statusText(
            order.status,
            t
          )}
        </span>

        {lastUpdated && (
          <span className="text-[10px] text-ink/35">
            {t('customerFlow.order.updatedAt', {
              time: lastUpdated.toLocaleTimeString(
                locale,
                {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }
              ),
            })}
          </span>
        )}
      </div>

      {!rejected &&
        order.status !==
          'PENDING_PAYMENT' && (
          <ol className="space-y-4 mt-8 mb-10">
            {steps.map(
              (step, index) => {
                const complete =
                  index <
                    currentIndex ||
                  order.status ===
                    'COMPLETED';

                const active =
                  index ===
                    currentIndex &&
                  order.status !==
                    'COMPLETED';

                return (
                  <li
                    key={step.key}
                    className="flex items-center gap-3"
                  >
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        complete ||
                        active
                          ? 'bg-[var(--accent,#1F6F5C)]'
                          : 'border border-ink/20'
                      }`}
                    />

                    <span
                      className={
                        complete ||
                        active
                          ? 'font-medium'
                          : 'text-ink/40'
                      }
                    >
                      {step.label}
                    </span>

                    {active && (
                      <span className="text-xs text-ink/40 ml-auto">
                        {t('customerFlow.order.now')}
                      </span>
                    )}
                  </li>
                );
              }
            )}
          </ol>
        )}

      {order.status ===
        'PENDING_PAYMENT' && (
        <div className="mt-8 border border-[#9a6b22]/20 bg-[#9a6b22]/5 rounded-xl p-4">
          <p className="font-medium text-sm">
            {t('customerFlow.order.paymentRequiredTitle')}
          </p>

          <p className="text-sm text-ink/50 mt-1">
            {t('customerFlow.order.paymentRequiredBody')}
          </p>
        </div>
      )}

      {rejected && (
        <div className="mt-8">
          <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
            {order.status ===
            'REJECTED'
              ? t('customerFlow.order.rejectedMessage')
              : t('customerFlow.order.cancelledMessage')}
          </p>
        </div>
      )}

      <div className="border-t border-line pt-5">
        <h2 className="text-sm font-semibold mb-3">
          {t('customerFlow.order.summaryTitle')}
        </h2>

        <ul className="space-y-1.5 text-sm">
          {order.items.map(
            (item, index) => (
              <li
                key={index}
                className="flex items-baseline"
              >
                <span className="text-ink/50 w-6 tabular">
                  {t('customerFlow.cart.quantityPrefix', { quantity: item.quantity })}
                </span>

                <span className="flex-1">
                  {item.nameSnapshot}
                </span>

                <span className="tabular">
                  {formatCents(
                    item.lineTotalCents,
                    order.currency
                  )}
                </span>
              </li>
            )
          )}
        </ul>

        <div className="flex items-baseline justify-between font-semibold mt-4 pt-3 border-t border-line">
          <span>
            {t('customerFlow.order.orderTotal')}
          </span>

          <span className="tabular">
            {formatCents(
              order.totalCents,
              order.currency
            )}
          </span>
        </div>
      </div>

      {showWaiting && (
        <div className="mt-7 border border-line rounded-xl p-4">
          <p className="font-medium text-sm">
            {t('customerFlow.order.servedTitle')}
          </p>

          <p className="text-sm text-ink/50 mt-1">
            {t('customerFlow.order.servedBody')}
          </p>
        </div>
      )}

      {showFinishChoice && (
        <div className="mt-7 border border-line rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
            {t('customerFlow.order.mealCompleteEyebrow')}
          </p>

          <h2 className="font-display text-2xl mt-1">
            {t('customerFlow.order.finishYourMeal')}
          </h2>

          <p className="text-sm text-ink/50 mt-2">
            {t('customerFlow.order.completeBillIs', {
              amount: formatCents(
                order.session.payableTotalCents,
                order.currency
              ),
            })}
          </p>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={() => {
                setPaymentChoice(
                  'ONLINE'
                );
                setError(null);
              }}
              className={`w-full text-left border rounded-lg px-4 py-4 ${
                paymentChoice ===
                'ONLINE'
                  ? 'border-[#7b2d26] bg-[#7b2d26]/5'
                  : 'border-line'
              }`}
            >
              <span className="block text-sm font-medium">
                {t('customerFlow.order.payOnline')}
              </span>

              <span className="block mt-1 text-xs text-ink/50">
                {t('customerFlow.order.payOnlineDesc')}
              </span>
            </button>

            {order.restaurant
              .allowPayAtRestaurant && (
              <button
                type="button"
                onClick={() => {
                  setPaymentChoice(
                    'PAY_AT_RESTAURANT'
                  );
                  setError(null);
                }}
                className={`w-full text-left border rounded-lg px-4 py-4 ${
                  paymentChoice ===
                  'PAY_AT_RESTAURANT'
                    ? 'border-[#7b2d26] bg-[#7b2d26]/5'
                    : 'border-line'
                }`}
              >
                <span className="block text-sm font-medium">
                  {t('customerFlow.order.payAtRestaurant')}
                </span>

                <span className="block mt-1 text-xs text-ink/50">
                  {t('customerFlow.order.payAtRestaurantDesc')}
                </span>
              </button>
            )}
          </div>

          {order.restaurant
            .allowPayAtRestaurant &&
          paymentChoice ===
            'PAY_AT_RESTAURANT' && (
            <div className="mt-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40 mb-2">
                {t('customerFlow.order.howWillYouPay')}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    'CASH',
                    'CARD',
                    'OTHER',
                  ] as const
                ).map(
                  (method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setCollectionChoice(
                          method
                        );
                        setError(
                          null
                        );
                      }}
                      className={`border rounded-lg px-3 py-3 text-xs font-medium uppercase tracking-[0.08em] ${
                        collectionChoice ===
                        method
                          ? 'border-[#7b2d26] bg-[#7b2d26]/5 text-[#7b2d26]'
                          : 'border-line'
                      }`}
                    >
                      {collectionMethodLabel(method, t)}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {order.restaurant
            .allowPayAtRestaurant &&
          paymentChoice === 'PAY_AT_RESTAURANT' &&
          collectionChoice === 'CASH' && (
            <div className="mt-5 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => {
                  setSplitBill((prev) => !prev);
                  setSplitError(null);
                }}
                className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-[#7b2d26]"
              >
                <span
                  className="inline-block h-4 w-4 rounded border"
                  style={{
                    borderColor: '#7b2d26',
                    background: splitBill
                      ? '#7b2d26'
                      : 'transparent',
                  }}
                />
                {t('customerFlow.order.splitBillToggle')}
              </button>

              {!splitBill && (
                <div className="mt-4">
                  <label className="block text-[10px] uppercase tracking-[0.15em] text-ink/40 mb-2">
                    {t('customerFlow.order.cashTenderedLabel')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cashTendered}
                    onChange={(e) =>
                      setCashTendered(
                        e.target.value
                      )
                    }
                    placeholder={formatCents(
                      order.session.payableTotalCents,
                      order.currency
                    )}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-ink/40">
                    {t('customerFlow.order.cashTenderedHint')}
                  </p>
                </div>
              )}

              {splitBill && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                      {t('customerFlow.order.numberOfPeople')}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          resizeSplit(splitCount - 1)
                        }
                        className="h-7 w-7 rounded-full border border-line flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-medium">
                        {splitCount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          resizeSplit(splitCount + 1)
                        }
                        className="h-7 w-7 rounded-full border border-line flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {Array.from({ length: splitCount }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className="border border-line rounded-lg p-3"
                      >
                        <p className="text-xs font-medium mb-2">
                          {t('customerFlow.order.person')}{' '}
                          {index + 1}
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] uppercase tracking-[0.12em] text-ink/40 mb-1">
                              {t('customerFlow.order.personShareLabel')}
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                personAmounts[index] ?? ''
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                setPersonAmounts((prev) => {
                                  const next = [...prev];
                                  next[index] = value;
                                  return next;
                                });
                              }}
                              className="w-full border border-line rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-[0.12em] text-ink/40 mb-1">
                              {t('customerFlow.order.personTenderedLabel')}
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                personTendered[index] ?? ''
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                setPersonTendered((prev) => {
                                  const next = [...prev];
                                  next[index] = value;
                                  return next;
                                });
                              }}
                              className="w-full border border-line rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <p className="text-xs text-ink/40">
                    {t('customerFlow.order.splitHint')}
                  </p>
                </div>
              )}

              {splitError && (
                <p className="mt-3 text-xs text-red-600">
                  {splitError}
                </p>
              )}
            </div>
          )}

          <a
            href={`/r/${order.restaurant.slug}?t=${order.table.token}`}
            className="mt-5 block w-full border border-line py-3 text-center text-sm"
          >
            {t('customerFlow.order.orderDessert')}
          </a>

          <button
            type="button"
            onClick={() =>
              void finishMeal()
            }
            disabled={
              finishing ||
              (paymentChoice ===
                'PAY_AT_RESTAURANT' &&
                !collectionChoice)
            }
            className="mt-2 block w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-50"
          >
            {finishing
              ? t('customerFlow.order.preparing')
              : paymentChoice ===
                'ONLINE'
                ? t('customerFlow.order.payOnlineAmount', {
                    amount: formatCents(
                      order.session.payableTotalCents,
                      order.currency
                    ),
                  })
                : t('customerFlow.order.requestPaymentAtRestaurant')}
          </button>

          {paymentChoice ===
            'PAY_AT_RESTAURANT' &&
            !collectionChoice && (
              <p className="mt-2 text-center text-xs text-ink/40">
                {t('customerFlow.order.selectPaymentFirst')}
              </p>
            )}
        </div>
      )}

      {paymentRequested && (
        <div className="mt-7 border border-[#9a6b22]/20 bg-[#9a6b22]/5 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#7a551b]">
            {t('customerFlow.order.paymentRequestedEyebrow')}
          </p>

          <h2 className="font-display text-2xl mt-1">
            {t('customerFlow.order.payAtRestaurant')}
          </h2>

          <p className="text-sm text-ink/55 mt-2">
            {t('customerFlow.order.payAtRestaurantInstructions')}
          </p>

          <div className="mt-4 space-y-3 border-t border-[#9a6b22]/15 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink/50">
                {t('customerFlow.order.paymentMethodLabel')}
              </span>

              <span className="font-medium">
                {collectionMethodLabel(
                  payment?.collectionMethod ??
                    collectionChoice,
                  t
                )}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink/50">
                {t('customerFlow.order.amountLabel')}
              </span>

              <span className="font-medium">
                {formatCents(
                  order.session
                    .payableTotalCents,
                  order.currency
                )}
              </span>
            </div>
          </div>

          <p className="mt-4 text-xs text-ink/45">
            {t('customerFlow.order.cannotChangeMethod')}
          </p>
        </div>
      )}

      {order.session.paid && (
        <div className="mt-8 border border-line rounded-2xl p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#477052]/10 text-[#477052] text-xl">
            OK
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 mt-4">
            {t('customerFlow.order.paymentCompleteEyebrow')}
          </p>

          <h2 className="font-display text-3xl mt-2">
            {t('customerFlow.order.thanksForVisiting')}
          </h2>

          <p className="text-sm text-ink/50 mt-2">
            {t('customerFlow.order.billPaidSuccess')}
          </p>

          <div className="mt-6 space-y-2">
            {order.googleReviewUrl ? (
              <a
                href={
                  order.googleReviewUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#29251f] py-3.5 text-sm font-medium text-[#f5f1e8]"
              >
                {t('customerFlow.order.leaveGoogleReview')}
              </a>
            ) : (
              <div className="border border-line px-4 py-3 text-sm text-ink/45">
                {t('customerFlow.order.reviewsNotConfigured')}
              </div>
            )}

            <button
              type="button"
              onClick={
                toggleSaveRestaurant
              }
              className="block w-full border border-line py-3.5 text-sm font-medium"
            >
              {savedRestaurant
                ? t('customerFlow.order.restaurantSaved')
                : t('customerFlow.order.saveRestaurant')}
            </button>

            <a
              href={`/r/${order.restaurant.slug}?t=${order.table.token}`}
              className="block w-full py-3 text-sm text-ink/55"
            >
              {t('customerFlow.order.backToMenu')}
            </a>
          </div>

          <p className="mt-5 text-[10px] uppercase tracking-[0.12em] text-ink/30">
            {t('customerFlow.order.thankYouDining')}
          </p>

          {paymentReturn && (
            <p className="mt-2 text-[10px] text-ink/30">
              {t('customerFlow.order.paymentConfirmedStripe')}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}