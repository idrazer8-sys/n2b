'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';
import { type FeedEvent } from '@/components/staff/NotificationFeed';
import PisoBoard, {
  kitchenBucket,
  KITCHEN_BUCKET_COLOR,
  type KitchenBucket,
} from '@/components/piso/PisoBoard';
import {
  TableIcon,
  OrdersIcon,
  BanknoteIcon,
  BellIcon,
  SignOutIcon,
} from '@/components/branding/icons';

type T = (key: string, vars?: Record<string, string | number>) => string;

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  currency: string;
};

type Me = {
  staffId: string;
  role: 'STAFF' | string;
  staffPortal: 'WAITER' | 'KITCHEN' | string;
  user: {
    id: string;
    name: string;
    email?: string;
  };
};

type TableAssignment = {
  id: string;
  tableId: string;
  staffId: string;
  role: 'PRIMARY' | 'ASSISTING';
  assignedAt: string;
  endedAt: string | null;
  table: {
    id: string;
    label: string;
    isActive: boolean;
  };
};

type OrderModifier = {
  id: string;
  nameSnapshot?: string | null;
};

type OrderItem = {
  id: string;
  nameSnapshot?: string | null;
  quantity: number;
  unitPriceCents: number;
  modifiers?: OrderModifier[];
  status?: 'PENDING' | 'SENT_TO_WAITER' | 'SERVED' | 'UNAVAILABLE';
};

type OrderStaff = {
  id: string;
  user?: {
    id: string;
    name: string;
  };
} | null;

type StaffOrder = {
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
  createdAt: string;
  updatedAt?: string;
  staffId: string | null;
  table: {
    id: string;
    label: string;
  } | null;
  items: OrderItem[];
  RestaurantStaff?: OrderStaff;
};

type PaymentRequestOrder = {
  id: string;
  orderNumber: number;
  status: string;
  totalCents: number;
  currency: string;
  staffId: string | null;
};

type PaymentSplit = {
  id: string;
  personIndex: number;
  label: string | null;
  shareCents: number;
  tenderedCents: number | null;
  changeDueCents: number | null;
};

type PaymentRequest = {
  id: string;
  customerSessionId: string;
  paymentMethod: string;
  collectionMethod:
    | 'CASH'
    | 'CARD'
    | 'OTHER'
    | null;
  isSplit?: boolean;
  cashTenderedCents?: number | null;
  changeDueCents?: number | null;
  splits?: PaymentSplit[];
  status: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  table: {
    id: string;
    label: string;
    isActive: boolean;
  } | null;
  orders: PaymentRequestOrder[];
};

type TableStatus = {
  table: {
    id: string;
    label: string;
    isActive: boolean;
  };
  status: string;
  statusLabel?: string;
  collectionMethod:
    | 'CASH'
    | 'CARD'
    | 'OTHER'
    | null;
  totalCents: number;
};

// One row of the unscoped table-status response — the whole room, which is
// what the floor plan draws. Same source PisoBoard reads internally, so the
// header counts can never disagree with the map beside them.
type FloorRow = {
  table: { id: string; label: string };
  partySize?: number | null;
  totalCents: number;
  orders: Array<{
    id: string;
    orderNumber: number;
    status: StaffOrder['status'];
    totalCents: number;
    staffId: string | null;
  }>;
};

function FloorClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="text-right leading-tight">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#1A134D]/35">
        {now.toLocaleDateString([], { day: '2-digit', month: 'short' })}
      </p>
      <p className="font-display text-xl tabular-nums">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}

function money(
  cents: number,
  currency: string
) {
  return new Intl.NumberFormat(
    'es-ES',
    {
      style: 'currency',
      currency,
    }
  ).format(cents / 100);
}

// Staff type amounts as "20" or "20,50" (comma, matching es-ES formatting) —
// this accepts either a comma or a dot as the decimal separator.
function parseCentsInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return null;

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return Math.round(amount * 100);
}

function elapsed(
  createdAt: string,
  t: T
) {
  const diff =
    Date.now() -
    new Date(createdAt).getTime();

  const minutes = Math.max(
    0,
    Math.floor(diff / 60000)
  );

  if (minutes < 1) {
    return t('staffPortal.time.justNow');
  }

  if (minutes === 1) {
    return t('staffPortal.time.oneMinuteAgo');
  }

  return t('staffPortal.time.minutesAgo', { minutes });
}

function normalizeOrders(
  data: unknown,
  t: T
): StaffOrder[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((raw) => {
    const order =
      raw as Record<string, unknown>;

    const rawTable =
      typeof order.table ===
        'object' &&
      order.table !== null
        ? (order.table as Record<
            string,
            unknown
          >)
        : null;

    const rawStaff =
      typeof order.RestaurantStaff ===
        'object' &&
      order.RestaurantStaff !== null
        ? (order.RestaurantStaff as Record<
            string,
            unknown
          >)
        : null;

    const rawStaffUser =
      rawStaff &&
      typeof rawStaff.user ===
        'object' &&
      rawStaff.user !== null
        ? (rawStaff.user as Record<
            string,
            unknown
          >)
        : null;

    const rawItems = Array.isArray(
      order.items
    )
      ? order.items
      : [];

    const items: OrderItem[] =
      rawItems.map((rawItem) => {
        const item =
          rawItem as Record<
            string,
            unknown
          >;

        const rawModifiers =
          Array.isArray(
            item.modifiers
          )
            ? item.modifiers
            : [];

        return {
          id: String(
            item.id ?? ''
          ),

          nameSnapshot:
            typeof item.nameSnapshot ===
            'string'
              ? item.nameSnapshot
              : t('staffPortal.common.itemFallback'),

          quantity:
            typeof item.quantity ===
            'number'
              ? item.quantity
              : 1,

          unitPriceCents:
            typeof item.unitPriceCents ===
            'number'
              ? item.unitPriceCents
              : 0,

          status:
            item.status ===
              'SENT_TO_WAITER' ||
            item.status ===
              'SERVED' ||
            item.status ===
              'UNAVAILABLE'
              ? item.status
              : 'PENDING',

          modifiers:
            rawModifiers.map(
              (rawModifier) => {
                const modifier =
                  rawModifier as Record<
                    string,
                    unknown
                  >;

                return {
                  id: String(
                    modifier.id ?? ''
                  ),

                  nameSnapshot:
                    typeof modifier.nameSnapshot ===
                    'string'
                      ? modifier.nameSnapshot
                      : null,
                };
              }
            ),
        };
      });

    return {
      id: String(
        order.id ?? ''
      ),

      orderNumber:
        typeof order.orderNumber ===
        'number'
          ? order.orderNumber
          : 0,

      status:
        typeof order.status ===
        'string'
          ? (order.status as StaffOrder['status'])
          : 'NEW',

      createdAt:
        typeof order.createdAt ===
        'string'
          ? order.createdAt
          : new Date().toISOString(),

      updatedAt:
        typeof order.updatedAt ===
        'string'
          ? order.updatedAt
          : undefined,

      staffId:
        typeof order.staffId ===
        'string'
          ? order.staffId
          : null,

      table: rawTable
        ? {
            id:
              typeof rawTable.id ===
              'string'
                ? rawTable.id
                : '',
            label:
              typeof rawTable.label ===
              'string'
                ? rawTable.label
                : t('staffPortal.common.tableFallback'),
          }
        : null,

      items,

      RestaurantStaff:
        rawStaff && rawStaffUser
          ? {
              id: String(
                rawStaff.id ?? ''
              ),
              user: {
                id: String(
                  rawStaffUser.id ??
                    ''
                ),
                name:
                  typeof rawStaffUser.name ===
                  'string'
                    ? rawStaffUser.name
                    : t('staffPortal.header.waiterFallback'),
              },
            }
          : null,
    };
  });
}

// An order belongs in the "ready to serve" section either because the
// whole thing is READY, or because the kitchen sent at least one item
// ahead of the rest (a drink in an otherwise food-heavy order) even
// though the order as a whole hasn't reached READY yet.
function hasServableItem(
  order: StaffOrder
) {
  return (
    order.status === 'READY' ||
    order.items.some(
      (item) => item.status === 'SENT_TO_WAITER'
    )
  );
}

function orderPriority(
  order: StaffOrder
) {
  switch (order.status) {
    case 'READY':
      return 0;
    case 'NEW':
      return 1;
    case 'PREPARING':
      return 2;
    case 'ACCEPTED':
      return 3;
    default:
      return 4;
  }
}

