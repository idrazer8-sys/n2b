'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import { N2BMark } from '@/components/branding/N2BLogo';

type Message = {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'HUMAN';
  content: string;
  createdAt: string;
};

type Props = {
  restaurantId: string;
};

/*
 * Floating "something's wrong?" help chat for the Manager dashboard.
 * An AI assistant answers first; if it can't resolve the issue, the
 * conversation is flagged and the platform team follows up (see
 * SUPPORT_ESCALATION_WEBHOOK_URL and /admin/support).
 */
export default function SupportChatWidget({ restaurantId }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [status, setStatus] = useState<'OPEN' | 'ESCALATED' | 'RESOLVED'>('OPEN');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || loadedOnce) return;

    async function load() {
      try {
        const response = await fetch(
          `/api/restaurants/${restaurantId}/support/messages`,
          { credentials: 'include', cache: 'no-store' }
        );

        if (!response.ok) return;

        const json = await response.json();
        if (json.conversation) {
          setConversationId(json.conversation.id);
          setStatus(json.conversation.status);
          setMessages(json.conversation.messages);
        }
      } finally {
        setLoadedOnce(true);
      }
    }

    void load();
  }, [open, loadedOnce, restaurantId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  // While the widget is open, poll for a human reply the team may have
  // sent from the admin support inbox.
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/restaurants/${restaurantId}/support/messages`,
          { credentials: 'include', cache: 'no-store' }
        );
        if (!response.ok) return;
        const json = await response.json();
        if (json.conversation) {
          setConversationId(json.conversation.id);
          setStatus(json.conversation.status);
          setMessages(json.conversation.messages);
        }
      } catch {
        // Ignore — this is a best-effort background refresh.
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [open, restaurantId]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    setInput('');

    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        role: 'USER',
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/support/messages`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, message: text }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? t('adminSupport.widget.sendError'));
      }

      setConversationId(json.conversation.id);
      setStatus(json.conversation.status);
      setMessages(json.conversation.messages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('adminSupport.widget.sendError')
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 w-[340px] max-w-[calc(100vw-2.5rem)] h-[440px] flex flex-col border border-line rounded-2xl bg-paper shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <N2BMark size={22} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold">{t('adminSupport.widget.title')}</p>
                {status === 'ESCALATED' && (
                  <p className="text-[10px] uppercase tracking-[0.08em] text-amber-700">
                    {t('adminSupport.widget.flaggedForTeam')}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-ink/40 text-sm"
              aria-label={t('adminSupport.widget.closeAriaLabel')}
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-ink/50">
                {t('adminSupport.widget.emptyState')}
              </p>
            )}

            {messages.map((message) => (
              <div key={message.id} className={message.role === 'USER' ? 'ml-8' : 'mr-8'}>
                {message.role === 'HUMAN' && (
                  <p className="text-[10px] uppercase tracking-[0.08em] text-ink/40 mb-1">
                    {t('adminSupport.widget.supportTeamLabel')}
                  </p>
                )}
                <div
                  className={
                    message.role === 'USER'
                      ? 'bg-ink text-paper rounded-xl rounded-br-sm px-3 py-2 text-sm'
                      : message.role === 'HUMAN'
                      ? 'bg-amber-50 border border-amber-200 rounded-xl rounded-bl-sm px-3 py-2 text-sm'
                      : 'bg-black/[0.04] rounded-xl rounded-bl-sm px-3 py-2 text-sm'
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="mr-8 bg-black/[0.04] rounded-xl rounded-bl-sm px-3 py-2 text-sm text-ink/40">
                {t('adminSupport.widget.thinking')}
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-2 text-xs text-red-700 border-t border-red-100 bg-red-50">
              {error}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
            className="border-t border-line p-2 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('adminSupport.widget.inputPlaceholder')}
              className="flex-1 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={sending || input.trim().length === 0}
              className="bg-ink text-paper rounded-lg px-3 py-2 text-sm disabled:opacity-50"
            >
              {t('adminSupport.actions.send')}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="h-14 w-14 rounded-full bg-ink text-paper shadow-lg flex items-center justify-center text-xl"
        aria-label={t('adminSupport.widget.openAriaLabel')}
      >
        {open ? '×' : '?'}
      </button>
    </div>
  );
}
