'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';
import PisoBoard, {
  kitchenBucket,
  KITCHEN_BUCKET_COLOR,
  type KitchenBucket,
} from '@/components/piso/PisoBoard';

type Table = {
  id: string;
  label: string;
  isActive: boolean;
};

type Assignment = {
  id: string;
  tableId: string;
  staffId: string;
  role: 'PRIMARY' | 'ASSISTING';
  table: Table;
};

type SplitEntry = {
  id: string;
  personIndex: number;
  label: string | null;
  shareCents: number;
  tenderedCents: number | null;
  changeDueCents: number | null;
};

type TableStatus = {
  table: Table;
  status:
    | 'FREE'
    | 'OPEN'
    | 'OCCUPIED'
    | 'READY_TO_PAY'
    | 'PAYMENT_REQUESTED'
    | 'PAID';
  statusLabel: string;
  collectionMethod: 'CASH' | 'CARD' | 'OTHER' | null;
  totalCents: number;
  isSplit?: boolean;
  cashTenderedCents?: number | null;
  changeDueCents?: number | null;
  splits?: SplitEntry[];
};

type BoardOrderItem = {
  id: string;
  nameSnapshot: string | null;
  quantity: number;
  status: 'PENDING' | 'SENT_TO_WAITER' | 'SERVED' | 'UNAVAILABLE';
};

type BoardOrder = {
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
  staffId: string | null;
  items: BoardOrderItem[];
};

// One row of the (unscoped) table-status response — same shape PisoBoard's
// kitchen lens reads internally; only the fields this page actually uses.
type BoardStatusRow = {
  table: { id: string; label: string };
  orders: BoardOrder[];
};

type Me = {
  staffId: string;
  role: string;
};

type FeedEvent = {
  id: string;
  message: string;
  time: string;
};

function boardOrderStatusLabel(
  status: BoardOrder['status'],
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  switch (status) {
    case 'NEW':
      return t('staffPortal.status.new');
    case 'ACCEPTED':
      return t('staffPortal.status.accepted');
    case 'PREPARING':
      return t('staffPortal.status.preparing');
    case 'READY':
      return t('staffPortal.status.ready');
    case 'COMPLETED':
      return t('staffPortal.status.completed');
    case 'REJECTED':
      return t('staffPortal.status.rejected');
    case 'CANCELLED':
      return t('staffPortal.status.cancelled');
    default:
      return status;
  }
}

function BoardClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="text-sm text-ink/50 tabular-nums">
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

function statusClass(status: TableStatus['status']) {
  switch (status) {
    case 'PAYMENT_REQUESTED':
      return 'border-[#9a6b22]/30 bg-[#9a6b22]/10 text-[#7a551b]';
    case 'PAID':
      return 'border-[#477052]/30 bg-[#477052]/10 text-[#406449]';
    case 'READY_TO_PAY':
      return 'border-[#5d6874]/30 bg-[#5d6874]/10 text-[#4f5964]';
    case 'OCCUPIED':
      return 'border-[#5B3DFF]/25 bg-[#5B3DFF]/5 text-[#5B3DFF]';
    case 'OPEN':
      return 'border-black/10 bg-black/[0.025] text-ink/60';
    case 'FREE':
      return 'border-line bg-transparent text-ink/40';
  }
}

function collectionLabel(
  method: TableStatus['collectionMethod'],
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  switch (method) {
    case 'CASH':
      return t('staffMisc.tables.cash');
    case 'CARD':
      return t('staffMisc.tables.card');
    case 'OTHER':
      return t('staffMisc.tables.other');
    default:
      return null;
  }
}

function assignmentRoleLabel(
  role: Assignment['role'],
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  return role === 'PRIMARY'
    ? t('staffMisc.tables.rolePrimary')
    : t('staffMisc.tables.roleAssisting');
}