function statusLabel(
  status: StaffOrder['status'],
  t: T
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

function collectionMethodLabel(
  method: 'CASH' | 'CARD' | 'OTHER' | null,
  t: T
) {
  switch (method) {
    case 'CASH':
      return t('staffPortal.paymentsSection.methodCash');

    case 'CARD':
      return t('staffPortal.paymentsSection.methodCard');

    case 'OTHER':
      return t('staffPortal.paymentsSection.methodOther');

    default:
      return t('staffPortal.paymentsSection.notSelected');
  }
}

function statusClass(
  status: StaffOrder['status']
) {
  switch (status) {
    case 'READY':
      return 'bg-[#477052]/10 text-[#406449] border-[#477052]/20';

    case 'NEW':
      return 'bg-[#5B3DFF]/10 text-[#5B3DFF] border-[#5B3DFF]/15';

    case 'PREPARING':
    case 'ACCEPTED':
      return 'bg-[#5d6874]/10 text-[#4f5964] border-[#5d6874]/15';

    default:
      return 'bg-black/5 text-ink/45 border-line';
  }
}

function tableStatusClass(
  status: string
) {
  switch (status) {
    case 'PAYMENT_REQUESTED':
    case 'READY_TO_PAY':
      return 'bg-[#9a6b22]/10 text-[#7a551b] border-[#9a6b22]/20';

    case 'OCCUPIED':
    case 'OPEN':
      return 'bg-black/5 text-ink/55 border-line';

    case 'PAID':
      return 'bg-black/5 text-ink/35 border-line';

    default:
      return 'bg-black/5 text-ink/40 border-line';
  }
}

export default function StaffOrdersPage() {
  const params =
    useParams<{
      restaurantId: string;
    }>();

  const router =
    useRouter();

  const restaurantId =
    params.restaurantId;

  const audioCtxRef =
    useRef<AudioContext | null>(
      null
    );

  const previousReadyRef =
    useRef<Set<string>>(
      new Set()
    );

  const [
    restaurant,
    setRestaurant,
  ] =
    useState<Restaurant | null>(
      null
    );

  const [
    me,
    setMe,
  ] =
    useState<Me | null>(
      null
    );

  const [
    orders,
    setOrders,
  ] =
    useState<StaffOrder[]>([]);

  const [
    assignments,
    setAssignments,
  ] =
    useState<TableAssignment[]>(
      []
    );

  const [
    paymentRequests,
    setPaymentRequests,
  ] =
    useState<PaymentRequest[]>(
      []
    );

  const [
    tableStatuses,
    setTableStatuses,
  ] =
    useState<TableStatus[]>(
      []
    );

  const [
    allTables,
    setAllTables,
  ] =
    useState<
      Array<{
        id: string;
        label: string;
        isActive: boolean;
      }>
    >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    live,
    setLive,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    claimingOrderId,
    setClaimingOrderId,
  ] =
    useState<string | null>(
      null
    );

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] =
    useState<string | null>(
      null
    );

  const [
    markingItemId,
    setMarkingItemId,
  ] =
    useState<string | null>(
      null
    );

  const [
    assigningTableId,
    setAssigningTableId,
  ] =
    useState<string | null>(
      null
    );

  const [
    selectedTableId,
    setSelectedTableId,
  ] = useState('');

  const [
    confirmingPaymentId,
    setConfirmingPaymentId,
  ] =
    useState<string | null>(
      null
    );

  // Change calculator: what staff actually received from the customer in
  // hand, separate from cashTenderedCents (which is only ever what the
  // customer pre-selected online at checkout, and may be null or wrong by
  // the time cash physically changes hands). Keyed by paymentRequest.id
  // for a single bill, or `${paymentRequest.id}:${split.id}` per person on
  // a split bill. Purely a local display aid — never sent to the server.
  const [
    cashReceivedInputs,
    setCashReceivedInputs,
  ] =
    useState<Record<string, string>>(
      {}
    );

  const [
    soundEnabled,
    setSoundEnabled,
  ] = useState(false);

  const [
    eventFeed,
    setEventFeed,
  ] = useState<FeedEvent[]>([]);

  // Floor-plan view state: which nav section is open, which stage is being
  // filtered for, and which table the waiter has tapped.
  const [floorRows, setFloorRows] = useState<FloorRow[]>([]);
  const [navSection, setNavSection] =
    useState<'tables' | 'orders' | 'payments'>('tables');
  const [floorFilter, setFloorFilter] =
    useState<KitchenBucket | 'all'>('all');
  const [selectedFloorTableId, setSelectedFloorTableId] =
    useState<string | null>(null);

  const { t } = useI18n();

  const pushFeedEvent = useCallback(
    (message: string, title?: string, color?: string) => {
      setEventFeed((prev) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            message,
            title,
            color,
            time: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 30)
      );
    },
    []
  );

  const enableSound =
    useCallback(
      async () => {
        try {
          const AudioContextClass =
            window.AudioContext ||
            (
              window as typeof window & {
                webkitAudioContext?: typeof AudioContext;
              }
            )
              .webkitAudioContext;

          if (
            !AudioContextClass
          ) {
            return;
          }

          const ctx =
            audioCtxRef.current ||
            new AudioContextClass();

          audioCtxRef.current =
            ctx;

          if (
            ctx.state ===
            'suspended'
          ) {
            await ctx.resume();
          }

          setSoundEnabled(
            true
          );
        } catch {
          setSoundEnabled(
            false
          );
        }
      },
      []
    );

  const chime =
    useCallback(() => {
      if (!soundEnabled) {
        return;
      }

      try {
        const ctx =
          audioCtxRef.current;

        if (!ctx) {
          return;
        }

        if (
          ctx.state ===
          'suspended'
        ) {
          void ctx.resume();
        }

        const oscillator =
          ctx.createOscillator();

        const gain =
          ctx.createGain();

        oscillator.frequency.setValueAtTime(
          880,
          ctx.currentTime
        );

        oscillator.frequency.setValueAtTime(
          660,
          ctx.currentTime +
            0.12
        );

        gain.gain.setValueAtTime(
          0.04,
          ctx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime +
            0.25
        );

        oscillator.connect(
          gain
        );

        gain.connect(
          ctx.destination
        );

        oscillator.start();

        oscillator.stop(
          ctx.currentTime +
            0.25
        );
      } catch {
        // Ignore audio errors.
      }
    }, [soundEnabled]);

  const loadData =
    useCallback(
      async (
        silent = false
      ) => {
        if (silent) {
          setRefreshing(true);
        }

        const attempt = async () => {
          // Fetched sequentially rather than via Promise.all — firing
          // all 7 of these at once was enough concurrent load to
          // randomly exhaust the DB pooler's connection limit and fail
          // one or two of them on every other load.
          const fetchOpts = {
            credentials: 'include' as const,
            cache: 'no-store' as const,
          };

          const restaurantsRes = await fetch(
            '/api/restaurants',
            fetchOpts
          );
          const meRes = await fetch(
            `/api/restaurants/${restaurantId}/me`,
            fetchOpts
          );
          const ordersRes = await fetch(
            `/api/restaurants/${restaurantId}/orders`,
            fetchOpts
          );
          const assignmentsRes = await fetch(
            `/api/restaurants/${restaurantId}/table-assignments?mine=1`,
            fetchOpts
          );
          const paymentRequestsRes = await fetch(
            `/api/restaurants/${restaurantId}/payment-requests`,
            fetchOpts
          );
          const tablesRes = await fetch(
            `/api/restaurants/${restaurantId}/tables`,
            fetchOpts
          );
          const tableStatusRes = await fetch(
            `/api/restaurants/${restaurantId}/table-status?mine=1`,
            fetchOpts
          );
          // Unscoped too: the floor plan shows the whole room, not just the
          // tables assigned to this waiter, so they can see what's going on
          // around them. Actions stay limited by the same server-side rules.
          const floorStatusRes = await fetch(
            `/api/restaurants/${restaurantId}/table-status`,
            fetchOpts
          );

          if (
            restaurantsRes.status ===
              401 ||
            meRes.status === 401
          ) {
            throw new Error(
              '__UNAUTHORIZED__'
            );
          }

          if (
            !restaurantsRes.ok
          ) {
            throw new Error(
              t('staffPortal.errors.loadRestaurantAccess')
            );
          }

          if (!meRes.ok) {
            throw new Error(
              t('staffPortal.errors.noWaiterDashboardAccess')
            );
          }

          if (!ordersRes.ok) {
            throw new Error(
              ordersRes.status ===
                403
                ? t('staffPortal.errors.noWaiterAccessRestaurant')
                : t('staffPortal.errors.loadOrders')
            );
          }

          if (!assignmentsRes.ok) {
            throw new Error(
              t('staffPortal.errors.loadTableAssignments')
            );
          }

          if (
            !paymentRequestsRes.ok
          ) {
            throw new Error(
              t('staffPortal.errors.loadPaymentRequests')
            );
          }

          if (!tablesRes.ok) {
            throw new Error(
              t('staffPortal.errors.loadTables')
            );
          }

          if (
            !tableStatusRes.ok
          ) {
            throw new Error(
              t('staffPortal.errors.loadTableStatus')
            );
          }

          const memberships =
            (await restaurantsRes.json()) as Array<{
              role: string;
              restaurant: Restaurant;
            }>;

          const membership =
            memberships.find(
              (item) =>
                item.restaurant.id ===
                restaurantId
            );

          if (!membership) {
            throw new Error(
              t('staffPortal.errors.noRestaurantAccess')
            );
          }

          const meJson =
            (await meRes.json()) as Me;

          if (
            meJson.staffPortal !==
            'WAITER'
          ) {
            throw new Error(
              t('staffPortal.errors.notWaiterAccount')
            );
          }

          const ordersJson =
            await ordersRes.json();

          const assignmentsJson =
            await assignmentsRes.json();

          const paymentRequestsJson =
            await paymentRequestsRes.json();

          const tablesJson =
            await tablesRes.json();

          const tableStatusJson =
            await tableStatusRes.json();

          setRestaurant(
            membership.restaurant
          );

          setMe(meJson);

          setOrders(
            normalizeOrders(
              ordersJson,
              t
            )
          );

          setAssignments(
            Array.isArray(
              assignmentsJson
            )
              ? assignmentsJson
              : []
          );

          setPaymentRequests(
            Array.isArray(
              paymentRequestsJson
            )
              ? paymentRequestsJson
              : []
          );

          setAllTables(
            Array.isArray(
              tablesJson
            )
              ? tablesJson
              : []
          );

          setTableStatuses(
            Array.isArray(
              tableStatusJson
                ?.tables
            )
              ? tableStatusJson.tables
              : []
          );

          // Only ever replaced with a real answer: blanking it on a failed
          // poll would empty the floor plan, zero the stage counts and drop
          // whichever table the waiter had open — mid-service — for what is
          // usually one hiccup that fixes itself on the next tick.
          if (floorStatusRes.ok) {
            const floorStatusJson = await floorStatusRes
              .json()
              .catch(() => null);

            if (Array.isArray(floorStatusJson?.tables)) {
              setFloorRows(floorStatusJson.tables);
            }
          }
        };

        try {
          await attempt();
          setError(null);
        } catch (err) {
          // A transient auth/connection hiccup right after a fresh
          // session (or under a burst of concurrent requests) can fail
          // once and succeed immediately after — one quick retry avoids
          // bouncing the waiter to the marketing homepage, or flashing
          // an error, for something that fixes itself right away.
          let finalErr: unknown = err;

          try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await attempt();
            setError(null);
            finalErr = null;
          } catch (retryErr) {
            finalErr = retryErr;
          }

          if (finalErr) {
            if (
              finalErr instanceof Error &&
              finalErr.message === '__UNAUTHORIZED__'
            ) {
              router.push('/');
              return;
            }

            if (!silent) {
              setError(
                finalErr instanceof Error
                  ? finalErr.message
                  : t('staffPortal.errors.loadDashboard')
              );
            }
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [restaurantId, router, t]
    );

  useEffect(() => {
    void loadData();

    const interval =
      window.setInterval(
        () => {
          void loadData(true);
        },
        5000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [loadData]);

  useEffect(() => {
    const stream =
      new EventSource(
        `/api/restaurants/${restaurantId}/orders/stream`
      );

    stream.onopen = () => {
      setLive(true);
    };

    stream.onmessage = async (
      event
    ) => {
      try {
        const payload =
          JSON.parse(
            event.data
          );

        const relevant =
          payload.type === 'ORDER_READY' ||
          payload.type === 'ORDER_CLAIMED' ||
          payload.type === 'ORDER_STATUS_CHANGED' ||
          payload.type === 'ORDER_PAID';

        if (!relevant) return;

        await loadData(true);

        // Looked up fresh (rather than read back off `orders` state,
        // which won't have re-rendered yet) so the feed message always
        // reflects the order this exact event was about.
        const response =
          await fetch(
            `/api/restaurants/${restaurantId}/orders`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
          );

        if (!response.ok) return;

        const nextOrders =
          normalizeOrders(
            await response.json(),
            t
          );

        const order =
          nextOrders.find(
            (item) => item.id === payload.orderId
          );

        if (!order) return;

        const tableLabel =
          order.table?.label ??
          t('staffPortal.common.tableFallback');

        // Headline + "Mesa 4 — #1051" subline + a colour per event type,
        // so the activity list reads at a glance rather than as prose.
        const tableRef = t('staffPortal.activity.tableRef', {
          table: tableLabel,
          number: order.orderNumber,
        });

        if (
          payload.type === 'ORDER_READY' &&
          order.status === 'READY'
        ) {
          pushFeedEvent(
            tableRef,
            t('staffPortal.activity.orderReady'),
            '#e0a83a'
          );
          chime();
        } else if (payload.type === 'ORDER_CLAIMED') {
          pushFeedEvent(
            tableRef,
            t('staffPortal.activity.orderClaimed'),
            '#35c88a'
          );
        } else if (payload.type === 'ORDER_STATUS_CHANGED') {
          pushFeedEvent(
            `${tableRef} · ${statusLabel(order.status, t)}`,
            t('staffPortal.activity.orderStatusChanged'),
            '#5B3DFF'
          );
        } else if (payload.type === 'ORDER_PAID') {
          pushFeedEvent(
            tableRef,
            t('staffPortal.activity.orderPaid'),
            '#3f8f5f'
          );
        }
      } catch {
        // Ignore malformed events.
      }
    };

    stream.onerror = () => {
      setLive(false);
    };

    return () => {
      stream.close();
      setLive(false);
    };
  }, [
    chime,
    loadData,
    pushFeedEvent,
    restaurantId,
    t,
  ]);

  async function claimOrder(
    order: StaffOrder
  ) {
    try {
      setClaimingOrderId(
        order.id
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/orders/${order.id}/claim`,
          {
            method: 'POST',
            credentials:
              'include',
          }
        );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ??
            t('staffPortal.errors.takeOrder')
        );
      }

      await loadData(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffPortal.errors.takeOrder')
      );
    } finally {
      setClaimingOrderId(
        null
      );
    }
  }

  async function markServed(
    order: StaffOrder
  ) {
    if (
      order.staffId !==
        me?.staffId &&
      !canActOnAnyReadyOrder
    ) {
      setError(
        t('staffPortal.errors.orderNotAssigned')
      );
      return;
    }

    try {
      setUpdatingOrderId(
        order.id
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/orders/${order.id}`,
          {
            method: 'PATCH',
            credentials:
              'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              status:
                'COMPLETED',
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ??
            t('staffPortal.errors.markServed')
        );
      }

      await loadData(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffPortal.errors.markServed')
      );
    } finally {
      setUpdatingOrderId(
        null
      );
    }
  }

  async function markItemServed(
    order: StaffOrder,
    item: OrderItem
  ) {
    if (
      order.staffId !==
        me?.staffId &&
      !canActOnAnyReadyOrder
    ) {
      setError(
        t('staffPortal.errors.orderNotAssigned')
      );
      return;
    }

    try {
      setMarkingItemId(
        item.id
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/orders/${order.id}/items/${item.id}`,
          {
            method: 'PATCH',
            credentials:
              'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              action:
                'SERVE',
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ??
            t('staffPortal.errors.markServed')
        );
      }

      await loadData(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffPortal.errors.markServed')
      );
    } finally {
      setMarkingItemId(
        null
      );
    }
  }

  async function assignMyself(
    tableId: string
  ) {
    if (!tableId) {
      return;
    }

    try {
      setAssigningTableId(
        tableId
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/table-assignments`,
          {
            method: 'POST',
            credentials:
              'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              tableId,
              role: 'PRIMARY',
            }),
          }
        );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ??
            t('staffPortal.errors.assignTable')
        );
      }

      setSelectedTableId('');

      await loadData(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffPortal.errors.assignTable')
      );
    } finally {
      setAssigningTableId(
        null
      );
    }
  }

  async function leaveTable(
    assignmentId: string
  ) {
    try {
      setAssigningTableId(
        assignmentId
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/table-assignments?assignmentId=${encodeURIComponent(
            assignmentId
          )}`,
          {
            method: 'DELETE',
            credentials:
              'include',
          }
        );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ??
            t('staffPortal.errors.leaveTable')
        );
      }

      await loadData(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffPortal.errors.leaveTable')
      );
    } finally {
      setAssigningTableId(
        null
      );
    }
  }

  async function confirmPayment(
    request: PaymentRequest
  ) {
    try {
      setConfirmingPaymentId(
        request.id
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/sessions/${request.customerSessionId}/payment`,
          {
            method: 'POST',
            credentials:
              'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              {}
            ),
          }
        );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error ??
            t('staffPortal.errors.confirmPayment')
        );
      }

      await loadData(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffPortal.errors.confirmPayment')
      );
    } finally {
      setConfirmingPaymentId(
        null
      );
    }
  }

  const myStaffId =
    me?.staffId ?? null;

  // A manager/owner needs full oversight of what's ready to serve — even
  // on tables staffed by someone else — so they can step in without first
  // reassigning the table. Regular staff only ever act on their own.
  const canActOnAnyReadyOrder =
    me?.role === 'MANAGER' ||
    me?.role === 'OWNER';

  const assignedTableIds =
    useMemo(
      () =>
        new Set(
          assignments
            .filter(
              (assignment) =>
                assignment.endedAt ===
                  null &&
                assignment.table
                  .isActive
            )
            .map(
              (assignment) =>
                assignment.tableId
            )
        ),
      [assignments]
    );

  const assignedTables =
    useMemo(
      () =>
        assignments
          .filter(
            (assignment) =>
              assignment.endedAt ===
                null &&
              assignment.table
                .isActive
          )
          .map(
            (assignment) =>
              assignment.table
          )
          .filter(
            (table, index, list) =>
              list.findIndex(
                (item) =>
                  item.id ===
                  table.id
              ) === index
          ),
      [assignments]
    );

  const availableTables =
    useMemo(
      () =>
        allTables.filter(
          (table) =>
            table.isActive &&
            !assignedTableIds.has(
              table.id
            )
        ),
      [
        allTables,
        assignedTableIds,
      ]
    );

  const myReadyOrders =
    useMemo(
      () =>
        orders
          .filter(
            (order) =>
              hasServableItem(order) &&
              (order.staffId ===
                myStaffId ||
                (canActOnAnyReadyOrder &&
                  order.staffId !==
                    null))
          )
          .sort(
            (a, b) =>
              new Date(
                a.createdAt
              ).getTime() -
              new Date(
                b.createdAt
              ).getTime()
          ),
      [
        orders,
        myStaffId,
        canActOnAnyReadyOrder,
      ]
    );

  const unclaimedReadyOrders =
    useMemo(
      () =>
        orders
          .filter(
            (order) =>
              hasServableItem(order) &&
              order.staffId ===
                null
          )
          .sort(
            (a, b) =>
              new Date(
                a.createdAt
              ).getTime() -
              new Date(
                b.createdAt
              ).getTime()
          ),
      [orders]
    );

  const claimedByOtherReady =
    useMemo(
      () =>
        canActOnAnyReadyOrder
          ? []
          : orders.filter(
              (order) =>
                hasServableItem(order) &&
                order.staffId !==
                  null &&
                order.staffId !==
                  myStaffId
            ),
      [
        orders,
        myStaffId,
        canActOnAnyReadyOrder,
      ]
    );

  const myActiveOrders =
    useMemo(
      () =>
        orders
          .filter(
            (order) =>
              order.staffId ===
                myStaffId &&
              (
                order.status ===
                  'NEW' ||
                order.status ===
                  'ACCEPTED' ||
                order.status ===
                  'PREPARING'
              )
          )
          .sort(
            (a, b) =>
              orderPriority(
                a
              ) -
              orderPriority(
                b
              )
          ),
      [orders, myStaffId]
    );

  const relevantPayments =
    useMemo(
      () =>
        paymentRequests.filter(
          (request) =>
            request.table &&
            assignedTableIds.has(
              request.table.id
            )
        ),
      [
        paymentRequests,
        assignedTableIds,
      ]
    );

  const floorOrdersByTableId = useMemo(() => {
    const map = new Map<string, FloorRow['orders']>();
    for (const row of floorRows) map.set(row.table.id, row.orders);
    return map;
  }, [floorRows]);

  const floorCounts = useMemo(() => {
    const result: Record<KitchenBucket, number> = {
      available: 0,
      ordering: 0,
      preparing: 0,
      ready: 0,
      serving: 0,
    };
    for (const row of floorRows) {
      result[kitchenBucket(row.orders)] += 1;
    }
    return result;
  }, [floorRows]);

  const selectedFloorRow = useMemo(
    () =>
      floorRows.find((row) => row.table.id === selectedFloorTableId) ?? null,
    [floorRows, selectedFloorTableId]
  );

  // The floor rows say which orders are actually live on that table right
  // now (session-scoped); the full order objects — with their items — come
  // from the orders list this page already loads, so the detail panel can
  // reuse the same claim/serve actions as the list below.
  const selectedFloorOrders = useMemo(() => {
    if (!selectedFloorRow) return [];
    const liveIds = new Set(selectedFloorRow.orders.map((order) => order.id));
    return orders.filter((order) => liveIds.has(order.id));
  }, [selectedFloorRow, orders]);

  const selectedFloorBucket = selectedFloorRow
    ? kitchenBucket(selectedFloorRow.orders)
    : 'available';

  const readyPoolCount =
    myReadyOrders.length +
    unclaimedReadyOrders.length;

  const activeCount =
    myActiveOrders.length;

  const billCount =
    relevantPayments.length;

  const priorityOrders =
    useMemo(
      () =>
        orders
          .filter(
            (order) =>
              order.table?.id &&
              assignedTableIds.has(
                order.table.id
              ) &&
              ![
                'COMPLETED',
                'REJECTED',
                'CANCELLED',
              ].includes(
                order.status
              )
          )
          .sort((a, b) => {
            const pa =
              orderPriority(a);

            const pb =
              orderPriority(b);

            if (pa !== pb) {
              return pa - pb;
            }

            return (
              new Date(
                a.createdAt
              ).getTime() -
              new Date(
                b.createdAt
              ).getTime()
            );
          }),
      [
        orders,
        assignedTableIds,
      ]
    );

  const readyIds =
    useMemo(
      () =>
        new Set(
          orders
            .filter(
              (order) =>
                order.status ===
                'READY'
            )
            .map(
              (order) =>
                order.id
            )
        ),
      [orders]
    );

  useEffect(() => {
    const previous =
      previousReadyRef.current;

    let hasNewReady = false;

    for (
      const orderId of readyIds
    ) {
      if (
        !previous.has(
          orderId
        )
      ) {
        hasNewReady = true;
        break;
      }
    }

    if (
      hasNewReady &&
      previous.size > 0
    ) {
      chime();
    }

    previousReadyRef.current =
      readyIds;
  }, [
    chime,
    readyIds,
  ]);

  const currency =
    restaurant?.currency ??
    'EUR';

  if (loading) {
    return (
      <main className="theme-n2b min-h-screen bg-[#F5F6FA] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A134D]/40">
            {t('staffPortal.loading.eyebrow')}
          </p>

          <h1 className="font-display text-3xl mt-2">
            {t('common.loading')}
          </h1>
        </div>
      </main>
    );
  }

  if (
    error &&
    !restaurant
  ) {
    return (
      <main className="theme-n2b min-h-screen bg-[#F5F6FA] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl">
            {t('staffPortal.error.unavailableTitle')}
          </h1>

          <p className="mt-3 text-sm text-[#1A134D]/60">
            {error}
          </p>
        </div>
      </main>
    );
  }

  const NAV = [
    {
      key: 'tables' as const,
      label: t('staffPortal.nav.tables'),
      icon: TableIcon,
      badge: floorCounts.ready,
    },
    {
      key: 'orders' as const,
      label: t('staffPortal.nav.orders'),
      icon: OrdersIcon,
      badge: readyPoolCount,
    },
    {
      key: 'payments' as const,
      label: t('staffPortal.nav.payments'),
      icon: BanknoteIcon,
      badge: billCount,
    },
  ];

  return (
    <main className="theme-n2b min-h-screen bg-[#F5F6FA] text-[#1A134D] md:flex">
      {/* Sidebar — desktop/tablet */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 bg-n2bNavy text-n2bOffwhite">
        <div className="px-5 pt-5 pb-4">
          <N2BLogo markSize={22} wordmarkClassName="text-sm leading-none" />
          <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-white/40">
            {restaurant?.name}
          </p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = navSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setNavSection(item.key)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                  active ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon size={17} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="rounded-full bg-[#ef5a6f] px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-2">
          <div className="px-3 pt-3 border-t border-white/10">
            <p className="text-sm text-white/90">
              {me?.user.name ?? t('staffPortal.header.waiterFallback')}
            </p>
            <p className="text-[11px] text-white/40">{t('dashboardCore.nav.waiter')}</p>
          </div>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
              router.push('/login');
            }}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white"
          >
            <SignOutIcon size={16} />
            {t('common.signOut')}
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden bg-n2bNavy text-n2bOffwhite px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <N2BLogo markSize={20} wordmarkClassName="text-sm leading-none" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                router.push('/login');
              }}
              className="text-white/60"
            >
              <SignOutIcon size={18} />
            </button>
          </div>
        </div>
        <nav className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {NAV.map((item) => {
            const active = navSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setNavSection(item.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                  active ? 'bg-white text-n2bNavy' : 'bg-white/10 text-white/70'
                }`}
              >
                {item.label}
                {item.badge > 0 && (
                  <span className="rounded-full bg-[#ef5a6f] px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* min-w-0 so this flex child can shrink below the floor plan's own
          1104px room instead of pushing the whole page wider than the
          screen — that's what lets the plan scale down beside the panel. */}
      <div className="flex-1 min-w-0 md:ml-56">
      {/* Only pinned once there's height to spare: on a phone this block
          (title, sound, clock, three counters) is half the screen, and
          keeping it stuck on top of the scrolling plan reads as the page
          being drawn twice. */}
      <header className="md:sticky md:top-0 z-30 border-b border-[#1A134D]/10 bg-[#F5F6FA]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl">
                {navSection === 'tables'
                  ? t('staffPortal.nav.tables')
                  : navSection === 'orders'
                    ? t('staffPortal.nav.orders')
                    : t('staffPortal.nav.payments')}
              </h1>
              <p className="text-[13px] sm:text-sm text-[#1A134D]/50 mt-0.5">
                {t('staffPortal.floor.subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() =>
                  soundEnabled ? setSoundEnabled(false) : void enableSound()
                }
                className="flex items-center gap-2.5 rounded-full border border-[#1A134D]/10 bg-white px-3.5 py-2 text-[13px] shadow-sm"
              >
                <BellIcon size={15} />
                <span className="hidden sm:inline">
                  {soundEnabled
                    ? t('staffPortal.header.soundOn')
                    : t('staffPortal.header.enableSound')}
                </span>
                <span
                  className={`relative h-5 w-9 rounded-full transition ${
                    soundEnabled ? 'bg-[#3f8f5f]' : 'bg-[#1A134D]/15'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                      soundEnabled ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
              <div className="hidden sm:block h-9 w-px bg-[#1A134D]/10" />
              <FloorClock />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="border border-[#477052]/20 bg-[#477052]/10 rounded-lg px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#406449]">
                {t('staffPortal.status.ready')}
              </p>

              <p className="font-display text-2xl mt-0.5 text-[#406449]">
                {readyPoolCount}
              </p>
            </div>

            <div className="border border-[#9a6b22]/20 bg-[#9a6b22]/10 rounded-lg px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#7a551b]">
                {t('staffPortal.stats.bills')}
              </p>

              <p className="font-display text-2xl mt-0.5 text-[#7a551b]">
                {billCount}
              </p>
            </div>

            <div className="border border-[#1A134D]/10 bg-black/5 rounded-lg px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#1A134D]/50">
                {t('common.active')}
              </p>

              <p className="font-display text-2xl mt-0.5">
                {activeCount}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#1A134D]/45">
            <span>
              {t('staffPortal.common.assignedTablesCount', {
                count: assignedTables.length,
                word: t(
                  assignedTables.length === 1
                    ? 'staffPortal.common.assignedTableSingular'
                    : 'staffPortal.common.assignedTablePlural'
                ),
              })}
            </span>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    live
                      ? 'bg-[#477052]'
                      : 'bg-[#9a6b22]'
                  }`}
                />

                {live
                  ? t('staffPortal.header.live')
                  : refreshing
                  ? t('staffPortal.header.syncing')
                  : t('staffPortal.header.reconnecting')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {navSection === 'tables' && (
          <section className="mb-8">
            {/* One scrolling row on a phone rather than three wrapped rows
                eating the screen above the plan. */}
            <div className="flex gap-2.5 mb-5 overflow-x-auto no-scrollbar lg:flex-wrap lg:overflow-visible">
              {(['all', 'available', 'ordering', 'preparing', 'ready', 'serving'] as const).map(
                (option) => {
                  const active = floorFilter === option;
                  const count =
                    option === 'all' ? floorRows.length : floorCounts[option];
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFloorFilter(option)}
                      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition ${
                        active
                          ? 'border-transparent bg-[#3f8f5f] text-white shadow-sm'
                          : 'border-[#1A134D]/10 bg-white text-[#1A134D]/75 hover:border-[#1A134D]/25'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background: active
                            ? 'rgba(255,255,255,0.9)'
                            : option === 'all'
                              ? '#3f8f5f'
                              : KITCHEN_BUCKET_COLOR[option],
                        }}
                      />
                      {option === 'all'
                        ? t('staffMisc.tables.boardFilterAll')
                        : t(`floorPlan.kitchenStage.${option}`)}
                      <span className={active ? 'text-white/80' : 'text-[#1A134D]/45'}>
                        ({count})
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <PisoBoard
                  restaurantId={restaurantId}
                  editable={false}
                  scopeToMine={false}
                  lens="kitchen"
                  showSidePanel={false}
                  highlightBucket={floorFilter}
                  onSelectTable={setSelectedFloorTableId}
                  fitToWidth
                  variant="light"
                />
              </div>

              <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
                {/* On a phone the plan sits above this column, so the table
                    you just tapped comes first and the activity log second;
                    side by side on a wide screen that order flips back to
                    match the layout the room is read in. */}
                <div className="rounded-2xl border border-[#1A134D]/10 bg-white p-5 shadow-sm order-2 lg:order-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg">
                      {t('staffPortal.notifications.title')}
                    </h2>
                    <span className="relative text-[#1A134D]/45">
                      <BellIcon size={18} />
                      {eventFeed.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ef5a6f] px-1 text-[9px] font-bold text-white">
                          {eventFeed.length > 9 ? '9+' : eventFeed.length}
                        </span>
                      )}
                    </span>
                  </div>

                  {eventFeed.length === 0 ? (
                    <p className="text-sm text-[#1A134D]/40 py-4 text-center">
                      {t('staffPortal.notifications.empty')}
                    </p>
                  ) : (
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {eventFeed.map((event) => (
                        <div key={event.id} className="flex gap-3">
                          <span
                            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                            style={{
                              background: `${event.color ?? '#5B3DFF'}1f`,
                              color: event.color ?? '#5B3DFF',
                            }}
                          >
                            <BellIcon size={15} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug">
                              {event.title ?? event.message}
                            </p>
                            {event.title && (
                              <p className="text-[13px] text-[#1A134D]/55 mt-0.5">
                                {event.message}
                              </p>
                            )}
                            <p className="text-xs text-[#1A134D]/35 mt-0.5">
                              {elapsed(event.time, t)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#1A134D]/10 bg-white p-5 shadow-sm order-1 lg:order-2">
                  {!selectedFloorRow ? (
                    <p className="text-sm text-[#1A134D]/40 py-6 text-center">
                      {t('staffMisc.tables.boardSelectPrompt')}
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-display text-xl">
                            {t('floorPlan.notifications.tablePrefix', {
                              label: selectedFloorRow.table.label,
                            })}
                          </h3>
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{
                              background: `${KITCHEN_BUCKET_COLOR[selectedFloorBucket]}1f`,
                              color: KITCHEN_BUCKET_COLOR[selectedFloorBucket],
                            }}
                          >
                            {t(`floorPlan.kitchenStage.${selectedFloorBucket}`)}
                          </span>
                        </div>

                        {selectedFloorRow.partySize != null && (
                          <span className="text-[13px] text-[#1A134D]/45">
                            {t('floorPlan.detail.guests', {
                              count: selectedFloorRow.partySize,
                            })}
                          </span>
                        )}
                      </div>

                      {selectedFloorOrders.length === 0 ? (
                        <p className="text-sm text-[#1A134D]/40 mt-4">
                          {t('staffMisc.tables.boardNoOrders')}
                        </p>
                      ) : (
                        <div className="mt-4 space-y-4">
                          {selectedFloorOrders.map((order) => {
                            const mine =
                              order.staffId === myStaffId ||
                              (canActOnAnyReadyOrder && order.staffId !== null);
                            const unclaimed = order.staffId === null;

                            return (
                              <div
                                key={order.id}
                                className="border-t border-[#1A134D]/10 pt-3 first:border-t-0 first:pt-0"
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="font-medium">
                                    {t('staffPortal.common.orderNumber', {
                                      number: order.orderNumber,
                                    })}
                                  </span>
                                  <span className="font-display text-lg">
                                    {money(
                                      order.items.reduce(
                                        (sum, item) =>
                                          sum + item.unitPriceCents * item.quantity,
                                        0
                                      ),
                                      currency
                                    )}
                                  </span>
                                </div>

                                <div className="mt-3 space-y-2">
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-2 text-[13px]"
                                    >
                                      <span className="text-[#1A134D]/45">
                                        {item.quantity} ×
                                      </span>
                                      <span
                                        className={`flex-1 ${
                                          item.status === 'UNAVAILABLE'
                                            ? 'line-through text-[#1A134D]/35'
                                            : ''
                                        }`}
                                      >
                                        {item.nameSnapshot ??
                                          t('staffPortal.common.itemFallback')}
                                      </span>
                                      <span className="text-[#1A134D]/55">
                                        {money(
                                          item.unitPriceCents * item.quantity,
                                          currency
                                        )}
                                      </span>

                                      {mine &&
                                        (item.status === 'SENT_TO_WAITER' ||
                                          (item.status === 'PENDING' &&
                                            order.status === 'READY')) && (
                                          <button
                                            type="button"
                                            disabled={markingItemId === item.id}
                                            onClick={() =>
                                              void markItemServed(order, item)
                                            }
                                            className="shrink-0 rounded-lg border border-[#1A134D]/20 px-2 py-1 text-[10px] uppercase tracking-[0.06em] text-[#1A134D]/70 disabled:opacity-40"
                                          >
                                            {t('staffPortal.actions.markItemServed')}
                                          </button>
                                        )}
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 flex gap-2">
                                  {unclaimed && hasServableItem(order) && (
                                    <button
                                      type="button"
                                      disabled={claimingOrderId === order.id}
                                      onClick={() => void claimOrder(order)}
                                      className="flex-1 rounded-lg bg-[#3f8f5f] px-3 py-3 text-sm font-medium text-white disabled:opacity-40"
                                    >
                                      {claimingOrderId === order.id
                                        ? t('staffPortal.actions.taking')
                                        : t('staffPortal.actions.takeOrder')}
                                    </button>
                                  )}

                                  {mine && order.status === 'READY' && (
                                    <button
                                      type="button"
                                      disabled={updatingOrderId === order.id}
                                      onClick={() => void markServed(order)}
                                      className="flex-1 rounded-lg bg-[#1A134D] px-3 py-3 text-sm font-medium text-[#F5F6FA] disabled:opacity-40"
                                    >
                                      {updatingOrderId === order.id
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
          </section>
        )}

        {navSection === 'orders' && (
        <section className="mb-8">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#477052]">
                {t('staffPortal.readySection.eyebrow')}
              </p>

              <h2 className="font-display text-3xl mt-1">
                {t('staffPortal.readySection.title')}
              </h2>
            </div>

            <span className="text-xs text-[#1A134D]/40">
              {t('staffPortal.common.ordersCount', {
                count: readyPoolCount,
                word: t(
                  readyPoolCount === 1
                    ? 'staffPortal.common.orderSingular'
                    : 'staffPortal.common.orderPlural'
                ),
              })}
            </span>
          </div>

          {readyPoolCount === 0 ? (
            <div className="border border-line rounded-xl px-6 py-10 text-center">
              <h3 className="font-display text-2xl">
                {t('staffPortal.readySection.emptyTitle')}
              </h3>

              <p className="text-sm text-ink/50 mt-2">
                {t('staffPortal.readySection.emptyBody')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                ...myReadyOrders,
                ...unclaimedReadyOrders,
              ].map(
                (order) => {
                  const mine =
                    order.staffId ===
                      myStaffId ||
                    (canActOnAnyReadyOrder &&
                      order.staffId !==
                        null);

                  const unclaimed =
                    order.staffId ===
                    null;

                  return (
                    <article
                      key={
                        order.id
                      }
                      className={`rounded-xl border p-5 ${
                        mine
                          ? 'border-[#477052]/25 bg-[#477052]/[0.045]'
                          : 'border-[#1A134D]/10 bg-white/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[#1A134D]/40">
                            {mine
                              ? t('staffPortal.readySection.myOrder')
                              : t('staffPortal.readySection.availableToClaim')}
                          </p>

                          <h3 className="font-display text-4xl mt-1">
                            {order.table
                              ?.label ??
                              t('staffPortal.common.tableFallback')}
                          </h3>

                          <p className="text-xs text-[#1A134D]/45 mt-1">
                            {t('staffPortal.readySection.orderNumberElapsed', {
                              number: order.orderNumber,
                              elapsed: elapsed(
                                order.createdAt,
                                t
                              ),
                            })}
                          </p>
                        </div>

                        <span
                          className={`inline-flex border px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.1em] ${statusClass(
                            order.status
                          )}`}
                        >
                          {statusLabel(order.status, t)}
                        </span>
                      </div>

                      <div className="mt-5 border-t border-[#1A134D]/10 pt-4 space-y-3">
                        {order.items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className="flex items-center gap-3"
                            >
                              <span className="text-sm text-[#1A134D]/50 w-10">
                                {item.quantity}
                                ×
                              </span>

                              <div className="flex-1">
                                <p
                                  className={`font-display text-lg ${
                                    item.status ===
                                    'UNAVAILABLE'
                                      ? 'line-through text-[#1A134D]/35'
                                      : ''
                                  }`}
                                >
                                  {item.nameSnapshot ??
                                    t('staffPortal.common.itemFallback')}
                                </p>

                                {item
                                  .modifiers
                                  ?.map(
                                    (
                                      modifier
                                    ) => (
                                      <p
                                        key={
                                          modifier.id
                                        }
                                        className="text-xs text-[#1A134D]/45 mt-0.5"
                                      >
                                        +
                                        {modifier.nameSnapshot ??
                                          t('staffPortal.common.optionFallback')}
                                      </p>
                                    )
                                  )}
                              </div>

                              <span className="text-sm text-[#1A134D]/55">
                                {money(
                                  item.unitPriceCents *
                                    item.quantity,
                                  currency
                                )}
                              </span>

                              {mine &&
                                (item.status ===
                                  'SENT_TO_WAITER' ||
                                  (item.status ===
                                    'PENDING' &&
                                    order.status ===
                                      'READY')) && (
                                  <button
                                    type="button"
                                    disabled={
                                      markingItemId ===
                                      item.id
                                    }
                                    onClick={() =>
                                      void markItemServed(
                                        order,
                                        item
                                      )
                                    }
                                    className="shrink-0 border border-[#1A134D]/20 rounded-lg px-2.5 py-1.5 text-[10px] uppercase tracking-[0.06em] text-[#1A134D]/70 disabled:opacity-40"
                                  >
                                    {markingItemId ===
                                    item.id
                                      ? t('staffPortal.actions.updating')
                                      : t('staffPortal.actions.markItemServed')}
                                  </button>
                                )}

                              {item.status ===
                                'PENDING' &&
                                order.status !==
                                  'READY' && (
                                  <span className="shrink-0 text-[10px] uppercase tracking-[0.06em] text-[#1A134D]/35">
                                    {t('staffPortal.actions.itemStillInKitchen')}
                                  </span>
                                )}

                              {item.status ===
                                'SERVED' && (
                                <span className="shrink-0 text-[10px] uppercase tracking-[0.06em] text-[#477052]">
                                  {t('staffPortal.actions.itemServedLabel')}
                                </span>
                              )}

                              {item.status ===
                                'UNAVAILABLE' && (
                                <span className="shrink-0 text-[10px] uppercase tracking-[0.06em] text-[#9b554a]">
                                  {t('staffPortal.actions.itemUnavailableLabel')}
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>

                      <div className="mt-5 flex gap-2">
                        {unclaimed && (
                          <button
                            type="button"
                            onClick={() =>
                              void claimOrder(
                                order
                              )
                            }
                            disabled={
                              claimingOrderId ===
                              order.id
                            }
                            className="flex-1 bg-[#477052] text-white rounded-lg px-4 py-3 text-xs uppercase tracking-[0.08em] disabled:opacity-40"
                          >
                            {claimingOrderId ===
                            order.id
                              ? t('staffPortal.actions.taking')
                              : t('staffPortal.actions.takeOrder')}
                          </button>
                        )}

                        {mine &&
                          order.status ===
                            'READY' && (
                            <button
                              type="button"
                              onClick={() =>
                                void markServed(
                                  order
                                )
                              }
                              disabled={
                                updatingOrderId ===
                                order.id
                              }
                              className="flex-1 bg-[#1A134D] text-[#F5F6FA] rounded-lg px-4 py-3 text-xs uppercase tracking-[0.08em] disabled:opacity-40"
                            >
                              {updatingOrderId ===
                              order.id
                                ? t('staffPortal.actions.updating')
                                : t('staffPortal.actions.markServed')}
                            </button>
                          )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}

          {claimedByOtherReady.length >
            0 && (
            <p className="mt-3 text-xs text-[#1A134D]/35">
              {t('staffPortal.readySection.claimedByOther', {
                count: claimedByOtherReady.length,
                phrase: t(
                  claimedByOtherReady.length === 1
                    ? 'staffPortal.readySection.claimedByOtherSingular'
                    : 'staffPortal.readySection.claimedByOtherPlural'
                ),
              })}
            </p>
          )}
        </section>
        )}

        {navSection === 'orders' && myActiveOrders.length >
          0 && (
          <section className="mb-8">
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#5d6874]">
                {t('staffPortal.activeSection.eyebrow')}
              </p>

              <h2 className="font-display text-3xl mt-1">
                {t('staffPortal.activeSection.title')}
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myActiveOrders.map(
                (order) => (
                  <article
                    key={
                      order.id
                    }
                    className="border border-line rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-2xl">
                        {order.table
                          ?.label ??
                          t('staffPortal.common.tableFallback')}
                      </h3>

                      <span
                        className={`border px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.08em] ${statusClass(
                          order.status
                        )}`}
                      >
                        {statusLabel(
                          order.status,
                          t
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-ink/40 mt-2">
                      {t('staffPortal.common.orderNumber', {
                        number: order.orderNumber,
                      })}
                    </p>

                    <div className="mt-4 space-y-2">
                      {order.items.map(
                        (item) => (
                          <div
                            key={
                              item.id
                            }
                            className="flex gap-2 text-sm"
                          >
                            <span className="text-ink/45">
                              {
                                item.quantity
                              }
                              ×
                            </span>

                            <span>
                              {item.nameSnapshot ??
                                t('staffPortal.common.itemFallback')}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          </section>
        )}

        {navSection === 'tables' && (
        <section className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#1A134D]/40">
                {t('staffPortal.tablesSection.eyebrow')}
              </p>

              <h2 className="font-display text-3xl mt-1">
                {t('staffPortal.tablesSection.title')}
              </h2>

              <p className="text-sm text-ink/50 mt-1">
                {t('staffPortal.tablesSection.description')}
              </p>
            </div>

            <div className="flex gap-2 sm:min-w-[360px]">
              <select
                value={
                  selectedTableId
                }
                onChange={(event) =>
                  setSelectedTableId(
                    event.target
                      .value
                  )
                }
                className="flex-1 border border-line rounded-lg bg-white px-3 py-2.5 text-sm"
              >
                <option value="">
                  {t('staffPortal.tablesSection.selectTablePlaceholder')}
                </option>

                {availableTables.map(
                  (table) => (
                    <option
                      key={
                        table.id
                      }
                      value={
                        table.id
                      }
                    >
                      {table.label}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                disabled={
                  !selectedTableId ||
                  assigningTableId !==
                    null
                }
                onClick={() =>
                  void assignMyself(
                    selectedTableId
                  )
                }
                className="bg-[#1A134D] text-[#F5F6FA] rounded-lg px-4 py-2.5 text-sm disabled:opacity-40"
              >
                {assigningTableId ===
                selectedTableId
                  ? t('staffPortal.tablesSection.assigning')
                  : t('staffPortal.tablesSection.assignTable')}
              </button>
            </div>
          </div>

          {assignedTables.length ===
          0 ? (
            <div className="border border-line rounded-xl px-6 py-10 text-center">
              <h3 className="font-display text-2xl">
                {t('staffPortal.tablesSection.emptyTitle')}
              </h3>

              <p className="text-sm text-ink/50 mt-2">
                {t('staffPortal.tablesSection.emptyBody')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignedTables.map(
                (table) => {
                  const status =
                    tableStatuses.find(
                      (item) =>
                        item.table
                          .id ===
                        table.id
                    );

                  const tableOrders =
                    priorityOrders.filter(
                      (order) =>
                        order.table
                          ?.id ===
                        table.id
                    );

                  return (
                    <article
                      key={
                        table.id
                      }
                      className="border border-line rounded-xl p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display text-3xl">
                          {table.label}
                        </h3>

                        <span
                          className={`border px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.08em] ${tableStatusClass(
                            status
                              ?.status ??
                              'FREE'
                          )}`}
                        >
                          {status
                            ?.statusLabel ??
                            status?.status ??
                            t('staffPortal.tablesSection.freeStatus')}
                        </span>
                      </div>

                      {status &&
                        status.totalCents >
                          0 && (
                          <p className="mt-3 text-sm text-ink/50">
                            {t('staffPortal.tablesSection.tableTotal')}{' '}
                            <strong className="text-ink/80">
                              {money(
                                status.totalCents,
                                currency
                              )}
                            </strong>
                          </p>
                        )}

                      {tableOrders.length >
                        0 && (
                        <div className="mt-4 space-y-2">
                          {tableOrders.map(
                            (
                              order
                            ) => (
                              <div
                                key={
                                  order.id
                                }
                                className="border border-line rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm font-medium">
                                    {t('staffPortal.common.orderNumber', {
                                      number: order.orderNumber,
                                    })}
                                  </span>

                                  <span
                                    className={`border px-2 py-1 rounded-full text-[9px] uppercase tracking-[0.08em] ${statusClass(
                                      order.status
                                    )}`}
                                  >
                                    {statusLabel(
                                      order.status,
                                      t
                                    )}
                                  </span>
                                </div>

                                <p className="text-xs text-ink/40 mt-1">
                                  {elapsed(
                                    order.createdAt,
                                    t
                                  )}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={
                          assigningTableId ===
                          table.id
                        }
                        onClick={() => {
                          const assignment =
                            assignments.find(
                              (
                                item
                              ) =>
                                item.tableId ===
                                table.id &&
                                item.endedAt ===
                                  null
                            );

                          if (
                            assignment
                          ) {
                            void leaveTable(
                              assignment.id
                            );
                          }
                        }}
                        className="mt-4 text-[10px] uppercase tracking-[0.1em] text-red-700 disabled:opacity-40"
                      >
                        {t('staffPortal.tablesSection.leaveTable')}
                      </button>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
        )}

        {navSection === 'payments' && relevantPayments.length ===
          0 && (
          <div className="border border-[#1A134D]/10 rounded-xl px-6 py-12 text-center text-sm text-[#1A134D]/50">
            {t('staffPortal.floor.noBills')}
          </div>
        )}

        {navSection === 'payments' && relevantPayments.length >
          0 && (
          <section className="mb-8">
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#9a6b22]">
                {t('staffPortal.paymentsSection.eyebrow')}
              </p>

              <h2 className="font-display text-3xl mt-1">
                {t('staffPortal.paymentsSection.title')}
              </h2>
            </div>

            <div className="space-y-4">
              {relevantPayments.map(
                (request) => (
                  <article
                    key={
                      request.id
                    }
                    className="border border-[#9a6b22]/25 bg-[#9a6b22]/[0.045] rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#9a6b22]">
                          {t('staffPortal.paymentsSection.paymentRequested')}
                        </p>

                        <h3 className="font-display text-4xl mt-1">
                          {request.table
                            ?.label ??
                            t('staffPortal.common.tableFallback')}
                        </h3>

                        <p className="text-xs text-ink/45 mt-2">
                          {t('staffPortal.paymentsSection.requestedAgo', {
                            elapsed: elapsed(
                              request.createdAt,
                              t
                            ),
                          })}
                        </p>
                      </div>

                      <p className="font-display text-2xl">
                        {money(
                          request.amountCents,
                          request.currency ||
                            currency
                        )}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-[#1A134D]/10 pt-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-ink/35">
                        {t('staffPortal.paymentsSection.customerSelected')}
                      </p>

                      <p className="font-display text-xl mt-1">
                        {collectionMethodLabel(
                          request.collectionMethod,
                          t
                        )}
                      </p>

                      {request.collectionMethod === 'CASH' &&
                        !request.isSplit && (
                          <div className="mt-3 rounded-lg bg-black/[0.03] px-3 py-2">
                            {request.cashTenderedCents != null && (
                              <>
                                <p className="text-[10px] uppercase tracking-[0.1em] text-ink/40">
                                  {t('staffMisc.tables.tendered')}
                                </p>
                                <p className="text-sm font-medium">
                                  {money(
                                    request.cashTenderedCents,
                                    request.currency || currency
                                  )}
                                </p>
                              </>
                            )}

                            <p className="text-[10px] uppercase tracking-[0.1em] text-ink/40 mt-2">
                              {t('staffMisc.tables.changeCalculator')}
                            </p>

                            {(() => {
                              const key = request.id;
                              const inputValue =
                                cashReceivedInputs[key] ??
                                (request.cashTenderedCents != null
                                  ? String(request.cashTenderedCents / 100)
                                  : '');
                              const receivedCents =
                                parseCentsInput(inputValue);

                              return (
                                <>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="text-sm text-ink/50">
                                      {t('staffMisc.tables.cashReceivedLabel')}
                                    </span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={inputValue}
                                      onChange={(e) =>
                                        setCashReceivedInputs((prev) => ({
                                          ...prev,
                                          [key]: e.target.value,
                                        }))
                                      }
                                      placeholder={money(
                                        request.amountCents,
                                        request.currency || currency
                                      )}
                                      className="w-24 rounded-lg border border-ink/15 bg-white px-2 py-1 text-sm text-right"
                                    />
                                  </div>

                                  {receivedCents != null && (
                                    <p
                                      className={`font-display text-lg mt-1 ${
                                        receivedCents < request.amountCents
                                          ? 'text-red-600'
                                          : ''
                                      }`}
                                    >
                                      {receivedCents < request.amountCents
                                        ? `${t('staffMisc.tables.notEnoughCash')}: ${money(
                                            request.amountCents - receivedCents,
                                            request.currency || currency
                                          )}`
                                        : `${t('staffMisc.tables.changeDue')}: ${money(
                                            receivedCents - request.amountCents,
                                            request.currency || currency
                                          )}`}
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}

                      {request.collectionMethod === 'CASH' &&
                        request.isSplit &&
                        request.splits &&
                        request.splits.length > 0 && (
                          <div className="mt-3 rounded-lg bg-black/[0.03] px-3 py-2 space-y-3">
                            <p className="text-[10px] uppercase tracking-[0.1em] text-ink/40">
                              {t('staffMisc.tables.splitBill')} ·{' '}
                              {t('staffMisc.tables.perPersonChange')}
                            </p>
                            {request.splits.map((split) => {
                              const key = `${request.id}:${split.id}`;
                              const inputValue =
                                cashReceivedInputs[key] ??
                                (split.tenderedCents != null
                                  ? String(split.tenderedCents / 100)
                                  : '');
                              const receivedCents =
                                parseCentsInput(inputValue);

                              return (
                                <div
                                  key={split.id}
                                  className="flex items-center justify-between gap-2 text-sm"
                                >
                                  <span>
                                    {split.label ?? `#${split.personIndex + 1}`} ·{' '}
                                    {t('staffMisc.tables.owes')}{' '}
                                    {money(
                                      split.shareCents,
                                      request.currency || currency
                                    )}
                                  </span>

                                  <span className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={inputValue}
                                      onChange={(e) =>
                                        setCashReceivedInputs((prev) => ({
                                          ...prev,
                                          [key]: e.target.value,
                                        }))
                                      }
                                      placeholder={money(
                                        split.shareCents,
                                        request.currency || currency
                                      )}
                                      className="w-20 rounded-lg border border-ink/15 bg-white px-2 py-1 text-sm text-right"
                                    />
                                    <span
                                      className={`font-medium ${
                                        receivedCents != null &&
                                        receivedCents < split.shareCents
                                          ? 'text-red-600'
                                          : ''
                                      }`}
                                    >
                                      {receivedCents == null
                                        ? t('staffMisc.tables.noChangeInfo')
                                        : receivedCents < split.shareCents
                                        ? money(
                                            split.shareCents - receivedCents,
                                            request.currency || currency
                                          )
                                        : money(
                                            receivedCents - split.shareCents,
                                            request.currency || currency
                                          )}
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>

                    <button
                      type="button"
                      disabled={
                        confirmingPaymentId ===
                          request.id ||
                        !request.collectionMethod
                      }
                      onClick={() =>
                        void confirmPayment(
                          request
                        )
                      }
                      className="mt-5 w-full bg-[#1A134D] text-[#F5F6FA] rounded-lg px-4 py-3 text-xs uppercase tracking-[0.08em] disabled:opacity-40"
                    >
                      {confirmingPaymentId ===
                      request.id
                        ? t('staffPortal.paymentsSection.confirming')
                        : t('staffPortal.paymentsSection.confirmPaymentReceived')}
                    </button>
                  </article>
                )
              )}
            </div>
          </section>
        )}

        {navSection === 'orders' && (
        <section className="mb-8">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#1A134D]/40">
              {t('staffPortal.prioritySection.eyebrow')}
            </p>

            <h2 className="font-display text-3xl mt-1">
              {t('staffPortal.prioritySection.title')}
            </h2>

            <p className="text-sm text-ink/50 mt-1">
              {t('staffPortal.prioritySection.description')}
            </p>
          </div>

          {priorityOrders.length ===
          0 ? (
            <div className="border border-line rounded-xl px-6 py-10 text-center">
              <p className="text-sm text-ink/50">
                {t('staffPortal.prioritySection.emptyBody')}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {priorityOrders.map(
                (order) => (
                  <div
                    key={
                      order.id
                    }
                    className="border border-line rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
                          {t('staffPortal.common.tableFallback')}
                        </p>

                        <p className="font-display text-2xl">
                          {order.table
                            ?.label ??
                            t('staffPortal.common.tableFallback')}
                        </p>
                      </div>

                      <span
                        className={`border px-2 py-1 rounded-full text-[9px] uppercase tracking-[0.08em] ${statusClass(
                          order.status
                        )}`}
                      >
                        {statusLabel(
                          order.status,
                          t
                        )}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-ink/45">
                      <span>
                        {t('staffPortal.common.orderNumber', {
                          number: order.orderNumber,
                        })}
                      </span>

                      <span>
                        {elapsed(
                          order.createdAt,
                          t
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
        )}

        <footer className="border-t border-line pt-6 pb-10">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/35">
            {t('staffPortal.footer.eyebrow')}
          </p>

          <p className="text-sm text-ink/45 mt-2">
            {t('staffPortal.footer.body')}
          </p>
        </footer>
      </div>
      </div>
    </main>
  );
}