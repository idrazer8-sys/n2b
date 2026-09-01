'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';

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
};

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">
            {t('staffMisc.tables.liveStatusEyebrow')}
          </p>
          <h2 className="font-display text-3xl mt-1">
            {t('staffMisc.tables.floorOverview')}
          </h2>
        </div>

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

        {statuses.length === 0 && (
          <div className="border border-line rounded-xl px-6 py-12 text-center text-sm text-ink/50">
            {t('staffMisc.tables.noTablesAssigned')}
          </div>
        )}
      </section>
    </main>
  );
}