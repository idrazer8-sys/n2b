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

type PaymentRequest = {
  id: string;
  customerSessionId: string;
  paymentMethod: string;
  collectionMethod:
    | 'CASH'
    | 'CARD'
    | 'OTHER'
    | null;
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

  const [
    soundEnabled,
    setSoundEnabled,
  ] = useState(false);

  const [
    readyNotice,
    setReadyNotice,
  ] =
    useState<StaffOrder | null>(
      null
    );

  const { t } = useI18n();

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
        try {
          if (!silent) {
            setError(null);
          }

          if (silent) {
            setRefreshing(true);
          }

          const [
            restaurantsRes,
            meRes,
            ordersRes,
            assignmentsRes,
            paymentRequestsRes,
            tablesRes,
            tableStatusRes,
          ] =
            await Promise.all([
              fetch(
                '/api/restaurants',
                {
                  credentials:
                    'include',
                  cache:
                    'no-store',
                }
              ),

              fetch(
                `/api/restaurants/${restaurantId}/me`,
                {
                  credentials:
                    'include',
                  cache:
                    'no-store',
                }
              ),

              fetch(
                `/api/restaurants/${restaurantId}/orders`,
                {
                  credentials:
                    'include',
                  cache:
                    'no-store',
                }
              ),

              fetch(
                `/api/restaurants/${restaurantId}/table-assignments`,
                {
                  credentials:
                    'include',
                  cache:
                    'no-store',
                }
              ),

              fetch(
                `/api/restaurants/${restaurantId}/payment-requests`,
                {
                  credentials:
                    'include',
                  cache:
                    'no-store',
                }
              ),

              fetch(
                `/api/restaurants/${restaurantId}/tables`,
                {
                  credentials:
                    'include',
                  cache:
                    'no-store',
                }
              ),

              fetch(
                `/api/restaurants/${restaurantId}/table-status?mine=1`,
                {
                  credentials:
                    'include',
                  cache:
                    'no-store',
                }
              ),
            ]);

          if (
            restaurantsRes.status ===
              401 ||
            meRes.status === 401
          ) {
            router.push(
              '/'
            );
            return;
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
        } catch (err) {
          if (!silent) {
            setError(
              err instanceof Error
                ? err.message
                : t('staffPortal.errors.loadDashboard')
            );
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

        if (
          payload.type ===
            'ORDER_READY' ||
          payload.type ===
            'ORDER_CLAIMED' ||
          payload.type ===
            'ORDER_STATUS_CHANGED' ||
          payload.type ===
            'ORDER_PAID'
        ) {
          await loadData(true);
        }

        if (
          payload.type ===
          'ORDER_READY'
        ) {
          const response =
            await fetch(
              `/api/restaurants/${restaurantId}/orders`,
              {
                credentials:
                  'include',
                cache:
                  'no-store',
              }
            );

          if (!response.ok) {
            return;
          }

          const nextOrders =
            normalizeOrders(
              await response.json(),
              t
            );

          const readyOrder =
            nextOrders.find(
              (order) =>
                order.id ===
                payload.orderId
            );

          if (
            readyOrder &&
            readyOrder.status ===
              'READY'
          ) {
            setReadyNotice(
              readyOrder
            );

            chime();

            window.setTimeout(
              () => {
                setReadyNotice(
                  (current) =>
                    current?.id ===
                    readyOrder.id
                      ? null
                      : current
                );
              },
              8000
            );
          }
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
      me?.staffId
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

      setReadyNotice(
        (current) =>
          current?.id ===
          order.id
            ? null
            : current
      );
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
              order.status ===
                'READY' &&
              order.staffId ===
                myStaffId
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
      [orders, myStaffId]
    );

  const unclaimedReadyOrders =
    useMemo(
      () =>
        orders
          .filter(
            (order) =>
              order.status ===
                'READY' &&
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
        orders.filter(
          (order) =>
            order.status ===
              'READY' &&
            order.staffId !==
              null &&
            order.staffId !==
              myStaffId
        ),
      [orders, myStaffId]
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

  return (
    <main className="theme-n2b min-h-screen bg-[#F5F6FA] text-[#1A134D]">
      {readyNotice && (
        <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md">
          <div className="bg-[#477052] text-[#F5F6FA] p-5 shadow-xl rounded-xl">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
              {t('staffPortal.readyNotice.eyebrow')}
            </p>

            <h2 className="font-display text-3xl mt-1">
              {readyNotice.table?.label ??
                t('staffPortal.common.tableFallback')}
            </h2>

            <p className="text-sm mt-1 text-white/85">
              {t('staffPortal.readyNotice.orderReady', {
                number: readyNotice.orderNumber,
              })}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  void claimOrder(
                    readyNotice
                  )
                }
                disabled={
                  readyNotice.staffId !==
                    null &&
                  readyNotice.staffId !==
                    myStaffId
                }
                className="flex-1 bg-white text-[#1A134D] rounded-lg px-4 py-3 text-xs uppercase tracking-[0.08em] disabled:opacity-40"
              >
                {readyNotice.staffId ===
                myStaffId
                  ? t('staffPortal.readyNotice.mine')
                  : t('staffPortal.actions.takeOrder')}
              </button>

              <button
                type="button"
                onClick={() =>
                  setReadyNotice(
                    null
                  )
                }
                className="border border-white/20 rounded-lg px-4 py-3 text-xs"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-[#1A134D]/10 bg-[#F5F6FA]/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <N2BLogo
                markSize={24}
                wordmarkClassName="text-sm leading-none text-[#1A134D]"
                className="mb-2"
              />

              <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A134D]/40">
                {restaurant?.name}
              </p>

              <h1 className="font-display text-3xl mt-1">
                {me?.user.name ??
                  t('staffPortal.header.waiterFallback')}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />

              <button
                type="button"
                onClick={async () => {
                  await fetch(
                    '/api/auth/logout',
                    {
                      method: 'POST',
                      credentials:
                        'include',
                    }
                  );

                  router.push(
                    '/login'
                  );
                }}
                className="border border-[#1A134D]/15 px-3 py-2 text-[10px] uppercase tracking-[0.1em]"
              >
                {t('common.signOut')}
              </button>
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
              <button
                type="button"
                onClick={() =>
                  void enableSound()
                }
                className="border border-[#1A134D]/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em]"
              >
                {soundEnabled
                  ? t('staffPortal.header.soundOn')
                  : t('staffPortal.header.enableSound')}
              </button>

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

      <div className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 rounded-lg">
            {error}
          </div>
        )}

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
                    myStaffId;

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

                        <span className="inline-flex border border-[#477052]/20 bg-[#477052]/10 text-[#406449] px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.1em]">
                          {t('staffPortal.status.ready')}
                        </span>
                      </div>

                      <div className="mt-5 border-t border-[#1A134D]/10 pt-4 space-y-3">
                        {order.items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className="flex gap-3"
                            >
                              <span className="text-sm text-[#1A134D]/50 w-10">
                                {item.quantity}
                                ×
                              </span>

                              <div className="flex-1">
                                <p className="font-display text-lg">
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

                        {mine && (
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

        {myActiveOrders.length >
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

        {relevantPayments.length >
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

        <footer className="border-t border-line pt-6 pb-10">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/35">
            {t('staffPortal.footer.eyebrow')}
          </p>

          <p className="text-sm text-ink/45 mt-2">
            {t('staffPortal.footer.body')}
          </p>
        </footer>
      </div>
    </main>
  );
}