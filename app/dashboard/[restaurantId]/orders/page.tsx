'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCents } from '@/src/lib/format';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type OrderItem = {
  nameSnapshot: string;
  quantity: number;
  notes: string | null;
};

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  totalCents: number;
  currency: string;
  table: { label: string };
  items: OrderItem[];
  createdAt: string;
};

export default function OrdersPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { restaurantId } = params;

  const { t } = useI18n();

  const [orders, setOrders] = useState<Order[]>([]);
  const [readyNotice, setReadyNotice] =
    useState<Order | null>(null);

  const audioCtxRef =
    useRef<AudioContext | null>(null);

  async function load() {
    const res = await fetch(
      `/api/restaurants/${restaurantId}/orders`,
      { credentials: 'include', cache: 'no-store' }
    );

    if (!res.ok) return;

    const all = await res.json();

    setOrders(
      all.filter(
        (order: Order) =>
          order.status === 'READY'
      )
    );
  }

  function chime() {
    try {
      const ctx =
        audioCtxRef.current ??
        new AudioContext();

      audioCtxRef.current = ctx;

      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.frequency.value = 880;
      osc2.frequency.value = 1174;

      osc1.connect(ctx.destination);
      osc2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.18);

      osc1.stop(now + 0.16);
      osc2.stop(now + 0.34);
    } catch {
      // Browser audio may be unavailable until user interaction.
    }
  }

  useEffect(() => {
    load();

    const source =
      new EventSource(
        `/api/restaurants/${restaurantId}/orders/stream`
      );

    source.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'ORDER_READY') {
          chime();

          const res = await fetch(
            `/api/restaurants/${restaurantId}/orders`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
          );

          if (res.ok) {
            const all = await res.json();

            const readyOrder = all.find(
              (order: Order) =>
                order.id === data.orderId
            );

            if (
              readyOrder &&
              readyOrder.status === 'READY'
            ) {
              setReadyNotice(readyOrder);

              window.setTimeout(() => {
                setReadyNotice((current) =>
                  current?.id === readyOrder.id
                    ? null
                    : current
                );
              }, 8000);
            }

            setOrders(
              all.filter(
                (order: Order) =>
                  order.status === 'READY'
              )
            );
          }

          return;
        }

        if (data.type === 'ORDER_STATUS_CHANGED') {
          load();
        }
      } catch {
        // Ignore malformed events.
      }
    };

    return () => source.close();
  }, [restaurantId]);

  async function markServed(order: Order) {
    const res = await fetch(
      `/api/restaurants/${restaurantId}/orders/${order.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED',
        }),
      }
    );

    if (!res.ok) return;

    setOrders((current) =>
      current.filter(
        (item) => item.id !== order.id
      )
    );

    if (readyNotice?.id === order.id) {
      setReadyNotice(null);
    }
  }

  return (
    <div>
      {readyNotice && (
        <div className="fixed right-5 top-5 z-50 max-w-sm border border-[#477052]/20 bg-[#477052] px-5 py-4 text-white shadow-2xl">
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/70">
            {t('ordersWaiters.orders.readyNoticeTitle')}
          </p>

          <p className="font-display text-2xl mt-1">
            {readyNotice.table.label}
          </p>

          <p className="text-sm mt-1 text-white/85">
            {t('ordersWaiters.orders.readyNoticeBody', {
              number: readyNotice.orderNumber,
            })}
          </p>

          <button
            type="button"
            onClick={() =>
              setReadyNotice(null)
            }
            className="mt-3 text-xs underline text-white/70"
          >
            {t('ordersWaiters.orders.dismiss')}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
            {t('ordersWaiters.orders.eyebrow')}
          </p>

          <h1 className="font-display text-2xl">
            {t('ordersWaiters.orders.title')}
          </h1>
        </div>

        <span className="text-sm text-ink/50">
          {orders.length === 1
            ? t('ordersWaiters.orders.countSingular', {
                count: orders.length,
              })
            : t('ordersWaiters.orders.countPlural', {
                count: orders.length,
              })}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="border border-line rounded-xl px-6 py-12 text-center">
          <p className="font-display text-2xl">
            {t('ordersWaiters.orders.emptyTitle')}
          </p>

          <p className="text-sm text-ink/50 mt-2">
            {t('ordersWaiters.orders.emptyBody')}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-[#477052]/25 bg-[#477052]/[0.035] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">
                    {t('ordersWaiters.orders.tablePrefix', {
                      label: order.table.label,
                    })}
                  </p>

                  <p className="text-xs text-ink/40 mt-1">
                    {t('ordersWaiters.orders.orderNumber', {
                      number: order.orderNumber,
                    })}
                  </p>
                </div>

                <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-[#477052]/10 text-[#477052]">
                  {t('ordersWaiters.orders.statusReady')}
                </span>
              </div>

              <ul className="text-sm space-y-1 mb-4">
                {order.items.map(
                  (item, index) => (
                    <li key={index}>
                      <span className="tabular text-ink/50">
                        {item.quantity}×
                      </span>{' '}
                      {item.nameSnapshot}

                      {item.notes && (
                        <span className="text-ink/40 italic">
                          {' '}
                          — {item.notes}
                        </span>
                      )}
                    </li>
                  )
                )}
              </ul>

              <div className="flex items-center justify-between">
                <span className="tabular font-medium">
                  {formatCents(
                    order.totalCents,
                    order.currency
                  )}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    markServed(order)
                  }
                  className="text-xs bg-ink text-paper rounded-full px-4 py-2"
                >
                  {t('ordersWaiters.orders.markServed')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
