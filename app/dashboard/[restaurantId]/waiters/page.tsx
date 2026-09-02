'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useParams } from 'next/navigation';

import { useI18n } from '@/src/lib/i18n/I18nProvider';

type StaffPortal =
  | 'WAITER'
  | 'KITCHEN';

type Table = {
  id: string;
  label: string;
  isActive: boolean;
};

type StaffMember = {
  id: string;
  role: string;
  staffPortal: StaffPortal;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type Assignment = {
  id: string;
  tableId: string;
  staffId: string;
  role: 'PRIMARY' | 'ASSISTING';
  assignedAt: string;
  endedAt: string | null;
  table: Table;
  staff: StaffMember;
};

export default function WaitersPage() {
  const params =
    useParams<{
      restaurantId: string;
    }>();

  const restaurantId =
    params.restaurantId;

  const { t } = useI18n();

  const [
    staff,
    setStaff,
  ] = useState<StaffMember[]>([]);

  const [
    tables,
    setTables,
  ] = useState<Table[]>([]);

  const [
    assignments,
    setAssignments,
  ] = useState<Assignment[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState<string | null>(null);

  const [
    deletingStaff,
    setDeletingStaff,
  ] = useState<string | null>(null);

  const [
    permanentDeleteStaff,
    setPermanentDeleteStaff,
  ] = useState<string | null>(null);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    selectedStaffId,
    setSelectedStaffId,
  ] = useState<string | null>(null);

  const [
    selectedTableId,
    setSelectedTableId,
  ] = useState('');

  const [
    newName,
    setNewName,
  ] = useState('');

  const [
    newEmail,
    setNewEmail,
  ] = useState('');

  const [
    newPassword,
    setNewPassword,
  ] = useState('');

  const [
    newStaffPortal,
    setNewStaffPortal,
  ] = useState<StaffPortal>('WAITER');

  const [
    creatingStaff,
    setCreatingStaff,
  ] = useState(false);

  const load =
    useCallback(
      async () => {
        try {
          setError(null);

          const [
            staffRes,
            tablesRes,
            assignmentsRes,
          ] =
            await Promise.all([
              fetch(
                `/api/restaurants/${restaurantId}/staff`,
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
                `/api/restaurants/${restaurantId}/table-assignments`,
                {
                  credentials:
                    'include',
                  cache:
                    'no-store',
                }
              ),
            ]);

          const staffJson =
            await staffRes
              .json()
              .catch(() => null);

          const tablesJson =
            await tablesRes
              .json()
              .catch(() => null);

          const assignmentsJson =
            await assignmentsRes
              .json()
              .catch(() => null);

          if (!staffRes.ok) {
            throw new Error(
              staffJson?.error ??
                t('ordersWaiters.staff.couldNotLoadStaff')
            );
          }

          if (!tablesRes.ok) {
            throw new Error(
              tablesJson?.error ??
                t('ordersWaiters.staff.couldNotLoadTables')
            );
          }

          if (!assignmentsRes.ok) {
            throw new Error(
              assignmentsJson?.error ??
                t('ordersWaiters.staff.couldNotLoadAssignments')
            );
          }

          setStaff(
            Array.isArray(
              staffJson
            )
              ? staffJson.map(
                  (
                    member: StaffMember
                  ) => ({
                    ...member,
                    staffPortal:
                      member.staffPortal ??
                      'WAITER',
                    isActive:
                      member.isActive ??
                      true,
                    deletedAt:
                      member.deletedAt ??
                      null,
                  })
                )
              : []
          );

          setTables(
            Array.isArray(
              tablesJson
            )
              ? tablesJson.filter(
                  (
                    table: Table
                  ) =>
                    table.isActive
                )
              : []
          );

          setAssignments(
            Array.isArray(
              assignmentsJson
            )
              ? assignmentsJson
              : []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load staff'
          );
        } finally {
          setLoading(false);
        }
      },
      [restaurantId, t]
    );

  useEffect(() => {
    void load();
  }, [load]);

  const activeStaff =
    useMemo(
      () =>
        staff.filter(
          (member) =>
            member.isActive
        ),
      [staff]
    );

  const archivedStaff =
    useMemo(
      () =>
        staff.filter(
          (member) =>
            !member.isActive
        ),
      [staff]
    );

  const waiters =
    useMemo(
      () =>
        activeStaff.filter(
          (member) =>
            member.staffPortal ===
            'WAITER'
        ),
      [activeStaff]
    );

  const kitchenStaff =
    useMemo(
      () =>
        activeStaff.filter(
          (member) =>
            member.staffPortal ===
            'KITCHEN'
        ),
      [activeStaff]
    );

  const assignmentsByStaff =
    useMemo(() => {
      const map =
        new Map<
          string,
          Assignment[]
        >();

      for (
        const assignment of assignments
      ) {
        const list =
          map.get(
            assignment.staffId
          ) ?? [];

        list.push(
          assignment
        );

        map.set(
          assignment.staffId,
          list
        );
      }

      return map;
    }, [assignments]);

  const assignedPrimaryTableIds =
    useMemo(
      () =>
        new Set(
          assignments
            .filter(
              (assignment) =>
                assignment.role ===
                'PRIMARY'
            )
            .map(
              (assignment) =>
                assignment.tableId
            )
        ),
      [assignments]
    );

  const unassignedTables =
    tables.filter(
      (table) =>
        !assignedPrimaryTableIds.has(
          table.id
        )
    );

  async function createStaff(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !newName.trim() ||
      !newEmail.trim() ||
      !newPassword
    ) {
      return;
    }

    try {
      setCreatingStaff(true);
      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/staff`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              name:
                newName.trim(),
              email:
                newEmail
                  .trim()
                  .toLowerCase(),
              password:
                newPassword,
              staffPortal:
                newStaffPortal,
            }),
          }
        );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('ordersWaiters.staff.couldNotCreateStaff')
        );
      }

      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewStaffPortal(
        'WAITER'
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('ordersWaiters.staff.couldNotCreateStaff')
      );
    } finally {
      setCreatingStaff(false);
    }
  }

  async function archiveStaff(
    staffId: string
  ) {
    const confirmed =
      window.confirm(
        t('ordersWaiters.staff.confirmArchive')
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingStaff(
        staffId
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/staff?staffId=${encodeURIComponent(
            staffId
          )}&permanent=false`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('ordersWaiters.staff.couldNotArchive')
        );
      }

      if (
        selectedStaffId ===
        staffId
      ) {
        setSelectedStaffId(
          null
        );
        setSelectedTableId('');
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('ordersWaiters.staff.couldNotArchive')
      );
    } finally {
      setDeletingStaff(
        null
      );
    }
  }

  async function permanentlyDeleteStaff(
    staffId: string
  ) {
    const confirmed =
      window.confirm(
        t('ordersWaiters.staff.confirmPermanentDelete')
      );

    if (!confirmed) {
      return;
    }

    try {
      setPermanentDeleteStaff(
        staffId
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/staff?staffId=${encodeURIComponent(
            staffId
          )}&permanent=true`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('ordersWaiters.staff.couldNotPermanentlyDelete')
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('ordersWaiters.staff.couldNotPermanentlyDelete')
      );
    } finally {
      setPermanentDeleteStaff(
        null
      );
    }
  }

  async function assignTable() {
    if (
      !selectedStaffId ||
      !selectedTableId
    ) {
      return;
    }

    const selectedMember =
      waiters.find(
        (member) =>
          member.id ===
          selectedStaffId
      );

    if (!selectedMember) {
      setError(
        t('ordersWaiters.staff.onlyWaitersAssignable')
      );
      return;
    }

    try {
      setSaving(
        selectedStaffId
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/table-assignments`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              staffId:
                selectedStaffId,
              tableId:
                selectedTableId,
              role: 'PRIMARY',
            }),
          }
        );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('ordersWaiters.staff.couldNotAssignTable')
        );
      }

      setSelectedStaffId(null);
      setSelectedTableId('');

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('ordersWaiters.staff.couldNotAssignTable')
      );
    } finally {
      setSaving(null);
    }
  }

  async function assignManagerSelf(
    tableId: string
  ) {
    try {
      setSaving(
        `self:${tableId}`
      );

      setError(null);

      const response =
        await fetch(
          `/api/restaurants/${restaurantId}/table-assignments`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              staffId: 'SELF',
              tableId,
              role: 'PRIMARY',
            }),
          }
        );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('ordersWaiters.staff.couldNotAssignSelf')
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('ordersWaiters.staff.couldNotAssignSelf')
      );
    } finally {
      setSaving(null);
    }
  }

  async function removeAssignment(
    assignmentId: string
  ) {
    try {
      setSaving(
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
            credentials: 'include',
          }
        );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('ordersWaiters.staff.couldNotRemoveAssignment')
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('ordersWaiters.staff.couldNotRemoveAssignment')
      );
    } finally {
      setSaving(null);
    }
  }

  function renderDeleteButton(
    member: StaffMember
  ) {
    return (
      <button
        type="button"
        disabled={
          deletingStaff ===
          member.id
        }
        onClick={() =>
          void archiveStaff(
            member.id
          )
        }
        className="w-full mt-3 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm hover:bg-red-50 disabled:opacity-50"
      >
        {deletingStaff ===
        member.id
          ? t('ordersWaiters.staff.archiving')
          : t('ordersWaiters.staff.deleteAccount')}
      </button>
    );
  }

  if (loading) {
    return (
      <div className="text-sm text-ink/50">
        {t('ordersWaiters.staff.loadingStaff')}
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
            {t('ordersWaiters.staff.eyebrow')}
          </p>

          <h1 className="font-display text-3xl mt-1">
            {t('ordersWaiters.staff.pageTitle')}
          </h1>

          <p className="text-sm text-ink/50 mt-2">
            {t('ordersWaiters.staff.pageDescription')}
          </p>
        </div>

        <div className="text-xs uppercase tracking-[0.12em] text-ink/40">
          {t('ordersWaiters.staff.statsLine', {
            waiters: waiters.length,
            kitchen: kitchenStaff.length,
            assigned: assignments.filter(
              (assignment) =>
                assignment.role ===
                'PRIMARY'
            ).length,
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="border border-line rounded-xl p-5 mb-8">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40 mb-2">
          {t('ordersWaiters.staff.addStaffEyebrow')}
        </p>

        <p className="text-sm text-ink/50 mb-4">
          {t('ordersWaiters.staff.addStaffDescription')}
        </p>

        <form
          onSubmit={createStaff}
          className="grid gap-3 md:grid-cols-4"
        >
          <select
            value={newStaffPortal}
            onChange={(event) =>
              setNewStaffPortal(
                event.target.value as StaffPortal
              )
            }
            className="border border-line rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="WAITER">
              {t('ordersWaiters.staff.roleWaiter')}
            </option>

            <option value="KITCHEN">
              {t('ordersWaiters.staff.roleKitchen')}
            </option>
          </select>

          <input
            required
            value={newName}
            onChange={(event) =>
              setNewName(
                event.target.value
              )
            }
            placeholder={t('ordersWaiters.staff.fullNamePlaceholder')}
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />

          <input
            required
            type="email"
            value={newEmail}
            onChange={(event) =>
              setNewEmail(
                event.target.value
              )
            }
            placeholder={t('common.email')}
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />

          <input
            required
            minLength={10}
            type="password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(
                event.target.value
              )
            }
            placeholder={t('ordersWaiters.staff.passwordPlaceholder')}
            className="border border-line rounded-lg px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={creatingStaff}
            className="md:col-span-4 bg-ink text-paper rounded-lg px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {creatingStaff
              ? t('ordersWaiters.staff.creatingAccount')
              : t('ordersWaiters.staff.createAccountButton', {
                  role:
                    newStaffPortal === 'WAITER'
                      ? t('ordersWaiters.staff.roleWaiter')
                      : t('ordersWaiters.staff.roleKitchen'),
                })}
          </button>
        </form>
      </section>

      <section className="border border-line rounded-xl p-5 mb-8">
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40 mb-2">
          {t('ordersWaiters.staff.selfAssignEyebrow')}
        </p>

        <p className="text-sm text-ink/50 mb-4">
          {t('ordersWaiters.staff.selfAssignDescription')}
        </p>

        {unassignedTables.length ===
        0 ? (
          <p className="text-sm text-ink/50">
            {t('ordersWaiters.staff.allTablesAssigned')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unassignedTables.map(
              (table) => (
                <button
                  key={table.id}
                  type="button"
                  disabled={
                    saving ===
                    `self:${table.id}`
                  }
                  onClick={() =>
                    void assignManagerSelf(
                      table.id
                    )
                  }
                  className="border border-line rounded-lg px-3 py-2 text-sm hover:bg-black/[0.025] disabled:opacity-50"
                >
                  {saving ===
                  `self:${table.id}`
                    ? t('ordersWaiters.staff.assigningEllipsis')
                    : t('ordersWaiters.staff.assignMyself', {
                        label: table.label,
                      })}
                </button>
              )
            )}
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">
            {t('ordersWaiters.staff.serviceStaffEyebrow')}
          </p>

          <h2 className="font-display text-2xl mt-1">
            {t('ordersWaiters.staff.waitersHeading')}
          </h2>

          <p className="text-sm text-ink/50 mt-2">
            {t('ordersWaiters.staff.waitersDescription')}
          </p>
        </div>

        {waiters.length === 0 ? (
          <div className="border border-line rounded-xl px-6 py-10 text-center">
            <h3 className="font-display text-2xl">
              {t('ordersWaiters.staff.noActiveWaiters')}
            </h3>

            <p className="text-sm text-ink/50 mt-2">
              {t('ordersWaiters.staff.createWaiterAbove')}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {waiters.map(
              (member) => {
                const memberAssignments =
                  assignmentsByStaff.get(
                    member.id
                  ) ?? [];

                return (
                  <article
                    key={member.id}
                    className="border border-line rounded-xl overflow-hidden"
                  >
                    <div className="bg-black/[0.02] border-b border-line p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex items-center border border-line rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-ink/50">
                            {t('ordersWaiters.staff.roleWaiter')}
                          </div>

                          <h3 className="font-display text-2xl mt-2">
                            {
                              member.user
                                .name
                            }
                          </h3>
                        </div>

                        <span className="h-2 w-2 rounded-full bg-[#477052] mt-2" />
                      </div>

                      <p className="text-xs text-ink/45 mt-3">
                        {
                          member.user
                            .email
                        }
                      </p>
                    </div>

                    <div className="p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                        {t('ordersWaiters.staff.assignedTablesLabel')}
                      </p>

                      {memberAssignments.length ===
                      0 ? (
                        <p className="text-sm text-ink/50 mt-3">
                          {t('ordersWaiters.staff.noTablesAssigned')}
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {memberAssignments.map(
                            (
                              assignment
                            ) => (
                              <div
                                key={
                                  assignment.id
                                }
                                className="flex items-center gap-2 border border-line rounded-lg px-3 py-2"
                              >
                                <span className="text-sm">
                                  {
                                    assignment
                                      .table
                                      .label
                                  }
                                </span>

                                <span className="text-[9px] uppercase tracking-[0.08em] text-ink/35">
                                  {assignment.role ===
                                  'PRIMARY'
                                    ? t('ordersWaiters.staff.rolePrimary')
                                    : t('ordersWaiters.staff.roleAssisting')}
                                </span>

                                <button
                                  type="button"
                                  disabled={
                                    saving ===
                                    assignment.id
                                  }
                                  onClick={() =>
                                    void removeAssignment(
                                      assignment.id
                                    )
                                  }
                                  className="text-[10px] text-red-700"
                                >
                                  {t('common.remove')}
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="mt-5 pt-4 border-t border-line">
                        {selectedStaffId ===
                        member.id ? (
                          <div className="space-y-2">
                            <select
                              value={
                                selectedTableId
                              }
                              onChange={(
                                event
                              ) =>
                                setSelectedTableId(
                                  event.target.value
                                )
                              }
                              className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-white"
                            >
                              <option value="">
                                {t('ordersWaiters.staff.selectTablePlaceholder')}
                              </option>

                              {unassignedTables.map(
                                (
                                  table
                                ) => (
                                  <option
                                    key={
                                      table.id
                                    }
                                    value={
                                      table.id
                                    }
                                  >
                                    {
                                      table.label
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={
                                  !selectedTableId ||
                                  saving ===
                                    member.id
                                }
                                onClick={() =>
                                  void assignTable()
                                }
                                className="flex-1 bg-ink text-paper rounded-lg px-3 py-2 text-sm disabled:opacity-40"
                              >
                                {saving ===
                                member.id
                                  ? t('ordersWaiters.staff.assigningEllipsis')
                                  : t('ordersWaiters.staff.assignTableButton')}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStaffId(
                                    null
                                  );
                                  setSelectedTableId(
                                    ''
                                  );
                                }}
                                className="border border-line rounded-lg px-3 py-2 text-sm"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStaffId(
                                  member.id
                                );
                                setSelectedTableId(
                                  ''
                                );
                              }}
                              className="w-full bg-ink text-paper rounded-lg px-4 py-2.5 text-sm"
                            >
                              {t('ordersWaiters.staff.assignTableButton')}
                            </button>

                            {renderDeleteButton(
                              member
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">
            {t('ordersWaiters.staff.operationsEyebrow')}
          </p>

          <h2 className="font-display text-2xl mt-1">
            {t('ordersWaiters.staff.kitchenStaffHeading')}
          </h2>

          <p className="text-sm text-ink/50 mt-2">
            {t('ordersWaiters.staff.kitchenStaffDescription')}
          </p>
        </div>

        {kitchenStaff.length === 0 ? (
          <div className="border border-line rounded-xl px-6 py-10 text-center">
            <h3 className="font-display text-2xl">
              {t('ordersWaiters.staff.noActiveKitchen')}
            </h3>

            <p className="text-sm text-ink/50 mt-2">
              {t('ordersWaiters.staff.createKitchenAbove')}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {kitchenStaff.map(
              (member) => (
                <article
                  key={member.id}
                  className="border border-line rounded-xl overflow-hidden"
                >
                  <div className="bg-black/[0.02] border-b border-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center border border-line rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-ink/50">
                          {t('ordersWaiters.staff.roleKitchen')}
                        </div>

                        <h3 className="font-display text-2xl mt-2">
                          {
                            member.user
                              .name
                          }
                        </h3>
                      </div>

                      <span className="h-2 w-2 rounded-full bg-[#477052] mt-2" />
                    </div>

                    <p className="text-xs text-ink/45 mt-3">
                      {
                        member.user
                          .email
                      }
                    </p>
                  </div>

                  <div className="p-4">
                    <div className="border border-line rounded-lg px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                        {t('ordersWaiters.staff.portalLabel')}
                      </p>

                      <p className="text-sm mt-1">
                        {t('ordersWaiters.staff.roleKitchen')}
                      </p>
                    </div>

                    {renderDeleteButton(
                      member
                    )}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="border-t border-line pt-8">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40">
            {t('ordersWaiters.staff.historyEyebrow')}
          </p>

          <h2 className="font-display text-2xl mt-1">
            {t('ordersWaiters.staff.archivedStaffHeading')}
          </h2>

          <p className="text-sm text-ink/50 mt-2">
            {t('ordersWaiters.staff.archivedStaffDescription')}
          </p>
        </div>

        {archivedStaff.length === 0 ? (
          <div className="border border-line rounded-xl mt-5 px-6 py-10 text-center">
            <p className="text-sm text-ink/50">
              {t('ordersWaiters.staff.noArchivedStaff')}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-5">
            {archivedStaff.map(
              (member) => (
                <article
                  key={member.id}
                  className="border border-line rounded-xl overflow-hidden opacity-80"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center border border-line rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-ink/50">
                          {t('ordersWaiters.staff.archivedBadge')}
                        </div>

                        <h3 className="font-display text-2xl mt-3">
                          {
                            member.user
                              .name
                          }
                        </h3>

                        <p className="text-xs text-ink/45 mt-1">
                          {
                            member.user
                              .email
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-xs text-ink/50">
                      <p>
                        {t('ordersWaiters.staff.portalInlineLabel')}{' '}
                        <strong className="text-ink/70">
                          {member.staffPortal === 'WAITER'
                            ? t('ordersWaiters.staff.roleWaiter')
                            : t('ordersWaiters.staff.roleKitchen')}
                        </strong>
                      </p>

                      <p>
                        {t('ordersWaiters.staff.archivedDateLabel')}{' '}
                        {member.deletedAt
                          ? new Date(
                              member.deletedAt
                            ).toLocaleString()
                          : t('ordersWaiters.staff.unknownDate')}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        permanentDeleteStaff ===
                        member.id
                      }
                      onClick={() =>
                        void permanentlyDeleteStaff(
                          member.id
                        )
                      }
                      className="w-full mt-5 bg-red-700 text-white rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
                    >
                      {permanentDeleteStaff ===
                      member.id
                        ? t('ordersWaiters.staff.deletingPermanently')
                        : t('ordersWaiters.staff.deletePermanently')}
                    </button>

                    <p className="text-[10px] text-ink/35 mt-3 text-center">
                      {t('ordersWaiters.staff.permanentDeleteNote')}
                    </p>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <div className="border-t border-line pt-6">
        <h2 className="font-display text-xl">
          {t('ordersWaiters.staff.operationsFooterHeading')}
        </h2>

        <div className="mt-3 space-y-2 text-sm text-ink/55">
          <p>
            {t('ordersWaiters.staff.opNote1')}
          </p>

          <p>
            {t('ordersWaiters.staff.opNote2')}
          </p>

          <p>
            {t('ordersWaiters.staff.opNote3')}
          </p>

          <p>
            {t('ordersWaiters.staff.opNote4')}
          </p>

          <p>
            {t('ordersWaiters.staff.opNote5')}
          </p>
        </div>
      </div>
    </div>
  );
}