'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';

type CheckResponse = {
  restaurantName?: string;
  acceptsJoin?: boolean;
  error?: string;
};

type JoinResponse = {
  restaurantId?: string;
  staffPortal?: 'WAITER' | 'KITCHEN';
  error?: string;
};

// Public — the link a manager shares with a new hire (Settings > Personal
// shows it once a staff join password is set). No session required to
// load this page; submitting the form creates one, same as /login.
export default function StaffJoinPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { t } = useI18n();

  const [checking, setChecking] = useState(true);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [acceptsJoin, setAcceptsJoin] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [staffJoinPassword, setStaffJoinPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffPortal, setStaffPortal] = useState<'WAITER' | 'KITCHEN'>('WAITER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/restaurants/${params.slug}/staff-join`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as CheckResponse;
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setRestaurantName(data.restaurantName ?? null);
        setAcceptsJoin(!!data.acceptsJoin);
      })
      .catch(() => setNotFound(true))
      .finally(() => setChecking(false));
  }, [params.slug]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/public/restaurants/${params.slug}/staff-join`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffJoinPassword,
            name,
            email: email.trim().toLowerCase(),
            password,
            staffPortal,
          }),
        }
      );

      const data = (await response.json().catch(() => ({}))) as JoinResponse;

      if (!response.ok) {
        throw new Error(data.error ?? t('staffJoin.couldNotJoin'));
      }

      if (data.staffPortal === 'KITCHEN' && data.restaurantId) {
        router.replace(`/kitchen/${data.restaurantId}`);
      } else if (data.restaurantId) {
        router.replace(`/staff/${data.restaurantId}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('staffJoin.couldNotJoin'));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-n2bNavy text-n2bOffwhite flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-end items-center mb-4">
          <LanguageSwitcher className="border border-white/15 rounded-lg px-2 py-1.5 text-xs bg-white/5 text-n2bOffwhite outline-none focus:border-white/40" />
        </div>

        <div className="text-center mb-8">
          <N2BLogo className="justify-center mb-5" markSize={44} wordmarkClassName="text-3xl leading-none text-white" />

          <p className="text-[10px] uppercase tracking-[0.22em] text-n2bOffwhite/40 mt-1">
            {t('staffJoin.eyebrow')}
          </p>

          <p className="text-sm text-n2bOffwhite/50 mt-3">
            {checking
              ? t('staffJoin.checking')
              : restaurantName
                ? t('staffJoin.subtitle', { restaurantName })
                : t('staffJoin.subtitleGeneric')}
          </p>
        </div>

        {!checking && notFound && (
          <div className="border border-white/10 rounded-2xl bg-white/5 p-6 text-center text-sm text-n2bOffwhite/60">
            {t('staffJoin.restaurantNotFound')}
          </div>
        )}

        {!checking && !notFound && !acceptsJoin && (
          <div className="border border-white/10 rounded-2xl bg-white/5 p-6 text-center text-sm text-n2bOffwhite/60">
            {t('staffJoin.notAcceptingJoins')}
          </div>
        )}

        {!checking && !notFound && acceptsJoin && (
          <form
            onSubmit={handleSubmit}
            className="border border-white/10 rounded-2xl bg-white/5 p-6"
          >
            <label className="block text-sm font-medium">
              {t('staffJoin.restaurantPasswordLabel')}
              <input
                type="password"
                required
                value={staffJoinPassword}
                onChange={(event) => setStaffJoinPassword(event.target.value)}
                placeholder={t('staffJoin.restaurantPasswordPlaceholder')}
                className="mt-2 w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-3 text-sm outline-none focus:border-n2bPurple"
              />
            </label>

            <label className="block text-sm font-medium mt-4">
              {t('staffJoin.roleLabel')}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStaffPortal('WAITER')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                    staffPortal === 'WAITER'
                      ? 'border-n2bPurple bg-n2bPurple text-white'
                      : 'border-white/15 text-n2bOffwhite/70'
                  }`}
                >
                  {t('staffJoin.roleWaiter')}
                </button>
                <button
                  type="button"
                  onClick={() => setStaffPortal('KITCHEN')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                    staffPortal === 'KITCHEN'
                      ? 'border-n2bPurple bg-n2bPurple text-white'
                      : 'border-white/15 text-n2bOffwhite/70'
                  }`}
                >
                  {t('staffJoin.roleKitchen')}
                </button>
              </div>
            </label>

            <label className="block text-sm font-medium mt-4">
              {t('staffJoin.nameLabel')}
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('staffJoin.namePlaceholder')}
                className="mt-2 w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-3 text-sm outline-none focus:border-n2bPurple"
              />
            </label>

            <label className="block text-sm font-medium mt-4">
              {t('staffJoin.emailLabel')}
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-3 text-sm outline-none focus:border-n2bPurple"
              />
            </label>

            <label className="block text-sm font-medium mt-4">
              {t('staffJoin.passwordLabel')}
              <input
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('staffJoin.passwordPlaceholder')}
                className="mt-2 w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-3 text-sm outline-none focus:border-n2bPurple"
              />
            </label>

            {error && (
              <div className="mt-4 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full bg-n2bPurple text-white rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {loading ? t('staffJoin.joining') : t('staffJoin.joinButton')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
