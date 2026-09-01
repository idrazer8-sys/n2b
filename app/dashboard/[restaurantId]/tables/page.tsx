'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type Table = {
  id: string;
  label: string;
  token: string;
  isActive: boolean;
};

type Membership = {
  role: string;
  restaurant: {
    id: string;
    slug: string;
    name: string;
    currency: string;
  };
};

type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED';

type OrderItem = {
  id: string;
  nameSnapshot?: string;
  name?: string;
  quantity: number;
  notes?: string | null;
};

type Order = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  table: {
    id: string;
    label: string;
  };
  items: OrderItem[];
  createdAt: string;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

type TFunction = (key: string, vars?: Record<string, string | number>) => string;

function elapsed(createdAt: string, t: TFunction) {
  const minutes = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / 60000
    )
  );

  if (minutes < 1) return t('menuTables.tables.justNow');
  if (minutes === 1) return t('menuTables.tables.oneMinAgo');
  return t('menuTables.tables.minsAgo', { minutes });
}

function statusLabel(status: OrderStatus, t: TFunction) {
  switch (status) {
    case 'NEW':
      return t('menuTables.tables.statusNew');
    case 'ACCEPTED':
      return t('menuTables.tables.statusAccepted');
    case 'PREPARING':
      return t('menuTables.tables.statusPreparing');
    case 'READY':
      return t('menuTables.tables.statusReady');
    case 'COMPLETED':
      return t('menuTables.tables.statusCompleted');
  }
}

function statusClasses(status: OrderStatus) {
  switch (status) {
    case 'NEW':
      return 'bg-[#5B3DFF]/10 text-[#5B3DFF]';
    case 'ACCEPTED':
      return 'bg-[#9a6b22]/10 text-[#7a551b]';
    case 'PREPARING':
      return 'bg-[#5d6874]/10 text-[#4f5964]';
    case 'READY':
      return 'bg-[#477052]/10 text-[#406449]';
    case 'COMPLETED':
      return 'bg-black/5 text-ink/45';
  }
}

