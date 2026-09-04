'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export type CalendarReservation = {
  id: string;
  startsAt: string;
  partySize: number;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  status: ReservationStatus;
  table: { id: string; label: string };
};

const STATUS_COLOR: Record<ReservationStatus, string> = {
  CONFIRMED: '#3f8f5f',
  COMPLETED: '#5B3DFF',
  NO_SHOW: '#b0392f',
  CANCELLED: '#8a8781',
};

// Local calendar-day key (not UTC): a 21:30 booking must land on the day the
// restaurant experienced it, not the next one because of the timezone.
function dayKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Monday-first, matching the rest of the app (see resolveFinanceRange).
function startOfGrid(monthAnchor: Date) {
  const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const weekday = first.getDay(); // 0=Sun
  const back = weekday === 0 ? 6 : weekday - 1;
  return new Date(first.getFullYear(), first.getMonth(), 1 - back);
}

export default function ReservationCalendar({
  restaurantId,
  // Managers get status controls; waiters just read the book.
  onCancel,
  onMarkNoShow,
}: {
  restaurantId: string;
  onCancel?: (id: string) => void | Promise<void>;
  onMarkNoShow?: (id: string) => void | Promise<void>;
}) {
  // Dates are formatted against the language the user picked in the app,
  // not the browser's — otherwise a Spanish UI shows "September 2026".
  const { t, locale } = useI18n();

  const [monthAnchor, setMonthAnchor] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));
  const [reservations, setReservations] = useState<CalendarReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gridStart = useMemo(() => startOfGrid(monthAnchor), [monthAnchor]);

  const days = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + i);
        return date;
      }),
    [gridStart]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const from = new Date(gridStart);
      const to = new Date(gridStart);
      to.setDate(to.getDate() + 42);

      const res = await fetch(
        `/api/restaurants/${restaurantId}/reservations?from=${encodeURIComponent(
          from.toISOString()
        )}&to=${encodeURIComponent(to.toISOString())}`,
        { credentials: 'include', cache: 'no-store' }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? t('reservations.loadError'));

      setReservations(Array.isArray(json.reservations) ? json.reservations : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('reservations.loadError'));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, gridStart, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarReservation[]>();
    for (const reservation of reservations) {
      const key = dayKey(new Date(reservation.startsAt));
      const list = map.get(key) ?? [];
      list.push(reservation);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
    }
    return map;
  }, [reservations]);

  const selectedList = byDay.get(selectedDay) ?? [];
  const todayKey = dayKey(new Date());

  function shiftMonth(delta: number) {
    setMonthAnchor(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {/* first-letter, not `capitalize`: Spanish renders "septiembre de
            2026", and capitalising every word would give "De". */}
        <h2 className="font-display text-2xl first-letter:uppercase">
          {monthAnchor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label={t('reservations.calendar.prevMonth')}
            className="rounded-lg border border-line px-3 py-1.5 text-sm"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setMonthAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedDay(dayKey(now));
            }}
            className="rounded-lg border border-line px-3 py-1.5 text-xs"
          >
            {t('reservations.calendar.today')}
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label={t('reservations.calendar.nextMonth')}
            className="rounded-lg border border-line px-3 py-1.5 text-sm"
          >
            ›
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-line overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-black/[0.02]">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className="px-1 py-2 text-center text-[10px] uppercase tracking-[0.1em] text-ink/40"
            >
              {t(`analytics.day.${day}`)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((date) => {
            const key = dayKey(date);
            const list = byDay.get(key) ?? [];
            const active = list.filter((r) => r.status === 'CONFIRMED');
            const inMonth = date.getMonth() === monthAnchor.getMonth();
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(key)}
                className={`min-h-[62px] border-b border-r border-line p-1.5 text-left transition ${
                  isSelected ? 'bg-[#5B3DFF]/[0.07]' : 'hover:bg-black/[0.02]'
                } ${inMonth ? '' : 'opacity-35'}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday ? 'bg-ink text-paper font-semibold' : 'text-ink/70'
                  }`}
                >
                  {date.getDate()}
                </span>

                {list.length > 0 && (
                  <span className="mt-1 flex flex-wrap gap-0.5">
                    {list.slice(0, 4).map((reservation) => (
                      <span
                        key={reservation.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: STATUS_COLOR[reservation.status] }}
                      />
                    ))}
                    {active.length > 0 && (
                      <span className="ml-0.5 text-[10px] leading-none text-ink/50">
                        {active.length}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium first-letter:uppercase">
          {new Date(`${selectedDay}T12:00:00`).toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h3>

        {loading && reservations.length === 0 ? (
          <p className="mt-3 text-sm text-ink/40">{t('reservations.calendar.loading')}</p>
        ) : selectedList.length === 0 ? (
          <p className="mt-3 text-sm text-ink/40">
            {t('reservations.calendar.noneOnDay')}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {selectedList.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {new Date(reservation.startsAt).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ·{' '}
                    {t('floorPlan.notifications.tablePrefix', {
                      label: reservation.table.label,
                    })}{' '}
                    ·{' '}
                    {t('reservations.calendar.guests', {
                      count: reservation.partySize,
                    })}
                  </p>
                  <p className="text-xs text-ink/50 mt-0.5 truncate">
                    {reservation.customerName ?? '—'}
                    {reservation.customerPhone ? ` · ${reservation.customerPhone}` : ''}
                  </p>
                  {reservation.notes && (
                    <p className="text-xs text-ink/40 mt-0.5 truncate">
                      {reservation.notes}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className="rounded-full px-2 py-1 text-[11px]"
                    style={{
                      background: `${STATUS_COLOR[reservation.status]}1f`,
                      color: STATUS_COLOR[reservation.status],
                    }}
                  >
                    {t(`reservations.status${reservation.status}`)}
                  </span>

                  {onMarkNoShow && reservation.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onMarkNoShow(reservation.id);
                        await load();
                      }}
                      className="rounded-lg border border-line px-2 py-1 text-xs"
                    >
                      {t('reservations.markNoShow')}
                    </button>
                  )}

                  {onCancel && reservation.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onCancel(reservation.id);
                        await load();
                      }}
                      className="rounded-lg border border-line px-2 py-1 text-xs text-red-600"
                    >
                      {t('reservations.cancel')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
