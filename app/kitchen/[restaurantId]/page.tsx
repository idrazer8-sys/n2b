'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';

type Membership = {
  role: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    currency: string;
  };
};

type Order = {
  id: string;
  orderNumber: number;
  status: 'NEW' | 'ACCEPTED' | 'PREPARING';
  createdAt: string;
  totalCents: number;
  currency: string;
  table: {
    id: string;
    label: string;
  } | null;
  items: {
    id: string;
    nameSnapshot: string;
    quantity: number;
    notes: string | null;
    status: 'PENDING' | 'SERVED' | 'UNAVAILABLE';
    kitchenKind: 'FOOD' | 'DRINKS' | 'DESSERT';
  }[];
};

// Drinks-only orders need no preparation, so kitchen can send them
// straight to the waiter instead of walking them through Accept ->
// Preparing -> Ready.
function isDrinksOnly(order: Order) {
  return order.items.every((item) => item.kitchenKind === 'DRINKS');
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

function elapsed(
  createdAt: string,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  const minutes = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / 60000
    )
  );

  if (minutes < 1) return t('staffMisc.kitchen.justNow');
  if (minutes === 1) return t('staffMisc.kitchen.oneMinAgo');
  return t('staffMisc.kitchen.minutesAgo', { minutes });
}

function KitchenOrderCard({
  order,
  currency,
  updating,
  actionLabel,
  onAction,
  markingItemId,
  onMarkItemUnavailable,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  order: Order;
  currency: string;
  updating: boolean;
  actionLabel: string;
  onAction: () => void;
  markingItemId: string | null;
  onMarkItemUnavailable: (itemId: string, note: string) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  const { t } = useI18n();
  const [notePromptItemId, setNotePromptItemId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  return (
    <article className="border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
            {t('staffMisc.kitchen.tableLabel')}
          </p>

          <h2 className="font-display text-4xl mt-1">
            {order.table?.label ?? '—'}
          </h2>
        </div>

        <div className="text-right">
          <p className="text-xs text-white/45">
            {elapsed(order.createdAt, t)}
          </p>

          <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-white/25">
            {t('staffMisc.kitchen.orderNumber', { number: order.orderNumber })}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4 space-y-4">
        {order.items.map((item) => (
          <div key={item.id}>
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium text-white/55">
                {item.quantity} ×
              </span>

              <span
                className={`flex-1 font-display text-xl ${
                  item.status === 'UNAVAILABLE'
                    ? 'line-through text-white/30'
                    : ''
                }`}
              >
                {item.nameSnapshot}
              </span>

              {item.status === 'UNAVAILABLE' ? (
                <span className="text-[10px] uppercase tracking-[0.08em] text-[#e2a5a5]">
                  {t('staffMisc.kitchen.itemUnavailable')}
                </span>
              ) : notePromptItemId === item.id ? null : (
                <button
                  type="button"
                  onClick={() => {
                    setNotePromptItemId(item.id);
                    setNote('');
                  }}
                  className="text-[10px] uppercase tracking-[0.08em] text-white/40 hover:text-[#e2a5a5] shrink-0"
                >
                  {t('staffMisc.kitchen.markUnavailable')}
                </button>
              )}
            </div>

            {item.notes && (
              <p className="ml-8 mt-2 border-l border-[#c39a62] pl-3 text-sm italic text-[#e2c7a2]">
                {item.notes}
              </p>
            )}

            {notePromptItemId === item.id && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('staffMisc.kitchen.unavailableNotePlaceholder')}
                  className="flex-1 bg-white/5 border border-white/15 px-2.5 py-1.5 text-xs text-white placeholder:text-white/30"
                />
                <button
                  type="button"
                  disabled={markingItemId === item.id}
                  onClick={() => {
                    onMarkItemUnavailable(item.id, note);
                    setNotePromptItemId(null);
                  }}
                  className="text-[10px] uppercase tracking-[0.08em] bg-[#9b554a] text-white px-2.5 py-1.5 disabled:opacity-50 shrink-0"
                >
                  {t('staffMisc.kitchen.confirmUnavailable')}
                </button>
                <button
                  type="button"
                  onClick={() => setNotePromptItemId(null)}
                  className="text-[10px] uppercase tracking-[0.08em] text-white/40 shrink-0"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
        <span className="text-sm text-white/45">
          {money(
            order.totalCents,
            order.currency || currency
          )}
        </span>

        <div className="flex items-center gap-2">
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              disabled={updating}
              onClick={onSecondaryAction}
              className="border border-n2bOffwhite/40 px-4 py-3 text-sm font-medium text-n2bOffwhite disabled:opacity-50"
            >
              {secondaryActionLabel}
            </button>
          )}

          <button
            type="button"
            disabled={updating}
            onClick={onAction}
            className="bg-n2bOffwhite px-5 py-3 text-sm font-medium text-n2bNavy disabled:opacity-50"
          >
            {updating ? t('staffMisc.kitchen.updating') : actionLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function KitchenPage() {
  const params = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const restaurantId = params.restaurantId;

  const { t } = useI18n();

  const [restaurant, setRestaurant] =
    useState<Membership['restaurant'] | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [markingItemId, setMarkingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Sequential rather than concurrent — firing both at once was
    // occasionally enough load to randomly exhaust the DB pooler's
    // connection limit and fail one of them.
    const fetchOpts = {
      credentials: 'include' as const,
      cache: 'no-store' as const,
    };
    const restaurantsRes = await fetch('/api/restaurants', fetchOpts);
    const ordersRes = await fetch(
      `/api/restaurants/${restaurantId}/orders`,
      fetchOpts
    );

    if (restaurantsRes.status === 401) {
      throw new Error('__UNAUTHORIZED__');
    }

    if (!restaurantsRes.ok) {
      throw new Error(t('staffMisc.kitchen.couldNotLoadAccess'));
    }

    if (!ordersRes.ok) {
      throw new Error(
        ordersRes.status === 403
          ? t('staffMisc.kitchen.noStaffAccess')
          : t('staffMisc.kitchen.couldNotLoadOrders')
      );
    }

    const memberships =
      (await restaurantsRes.json()) as Membership[];

    const membership = memberships.find(
      (item) => item.restaurant.id === restaurantId
    );

    if (!membership) {
      throw new Error(
        t('staffMisc.kitchen.noAccess')
      );
    }

    const allOrders =
      (await ordersRes.json()) as Array<
        Omit<Order, 'status'> & { status: string }
      >;

    const kitchenOrders = allOrders.filter(
      (order): order is Order =>
        order.status === 'NEW' ||
        order.status === 'ACCEPTED' ||
        order.status === 'PREPARING'
    );

    setRestaurant(membership.restaurant);
    setOrders(kitchenOrders);
  }, [restaurantId, router, t]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        setLoading(true);
        setError(null);
        await load();
      } catch (err) {
        // A transient auth/connection hiccup right after a fresh
        // session can fail once and succeed immediately after — one
        // quick retry avoids bouncing the cook to the login page for
        // something that fixes itself right away.
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await load();
        } catch (retryErr) {
          if (!mounted) return;

          if (
            retryErr instanceof Error &&
            retryErr.message === '__UNAUTHORIZED__'
          ) {
            router.push('/login');
            return;
          }

          setError(
            retryErr instanceof Error
              ? retryErr.message
              : t('staffMisc.kitchen.couldNotLoadKitchen')
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [load]);

  useEffect(() => {
    const source = new EventSource(
      `/api/restaurants/${restaurantId}/orders/stream`
    );

    source.onopen = () => {
      setConnected(true);
    };

    source.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.type === 'ORDER_CREATED' ||
          data.type === 'ORDER_STATUS_CHANGED' ||
          data.type === 'ORDER_READY'
        ) {
          await load();
        }
      } catch {
        // Ignore malformed events.
      }
    };

    source.onerror = () => {
      setConnected(false);
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [load, restaurantId]);

  async function updateOrder(
    orderId: string,
    status: 'ACCEPTED' | 'PREPARING' | 'READY'
  ) {
    try {
      setUpdating(orderId);
      setError(null);

      const response = await fetch(
        `/api/restaurants/${restaurantId}/orders/${orderId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? t('staffMisc.kitchen.couldNotUpdateOrder')
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffMisc.kitchen.couldNotUpdateOrder')
      );
    } finally {
      setUpdating(null);
    }
  }

  async function markItemUnavailable(
    orderId: string,
    itemId: string,
    note: string
  ) {
    try {
      setMarkingItemId(itemId);
      setError(null);

      const response = await fetch(
        `/api/restaurants/${restaurantId}/orders/${orderId}/items/${itemId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'UNAVAILABLE',
            note: note || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? t('staffMisc.kitchen.couldNotUpdateOrder')
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffMisc.kitchen.couldNotUpdateOrder')
      );
    } finally {
      setMarkingItemId(null);
    }
  }

  const newOrders = orders.filter(
    (order) => order.status === 'NEW'
  );

  const acceptedOrders = orders.filter(
    (order) => order.status === 'ACCEPTED'
  );

  const preparingOrders = orders.filter(
    (order) => order.status === 'PREPARING'
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-n2bNavy text-n2bOffwhite flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            {t('staffMisc.kitchen.title')}
          </p>

          <h1 className="font-display text-3xl mt-2">
            {t('common.loading')}
          </h1>
        </div>
      </main>
    );
  }

  if (error && !restaurant) {
    return (
      <main className="min-h-screen bg-n2bNavy text-n2bOffwhite flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="font-display text-3xl">
            {t('staffMisc.kitchen.unavailableTitle')}
          </h1>

          <p className="mt-3 text-sm text-white/55">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-n2bNavy text-n2bOffwhite pb-12">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-n2bNavy/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <N2BLogo markSize={32} wordmarkClassName="text-lg leading-none text-white" />

              <div className="border-l border-white/10 pl-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {restaurant?.name}
                </p>

                <h1 className="font-display text-3xl mt-1">
                  {t('staffMisc.kitchen.title')}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-xs text-white/45">
                <span
                  className={`h-2 w-2 rounded-full ${
                    connected
                      ? 'bg-[#79a77f]'
                      : 'bg-[#b9914f]'
                  }`}
                />

                {connected
                  ? t('staffMisc.kitchen.live')
                  : t('staffMisc.kitchen.reconnecting')}
              </span>

              <LanguageSwitcher />

              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                  });

                  router.push('/login');
                }}
                className="border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.1em] text-white/70"
              >
                {t('common.signOut')}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 border border-[#9b554a]/50 bg-[#9b554a]/10 px-4 py-3 text-sm text-[#f0c6bd]">
              {error}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display text-2xl">
                {t('staffMisc.kitchen.newOrders')}
              </h2>

              <span className="min-w-6 h-6 px-2 rounded-full bg-n2bPurple flex items-center justify-center text-xs">
                {newOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {newOrders.length === 0 ? (
                <div className="border border-white/10 p-8 text-center text-sm text-white/40">
                  {t('staffMisc.kitchen.noNewOrders')}
                </div>
              ) : (
                newOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    currency={restaurant?.currency ?? 'EUR'}
                    updating={updating === order.id}
                    actionLabel={t('staffMisc.kitchen.acceptOrder')}
                    onAction={() =>
                      updateOrder(
                        order.id,
                        'ACCEPTED'
                      )
                    }
                    markingItemId={markingItemId}
                    onMarkItemUnavailable={(itemId, note) =>
                      void markItemUnavailable(order.id, itemId, note)
                    }
                    secondaryActionLabel={
                      isDrinksOnly(order)
                        ? t('staffMisc.kitchen.sendDirectToWaiter')
                        : undefined
                    }
                    onSecondaryAction={
                      isDrinksOnly(order)
                        ? () => updateOrder(order.id, 'READY')
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display text-2xl">
                {t('staffMisc.kitchen.accepted')}
              </h2>

              <span className="min-w-6 h-6 px-2 rounded-full bg-white/10 flex items-center justify-center text-xs">
                {acceptedOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {acceptedOrders.length === 0 ? (
                <div className="border border-white/10 p-8 text-center text-sm text-white/40">
                  {t('staffMisc.kitchen.noAcceptedOrders')}
                </div>
              ) : (
                acceptedOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    currency={restaurant?.currency ?? 'EUR'}
                    updating={updating === order.id}
                    actionLabel={t('staffMisc.kitchen.startPreparing')}
                    onAction={() =>
                      updateOrder(
                        order.id,
                        'PREPARING'
                      )
                    }
                    markingItemId={markingItemId}
                    onMarkItemUnavailable={(itemId, note) =>
                      void markItemUnavailable(order.id, itemId, note)
                    }
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display text-2xl">
                {t('staffMisc.kitchen.preparing')}
              </h2>

              <span className="min-w-6 h-6 px-2 rounded-full bg-white/10 flex items-center justify-center text-xs">
                {preparingOrders.length}
              </span>
            </div>

            <div className="space-y-4">
              {preparingOrders.length === 0 ? (
                <div className="border border-white/10 p-8 text-center text-sm text-white/40">
                  {t('staffMisc.kitchen.nothingCooking')}
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    currency={restaurant?.currency ?? 'EUR'}
                    updating={updating === order.id}
                    actionLabel={t('staffMisc.kitchen.markReady')}
                    onAction={() =>
                      updateOrder(
                        order.id,
                        'READY'
                      )
                    }
                    markingItemId={markingItemId}
                    onMarkItemUnavailable={(itemId, note) =>
                      void markItemUnavailable(order.id, itemId, note)
                    }
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
