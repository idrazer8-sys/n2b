'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import {
  PlusIcon,
  TrashIcon,
  CloseIcon,
  CheckIcon,
  UsersIcon,
  CreditCardIcon,
  UtensilsIcon,
  ClipboardIcon,
} from '@/components/branding/icons';

type Shape = 'SQUARE' | 'RECT' | 'CIRCLE';

type ZoneRow = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type TableRow = {
  id: string;
  label: string;
  isActive: boolean;
  zoneId: string | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  shape: Shape;
};

type OrderRow = {
  id: string;
  orderNumber: number;
  status:
    | 'PENDING_PAYMENT'
    | 'NEW'
    | 'ACCEPTED'
    | 'PREPARING'
    | 'READY'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'PAYMENT_FAILED';
  totalCents: number;
};

type StatusRow = {
  table: { id: string; label: string; isActive: boolean };
  status:
    | 'FREE'
    | 'OPEN'
    | 'OCCUPIED'
    | 'READY_TO_PAY'
    | 'PAYMENT_REQUESTED'
    | 'PAID';
  customerSessionId: string | null;
  totalCents: number;
  partySize: number | null;
  orders: OrderRow[];
};

type NotificationType = 'pago' | 'pedido' | 'comanda';

type NotificationItem = {
  id: string;
  tableId: string;
  tableLabel: string;
  type: NotificationType;
  text: string;
};

const DEFAULT_TABLE_SIZE = 88;
const DEFAULT_ZONE_SIZE = { width: 260, height: 220 };

function statusDotColor(status: StatusRow['status']) {
  switch (status) {
    case 'FREE':
      return '#5b6472';
    case 'OPEN':
    case 'OCCUPIED':
      return '#35c88a';
    case 'READY_TO_PAY':
    case 'PAYMENT_REQUESTED':
      return '#ef5a6f';
    case 'PAID':
      return '#5B3DFF';
    default:
      return '#5b6472';
  }
}