export default function StaffTablesPage() {
  const params = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const restaurantId = params.restaurantId;

  const { t } = useI18n();

  const [tables, setTables] = useState<Table[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [statuses, setStatuses] = useState<TableStatus[]>([]);
  const [currency, setCurrency] = useState('EUR');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [view, setView] = useState<'list' | 'floorplan' | 'board'>('list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Tablero" tab — a third, additional way to look at the same floor:
  // tap a table, see what needs to happen on it. Reuses the exact
  // claim/serve endpoints the main waiter dashboard already calls; kept
  // local to this page rather than shared, so that page is untouched.
  const [boardStatusRows, setBoardStatusRows] = useState<BoardStatusRow[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [boardFilter, setBoardFilter] = useState<KitchenBucket | 'all'>('all');
  const [selectedBoardTableId, setSelectedBoardTableId] = useState<string | null>(null);
  const [boardClaimingId, setBoardClaimingId] = useState<string | null>(null);
  const [boardUpdatingId, setBoardUpdatingId] = useState<string | null>(null);
  const [boardMarkingItemId, setBoardMarkingItemId] = useState<string | null>(null);
  const [boardSoundEnabled, setBoardSoundEnabled] = useState(false);
  const [boardActivity, setBoardActivity] = useState<FeedEvent[]>([]);
  const boardAudioCtxRef = useRef<AudioContext | null>(null);

  const enableBoardSound = useCallback(async () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = boardAudioCtxRef.current || new AudioContextClass();
      boardAudioCtxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      setBoardSoundEnabled(true);
    } catch {
      setBoardSoundEnabled(false);
    }
  }, []);

  const boardChime = useCallback(() => {
    if (!boardSoundEnabled) return;
    try {
      const ctx = boardAudioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') void ctx.resume();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.25);
    } catch {
      // Ignore audio errors.
    }
  }, [boardSoundEnabled]);

  const pushBoardActivity = useCallback((message: string) => {
    setBoardActivity((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          message,
          time: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 20)
    );
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);

      const [tablesRes, assignmentsRes, statusRes, restaurantsRes] =
        await Promise.all([
          fetch(`/api/restaurants/${restaurantId}/tables`, {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch(`/api/restaurants/${restaurantId}/table-assignments?mine=1`, {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch(`/api/restaurants/${restaurantId}/table-status?mine=1`, {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch('/api/restaurants', {
            credentials: 'include',
            cache: 'no-store',
          }),
        ]);

      if (tablesRes.status === 401 || assignmentsRes.status === 401) {
        router.replace(`/staff/${restaurantId}/login`);
        return;
      }

      const tablesJson = await tablesRes.json().catch(() => []);
      const assignmentsJson = await assignmentsRes.json().catch(() => []);
      const statusJson = await statusRes.json().catch(() => ({ tables: [] }));
      const restaurantsJson = await restaurantsRes.json().catch(() => []);

      if (!tablesRes.ok)
        throw new Error(
          tablesJson?.error ?? t('staffMisc.tables.couldNotLoadTables')
        );
      if (!assignmentsRes.ok)
        throw new Error(
          assignmentsJson?.error ??
            t('staffMisc.tables.couldNotLoadAssignments')
        );
      if (!statusRes.ok)
        throw new Error(
          statusJson?.error ?? t('staffMisc.tables.couldNotLoadStatus')
        );

      const membership = restaurantsJson.find(
        (item: any) => item.restaurant?.id === restaurantId
      );

      setCurrency(membership?.restaurant?.currency || 'EUR');
      setTables(
        (Array.isArray(tablesJson) ? tablesJson : []).filter(
          (table: Table) => table.isActive
        )
      );
      setAssignments(Array.isArray(assignmentsJson) ? assignmentsJson : []);
      setStatuses(Array.isArray(statusJson?.tables) ? statusJson.tables : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffMisc.tables.couldNotLoadStatus')
      );
    } finally {
      setLoading(false);
    }
  }, [restaurantId, router, t]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(interval);
  }, [load]);

  const loadBoard = useCallback(async () => {
    try {
      // Deliberately the SAME endpoint PisoBoard's own kitchen lens uses
      // internally (unscoped — every table, not just `?mine=1`) rather
      // than /orders: /orders returns every order restaurant-wide with no
      // regard for which customer session is "current" for a table, while
      // table-status only ever looks at each table's latest session. Using
      // a different source here previously caused the board's counts to
      // silently disagree with what the map itself was showing.
      const [statusRes, meRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}/table-status`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/restaurants/${restaurantId}/me`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      let rows: BoardStatusRow[] = [];
      if (statusRes.ok) {
        const json = await statusRes.json().catch(() => ({ tables: [] }));
        rows = Array.isArray(json?.tables) ? json.tables : [];
        setBoardStatusRows(rows);
      }
      if (meRes.ok) {
        const json = await meRes.json().catch(() => null);
        if (json) setMe(json);
      }
      return rows;
    } catch {
      // Best-effort — a failed poll just keeps the last known board state.
      return [];
    }
  }, [restaurantId]);

  useEffect(() => {
    if (view !== 'board') return;
    void loadBoard();
    const interval = window.setInterval(() => void loadBoard(), 4000);
    return () => window.clearInterval(interval);
  }, [view, loadBoard]);

  // "Recent activity" feed for the Tablero tab — same event types and same
  // sound-alert trigger (ORDER_READY only) as the main waiter dashboard's
  // notification panel, kept as a separate subscription here rather than
  // shared so that page's logic is untouched. Only connects while this tab
  // is actually visible.
  useEffect(() => {
    if (view !== 'board') return;

    const stream = new EventSource(`/api/restaurants/${restaurantId}/orders/stream`);

    stream.onmessage = async (event) => {
      try {
        const payload = JSON.parse(event.data);
        const relevant =
          payload.type === 'ORDER_READY' ||
          payload.type === 'ORDER_CLAIMED' ||
          payload.type === 'ORDER_STATUS_CHANGED' ||
          payload.type === 'ORDER_PAID';
        if (!relevant) return;

        const rows = await loadBoard();
        let match: { order: BoardOrder; tableLabel: string } | null = null;
        for (const row of rows) {
          const order = row.orders.find((candidate) => candidate.id === payload.orderId);
          if (order) {
            match = { order, tableLabel: row.table.label };
            break;
          }
        }
        if (!match) return;

        const { order, tableLabel } = match;

        if (payload.type === 'ORDER_READY' && order.status === 'READY') {
          pushBoardActivity(
            t('staffPortal.notifications.orderReady', { table: tableLabel, number: order.orderNumber })
          );
          boardChime();
        } else if (payload.type === 'ORDER_CLAIMED') {
          pushBoardActivity(
            t('staffPortal.notifications.orderClaimed', {
              table: tableLabel,
              number: order.orderNumber,
              staff: t('staffPortal.header.waiterFallback'),
            })
          );
        } else if (payload.type === 'ORDER_STATUS_CHANGED') {
          pushBoardActivity(
            t('staffPortal.notifications.orderStatusChanged', {
              table: tableLabel,
              number: order.orderNumber,
              status: boardOrderStatusLabel(order.status, t),
            })
          );
        } else if (payload.type === 'ORDER_PAID') {
          pushBoardActivity(
            t('staffPortal.notifications.orderPaid', { table: tableLabel, number: order.orderNumber })
          );
        }
      } catch {
        // Ignore malformed events.
      }
    };

    return () => stream.close();
  }, [view, restaurantId, loadBoard, pushBoardActivity, boardChime, t]);

  const ordersByTableId = useMemo(() => {
    const map = new Map<string, BoardOrder[]>();
    for (const row of boardStatusRows) {
      map.set(row.table.id, row.orders);
    }
    return map;
  }, [boardStatusRows]);

  const boardCounts = useMemo(() => {
    const result: Record<KitchenBucket, number> = {
      available: 0,
      ordering: 0,
      preparing: 0,
      ready: 0,
      serving: 0,
    };
    for (const table of tables) {
      result[kitchenBucket(ordersByTableId.get(table.id) ?? [])] += 1;
    }
    return result;
  }, [tables, ordersByTableId]);

  const selectedBoardTable = useMemo(
    () => tables.find((table) => table.id === selectedBoardTableId) ?? null,
    [tables, selectedBoardTableId]
  );

  const selectedBoardOrders = selectedBoardTableId
    ? ordersByTableId.get(selectedBoardTableId) ?? []
    : [];

  const selectedBucket = kitchenBucket(selectedBoardOrders);

  // Managers/owners can act on any ready order, same rule as the main
  // waiter dashboard (see canActOnAnyReadyOrder there).
  const canActOnAnyReadyOrder = me?.role === 'MANAGER' || me?.role === 'OWNER';

  async function claimBoardOrder(order: BoardOrder) {
    try {
      setBoardClaimingId(order.id);
      setError(null);
      const response = await fetch(
        `/api/restaurants/${restaurantId}/orders/${order.id}/claim`,
        { method: 'POST', credentials: 'include' }
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error ?? t('staffPortal.errors.takeOrder'));
      }
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('staffPortal.errors.takeOrder'));
    } finally {
      setBoardClaimingId(null);
    }
  }

  async function markBoardServed(order: BoardOrder) {
    try {
      setBoardUpdatingId(order.id);
      setError(null);
      const response = await fetch(
        `/api/restaurants/${restaurantId}/orders/${order.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' }),
        }
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error ?? t('staffPortal.errors.markServed'));
      }
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('staffPortal.errors.markServed'));
    } finally {
      setBoardUpdatingId(null);
    }
  }

  async function markBoardItemServed(order: BoardOrder, item: BoardOrderItem) {
    try {
      setBoardMarkingItemId(item.id);
      setError(null);
      const response = await fetch(
        `/api/restaurants/${restaurantId}/orders/${order.id}/items/${item.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'SERVE' }),
        }
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error ?? t('staffPortal.errors.markServed'));
      }
      await loadBoard();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('staffPortal.errors.markServed'));
    } finally {
      setBoardMarkingItemId(null);
    }
  }

  const assignedIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.tableId)),
    [assignments]
  );

  const availableTables = useMemo(
    () => tables.filter((table) => !assignedIds.has(table.id)),
    [assignedIds, tables]
  );

  const statusById = useMemo(
    () => new Map(statuses.map((status) => [status.table.id, status])),
    [statuses]
  );

  async function assignMyself() {
    if (!selectedTableId) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `/api/restaurants/${restaurantId}/table-assignments`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableId: selectedTableId,
            role: 'PRIMARY',
          }),
        }
      );

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          json.error ?? t('staffMisc.tables.couldNotAssignTable')
        );
      }

      setSelectedTableId('');
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffMisc.tables.couldNotAssignTable')
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignment(assignmentId: string) {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/restaurants/${restaurantId}/table-assignments?assignmentId=${encodeURIComponent(
          assignmentId
        )}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          json.error ?? t('staffMisc.tables.couldNotRemoveAssignment')
        );
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffMisc.tables.couldNotRemoveAssignment')
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="theme-n2b text-sm text-ink/50">
        {t('staffMisc.tables.loadingTables')}
      </div>
    );
  }

  return (
    <main className="theme-n2b pb-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <N2BLogo markSize={26} wordmarkClassName="text-base leading-none text-ink" className="mb-4" />
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
            {t('staffMisc.tables.liveFloorEyebrow')}
          </p>
          <h1 className="font-display text-4xl mt-1">
            {t('staffMisc.tables.myTables')}
          </h1>
          <p className="text-sm text-ink/50 mt-2">
            {t('staffMisc.tables.myTablesDesc')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => router.push(`/staff/${restaurantId}`)}
            className="border border-line rounded-lg px-3 py-2 text-xs"
          >
            {t('staffMisc.tables.backToWaiter')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="border border-line rounded-xl p-5 mb-8">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">
          {t('staffMisc.tables.assignedToMe')}
        </p>

        {assignments.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">
            {t('staffMisc.tables.noneAssignedYet')}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center gap-2 border border-line rounded-lg px-3 py-2"
              >
                <span className="text-sm">{assignment.table.label}</span>
                <span className="text-[9px] uppercase tracking-[0.1em] text-ink/35">
                  {assignmentRoleLabel(assignment.role, t)}
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void removeAssignment(assignment.id)}
                  className="text-[10px] text-red-700"
                >
                  {t('common.remove')}
                </button>
              </div>
            ))}
          </div>
        )}

        {availableTables.length > 0 && (
          <div className="mt-5 pt-4 border-t border-line flex gap-2">
            <select
              value={selectedTableId}
              onChange={(event) => setSelectedTableId(event.target.value)}
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">
                {t('staffMisc.tables.assignMyselfOption')}
              </option>
              {availableTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedTableId || saving}
              onClick={() => void assignMyself()}
              className="bg-ink text-paper rounded-lg px-4 py-2 text-sm disabled:opacity-40"
            >
              {saving ? t('common.saving') : t('staffMisc.tables.assign')}
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">
              {t('staffMisc.tables.liveStatusEyebrow')}
            </p>
            <h2 className="font-display text-3xl mt-1">
              {t('staffMisc.tables.floorOverview')}
            </h2>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-3 py-2 text-xs border rounded-lg transition ${
                view === 'list'
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-ink/60 hover:text-ink'
              }`}
            >
              {t('staffMisc.tables.viewList')}
            </button>
            <button
              type="button"
              onClick={() => setView('floorplan')}
              className={`px-3 py-2 text-xs border rounded-lg transition ${
                view === 'floorplan'
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-ink/60 hover:text-ink'
              }`}
            >
              {t('staffMisc.tables.viewFloorPlan')}
            </button>
            <button
              type="button"
              onClick={() => setView('board')}
              className={`px-3 py-2 text-xs border rounded-lg transition ${
                view === 'board'
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line text-ink/60 hover:text-ink'
              }`}
            >
              {t('staffMisc.tables.viewBoard')}
            </button>
          </div>
        </div>

        {view === 'floorplan' ? (
          <PisoBoard restaurantId={restaurantId} editable={false} scopeToMine lens="kitchen" />
        ) : view === 'board' ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {(['all', 'available', 'ordering', 'preparing', 'ready', 'serving'] as const).map(
                  (option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBoardFilter(option)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs border rounded-lg transition ${
                        boardFilter === option
                          ? 'border-ink bg-ink text-paper'
                          : 'border-line text-ink/60 hover:text-ink'
                      }`}
                    >
                      {option !== 'all' && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: KITCHEN_BUCKET_COLOR[option] }}
                        />
                      )}
                      {option === 'all'
                        ? t('staffMisc.tables.boardFilterAll')
                        : t(`floorPlan.kitchenStage.${option}`)}
                      <span className="opacity-60">
                        {option === 'all' ? tables.length : boardCounts[option]}
                      </span>
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    boardSoundEnabled ? setBoardSoundEnabled(false) : void enableBoardSound()
                  }
                  className="flex items-center gap-1.5 border border-line rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] text-ink/70"
                >
                  {boardSoundEnabled
                    ? t('staffPortal.header.soundOn')
                    : t('staffPortal.header.enableSound')}
                </button>
                <BoardClock />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <PisoBoard
                  restaurantId={restaurantId}
                  editable={false}
                  scopeToMine={false}
                  lens="kitchen"
                  showSidePanel={false}
                  highlightBucket={boardFilter}
                  onSelectTable={setSelectedBoardTableId}
                />
              </div>

              <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
              <div className="border border-line rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40 mb-3">
                  {t('staffPortal.notifications.title')}
                </p>
                {boardActivity.length === 0 ? (
                  <p className="text-sm text-ink/40 py-4 text-center">
                    {t('staffPortal.notifications.empty')}
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {boardActivity.map((event) => (
                      <div key={event.id} className="border-b border-line pb-2 last:border-b-0">
                        <p className="text-sm text-ink">{event.message}</p>
                        <p className="text-[10px] uppercase tracking-[0.08em] text-ink/35 mt-0.5">
                          {new Date(event.time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-line rounded-xl p-4">
                {!selectedBoardTable ? (
                  <p className="text-sm text-ink/40 py-8 text-center">
                    {t('staffMisc.tables.boardSelectPrompt')}
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-display text-2xl">{selectedBoardTable.label}</h3>
                      <span
                        className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-full"
                        style={{
                          background: `${KITCHEN_BUCKET_COLOR[selectedBucket]}22`,
                          color: KITCHEN_BUCKET_COLOR[selectedBucket],
                        }}
                      >
                        {t(`floorPlan.kitchenStage.${selectedBucket}`)}
                      </span>
                    </div>

                    {selectedBoardOrders.length === 0 ? (
                      <p className="text-sm text-ink/40 mt-4">
                        {t('staffMisc.tables.boardNoOrders')}
                      </p>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {selectedBoardOrders.map((order) => {
                          const mine =
                            order.staffId === me?.staffId ||
                            (canActOnAnyReadyOrder && order.staffId !== null);
                          const unclaimed = order.staffId === null;

                          return (
                            <div
                              key={order.id}
                              className="border-t border-line pt-4 first:border-t-0 first:pt-0"
                            >
                              <p className="text-xs text-ink/40 mb-2">
                                {t('staffPortal.common.orderNumber', {
                                  number: order.orderNumber,
                                })}
                              </p>

                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex items-center gap-2 text-sm">
                                    <span className="text-ink/45">{item.quantity}×</span>
                                    <span
                                      className={`flex-1 ${
                                        item.status === 'UNAVAILABLE'
                                          ? 'line-through text-ink/35'
                                          : ''
                                      }`}
                                    >
                                      {item.nameSnapshot ?? t('staffPortal.common.itemFallback')}
                                    </span>

                                    {mine &&
                                      (item.status === 'SENT_TO_WAITER' ||
                                        (item.status === 'PENDING' &&
                                          order.status === 'READY')) && (
                                        <button
                                          type="button"
                                          disabled={boardMarkingItemId === item.id}
                                          onClick={() => void markBoardItemServed(order, item)}
                                          className="shrink-0 text-[10px] uppercase tracking-[0.06em] border border-line rounded-lg px-2 py-1 text-ink/70 disabled:opacity-40"
                                        >
                                          {t('staffPortal.actions.markItemServed')}
                                        </button>
                                      )}

                                    {item.status === 'SERVED' && (
                                      <span className="shrink-0 text-[10px] uppercase tracking-[0.06em] text-[#477052]">
                                        {t('staffPortal.actions.itemServedLabel')}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div className="mt-3 flex gap-2">
                                {unclaimed && order.status === 'READY' && (
                                  <button
                                    type="button"
                                    disabled={boardClaimingId === order.id}
                                    onClick={() => void claimBoardOrder(order)}
                                    className="flex-1 bg-[#477052] text-white rounded-lg px-3 py-2 text-xs uppercase tracking-[0.08em] disabled:opacity-40"
                                  >
                                    {boardClaimingId === order.id
                                      ? t('staffPortal.actions.taking')
                                      : t('staffPortal.actions.takeOrder')}
                                  </button>
                                )}

                                {mine && order.status === 'READY' && (
                                  <button
                                    type="button"
                                    disabled={boardUpdatingId === order.id}
                                    onClick={() => void markBoardServed(order)}
                                    className="flex-1 bg-ink text-paper rounded-lg px-3 py-2 text-xs uppercase tracking-[0.08em] disabled:opacity-40"
                                  >
                                    {boardUpdatingId === order.id
                                      ? t('staffPortal.actions.updating')
                                      : t('staffPortal.actions.markServed')}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
              </div>
            </div>
          </div>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statuses.map((item) => (
            <article
              key={item.table.id}
              className={`border rounded-xl p-5 ${statusClass(item.status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-2xl">{item.table.label}</h3>
                <span className="text-[10px] uppercase tracking-[0.12em]">
                  {item.statusLabel}
                </span>
              </div>

              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-xs opacity-60">
                  {t('staffMisc.tables.currentBill')}
                </span>
                <span className="font-medium">
                  {money(item.totalCents, currency)}
                </span>
              </div>

              {item.status === 'PAYMENT_REQUESTED' && (
                <div className="mt-4 border-t border-current/10 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] opacity-60">
                    {t('staffMisc.tables.customerSelected')}
                  </p>
                  <p className="font-display text-xl mt-1">
                    {collectionLabel(item.collectionMethod, t) ??
                      t('staffMisc.tables.paymentMethodMissing')}
                  </p>
                  <p className="text-xs opacity-60 mt-1">
                    {t('staffMisc.tables.goToPaymentRequest')}
                  </p>

                  {item.collectionMethod === 'CASH' &&
                    !item.isSplit &&
                    item.cashTenderedCents != null && (
                      <div className="mt-3 rounded-lg bg-current/5 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.1em] opacity-60">
                          {t('staffMisc.tables.tendered')}
                        </p>
                        <p className="text-sm font-medium">
                          {money(item.cashTenderedCents, currency)}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.1em] opacity-60 mt-2">
                          {t('staffMisc.tables.changeDue')}
                        </p>
                        <p className="font-display text-lg">
                          {money(
                            Math.max(0, item.changeDueCents ?? 0),
                            currency
                          )}
                        </p>
                      </div>
                    )}

                  {item.collectionMethod === 'CASH' &&
                    item.isSplit &&
                    item.splits &&
                    item.splits.length > 0 && (
                      <div className="mt-3 rounded-lg bg-current/5 px-3 py-2 space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.1em] opacity-60">
                          {t('staffMisc.tables.splitBill')} ·{' '}
                          {t('staffMisc.tables.perPersonChange')}
                        </p>
                        {item.splits.map((split) => (
                          <div
                            key={split.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>
                              {split.label ?? `#${split.personIndex + 1}`} ·{' '}
                              {t('staffMisc.tables.owes')}{' '}
                              {money(split.shareCents, currency)}
                            </span>
                            <span className="font-medium">
                              {split.tenderedCents != null
                                ? money(
                                    Math.max(0, split.changeDueCents ?? 0),
                                    currency
                                  )
                                : t('staffMisc.tables.noChangeInfo')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {item.status === 'READY_TO_PAY' && (
                <p className="mt-4 text-xs opacity-70">
                  {t('staffMisc.tables.allOrdersServedReady')}
                </p>
              )}

              {item.status === 'PAID' && (
                <p className="mt-4 text-xs opacity-70">
                  {t('staffMisc.tables.paymentConfirmed')}
                </p>
              )}
            </article>
          ))}
        </div>
        )}

        {view === 'list' && statuses.length === 0 && (
          <div className="border border-line rounded-xl px-6 py-12 text-center text-sm text-ink/50">
            {t('staffMisc.tables.noTablesAssigned')}
          </div>
        )}
      </section>
    </main>
  );
}