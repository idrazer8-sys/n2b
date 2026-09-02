'use client';

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type Table = {
  id: string;
  label: string;
};

type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

type Reservation = {
  id: string;
  tableId: string;
  startsAt: string;
  partySize: number;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  status: ReservationStatus;
  table: Table;
};

function statusClasses(status: ReservationStatus) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-[#477052]/10 text-[#406449]';
    case 'CANCELLED':
      return 'bg-black/5 text-ink/40';
    case 'COMPLETED':
      return 'bg-[#5B3DFF]/10 text-[#5B3DFF]';
    case 'NO_SHOW':
      return 'bg-[#b0392f]/10 text-[#b0392f]';
  }
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ReservationsPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { restaurantId } = params;
  const { t } = useI18n();

  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[] | null>(
    null
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tableId, setTableId] = useState('');
  const [startsAt, setStartsAt] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 60 * 60000))
  );
  const [partySize, setPartySize] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [bufferMinutes, setBufferMinutes] = useState<number | null>(null);
  const [bufferDraft, setBufferDraft] = useState('15');
  const [savingBuffer, setSavingBuffer] = useState(false);
  const [bufferSaved, setBufferSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tablesRes, reservationsRes, settingsRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}/tables`, {
          credentials: 'include',
        }),
        fetch(`/api/restaurants/${restaurantId}/reservations`, {
          credentials: 'include',
        }),
        fetch(`/api/restaurants/${restaurantId}/settings`, {
          credentials: 'include',
        }),
      ]);

      if (!tablesRes.ok || !reservationsRes.ok || !settingsRes.ok) {
        throw new Error(t('reservations.loadError'));
      }

      const tablesJson = await tablesRes.json();
      const reservationsJson = await reservationsRes.json();
      const settingsJson = await settingsRes.json();

      const tableList: Table[] = Array.isArray(tablesJson)
        ? tablesJson
        : tablesJson.tables ?? [];

      setTables(tableList);
      setReservations(reservationsJson.reservations ?? []);
      setBufferMinutes(settingsJson.reservationBufferMinutes ?? 15);
      setBufferDraft(String(settingsJson.reservationBufferMinutes ?? 15));

      if (!tableId && tableList.length > 0) {
        setTableId(tableList[0].id);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t('reservations.loadError')
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createReservation() {
    if (!tableId) return;

    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/reservations`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId,
            startsAt: new Date(startsAt).toISOString(),
            partySize,
            customerName: customerName.trim() || null,
            customerPhone: customerPhone.trim() || null,
            notes: notes.trim() || null,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error ?? t('reservations.loadError'));
      }

      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      await load();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : t('reservations.loadError')
      );
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: ReservationStatus) {
    await fetch(`/api/restaurants/${restaurantId}/reservations/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function cancelReservation(id: string) {
    if (!confirm(t('reservations.cancelConfirm'))) return;

    await fetch(`/api/restaurants/${restaurantId}/reservations/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await load();
  }

  async function saveBuffer() {
    const value = Math.max(0, Math.min(240, Number(bufferDraft) || 0));
    setSavingBuffer(true);
    setBufferSaved(false);

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/settings`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationBufferMinutes: value }),
      });

      if (res.ok) {
        setBufferMinutes(value);
        setBufferSaved(true);
      }
    } finally {
      setSavingBuffer(false);
    }
  }

  const now = Date.now();
  const upcoming = (reservations ?? [])
    .filter(
      (r) =>
        r.status === 'CONFIRMED' &&
        new Date(r.startsAt).getTime() >= now - 60 * 60000
    )
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );

  const past = (reservations ?? [])
    .filter((r) => !upcoming.includes(r))
    .sort(
      (a, b) =>
        new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
    );

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="font-display text-3xl mt-1">
          {t('reservations.title')}
        </h1>
        <p className="text-sm text-ink/50 mt-2">
          {t('reservations.subtitle')}
        </p>
      </div>

      {loadError && (
        <p className="mb-4 text-sm text-red-600">{loadError}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-line rounded-xl p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-ink/60 mb-4">
              {t('reservations.newReservation')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink/50 mb-1">
                  {t('reservations.table')}
                </label>
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">{t('reservations.selectTable')}</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-ink/50 mb-1">
                  {t('reservations.dateTime')}
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-ink/50 mb-1">
                  {t('reservations.partySize')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={partySize}
                  onChange={(e) =>
                    setPartySize(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-ink/50 mb-1">
                  {t('reservations.customerName')} ({t('reservations.optional')})
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-ink/50 mb-1">
                  {t('reservations.customerPhone')} ({t('reservations.optional')})
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-ink/50 mb-1">
                  {t('reservations.notes')} ({t('reservations.optional')})
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {createError && (
              <p className="mt-3 text-sm text-red-600">{createError}</p>
            )}

            <button
              type="button"
              disabled={!tableId || creating}
              onClick={() => void createReservation()}
              className="mt-4 bg-ink text-white text-sm font-medium rounded-lg px-4 py-2.5 disabled:opacity-50"
            >
              {creating
                ? t('reservations.creating')
                : t('reservations.create')}
            </button>
          </div>

          <div>
            <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-ink/60 mb-3">
              {t('reservations.upcoming')}
            </h2>

            {reservations === null ? null : upcoming.length === 0 ? (
              <p className="text-sm text-ink/40">{t('reservations.empty')}</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="border border-line rounded-lg p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {reservation.table.label} —{' '}
                        {new Date(reservation.startsAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {reservation.partySize} · {reservation.customerName ?? '—'}
                        {reservation.customerPhone
                          ? ` · ${reservation.customerPhone}`
                          : ''}
                      </p>
                      {reservation.notes && (
                        <p className="text-xs text-ink/40 mt-0.5">
                          {reservation.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusClasses(
                          reservation.status
                        )}`}
                      >
                        {t(`reservations.status${reservation.status}`)}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          void updateStatus(reservation.id, 'NO_SHOW')
                        }
                        title={t('reservations.markNoShow')}
                        className="text-xs border border-line rounded-lg px-2 py-1"
                      >
                        {t('reservations.markNoShow')}
                      </button>

                      <button
                        type="button"
                        onClick={() => void cancelReservation(reservation.id)}
                        className="text-xs border border-line rounded-lg px-2 py-1 text-red-600"
                      >
                        {t('reservations.cancel')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-ink/60 mb-3">
              {t('reservations.past')}
            </h2>

            {reservations === null ? null : past.length === 0 ? (
              <p className="text-sm text-ink/40">{t('reservations.empty')}</p>
            ) : (
              <div className="space-y-2">
                {past.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="border border-line rounded-lg p-4 flex items-center justify-between gap-4 opacity-70"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {reservation.table.label} —{' '}
                        {new Date(reservation.startsAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-ink/50 mt-0.5">
                        {reservation.partySize} · {reservation.customerName ?? '—'}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2 py-1 rounded-full shrink-0 ${statusClasses(
                        reservation.status
                      )}`}
                    >
                      {t(`reservations.status${reservation.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border border-line rounded-xl p-5 h-fit">
          <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-ink/60 mb-2">
            {t('reservations.bufferSettingTitle')}
          </h2>
          <p className="text-xs text-ink/50 mb-4">
            {t('reservations.bufferSettingHint')}
          </p>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={240}
              value={bufferDraft}
              onChange={(e) => {
                setBufferDraft(e.target.value);
                setBufferSaved(false);
              }}
              className="w-24 border border-line rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-sm text-ink/50">min</span>
          </div>

          <button
            type="button"
            onClick={() => void saveBuffer()}
            disabled={savingBuffer}
            className="mt-3 bg-ink text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {savingBuffer
              ? '…'
              : bufferSaved
              ? t('reservations.bufferSettingSaved')
              : t('reservations.bufferSettingSave')}
          </button>

          {bufferMinutes !== null && (
            <p className="mt-3 text-xs text-ink/40">
              {t('reservations.bufferSettingSaved')}: {bufferMinutes} min
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