export default function TablesPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { restaurantId } = params;
  const { t } = useI18n();

  const [tables, setTables] = useState<Table[] | null>(null);
  const [slug, setSlug] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [currency, setCurrency] = useState('EUR');

  const [orders, setOrders] = useState<Order[]>([]);

  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      setError(null);

      const [
        tablesRes,
        restaurantsRes,
        activeOrdersRes,
        completedOrdersRes,
      ] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}/tables`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/restaurants', {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/restaurants/${restaurantId}/orders`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(
          `/api/restaurants/${restaurantId}/orders?status=COMPLETED`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        ),
      ]);

      if (!tablesRes.ok) {
        throw new Error(t('menuTables.tables.couldNotLoadTables'));
      }

      if (!restaurantsRes.ok) {
        throw new Error(t('menuTables.editor.couldNotLoadRestaurant'));
      }

      if (!activeOrdersRes.ok) {
        throw new Error(t('menuTables.tables.couldNotLoadActiveOrders'));
      }

      if (!completedOrdersRes.ok) {
        throw new Error(t('menuTables.tables.couldNotLoadOrderHistory'));
      }

      const tableData = (await tablesRes.json()) as Table[];
      const memberships =
        (await restaurantsRes.json()) as Membership[];
      const activeOrders =
        (await activeOrdersRes.json()) as Order[];
      const completedOrders =
        (await completedOrdersRes.json()) as Order[];

      const mine = memberships.find(
        (membership) =>
          membership.restaurant.id === restaurantId
      );

      setTables(tableData);
      setOrders([...activeOrders, ...completedOrders]);

      if (mine) {
        setSlug(mine.restaurant.slug);
        setRestaurantName(mine.restaurant.name);
        setCurrency(mine.restaurant.currency || 'EUR');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.tables.couldNotLoadTables')
      );
    }
  }, [restaurantId, t]);

  useEffect(() => {
    load();

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const source = new EventSource(
      `/api/restaurants/${restaurantId}/orders/stream`
    );

    source.onopen = () => {
      setLive(true);
    };

    source.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.type === 'ORDER_PAID' ||
          data.type === 'ORDER_STATUS_CHANGED'
        ) {
          await load();
        }
      } catch {
        // Ignore malformed events.
      }
    };

    source.onerror = () => {
      setLive(false);
    };

    return () => {
      source.close();
      setLive(false);
    };
  }, [load, restaurantId]);

  const activeOrders = useMemo(
    () =>
      orders.filter((order) =>
        [
          'NEW',
          'ACCEPTED',
          'PREPARING',
          'READY',
        ].includes(order.status)
      ),
    [orders, now]
  );

  const completedOrders = useMemo(
    () =>
      orders.filter(
        (order) => order.status === 'COMPLETED'
      ),
    [orders]
  );

  const activeByTable = useMemo(() => {
    const map = new Map<string, Order[]>();

    for (const order of activeOrders) {
      const list = map.get(order.table.id) ?? [];
      list.push(order);
      map.set(order.table.id, list);
    }

    return map;
  }, [activeOrders]);

  const spentByTable = useMemo(() => {
    const map = new Map<string, number>();

    for (const order of completedOrders) {
      map.set(
        order.table.id,
        (map.get(order.table.id) ?? 0) +
          order.totalCents
      );
    }

    return map;
  }, [completedOrders]);

  function tableUrl(table: Table) {
    return `${window.location.origin}/r/${slug}?t=${table.token}`;
  }

  async function addTable(e: React.FormEvent) {
    e.preventDefault();

    const label = newLabel.trim();
    if (!label) return;

    try {
      setSaving('new');
      setError(null);

      const res = await fetch(
        `/api/restaurants/${restaurantId}/tables`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ label }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error ?? t('menuTables.tables.couldNotCreateTable')
        );
      }

      setNewLabel('');
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.tables.couldNotCreateTable')
      );
    } finally {
      setSaving(null);
    }
  }

  async function saveTable(tableId: string) {
    const label = editingLabel.trim();

    if (!label) {
      setError(t('menuTables.tables.tableNameEmpty'));
      return;
    }

    try {
      setSaving(tableId);
      setError(null);

      const res = await fetch(
        `/api/restaurants/${restaurantId}/tables/${tableId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ label }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error ?? t('menuTables.tables.couldNotUpdateTable')
        );
      }

      setEditingId(null);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.tables.couldNotUpdateTable')
      );
    } finally {
      setSaving(null);
    }
  }

  async function toggleTable(table: Table) {
    try {
      setSaving(table.id);
      setError(null);

      const res = await fetch(
        `/api/restaurants/${restaurantId}/tables/${table.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !table.isActive,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error ?? t('menuTables.tables.couldNotUpdateTable')
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.tables.couldNotUpdateTable')
      );
    } finally {
      setSaving(null);
    }
  }

  async function deleteTable(table: Table) {
    const confirmed = window.confirm(
      t('menuTables.tables.confirmDeleteTable', { label: table.label })
    );

    if (!confirmed) return;

    try {
      setSaving(table.id);
      setError(null);

      const res = await fetch(
        `/api/restaurants/${restaurantId}/tables/${table.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error ?? t('menuTables.tables.couldNotDeleteTable')
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.tables.couldNotDeleteTable')
      );
    } finally {
      setSaving(null);
    }
  }

  async function copyUrl(table: Table) {
    try {
      await navigator.clipboard.writeText(tableUrl(table));

      setCopiedId(table.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch {
      setError(t('menuTables.tables.couldNotCopyUrl'));
    }
  }

  function openCustomerPage(table: Table) {
    window.open(
      tableUrl(table),
      '_blank',
      'noopener,noreferrer'
    );
  }

  async function downloadQrCard(table: Table) {
    setDownloadingId(table.id);
    setError(null);

    try {
      await Promise.all([
        document.fonts.load('700 40px Fraunces'),
        document.fonts.load('600 32px Fraunces'),
        document.fonts.load('600 16px Inter'),
      ]);

      const qrResponse = await fetch(
        `/api/restaurants/${restaurantId}/tables/${table.id}/qr`
      );

      if (!qrResponse.ok) {
        throw new Error(t('menuTables.tables.couldNotBuildQrCard'));
      }

      const qrBlob = await qrResponse.blob();
      const qrUrl = URL.createObjectURL(qrBlob);

      const qrImage = await new Promise<HTMLImageElement>(
        (resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () =>
            reject(new Error(t('menuTables.tables.couldNotBuildQrCard')));
          img.src = qrUrl;
        }
      );

      const width = 900;
      const height = 1180;
      const ink = '#29251f';
      const cream = '#f7f3ec';
      const burgundy = '#7b2d26';

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(t('menuTables.tables.couldNotBuildQrCard'));

      // Menu-aesthetic card background.
      ctx.fillStyle = cream;
      ctx.fillRect(0, 0, width, height);

      // Outer hairline frame, matching the menu's thin-border language.
      const frameInset = 44;
      ctx.strokeStyle = `${ink}4D`; // ~30% opacity
      ctx.lineWidth = 2;
      ctx.strokeRect(
        frameInset,
        frameInset,
        width - frameInset * 2,
        height - frameInset * 2
      );

      const centerX = width / 2;
      let y = frameInset + 74;

      // Restaurant name — same font-display serif the customer menu uses.
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.font = '700 46px Fraunces, serif';
      ctx.fillText(restaurantName || 'Restaurant', centerX, y);

      y += 40;

      // Eyebrow tagline.
      ctx.font = '600 15px Inter, sans-serif';
      ctx.fillStyle = `${ink}80`; // ~50% opacity
      ctx.save();
      const eyebrow = t('menuTables.tables.qrCardEyebrow').toUpperCase();
      ctx.font = '600 15px Inter, sans-serif';
      // Approximate letter-spacing by drawing char-by-char.
      const spacing = 3;
      const totalWidth =
        eyebrow
          .split('')
          .reduce((sum, ch) => sum + ctx.measureText(ch).width + spacing, 0) -
        spacing;
      let cx = centerX - totalWidth / 2;
      for (const ch of eyebrow) {
        ctx.textAlign = 'left';
        ctx.fillText(ch, cx, y);
        cx += ctx.measureText(ch).width + spacing;
      }
      ctx.restore();

      y += 34;

      // Dotted divider, matching the menu's ticket-leader motif.
      ctx.strokeStyle = `${ink}33`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.moveTo(frameInset + 90, y);
      ctx.lineTo(width - frameInset - 90, y);
      ctx.stroke();
      ctx.setLineDash([]);

      y += 56;

      // QR code, boxed with a hairline border.
      const qrSize = 560;
      const qrX = centerX - qrSize / 2;
      ctx.strokeStyle = `${ink}1A`;
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX - 24, y - 24, qrSize + 48, qrSize + 48);
      ctx.drawImage(qrImage, qrX, y, qrSize, qrSize);

      y += qrSize + 70;

      // Table number — the explicit ask: make it prominent under the QR.
      ctx.textAlign = 'center';
      ctx.font = '600 15px Inter, sans-serif';
      ctx.fillStyle = `${ink}80`;
      ctx.fillText(
        t('menuTables.tables.qrCardTableEyebrow').toUpperCase(),
        centerX,
        y
      );

      y += 54;

      ctx.font = '700 64px Fraunces, serif';
      ctx.fillStyle = burgundy;
      ctx.fillText(table.label, centerX, y);

      y += 46;

      ctx.font = '500 15px Inter, sans-serif';
      ctx.fillStyle = `${ink}66`;
      ctx.fillText(t('menuTables.tables.qrCardScanToOrder'), centerX, y);

      URL.revokeObjectURL(qrUrl);

      const finalUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = finalUrl;
      link.download = `${table.label}-qr.png`;
      link.click();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.tables.couldNotBuildQrCard')
      );
    } finally {
      setDownloadingId(null);
    }
  }

  if (!tables) {
    return (
      <div className="text-sm text-ink/50">
        {t('menuTables.tables.loadingTables')}
      </div>
    );
  }

  const activeTables = tables.filter(
    (table) => table.isActive
  ).length;

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
            {restaurantName || t('menuTables.tables.restaurantFallback')}
          </p>

          <h1 className="font-display text-3xl mt-1">
            {t('menuTables.tables.heading')}
          </h1>

          <p className="text-sm text-ink/50 mt-2">
            {t('menuTables.tables.subheading')}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-ink/40">
          <span>
            {t('menuTables.tables.activeTotalSummary', {
              active: activeTables,
              total: tables.length,
            })}
          </span>

          <span className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                live
                  ? 'bg-[#477052]'
                  : 'bg-[#9a6b22]'
              }`}
            />
            {live ? t('menuTables.tables.live') : t('menuTables.tables.offline')}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form
        onSubmit={addTable}
        className="border border-line rounded-xl p-5 mb-8"
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40 mb-2">
          {t('menuTables.tables.addTable')}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            required
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder={t('menuTables.tables.tableNamePlaceholder')}
            className="border border-line rounded-lg px-3 py-2 text-sm flex-1"
          />

          <button
            disabled={saving === 'new'}
            className="bg-ink text-paper rounded-lg px-5 py-2 text-sm disabled:opacity-50"
          >
            {saving === 'new'
              ? t('menuTables.tables.adding')
              : t('menuTables.tables.addTable')}
          </button>
        </div>
      </form>

      {tables.length === 0 ? (
        <div className="border border-line rounded-xl px-6 py-12 text-center">
          <h2 className="font-display text-2xl">
            {t('menuTables.tables.noTablesYet')}
          </h2>

          <p className="text-sm text-ink/50 mt-2">
            {t('menuTables.tables.addFirstTableAbove')}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => {
            const tableActiveOrders =
              activeByTable.get(table.id) ?? [];

            const tableCompletedOrders =
              completedOrders.filter(
                (order) => order.table.id === table.id
              );

            const spent =
              spentByTable.get(table.id) ?? 0;

            return (
              <article
                key={table.id}
                className={`border rounded-xl overflow-hidden ${
                  table.isActive
                    ? 'border-line'
                    : 'border-line opacity-65'
                }`}
              >
                <div className="bg-black/[0.02] border-b border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {editingId === table.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={editingLabel}
                            onChange={(e) =>
                              setEditingLabel(e.target.value)
                            }
                            className="border border-line rounded-lg px-3 py-2 text-sm w-full"
                          />

                          <button
                            type="button"
                            disabled={
                              saving === table.id
                            }
                            onClick={() =>
                              saveTable(table.id)
                            }
                            className="bg-ink text-paper rounded-lg px-3 py-2 text-xs"
                          >
                            {t('common.save')}
                          </button>
                        </div>
                      ) : (
                        <>
                          <h2 className="font-display text-2xl">
                            {table.label}
                          </h2>

                          <p className="text-xs text-ink/40 mt-1">
                            {table.isActive
                              ? t('common.active')
                              : t('common.inactive')}
                          </p>
                        </>
                      )}
                    </div>

                    {editingId !== table.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(table.id);
                          setEditingLabel(table.label);
                        }}
                        className="text-xs text-ink/45 underline underline-offset-2"
                      >
                        {t('common.edit')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <img
                    src={`/api/restaurants/${restaurantId}/tables/${table.id}/qr`}
                    alt={t('menuTables.tables.qrCodeAlt', { label: table.label })}
                    className={`w-full aspect-square object-contain mb-4 ${
                      table.isActive
                        ? ''
                        : 'grayscale'
                    }`}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={downloadingId === table.id}
                      onClick={() => void downloadQrCard(table)}
                      className="text-xs text-center border border-line rounded-lg px-3 py-2 disabled:opacity-50"
                    >
                      {downloadingId === table.id
                        ? t('common.loading')
                        : t('menuTables.tables.downloadQr')}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyUrl(table)}
                      className="text-xs border border-line rounded-lg px-3 py-2"
                    >
                      {copiedId === table.id
                        ? t('menuTables.tables.copied')
                        : t('menuTables.tables.copyUrl')}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openCustomerPage(table)
                      }
                      className="text-xs border border-line rounded-lg px-3 py-2"
                    >
                      {t('menuTables.tables.openMenu')}
                    </button>

                    <button
                      type="button"
                      disabled={saving === table.id}
                      onClick={() =>
                        toggleTable(table)
                      }
                      className="text-xs border border-line rounded-lg px-3 py-2"
                    >
                      {table.isActive
                        ? t('menuTables.tables.deactivate')
                        : t('menuTables.tables.activate')}
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={saving === table.id}
                    onClick={() => deleteTable(table)}
                    className="w-full mt-2 text-xs text-red-700 border border-red-200 rounded-lg px-3 py-2"
                  >
                    {t('menuTables.tables.deleteTable')}
                  </button>

                  <div className="mt-6 pt-5 border-t border-line">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                          {t('menuTables.tables.currentActivity')}
                        </p>

                        <p className="font-display text-xl mt-1">
                          {tableActiveOrders.length === 0
                            ? t('menuTables.tables.noActiveOrder')
                            : t(
                                tableActiveOrders.length === 1
                                  ? 'menuTables.tables.activeOrdersCountSingular'
                                  : 'menuTables.tables.activeOrdersCountPlural',
                                { count: tableActiveOrders.length }
                              )}
                        </p>
                      </div>

                      {tableActiveOrders.length > 0 && (
                        <span className="h-3 w-3 rounded-full bg-[#5B3DFF]" />
                      )}
                    </div>

                    {tableActiveOrders.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {tableActiveOrders.map(
                          (order) => (
                            <div
                              key={order.id}
                              className="border border-[#5B3DFF]/20 bg-[#5B3DFF]/[0.035] rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-medium text-sm">
                                  {t('menuTables.tables.orderNumber', {
                                    number: order.orderNumber,
                                  })}
                                </span>

                                <span
                                  className={`text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-full ${statusClasses(
                                    order.status
                                  )}`}
                                >
                                  {statusLabel(
                                    order.status,
                                    t
                                  )}
                                </span>
                              </div>

                              <p className="text-[11px] text-ink/45 mt-1">
                                {elapsed(
                                  order.createdAt,
                                  t
                                )}
                              </p>

                              <div className="mt-3 space-y-1">
                                {order.items.map(
                                  (item) => (
                                    <div
                                      key={item.id}
                                      className="text-xs"
                                    >
                                      <span className="text-ink/50">
                                        {item.quantity} ×
                                      </span>{' '}
                                      {item.nameSnapshot ||
                                        item.name ||
                                        t('menuTables.tables.itemFallback')}

                                      {item.notes && (
                                        <span className="block ml-4 text-ink/40 italic">
                                          {item.notes}
                                        </span>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1A134D]/10">
                                <span className="text-[10px] uppercase tracking-[0.1em] text-ink/40">
                                  {t('menuTables.tables.currentOrderLabel')}
                                </span>

                                <span className="text-sm font-medium">
                                  {money(
                                    order.totalCents,
                                    order.currency ||
                                      currency
                                  )}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-line">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                          {t('menuTables.tables.totalSpent')}
                        </p>

                        <p className="font-display text-xl mt-1">
                          {money(spent, currency)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-ink/40">
                          {t('menuTables.tables.completedOrders')}
                        </p>

                        <p className="text-sm mt-1">
                          {tableCompletedOrders.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {tableActiveOrders.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40 mb-2">
                        {t('menuTables.tables.orderProgress')}
                      </p>

                      <div className="flex items-center gap-1">
                        {[
                          'NEW',
                          'ACCEPTED',
                          'PREPARING',
                          'READY',
                          'COMPLETED',
                        ].map((step, index, steps) => {
                          const current =
                            tableActiveOrders[0]
                              .status;

                          const currentIndex =
                            steps.indexOf(current);

                          const stepIndex = index;

                          return (
                            <div
                              key={step}
                              className="flex items-center flex-1"
                            >
                              <div
                                className={`h-2 w-full rounded-full ${
                                  stepIndex <=
                                  currentIndex
                                    ? 'bg-[#5B3DFF]'
                                    : 'bg-black/10'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between mt-2 text-[8px] uppercase tracking-[0.06em] text-ink/35">
                        <span>{t('menuTables.tables.statusNew')}</span>
                        <span>{t('menuTables.tables.statusAccepted')}</span>
                        <span>{t('menuTables.tables.statusPreparing')}</span>
                        <span>{t('menuTables.tables.statusReady')}</span>
                        <span>{t('menuTables.tables.statusServed')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-10 border-t border-line pt-6">
        <h2 className="font-display text-xl">
          {t('menuTables.tables.qrNfcHeading')}
        </h2>

        <div className="mt-3 space-y-2 text-sm text-ink/55">
          <p>
            {t('menuTables.tables.qrNfcParagraph1')}
          </p>

          <p>
            {t('menuTables.tables.qrNfcParagraph2', {
              copyUrl: t('menuTables.tables.copyUrl'),
              downloadQr: t('menuTables.tables.downloadQr'),
            })}
          </p>

          <p>
            {t('menuTables.tables.qrNfcParagraph3')}
          </p>
        </div>
      </div>
    </div>
  );
}
