'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';

type LoginResponse = {
  id?: string;
  name?: string;
  email?: string;
  portal?: 'MANAGER' | 'WAITER' | 'KITCHEN';
  restaurantId?: string;
  staffId?: string;
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const response =
        await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            email:
              email
                .trim()
                .toLowerCase(),
            password,
            portal: 'AUTO',
          }),
        });

      const data =
        (await response.json().catch(
          () => ({})
        )) as LoginResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
            'Invalid username or password'
        );
      }

      if (
        data.portal === 'MANAGER'
      ) {
        router.replace('/dashboard');
        router.refresh();
        return;
      }

      if (
        data.portal === 'WAITER' &&
        data.restaurantId
      ) {
        router.replace(
          `/staff/${data.restaurantId}`
        );
        router.refresh();
        return;
      }

      if (
        data.portal === 'KITCHEN' &&
        data.restaurantId
      ) {
        router.replace(
          `/kitchen/${data.restaurantId}`
        );
        router.refresh();
        return;
      }

      throw new Error(
        t('authPages.root.invalidAccess')
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('authPages.root.couldNotSignIn')
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-n2bNavy text-n2bOffwhite flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <a
            href="/"
            className="text-xs text-n2bOffwhite/50 hover:text-n2bOffwhite"
          >
            {t('common.back')}
          </a>

          <LanguageSwitcher className="border border-white/15 rounded-lg px-2 py-1.5 text-xs bg-white/5 text-n2bOffwhite outline-none focus:border-white/40" />
        </div>

        <div className="text-center mb-8">
          <N2BLogo
            className="justify-center mb-5"
            markSize={44}
            wordmarkClassName="text-3xl leading-none text-white"
          />

          <p className="text-[10px] uppercase tracking-[0.22em] text-n2bOffwhite/40 mt-1">
            {t('authPages.root.eyebrow')}
          </p>

          <p className="text-sm text-n2bOffwhite/50 mt-3">
            {t('authPages.root.subtitle')}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-white/10 rounded-2xl bg-white/5 p-6"
        >
          <label className="block text-sm font-medium">
            {t('authPages.root.usernameLabel')}

            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@restaurant.com"
              className="mt-2 w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-3 text-sm outline-none focus:border-n2bPurple"
            />
          </label>

          <label className="block text-sm font-medium mt-4">
            {t('common.password')}

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder={t('authPages.root.passwordPlaceholder')}
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
            {loading
              ? t('common.signingIn')
              : t('common.signIn')}
          </button>

          <p className="mt-4 text-center text-xs text-n2bOffwhite/45">
            {t('authPages.root.noAccountYet')}{' '}
            <a
              href="/dashboard/register"
              className="underline text-n2bOffwhite/70"
            >
              {t('authPages.root.startFreeTrial')}
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