export default function PisoBoard({
  restaurantId,
  editable,
  scopeToMine,
}: {
  restaurantId: string;
  editable: boolean;
  scopeToMine: boolean;
}) {
  const { t } = useI18n();

  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<
    { kind: 'table' | 'zone'; id: string } | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const draggingRef = useRef(false);
  const dragState = useRef<{
    kind: 'table' | 'zone';
    id: string;
    action: 'move' | 'resize';
    startX: number;
    startY: number;
    orig: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const statusByTableId = useMemo(() => {
    const map = new Map<string, StatusRow>();
    for (const row of statuses) map.set(row.table.id, row);
    return map;
  }, [statuses]);

  const loadLayout = useCallback(async () => {
    try {
      const [tablesRes, zonesRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}/tables`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/restaurants/${restaurantId}/table-zones`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      const tablesJson = await tablesRes.json().catch(() => []);
      const zonesJson = await zonesRes.json().catch(() => []);

      if (!tablesRes.ok || !zonesRes.ok) {
        throw new Error(t('floorPlan.error'));
      }

      setTables(
        (Array.isArray(tablesJson) ? tablesJson : []).filter(
          (row: TableRow) => row.isActive
        )
      );
      setZones(Array.isArray(zonesJson) ? zonesJson : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('floorPlan.error'));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  const loadStatuses = useCallback(async () => {
    try {
      const url = `/api/restaurants/${restaurantId}/table-status${
        scopeToMine ? '?mine=1' : ''
      }`;
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      const json = await res.json().catch(() => ({ tables: [] }));
      if (res.ok) {
        setStatuses(Array.isArray(json.tables) ? json.tables : []);
      }
    } catch {
      // Live status is best-effort; a failed poll just keeps the last
      // known state instead of blanking the board.
    }
  }, [restaurantId, scopeToMine]);

  useEffect(() => {
    void loadLayout();
    void loadStatuses();
    const interval = window.setInterval(() => {
      if (!draggingRef.current) void loadStatuses();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [loadLayout, loadStatuses]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    for (const row of statuses) {
      if (dismissed.has(row.table.id)) continue;

      if (row.status === 'PAYMENT_REQUESTED') {
        items.push({
          id: `${row.table.id}-bill`,
          tableId: row.table.id,
          tableLabel: row.table.label,
          type: 'pago',
          text: t('floorPlan.notifications.billRequested'),
        });
      } else if (row.status === 'READY_TO_PAY') {
        items.push({
          id: `${row.table.id}-ready-to-pay`,
          tableId: row.table.id,
          tableLabel: row.table.label,
          type: 'pago',
          text: t('floorPlan.notifications.readyToPay'),
        });
      }

      for (const order of row.orders) {
        if (order.status === 'NEW' || order.status === 'ACCEPTED') {
          items.push({
            id: `${row.table.id}-order-${order.id}`,
            tableId: row.table.id,
            tableLabel: row.table.label,
            type: 'pedido',
            text: t('floorPlan.notifications.newOrder'),
          });
        } else if (order.status === 'PREPARING') {
          items.push({
            id: `${row.table.id}-order-${order.id}`,
            tableId: row.table.id,
            tableLabel: row.table.label,
            type: 'comanda',
            text: t('floorPlan.notifications.preparing'),
          });
        } else if (order.status === 'READY') {
          items.push({
            id: `${row.table.id}-order-${order.id}`,
            tableId: row.table.id,
            tableLabel: row.table.label,
            type: 'comanda',
            text: t('floorPlan.notifications.ready'),
          });
        }
      }
    }

    const weight: Record<NotificationType, number> = {
      pago: 0,
      pedido: 1,
      comanda: 2,
    };

    return items.sort((a, b) => weight[a.type] - weight[b.type]);
  }, [statuses, dismissed, t]);

  const counts = useMemo(() => {
    const result = { free: 0, occupied: 0, readyToPay: 0, paid: 0 };
    for (const table of tables) {
      const row = statusByTableId.get(table.id);
      const status = row?.status ?? 'FREE';
      if (status === 'FREE') result.free += 1;
      else if (status === 'OPEN' || status === 'OCCUPIED') result.occupied += 1;
      else if (status === 'READY_TO_PAY' || status === 'PAYMENT_REQUESTED')
        result.readyToPay += 1;
      else if (status === 'PAID') result.paid += 1;
    }
    return result;
  }, [tables, statusByTableId]);

  const selectedTable =
    selected?.kind === 'table'
      ? tables.find((table) => table.id === selected.id) ?? null
      : null;
  const selectedZone =
    selected?.kind === 'zone'
      ? zones.find((zone) => zone.id === selected.id) ?? null
      : null;
  const selectedStatus = selectedTable
    ? statusByTableId.get(selectedTable.id) ?? null
    : null;

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const d = dragState.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.kind === 'table') {
      setTables((prev) =>
        prev.map((table) => {
          if (table.id !== d.id) return table;
          if (d.action === 'move') {
            return {
              ...table,
              x: Math.max(0, Math.round(d.orig.x + dx)),
              y: Math.max(0, Math.round(d.orig.y + dy)),
            };
          }
          return {
            ...table,
            width: Math.max(50, Math.round(d.orig.width + dx)),
            height: Math.max(50, Math.round(d.orig.height + dy)),
          };
        })
      );
    } else {
      setZones((prev) =>
        prev.map((zone) => {
          if (zone.id !== d.id) return zone;
          if (d.action === 'move') {
            return {
              ...zone,
              x: Math.max(0, Math.round(d.orig.x + dx)),
              y: Math.max(0, Math.round(d.orig.y + dy)),
            };
          }
          return {
            ...zone,
            width: Math.max(140, Math.round(d.orig.width + dx)),
            height: Math.max(120, Math.round(d.orig.height + dy)),
          };
        })
      );
    }
  }, []);

  const persistDragResult = useCallback(
    async (kind: 'table' | 'zone', id: string) => {
      if (kind === 'table') {
        const table = tables.find((row) => row.id === id);
        if (!table) return;
        await fetch(`/api/restaurants/${restaurantId}/tables/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            x: table.x,
            y: table.y,
            width: table.width,
            height: table.height,
          }),
        }).catch(() => {});
      } else {
        const zone = zones.find((row) => row.id === id);
        if (!zone) return;
        await fetch(`/api/restaurants/${restaurantId}/table-zones/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            x: zone.x,
            y: zone.y,
            width: zone.width,
            height: zone.height,
          }),
        }).catch(() => {});
      }
    },
    [restaurantId, tables, zones]
  );

  const handlePointerUp = useCallback(() => {
    const d = dragState.current;
    dragState.current = null;
    draggingRef.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    if (d) void persistDragResult(d.kind, d.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlePointerMove]);

  function startDrag(
    e: React.PointerEvent,
    kind: 'table' | 'zone',
    id: string,
    action: 'move' | 'resize'
  ) {
    if (!editable) {
      if (kind === 'table') setSelected({ kind: 'table', id });
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    const list = kind === 'table' ? tables : zones;
    const item = list.find((row) => row.id === id);
    if (!item) return;

    const orig =
      kind === 'table'
        ? {
            x: (item as TableRow).x ?? 0,
            y: (item as TableRow).y ?? 0,
            width: (item as TableRow).width ?? DEFAULT_TABLE_SIZE,
            height: (item as TableRow).height ?? DEFAULT_TABLE_SIZE,
          }
        : {
            x: (item as ZoneRow).x,
            y: (item as ZoneRow).y,
            width: (item as ZoneRow).width,
            height: (item as ZoneRow).height,
          };

    dragState.current = {
      kind,
      id,
      action,
      startX: e.clientX,
      startY: e.clientY,
      orig,
    };
    draggingRef.current = true;
    setSelected({ kind, id });
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  async function addTable() {
    setSaving(true);
    try {
      const nextIndex = tables.length + 1;
      const res = await fetch(`/api/restaurants/${restaurantId}/tables`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: String(nextIndex),
          x: 40 + ((nextIndex * 37) % 400),
          y: 40 + ((nextIndex * 53) % 300),
          width: DEFAULT_TABLE_SIZE,
          height: DEFAULT_TABLE_SIZE,
          shape: 'SQUARE',
          zoneId: zones[0]?.id,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json) {
        await loadLayout();
        setSelected({ kind: 'table', id: json.id });
      }
    } finally {
      setSaving(false);
    }
  }

  async function addZone() {
    setSaving(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/table-zones`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: t('floorPlan.editPanel.zone'),
          x: 40,
          y: 40,
          ...DEFAULT_ZONE_SIZE,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json) {
        await loadLayout();
        setSelected({ kind: 'zone', id: json.id });
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    setSaving(true);
    try {
      if (selected.kind === 'table') {
        await fetch(
          `/api/restaurants/${restaurantId}/tables/${selected.id}`,
          { method: 'DELETE', credentials: 'include' }
        );
      } else {
        await fetch(
          `/api/restaurants/${restaurantId}/table-zones/${selected.id}`,
          { method: 'DELETE', credentials: 'include' }
        );
      }
      setSelected(null);
      await loadLayout();
    } finally {
      setSaving(false);
    }
  }

  async function updateSelectedTable(patch: Partial<TableRow>) {
    if (!selectedTable) return;
    setTables((prev) =>
      prev.map((table) =>
        table.id === selectedTable.id ? { ...table, ...patch } : table
      )
    );
    await fetch(`/api/restaurants/${restaurantId}/tables/${selectedTable.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }

  async function updateSelectedZone(patch: Partial<ZoneRow>) {
    if (!selectedZone) return;
    setZones((prev) =>
      prev.map((zone) =>
        zone.id === selectedZone.id ? { ...zone, ...patch } : zone
      )
    );
    await fetch(
      `/api/restaurants/${restaurantId}/table-zones/${selectedZone.id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }
    ).catch(() => {});
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-[#181b22] text-[#eef1f5] p-16 text-center text-sm text-[#7a8291]">
        {t('floorPlan.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[#23272f] bg-[#12141a] text-[#eef1f5]">
      <div className="flex" style={{ minHeight: 560 }}>
        {/* canvas */}
        <div className="flex-1 p-4">
          {editable && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <ToolButton icon={PlusIcon} label={t('floorPlan.toolbar.addTable')} onClick={() => void addTable()} disabled={saving} />
              <ToolButton icon={PlusIcon} label={t('floorPlan.toolbar.addZone')} onClick={() => void addZone()} disabled={saving} />
              <ToolButton
                icon={TrashIcon}
                label={t('floorPlan.toolbar.delete')}
                onClick={() => void deleteSelected()}
                disabled={!selected || saving}
                danger
              />
              <span className="ml-2 text-[11px] text-[#6b7280]">
                {t('floorPlan.toolbar.hint')}
              </span>
            </div>
          )}

          <div
            onPointerDown={() => setSelected(null)}
            className="relative rounded-xl border border-[#23272f] bg-[#181b22] overflow-auto"
            style={{ width: '100%', maxWidth: 1104, height: 620 }}
          >
            <div className="relative" style={{ width: 1104, height: 620 }}>
              {zones.length === 0 && tables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-[#5b6472]">
                  {editable
                    ? t('floorPlan.empty.noZones')
                    : t('floorPlan.empty.noTables')}
                </div>
              )}

              {zones.map((zone) => {
                const isSel = selected?.kind === 'zone' && selected.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onPointerDown={(e) => startDrag(e, 'zone', zone.id, 'move')}
                    className="absolute rounded-xl"
                    style={{
                      left: zone.x,
                      top: zone.y,
                      width: zone.width,
                      height: zone.height,
                      background: '#1c2028',
                      border: isSel ? '2px solid #d97a3d' : '1px dashed #333a45',
                      cursor: editable ? 'move' : 'default',
                    }}
                  >
                    <span className="absolute top-2 left-3 text-[12px] font-semibold text-[#7a8291]">
                      {zone.name}
                    </span>
                    {editable && isSel && (
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startDrag(e, 'zone', zone.id, 'resize');
                        }}
                        className="absolute rounded"
                        style={{
                          right: -6,
                          bottom: -6,
                          width: 14,
                          height: 14,
                          background: '#d97a3d',
                          cursor: 'nwse-resize',
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {tables.map((table) => {
                const isSel = selected?.kind === 'table' && selected.id === table.id;
                const row = statusByTableId.get(table.id);
                const isKnown = row !== undefined;
                const status = row?.status ?? 'FREE';
                const width = table.width ?? DEFAULT_TABLE_SIZE;
                const height = table.height ?? DEFAULT_TABLE_SIZE;
                const dimmed = scopeToMine && !isKnown;

                let subtitle = t('floorPlan.status.free');
                if (dimmed) subtitle = t('floorPlan.status.notMine');
                else if (row && row.status !== 'FREE') {
                  subtitle =
                    row.partySize != null
                      ? t('floorPlan.detail.guests', { count: row.partySize })
                      : t(
                          row.status === 'READY_TO_PAY' ||
                            row.status === 'PAYMENT_REQUESTED'
                            ? 'floorPlan.status.readyToPay'
                            : row.status === 'PAID'
                            ? 'floorPlan.status.paid'
                            : 'floorPlan.status.occupied'
                        );
                }

                return (
                  <div
                    key={table.id}
                    onPointerDown={(e) => startDrag(e, 'table', table.id, 'move')}
                    className="absolute flex flex-col items-center justify-center select-none"
                    style={{
                      left: table.x ?? 0,
                      top: table.y ?? 0,
                      width,
                      height,
                      borderRadius: table.shape === 'CIRCLE' ? '50%' : 14,
                      background: '#242832',
                      border: `2px solid ${isSel ? '#d97a3d' : statusDotColor(status)}`,
                      boxShadow: isSel ? '0 0 0 3px rgba(217,122,61,0.2)' : 'none',
                      opacity: dimmed ? 0.45 : 1,
                      cursor: editable ? 'move' : dimmed ? 'default' : 'pointer',
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center font-extrabold px-1.5"
                      style={{
                        minWidth: 22,
                        height: 20,
                        maxWidth: 'calc(100% - 8px)',
                        background: statusDotColor(status),
                        color: '#0e1013',
                        fontSize: 10.5,
                        marginBottom: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={table.label}
                    >
                      {table.label}
                    </div>
                    <span className="text-[10px] text-[#aab1bd] px-1 text-center leading-tight max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {subtitle}
                    </span>

                    {editable && isSel && (
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startDrag(e, 'table', table.id, 'resize');
                        }}
                        className="absolute rounded"
                        style={{
                          right: -6,
                          bottom: -6,
                          width: 14,
                          height: 14,
                          background: '#d97a3d',
                          cursor: 'nwse-resize',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* right panel */}
        <div className="w-80 shrink-0 border-l border-[#23272f] p-4 bg-[#161920]">
          <div className="grid grid-cols-2 gap-2 mb-5">
            <StatChip color="#5b6472" label={t('floorPlan.status.free')} value={counts.free} />
            <StatChip color="#35c88a" label={t('floorPlan.status.occupied')} value={counts.occupied} />
            <StatChip color="#ef5a6f" label={t('floorPlan.status.readyToPay')} value={counts.readyToPay} />
            <StatChip color="#5B3DFF" label={t('floorPlan.status.paid')} value={counts.paid} />
          </div>

          {editable && selected ? (
            <EditPanel
              t={t}
              table={selectedTable}
              zone={selectedZone}
              zones={zones}
              onUpdateTable={updateSelectedTable}
              onUpdateZone={updateSelectedZone}
              onClose={() => setSelected(null)}
              onDelete={() => void deleteSelected()}
            />
          ) : !editable && selectedTable ? (
            <TableDetail
              t={t}
              table={selectedTable}
              status={selectedStatus}
              onClose={() => setSelected(null)}
            />
          ) : (
            <>
              <div className="text-[13px] font-bold mb-2.5 text-[#c9cfd9]">
                {t('floorPlan.notifications.heading')} · {notifications.length}
              </div>
              <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="text-[13px] text-[#5b6472] py-5 px-1">
                    {t('floorPlan.notifications.empty')}
                  </div>
                )}
                {notifications.map((n) => (
                  <NotificationRow
                    key={n.id}
                    item={n}
                    t={t}
                    onResolve={() =>
                      setDismissed((prev) => new Set(prev).add(n.tableId))
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type Translate = (key: string, vars?: Record<string, string | number>) => string;

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: (props: { size?: number }) => JSX.Element;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold"
      style={{
        borderColor: '#2a2f38',
        background: disabled ? '#1a1d24' : danger ? '#2a1a1c' : '#1e222a',
        color: disabled ? '#4b515c' : danger ? '#f0899a' : '#eef1f5',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function StatChip({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#2a2f38] bg-[#1e222a] px-2.5 py-2 flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-[12px] text-[#9aa2b1]">
        <span className="rounded-full" style={{ width: 8, height: 8, background: color }} />
        {label}
      </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function fieldInputClass() {
  return 'w-full bg-[#1e222a] border border-[#2a2f38] rounded-lg px-2.5 py-1.5 text-[13px] text-[#eef1f5]';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] text-[#7a8291] mb-1 font-semibold">{label}</div>
      {children}
    </div>
  );
}

function EditPanel({
  t,
  table,
  zone,
  zones,
  onUpdateTable,
  onUpdateZone,
  onClose,
  onDelete,
}: {
  t: Translate;
  table: TableRow | null;
  zone: ZoneRow | null;
  zones: ZoneRow[];
  onUpdateTable: (patch: Partial<TableRow>) => void;
  onUpdateZone: (patch: Partial<ZoneRow>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#2a2f38] bg-[#1e222a] p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-bold">
          {table
            ? t('floorPlan.editPanel.editTable', { label: table.label })
            : t('floorPlan.editPanel.editZone')}
        </span>
        <button type="button" onClick={onClose} className="text-[#7a8291]">
          <CloseIcon size={16} />
        </button>
      </div>

      {table && (
        <>
          <Field label={t('floorPlan.editPanel.label')}>
            <input
              type="text"
              value={table.label}
              onChange={(e) => onUpdateTable({ label: e.target.value })}
              className={fieldInputClass()}
            />
          </Field>

          <Field label={t('floorPlan.editPanel.shape')}>
            <select
              value={table.shape}
              onChange={(e) => onUpdateTable({ shape: e.target.value as Shape })}
              className={fieldInputClass()}
            >
              <option value="SQUARE">{t('floorPlan.editPanel.shapeSquare')}</option>
              <option value="RECT">{t('floorPlan.editPanel.shapeRect')}</option>
              <option value="CIRCLE">{t('floorPlan.editPanel.shapeCircle')}</option>
            </select>
          </Field>

          <Field label={t('floorPlan.editPanel.zone')}>
            <select
              value={table.zoneId ?? ''}
              onChange={(e) =>
                onUpdateTable({ zoneId: e.target.value || null })
              }
              className={fieldInputClass()}
            >
              <option value="">{t('floorPlan.editPanel.noZone')}</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      {zone && (
        <Field label={t('floorPlan.editPanel.zoneName')}>
          <input
            type="text"
            value={zone.name}
            onChange={(e) => onUpdateZone({ name: e.target.value })}
            className={fieldInputClass()}
          />
        </Field>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[12.5px] font-semibold"
        style={{ background: '#2a1a1c', color: '#f0899a', borderColor: '#3a2226' }}
      >
        <TrashIcon size={14} />
        {table
          ? t('floorPlan.editPanel.deleteTable')
          : t('floorPlan.editPanel.deleteZone')}
      </button>
    </div>
  );
}

function TableDetail({
  t,
  table,
  status,
  onClose,
}: {
  t: Translate;
  table: TableRow;
  status: StatusRow | null;
  onClose: () => void;
}) {
  const state = status?.status ?? 'FREE';
  const label =
    state === 'FREE'
      ? t('floorPlan.status.free')
      : state === 'READY_TO_PAY' || state === 'PAYMENT_REQUESTED'
      ? t('floorPlan.status.readyToPay')
      : state === 'PAID'
      ? t('floorPlan.status.paid')
      : t('floorPlan.status.occupied');

  return (
    <div className="rounded-xl border border-[#2a2f38] bg-[#1e222a] p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-bold">
          {t('floorPlan.detail.title', { label: table.label })}
        </span>
        <button type="button" onClick={onClose} className="text-[#7a8291]">
          <CloseIcon size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span
          className="rounded-full"
          style={{ width: 9, height: 9, background: statusDotColor(state) }}
        />
        <span className="text-[13px] text-[#c9cfd9]">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 text-[13px] text-[#9aa2b1] mb-1">
        <UsersIcon size={14} />
        {status?.partySize != null
          ? t('floorPlan.detail.guests', { count: status.partySize })
          : t('floorPlan.detail.noGuestsYet')}
      </div>

      {status && status.totalCents > 0 && (
        <div className="text-[13px] text-[#9aa2b1]">
          {t('floorPlan.detail.total')}: {(status.totalCents / 100).toFixed(2)}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  item,
  t,
  onResolve,
}: {
  item: NotificationItem;
  t: Translate;
  onResolve: () => void;
}) {
  const meta: Record<NotificationType, { color: string; Icon: (props: { size?: number }) => JSX.Element }> = {
    pago: { color: '#ef5a6f', Icon: CreditCardIcon },
    pedido: { color: '#e0984a', Icon: UtensilsIcon },
    comanda: { color: '#f0b429', Icon: ClipboardIcon },
  };
  const { color, Icon } = meta[item.type];

  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border p-2.5"
      style={{ background: '#1e222a', borderColor: '#2a2f38', borderLeft: `3px solid ${color}` }}
    >
      <span style={{ color, marginTop: 2, flexShrink: 0 }}>
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold">
          {t('floorPlan.notifications.tablePrefix', { label: item.tableLabel })}
        </div>
        <div className="text-[12px] text-[#9aa2b1]">{item.text}</div>
      </div>
      <button
        type="button"
        onClick={onResolve}
        title={t('floorPlan.notifications.markHandled')}
        className="rounded-lg flex items-center justify-center shrink-0"
        style={{ width: 26, height: 26, background: '#262b34', color: '#8ee6b4' }}
      >
        <CheckIcon size={14} />
      </button>
    </div>
  );
}
