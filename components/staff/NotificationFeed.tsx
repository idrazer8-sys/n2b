'use client';

import { useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import { BellIcon, CloseIcon, SpeakerIcon, SpeakerMuteIcon } from '@/components/branding/icons';

export type FeedEvent = {
  id: string;
  message: string;
  time: string; // ISO
  // Optional richer presentation used by the waiter floor view: a short
  // headline for what happened, plus the colour its icon is tinted with.
  title?: string;
  color?: string;
};

function elapsed(iso: string, t: (key: string, vars?: Record<string, string | number>) => string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return t('staffPortal.time.justNow');
  if (minutes === 1) return t('staffPortal.time.oneMinuteAgo');
  return t('staffPortal.time.minutesAgo', { minutes });
}

// A persistent notification log, replacing the old full-width "order
// ready" banner that auto-dismissed after 8 seconds. This never
// auto-closes once opened, and the collapsed state is just a small
// floating badge — it never sits on top of the table/order content the
// way the old banner did.
export default function NotificationFeed({
  events,
  soundEnabled,
  onToggleSound,
}: {
  events: FeedEvent[];
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('staffPortal.notifications.title')}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A134D] text-white shadow-lg"
      >
        <BellIcon size={22} />
        {events.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ef5a6f] px-1 text-[10px] font-bold text-white">
            {events.length > 9 ? '9+' : events.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-display text-2xl text-[#1A134D]">
            {t('staffPortal.notifications.title')}
          </h2>
          <button type="button" onClick={() => setOpen(false)} className="text-[#1A134D]/50">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <span className="text-xs text-[#1A134D]/50">
            {t('staffPortal.notifications.soundLabel')}
          </span>
          <button
            type="button"
            onClick={onToggleSound}
            className="flex items-center gap-1.5 border border-line rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-[0.06em] text-[#1A134D]/70"
          >
            {soundEnabled ? <SpeakerIcon size={15} /> : <SpeakerMuteIcon size={15} />}
            {soundEnabled ? t('staffPortal.header.soundOn') : t('staffPortal.header.enableSound')}
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(100vh - 130px)' }}>
          {events.length === 0 ? (
            <p className="text-sm text-[#1A134D]/40 py-8 text-center">
              {t('staffPortal.notifications.empty')}
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="border-b border-line pb-3 last:border-b-0">
                  <p className="text-sm text-[#1A134D]">{event.message}</p>
                  <p className="text-[10px] uppercase tracking-[0.08em] text-[#1A134D]/35 mt-1">
                    {elapsed(event.time, t)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
