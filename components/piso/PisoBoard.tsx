'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import {
  PlusIcon,
  TrashIcon,
  CloseIcon,
  UsersIcon,
  UtensilsIcon,
  ClipboardIcon,
} from '@/components/branding/icons';

type Shape = 'SQUARE' | 'RECT' | 'CIRCLE';

type ZoneKind = 'ZONE' | 'BAR' | 'KITCHEN' | 'ENTRANCE';

type ZoneRow = {
  id: string;
  name: string;
  kind: ZoneKind;
  x: number;
  y: number;
  width: number;
  height: number;
};

type TableRow = {
  id: string;
  label: string;
  token: string;
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
  staffId?: string | null;
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
  updatedAt: string;
};

type ReservationRow = {
  id: string;
  tableId: string;
  startsAt: string;
  partySize: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
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

type LegendBucket = 'occupied' | 'reserved' | 'waiting' | 'free';

const BUCKET_COLOR: Record<LegendBucket, string> = {
  occupied: '#35c88a',
  reserved: '#e0a83a',
  waiting: '#ef5a6f',
  free: '#5b6472',
};

function floorBucket(status: StatusRow['status'], hasReservationSoon: boolean): LegendBucket {
  if (status === 'READY_TO_PAY' || status === 'PAYMENT_REQUESTED') return 'waiting';
  if (status === 'OPEN' || status === 'OCCUPIED' || status === 'PAID') return 'occupied';
  if (hasReservationSoon) return 'reserved';
  return 'free';
}

// Second lens on the same board: instead of payment/session state, color
// each table by where its most recent active order sits in the kitchen
// pipeline. READY splits into two buckets depending on whether a waiter
// has claimed it yet (via the claim endpoint) — "ready" (in the pass,
// nobody's picked it up) vs "serving" (claimed, on its way to the table).
export type KitchenBucket = 'available' | 'ordering' | 'preparing' | 'ready' | 'serving';

export const KITCHEN_BUCKET_COLOR: Record<KitchenBucket, string> = {
  available: '#5b6472',
  ordering: '#5B3DFF',
  preparing: '#e0a83a',
  ready: '#ef5a6f',
  serving: '#35c88a',
};

export function kitchenBucket(orders: OrderRow[]): KitchenBucket {
  if (orders.length === 0) return 'available';

  const latest = orders[orders.length - 1];
  switch (latest.status) {
    case 'PENDING_PAYMENT':
    case 'NEW':
    case 'ACCEPTED':
      return 'ordering';
    case 'PREPARING':
      return 'preparing';
    case 'READY':
      return latest.staffId ? 'serving' : 'ready';
    case 'COMPLETED':
      return 'serving';
    default:
      return 'available';
  }
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Tables carry free-text labels ("Mesa 1", "Terraza 2"), but the seat
// itself only has room for a short token — pull the trailing number when
// there is one, otherwise fall back to the first couple of characters.
function shortTableLabel(label: string) {
  const trailingNumber = label.match(/(\d+)\s*$/);
  if (trailingNumber) return trailingNumber[1];
  return label.slice(0, 2).toUpperCase();
}

const CHAIR_COLOR = '#2b2f38';
const CHAIR_BORDER = '#454b57';

function Chair({ style }: { style: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className="absolute rounded-full"
      style={{
        width: 12,
        height: 12,
        background: CHAIR_COLOR,
        border: `1.5px solid ${CHAIR_BORDER}`,
        ...style,
      }}
    />
  );
}

function TableChairs({
  shape,
  width,
  height,
}: {
  shape: Shape;
  width: number;
  height: number;
}) {
  if (shape === 'CIRCLE') {
    const radius = width / 2 + 11;
    const cx = width / 2;
    const cy = height / 2;
    const seatCount = width >= 100 ? 8 : 6;
    return (
      <>
        {Array.from({ length: seatCount }).map((_, i) => {
          const angle = (i / seatCount) * Math.PI * 2 - Math.PI / 2;
          const x = cx + radius * Math.cos(angle) - 6;
          const y = cy + radius * Math.sin(angle) - 6;
          return <Chair key={i} style={{ left: x, top: y }} />;
        })}
      </>
    );
  }

  // SQUARE / RECT — evenly spaced along each side.
  const perSideTop = Math.max(1, Math.round(width / 70));
  const perSideVertical = Math.max(1, Math.round(height / 70));
  const chairs: React.CSSProperties[] = [];

  for (let i = 0; i < perSideTop; i++) {
    const x = ((i + 0.5) / perSideTop) * width - 6;
    chairs.push({ left: x, top: -18 });
    chairs.push({ left: x, top: height + 6 });
  }
  for (let i = 0; i < perSideVertical; i++) {
    const y = ((i + 0.5) / perSideVertical) * height - 6;
    chairs.push({ left: -18, top: y });
    chairs.push({ left: width + 6, top: y });
  }

  return (
    <>
      {chairs.map((style, i) => (
        <Chair key={i} style={style} />
      ))}
    </>
  );
}

// What each kind of box looks like on the floor. Bar/kitchen/entrance used
// to be fixed decoration drawn identically for every restaurant; they're
// now real rows the manager places (and only if the restaurant has them),
// so this just styles whatever they've actually put on their plan.
function ZoneContents({ zone, light = false }: { zone: ZoneRow; light?: boolean }) {
  const label: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: light ? '#5c5a56' : '#7a8291',
    letterSpacing: '0.06em',
  };

  if (zone.kind === 'BAR') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
        <span style={label}>{zone.name}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: Math.max(2, Math.min(10, Math.round(zone.width / 34))) }).map(
            (_, i) => (
              <div
                key={i}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#3a3f4a' }}
              />
            )
          )}
        </div>
      </div>
    );
  }

  if (zone.kind === 'KITCHEN') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none text-[#7a8291]">
        <UtensilsIcon size={20} />
        <span style={label}>{zone.name}</span>
      </div>
    );
  }

  if (zone.kind === 'ENTRANCE') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none">
        <span style={{ fontSize: 18, color: '#5b6472' }}>↑</span>
        <span style={label}>{zone.name}</span>
      </div>
    );
  }

  return (
    <span
      className="absolute top-2 left-3 text-[12px] font-semibold"
      style={{ color: light ? '#8a8781' : '#7a8291' }}
    >
      {zone.name}
    </span>
  );
}

