'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

export default function NewWaiterPage() {
  const params = useParams<{ restaurantId: string }>();
  const router = useRouter();

  const { t } = useI18n();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/staff`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error ?? t('ordersWaiters.newWaiter.couldNotCreate')
        );
      }

      router.replace(`/dashboard/${params.restaurantId}/waiters`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('ordersWaiters.newWaiter.couldNotCreate')
      );
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
          {t('ordersWaiters.newWaiter.eyebrow')}
        </p>
        <h1 className="font-display text-4xl mt-1">
          {t('ordersWaiters.newWaiter.title')}
        </h1>
        <p className="text-sm text-ink/50 mt-2">
          {t('ordersWaiters.newWaiter.description')}
        </p>
      </div>

      <form
        onSubmit={submit}
        className="border border-line rounded-2xl p-6"
      >
        <label className="block text-sm font-medium">
          {t('ordersWaiters.newWaiter.fullNameLabel')}
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full border border-line rounded-lg px-3 py-3 text-sm"
            placeholder={t('ordersWaiters.newWaiter.fullNamePlaceholder')}
          />
        </label>

        <label className="block text-sm font-medium mt-4">
          {t('ordersWaiters.newWaiter.usernameEmailLabel')}
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full border border-line rounded-lg px-3 py-3 text-sm"
            placeholder={t('ordersWaiters.newWaiter.emailPlaceholder')}
          />
        </label>

        <label className="block text-sm font-medium mt-4">
          {t('ordersWaiters.newWaiter.tempPasswordLabel')}
          <input
            required
            minLength={10}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full border border-line rounded-lg px-3 py-3 text-sm"
            placeholder={t('ordersWaiters.newWaiter.passwordPlaceholder')}
          />
          <span className="block mt-1 text-xs text-ink/40">
            {t('ordersWaiters.newWaiter.passwordHint')}
          </span>
        </label>

        {error && (
          <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-ink text-paper rounded-lg px-4 py-3 text-sm disabled:opacity-50"
          >
            {saving
              ? t('ordersWaiters.newWaiter.creating')
              : t('ordersWaiters.newWaiter.submit')}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(`/dashboard/${params.restaurantId}/waiters`)
            }
            className="border border-line rounded-lg px-4 py-3 text-sm"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}