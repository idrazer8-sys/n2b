'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';

type ConversationSummary = {
  id: string;
  status: 'OPEN' | 'ESCALATED' | 'RESOLVED';
  updatedAt: string;
  restaurant: { id: string; name: string };
  staff: { name: string; email: string };
  lastMessage: string | null;
};

type Message = {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'HUMAN';
  content: string;
  createdAt: string;
};

type ConversationDetail = {
  id: string;
  status: ConversationSummary['status'];
  restaurant: { id: string; name: string };
  staff: { name: string; email: string };
  messages: Message[];
};

/*
 * Internal-only support inbox for the platform team. Gated server-side
 * by PLATFORM_ADMIN_EMAILS via /api/admin/support — not linked from
 * anywhere in the product UI.
 */
export default function AdminSupportPage() {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [selected, setSelected] = useState<ConversationDetail | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadList() {
    const response = await fetch('/api/admin/support', {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? t('adminSupport.inbox.loadListError'));
      setConversations([]);
      return;
    }

    setConversations(await response.json());
  }

  useEffect(() => {
    void loadList();
  }, []);

  async function openConversation(id: string) {
    setError(null);

    const response = await fetch(`/api/admin/support/${id}`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setError(json.error ?? t('adminSupport.inbox.loadConversationError'));
      return;
    }

    setSelected(await response.json());
  }

  async function sendReply(status?: 'RESOLVED') {
    if (!selected) return;
    if (!reply.trim() && !status) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/support/${selected.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: reply.trim() || undefined,
          status,
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? t('adminSupport.inbox.sendError'));

      setSelected((current) =>
        current ? { ...current, status: json.status, messages: json.messages } : current
      );
      setReply('');
      void loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adminSupport.inbox.sendError'));
    } finally {
      setSending(false);
    }
  }

  if (conversations === null) {
    return (
      <div className="theme-n2b min-h-screen bg-paper p-8 text-sm text-ink/50">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="theme-n2b min-h-screen bg-paper text-ink grid grid-cols-1 md:grid-cols-[340px_1fr]">
      <aside className="border-r border-line overflow-y-auto">
        <div className="px-4 py-4 border-b border-line flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <N2BLogo markSize={26} wordmarkClassName="text-base leading-none text-ink" />
            <h1 className="font-display text-xl">{t('adminSupport.inbox.title')}</h1>
          </div>
          <LanguageSwitcher />
        </div>

        {error && !selected && (
          <p className="p-4 text-sm text-red-700">{error}</p>
        )}

        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            type="button"
            onClick={() => openConversation(conversation.id)}
            className={`block w-full text-left px-4 py-3 border-b border-line/60 hover:bg-black/[0.02] ${
              selected?.id === conversation.id ? 'bg-black/[0.03]' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{conversation.restaurant.name}</span>
              <span
                className={`text-[10px] uppercase tracking-[0.06em] ${
                  conversation.status === 'ESCALATED'
                    ? 'text-amber-700'
                    : conversation.status === 'RESOLVED'
                    ? 'text-ink/30'
                    : 'text-ink/50'
                }`}
              >
                {t(`adminSupport.status.${conversation.status.toLowerCase()}`)}
              </span>
            </div>
            <p className="text-xs text-ink/50 mt-0.5">{conversation.staff.name}</p>
            {conversation.lastMessage && (
              <p className="text-xs text-ink/40 mt-1 truncate">
                {conversation.lastMessage}
              </p>
            )}
          </button>
        ))}

        {conversations.length === 0 && (
          <p className="p-4 text-sm text-ink/50">{t('adminSupport.inbox.noConversations')}</p>
        )}
      </aside>

      <section className="flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-ink/40">
            {t('adminSupport.inbox.selectConversation')}
          </div>
        ) : (
          <>
            <div className="border-b border-line px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{selected.restaurant.name}</p>
                <p className="text-xs text-ink/50">
                  {selected.staff.name} · {selected.staff.email}
                </p>
              </div>
              {selected.status !== 'RESOLVED' && (
                <button
                  type="button"
                  onClick={() => sendReply('RESOLVED')}
                  disabled={sending}
                  className="text-xs border border-line rounded-full px-4 py-2"
                >
                  {t('adminSupport.actions.markResolved')}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {selected.messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === 'USER' ? 'mr-auto max-w-md' : 'ml-auto max-w-md'}
                >
                  <p className="text-[10px] uppercase tracking-[0.06em] text-ink/40 mb-1">
                    {message.role === 'USER'
                      ? selected.staff.name
                      : message.role === 'HUMAN'
                      ? t('adminSupport.inbox.teamLabel')
                      : t('adminSupport.inbox.aiAssistantLabel')}
                  </p>
                  <div
                    className={`rounded-xl px-3 py-2 text-sm ${
                      message.role === 'USER'
                        ? 'bg-black/[0.04]'
                        : message.role === 'HUMAN'
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-black/[0.02] border border-line'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="px-6 text-sm text-red-700">{error}</p>}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendReply();
              }}
              className="border-t border-line p-3 flex items-center gap-2"
            >
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder={t('adminSupport.inbox.replyPlaceholder')}
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={sending || reply.trim().length === 0}
                className="bg-ink text-paper rounded-lg px-4 py-2 text-sm disabled:opacity-50"
              >
                {t('adminSupport.actions.send')}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