function zoneStyle(
  kind: ZoneKind,
  isSelected: boolean,
  light = false
): React.CSSProperties {
  if (light) {
    // Fixtures read as solid built structure (kitchen, bar, restrooms);
    // table-grouping zones are just faint outlines of the room itself.
    if (kind === 'ZONE') {
      return { background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(26,19,77,0.06)' };
    }
    return { background: '#D8D6D2', border: '1px solid rgba(26,19,77,0.08)' };
  }
  if (isSelected) {
    return { background: '#1c2028', border: '2px solid #d97a3d' };
  }
  switch (kind) {
    case 'BAR':
      return { background: '#20242d', border: '1px solid #39404c' };
    case 'KITCHEN':
      return { background: '#1b1f27', border: '1px dashed #39404c' };
    case 'ENTRANCE':
      return { background: 'transparent', border: '1px dashed #2f3540' };
    default:
      return { background: '#1c2028', border: '1px dashed #333a45' };
  }
}

export default function PisoBoard({
  restaurantId,
  editable,
  scopeToMine,
  lens = 'payment',
  highlightBucket = 'all',
  showSidePanel = true,
  onSelectTable,
  fitToWidth = false,
  variant = 'dark',
}: {
  restaurantId: string;
  editable: boolean;
  scopeToMine: boolean;
  lens?: 'payment' | 'kitchen';
  // Only meaningful when lens="kitchen" — dims every table whose current
  // bucket doesn't match, so a caller can drive this from filter pills
  // without needing its own copy of the floor-plan rendering.
  highlightBucket?: KitchenBucket | 'all';
  // A caller that renders its own detail panel (e.g. the waiter home page)
  // sets this false so PisoBoard only draws the canvas — no built-in
  // legend/detail column competing with its own right column.
  showSidePanel?: boolean;
  // Fired alongside the internal selection state in the non-editable path,
  // so a parent can react to a table click without duplicating PisoBoard's
  // own fetch/state — it looks the table up in data it's already loading
  // for its own purposes.
  onSelectTable?: (tableId: string | null) => void;
  // Scales the whole room down to whatever width it's given instead of
  // scrolling it, so the plan can sit next to a side panel and still be
  // visible in one glance.
  fitToWidth?: boolean;
  // "light" is the waiter floor view: a pale room with small colour-coded
  // circular markers per table, instead of the dark editor board with its
  // big wooden table slabs.
  variant?: 'dark' | 'light';
}) {
  const { t } = useI18n();

  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (!fitToWidth) return;
    const element = canvasWrapRef.current;
    if (!element) return;

    const measure = () => {
      const width = element.clientWidth;
      if (width > 0) setFitScale(Math.min(1, width / 1104));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fitToWidth]);

  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [slug, setSlug] = useState('');
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

  // handlePointerUp is wired up once per drag via a raw window listener
  // (not a React prop), so it can't pick up a fresh persistDragResult on
  // every render the way a normal callback prop would. Reading the latest
  // tables/zones through refs — instead of closing over the state
  // variables directly — is what lets a single, stable save function
  // always see the position the drag actually ended at.
  const tablesRef = useRef(tables);
  const zonesRef = useRef(zones);

  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  const statusByTableId = useMemo(() => {
    const map = new Map<string, StatusRow>();
    for (const row of statuses) map.set(row.table.id, row);
    return map;
  }, [statuses]);

  const fetchLayoutOnce = useCallback(async () => {
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

    if (!tablesRes.ok || !zonesRes.ok) return null;

    const tablesJson = await tablesRes.json().catch(() => []);
    const zonesJson = await zonesRes.json().catch(() => []);
    return { tablesJson, zonesJson };
  }, [restaurantId]);

  const loadLayout = useCallback(async () => {
    try {
      // The very first request on a fresh session can 401 transiently
      // (auth cold-start) even though the session is valid — one quick
      // retry avoids surfacing a scary error for what fixes itself
      // immediately after.
      let result = await fetchLayoutOnce();
      if (!result) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        result = await fetchLayoutOnce();
      }

      if (!result) {
        throw new Error(t('floorPlan.error'));
      }

      setTables(
        (Array.isArray(result.tablesJson) ? result.tablesJson : []).filter(
          (row: TableRow) => row.isActive
        )
      );
      setZones(Array.isArray(result.zonesJson) ? result.zonesJson : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('floorPlan.error'));
    } finally {
      setLoading(false);
    }
  }, [fetchLayoutOnce, t]);

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

  const loadReservations = useCallback(async () => {
    try {
      const from = new Date().toISOString();
      const to = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const res = await fetch(
        `/api/restaurants/${restaurantId}/reservations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&status=CONFIRMED`,
        { credentials: 'include', cache: 'no-store' }
      );
      const json = await res.json().catch(() => ({ reservations: [] }));
      if (res.ok) {
        setReservations(Array.isArray(json.reservations) ? json.reservations : []);
      }
    } catch {
      // Best-effort — the board still works without the reservation overlay.
    }
  }, [restaurantId]);

  useEffect(() => {
    void loadLayout();
    void loadStatuses();
    void loadReservations();
    const interval = window.setInterval(() => {
      if (!draggingRef.current) {
        void loadStatuses();
        void loadReservations();
      }
    }, 4000);
    return () => window.clearInterval(interval);
  }, [loadLayout, loadStatuses, loadReservations]);

  // Needed to build each table's public order-page URL (QR/"open menu"/
  // "copy link") right here on the board — the slug isn't part of the
  // table or zone payloads. Only the editable (manager/owner) board shows
  // that panel, and /settings requires MANAGER rank, so skip this for the
  // read-only staff board.
  useEffect(() => {
    if (!editable) return;
    let cancelled = false;
    fetch(`/api/restaurants/${restaurantId}/settings`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.slug) setSlug(data.slug);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [restaurantId, editable]);

  const nextReservationByTableId = useMemo(() => {
    const map = new Map<string, ReservationRow>();
    const sorted = [...reservations].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    for (const reservation of sorted) {
      if (!map.has(reservation.tableId)) map.set(reservation.tableId, reservation);
    }
    return map;
  }, [reservations]);

  const counts = useMemo(() => {
    const result: Record<LegendBucket, number> = { occupied: 0, reserved: 0, waiting: 0, free: 0 };
    for (const table of tables) {
      const row = statusByTableId.get(table.id);
      const status = row?.status ?? 'FREE';
      const bucket = floorBucket(status, nextReservationByTableId.has(table.id));
      result[bucket] += 1;
    }
    return result;
  }, [tables, statusByTableId, nextReservationByTableId]);

  const kitchenCounts = useMemo(() => {
    const result: Record<KitchenBucket, number> = {
      available: 0,
      ordering: 0,
      preparing: 0,
      ready: 0,
      serving: 0,
    };
    for (const table of tables) {
      const row = statusByTableId.get(table.id);
      result[kitchenBucket(row?.orders ?? [])] += 1;
    }
    return result;
  }, [tables, statusByTableId]);

  const orderStatusLabel = useCallback(
    (status: OrderRow['status']) => {
      if (status === 'COMPLETED') return t('floorPlan.orderStatus.served');
      if (status === 'READY') return t('floorPlan.notifications.ready');
      return t('floorPlan.notifications.preparing');
    },
    [t]
  );

  const ordersInProgress = useMemo(() => {
    const rows: {
      tableId: string;
      tableLabel: string;
      partySize: number | null;
      orderStatus: OrderRow['status'];
      time: string;
      bucket: LegendBucket;
    }[] = [];

    for (const table of tables) {
      const row = statusByTableId.get(table.id);
      if (!row || row.orders.length === 0) continue;
      const latest = row.orders[row.orders.length - 1];
      rows.push({
        tableId: table.id,
        tableLabel: table.label,
        partySize: row.partySize,
        orderStatus: latest.status,
        time: row.updatedAt,
        bucket: floorBucket(row.status, false),
      });
    }

    return rows.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
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
        const table = tablesRef.current.find((row) => row.id === id);
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
        const zone = zonesRef.current.find((row) => row.id === id);
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
    [restaurantId]
  );

  const handlePointerUp = useCallback(() => {
    const d = dragState.current;
    dragState.current = null;
    draggingRef.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    if (d) void persistDragResult(d.kind, d.id);
  }, [handlePointerMove, persistDragResult]);

  function startDrag(
    e: React.PointerEvent,
    kind: 'table' | 'zone',
    id: string,
    action: 'move' | 'resize'
  ) {
    if (!editable) {
      if (kind === 'table') {
        // Without this, the click bubbles to the canvas container's own
        // onPointerDown (which deselects on background click) and
        // immediately clears the selection this same click just made.
        e.stopPropagation();
        setSelected({ kind: 'table', id });
        onSelectTable?.(id);
      }
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

  async function addZone(kind: ZoneKind = 'ZONE') {
    setSaving(true);
    try {
      const preset =
        kind === 'BAR'
          ? { name: t('floorPlan.fixture.bar'), width: 240, height: 60 }
          : kind === 'KITCHEN'
            ? { name: t('floorPlan.decor.kitchen'), width: 200, height: 110 }
            : kind === 'ENTRANCE'
              ? { name: t('floorPlan.decor.entrance'), width: 140, height: 70 }
              : { name: t('floorPlan.editPanel.zone'), ...DEFAULT_ZONE_SIZE };

      const res = await fetch(`/api/restaurants/${restaurantId}/table-zones`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          x: 40,
          y: 40,
          ...preset,
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
      <div
        className={`rounded-2xl border p-16 text-center text-sm ${
          variant === 'light'
            ? 'border-[#1A134D]/10 bg-white text-[#1A134D]/40'
            : 'border-black/10 bg-[#181b22] text-[#7a8291]'
        }`}
      >
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

  const light = variant === 'light';

  return (
    <div
      className={`rounded-2xl overflow-hidden border ${
        light
          ? 'border-[#1A134D]/10 bg-white text-[#1A134D]'
          : 'border-[#23272f] bg-[#12141a] text-[#eef1f5]'
      }`}
    >
      <div className="flex" style={{ minHeight: light ? 0 : 560 }}>
        {/* canvas */}
        {/* min-w-0: without it the flex item refuses to shrink below the
            1104px room, so a caller using fitToWidth could never actually
            give it a narrower box to scale into. */}
        <div className="flex-1 min-w-0 p-4">
          {editable && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <ToolButton icon={PlusIcon} label={t('floorPlan.toolbar.addTable')} onClick={() => void addTable()} disabled={saving} />
              <ToolButton icon={PlusIcon} label={t('floorPlan.toolbar.addZone')} onClick={() => void addZone('ZONE')} disabled={saving} />
              <ToolButton icon={PlusIcon} label={t('floorPlan.toolbar.addBar')} onClick={() => void addZone('BAR')} disabled={saving} />
              <ToolButton icon={PlusIcon} label={t('floorPlan.toolbar.addKitchen')} onClick={() => void addZone('KITCHEN')} disabled={saving} />
              <ToolButton icon={PlusIcon} label={t('floorPlan.toolbar.addEntrance')} onClick={() => void addZone('ENTRANCE')} disabled={saving} />
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
            ref={canvasWrapRef}
            onPointerDown={() => {
              setSelected(null);
              if (!editable) onSelectTable?.(null);
            }}
            className={`relative rounded-xl border ${
              light
                ? 'border-[#1A134D]/10 bg-[#EFE9E1]'
                : 'border-[#23272f] bg-[#181b22]'
            } ${fitToWidth ? 'overflow-hidden' : 'overflow-auto'}`}
            style={{
              width: '100%',
              maxWidth: 1104,
              height: fitToWidth ? 620 * fitScale : 620,
            }}
          >
            <div
              className="relative"
              style={{
                width: 1104,
                height: 620,
                ...(fitToWidth
                  ? { transform: `scale(${fitScale})`, transformOrigin: 'top left' }
                  : {}),
              }}
            >
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
                      ...zoneStyle(zone.kind, isSel, light),
                      cursor: editable ? 'move' : 'default',
                    }}
                  >
                    <ZoneContents zone={zone} light={light} />
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
                const reservation = nextReservationByTableId.get(table.id);
                const bucket = floorBucket(status, !!reservation);
                const kBucket = kitchenBucket(row?.orders ?? []);
                const ringColor =
                  lens === 'kitchen' ? KITCHEN_BUCKET_COLOR[kBucket] : BUCKET_COLOR[bucket];
                const filteredOut =
                  lens === 'kitchen' && highlightBucket !== 'all' && kBucket !== highlightBucket;

                let subtitle: string;
                if (dimmed) subtitle = t('floorPlan.status.notMine');
                else if (lens === 'kitchen') subtitle = t(`floorPlan.kitchenStage.${kBucket}`);
                else if (row && row.partySize != null)
                  subtitle = t('floorPlan.detail.guests', { count: row.partySize });
                else if (bucket === 'reserved' && reservation)
                  subtitle = t('floorPlan.reservedSoon', { time: formatClock(reservation.startsAt) });
                else subtitle = t(`floorPlan.legend.${bucket}`);

                return (
                  <div
                    key={table.id}
                    onPointerDown={(e) => startDrag(e, 'table', table.id, 'move')}
                    className="absolute select-none"
                    style={{
                      left: table.x ?? 0,
                      top: table.y ?? 0,
                      width,
                      height,
                      opacity: dimmed ? 0.45 : filteredOut ? 0.3 : 1,
                      cursor: editable ? 'move' : dimmed ? 'default' : 'pointer',
                    }}
                  >
                    {light ? (
                      <>
                        {/* The table slab itself is pale furniture; the
                            status lives in a small coloured disc on top of
                            it, so a waiter reads the room by colour alone. */}
                        <div
                          className="absolute inset-0"
                          style={{
                            borderRadius: table.shape === 'CIRCLE' ? '50%' : 8,
                            background: '#FBFAF8',
                            border: '1px solid rgba(26,19,77,0.10)',
                            boxShadow: isSel
                              ? `0 0 0 3px ${ringColor}55`
                              : '0 1px 2px rgba(0,0,0,0.06)',
                          }}
                        />
                        <div
                          className="absolute flex items-center justify-center rounded-full"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: Math.max(30, Math.min(46, Math.min(width, height) * 0.5)),
                            height: Math.max(30, Math.min(46, Math.min(width, height) * 0.5)),
                            background: ringColor,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                          }}
                          title={`${table.label} · ${subtitle}`}
                        >
                          <span
                            className="font-bold leading-none text-white"
                            style={{ fontSize: 14 }}
                          >
                            {shortTableLabel(table.label)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <TableChairs shape={table.shape} width={width} height={height} />

                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center"
                          style={{
                            borderRadius: table.shape === 'CIRCLE' ? '50%' : 12,
                            background: 'linear-gradient(155deg, #8a6239, #6b4a29)',
                            border: `3px solid ${isSel ? '#d97a3d' : ringColor}`,
                            boxShadow: isSel
                              ? '0 0 0 3px rgba(217,122,61,0.25)'
                              : `0 0 0 3px ${ringColor}33, inset 0 1px 6px rgba(0,0,0,0.35)`,
                          }}
                        >
                          <span
                            className="font-extrabold leading-none"
                            style={{ fontSize: 17, color: '#fdf6ec', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                            title={table.label}
                          >
                            {shortTableLabel(table.label)}
                          </span>
                          <span
                            className="text-center leading-tight px-1 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
                            style={{ fontSize: 9.5, color: '#e9d9c2' }}
                          >
                            {subtitle}
                          </span>
                        </div>
                      </>
                    )}

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
                          zIndex: 2,
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
        {showSidePanel && (
        <div className="w-80 shrink-0 border-l border-[#23272f] p-4 bg-[#161920]">
          {lens === 'kitchen' ? (
            <div className="grid grid-cols-2 gap-2 mb-5">
              <StatChip color={KITCHEN_BUCKET_COLOR.ordering} label={t('floorPlan.kitchenStage.ordering')} value={kitchenCounts.ordering} />
              <StatChip color={KITCHEN_BUCKET_COLOR.preparing} label={t('floorPlan.kitchenStage.preparing')} value={kitchenCounts.preparing} />
              <StatChip color={KITCHEN_BUCKET_COLOR.ready} label={t('floorPlan.kitchenStage.ready')} value={kitchenCounts.ready} />
              <StatChip color={KITCHEN_BUCKET_COLOR.serving} label={t('floorPlan.kitchenStage.serving')} value={kitchenCounts.serving} />
              <StatChip color={KITCHEN_BUCKET_COLOR.available} label={t('floorPlan.kitchenStage.available')} value={kitchenCounts.available} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-5">
              <StatChip color={BUCKET_COLOR.occupied} label={t('floorPlan.legend.occupied')} value={counts.occupied} />
              <StatChip color={BUCKET_COLOR.reserved} label={t('floorPlan.legend.reserved')} value={counts.reserved} />
              <StatChip color={BUCKET_COLOR.waiting} label={t('floorPlan.legend.waiting')} value={counts.waiting} />
              <StatChip color={BUCKET_COLOR.free} label={t('floorPlan.legend.free')} value={counts.free} />
            </div>
          )}

          {editable && selected ? (
            <EditPanel
              t={t}
              restaurantId={restaurantId}
              slug={slug}
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
              <div className="text-[13px] font-bold mb-2.5 text-[#c9cfd9] flex items-center gap-1.5">
                <ClipboardIcon size={15} />
                {t('floorPlan.ordersHeading')}
              </div>
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                {ordersInProgress.length === 0 && (
                  <div className="text-[13px] text-[#5b6472] py-5 px-1">
                    {t('floorPlan.ordersEmpty')}
                  </div>
                )}
                {ordersInProgress.map((o) => (
                  <button
                    key={o.tableId}
                    type="button"
                    onClick={() => setSelected({ kind: 'table', id: o.tableId })}
                    className="text-left rounded-lg p-2.5 flex items-center gap-2.5"
                    style={{
                      background: '#1e222a',
                      borderLeft: `3px solid ${BUCKET_COLOR[o.bucket]}`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold">
                        {t('floorPlan.notifications.tablePrefix', { label: o.tableLabel })}
                        {o.partySize != null && (
                          <span className="font-normal text-[#9aa2b1]">
                            {' '}
                            · {o.partySize} pers.
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#9aa2b1]">{orderStatusLabel(o.orderStatus)}</div>
                    </div>
                    <span className="text-[11px] text-[#6b7280] shrink-0">{formatClock(o.time)}</span>
                  </button>
                ))}
              </div>

              {ordersInProgress.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelected({ kind: 'table', id: ordersInProgress[0].tableId })}
                  className="mt-3 w-full rounded-lg py-2.5 text-[12.5px] font-semibold"
                  style={{ background: '#5B3DFF', color: '#fff' }}
                >
                  {t('floorPlan.viewOrderDetails')}
                </button>
              )}
            </>
          )}
        </div>
        )}
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

// Exact dimensions, for when dragging the corner handle isn't precise
// enough to get the plan square and proportional.
function SizeFields({
  t,
  width,
  height,
  min,
  onChange,
}: {
  t: Translate;
  width: number;
  height: number;
  min: number;
  onChange: (patch: { width?: number; height?: number }) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div>
        <div className="text-[11px] text-[#7a8291] mb-1 font-semibold">
          {t('floorPlan.editPanel.width')}
        </div>
        <input
          type="number"
          min={min}
          value={width}
          onChange={(e) => {
            const next = Math.round(Number(e.target.value));
            if (Number.isFinite(next) && next >= min) onChange({ width: next });
          }}
          className={fieldInputClass()}
        />
      </div>
      <div>
        <div className="text-[11px] text-[#7a8291] mb-1 font-semibold">
          {t('floorPlan.editPanel.height')}
        </div>
        <input
          type="number"
          min={min}
          value={height}
          onChange={(e) => {
            const next = Math.round(Number(e.target.value));
            if (Number.isFinite(next) && next >= min) onChange({ height: next });
          }}
          className={fieldInputClass()}
        />
      </div>
    </div>
  );
}

function EditPanel({
  t,
  restaurantId,
  slug,
  table,
  zone,
  zones,
  onUpdateTable,
  onUpdateZone,
  onClose,
  onDelete,
}: {
  t: Translate;
  restaurantId: string;
  slug: string;
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

          <SizeFields
            t={t}
            width={table.width ?? DEFAULT_TABLE_SIZE}
            height={table.height ?? DEFAULT_TABLE_SIZE}
            min={30}
            onChange={onUpdateTable}
          />

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

          <TableQrSection t={t} restaurantId={restaurantId} slug={slug} table={table} />
        </>
      )}

      {zone && (
        <>
          <Field label={t('floorPlan.editPanel.zoneName')}>
            <input
              type="text"
              value={zone.name}
              onChange={(e) => onUpdateZone({ name: e.target.value })}
              className={fieldInputClass()}
            />
          </Field>

          <Field label={t('floorPlan.editPanel.zoneKind')}>
            <select
              value={zone.kind}
              onChange={(e) => onUpdateZone({ kind: e.target.value as ZoneKind })}
              className={fieldInputClass()}
            >
              <option value="ZONE">{t('floorPlan.editPanel.zone')}</option>
              <option value="BAR">{t('floorPlan.fixture.bar')}</option>
              <option value="KITCHEN">{t('floorPlan.decor.kitchen')}</option>
              <option value="ENTRANCE">{t('floorPlan.decor.entrance')}</option>
            </select>
          </Field>

          <SizeFields
            t={t}
            width={zone.width}
            height={zone.height}
            min={40}
            onChange={onUpdateZone}
          />
        </>
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

// The QR code is not a separate thing to manage — it's just this table's
// own token rendered as an image, so it's automatically in sync with the
// table it belongs to: a brand-new table already has a working QR (its
// token is generated the moment the row is created), and deleting or
// deactivating the table immediately invalidates that same QR (the public
// menu route rejects an inactive/missing table), with nothing extra to
// wire up on either side.
function TableQrSection({
  t,
  restaurantId,
  slug,
  table,
}: {
  t: Translate;
  restaurantId: string;
  slug: string;
  table: TableRow;
}) {
  const [copied, setCopied] = useState(false);
  const qrSrc = `/api/restaurants/${restaurantId}/tables/${table.id}/qr`;
  const publicUrl =
    slug && typeof window !== 'undefined'
      ? `${window.location.origin}/r/${slug}?t=${table.token}`
      : '';

  async function copyUrl() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser — the link is still
      // right there for the manager to select and copy manually.
    }
  }

  return (
    <Field label={t('floorPlan.editPanel.qrHeading')}>
      <div className="rounded-lg border border-[#2a2f38] bg-[#12141a] p-3 flex flex-col items-center">
        <img
          src={qrSrc}
          alt={t('floorPlan.editPanel.qrHeading')}
          className="w-28 h-28 bg-white rounded"
        />

        <div className="mt-3 grid grid-cols-2 gap-2 w-full">
          <button
            type="button"
            onClick={() => void copyUrl()}
            disabled={!publicUrl}
            className="text-[11.5px] text-center border rounded-lg px-2 py-1.5 disabled:opacity-40"
            style={{ borderColor: '#2a2f38', color: '#eef1f5' }}
          >
            {copied
              ? t('floorPlan.editPanel.copied')
              : t('floorPlan.editPanel.copyUrl')}
          </button>

          <a
            href={publicUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!publicUrl}
            className="text-[11.5px] text-center border rounded-lg px-2 py-1.5"
            style={{
              borderColor: '#2a2f38',
              color: publicUrl ? '#eef1f5' : '#4b515c',
              pointerEvents: publicUrl ? 'auto' : 'none',
            }}
          >
            {t('floorPlan.editPanel.openMenu')}
          </a>

          <a
            href={qrSrc}
            download={`mesa-${table.label}-qr.png`}
            className="col-span-2 text-[11.5px] text-center border rounded-lg px-2 py-1.5"
            style={{ borderColor: '#2a2f38', color: '#eef1f5' }}
          >
            {t('floorPlan.editPanel.downloadQr')}
          </a>
        </div>
      </div>
    </Field>
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

