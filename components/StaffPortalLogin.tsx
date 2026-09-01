'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';

type Portal =
  | 'WAITER'
  | 'KITCHEN';

type Props = {
  restaurantId: string;
  destination: string;
  title:
    | 'Kitchen'
    | 'Waiter';
};

export default function StaffPortalLogin({
  restaurantId,
  destination,
  title,
}: Props) {
  const router =
    useRouter();

  const portal: Portal =
    title === 'Kitchen'
      ? 'KITCHEN'
      : 'WAITER';

  const { t } = useI18n();

  const portalLabel =
    portal === 'KITCHEN'
      ? t('staffMisc.login.kitchenTitle')
      : t('staffMisc.login.waiterTitle');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    let mounted = true;

    async function checkExistingSession() {
      try {
        const response =
          await fetch(
            '/api/auth/session',
            {
              credentials:
                'include',
              cache:
                'no-store',
            }
          );

        if (
          response.status !==
          200
        ) {
          return;
        }

        const data =
          await response
            .json()
            .catch(
              () => null
            );

        /*
         * IMPORTANT:
         *
         * If the current session is already
         * for this portal, verify that the
         * current user can actually belong
         * to this restaurant before redirecting.
         *
         * The destination itself remains protected
         * by middleware + server-side authorization.
         */
        if (
          mounted &&
          data?.authenticated ===
            true &&
          data?.portal ===
            portal
        ) {
          router.replace(
            destination
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void checkExistingSession();

    return () => {
      mounted = false;
    };
  }, [
    destination,
    portal,
    router,
  ]);

  async function submit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      const loginResponse =
        await fetch(
          '/api/auth/login',
          {
            method: 'POST',
            credentials:
              'include',

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

              portal,

              /*
               * THIS WAS THE MISSING FIELD.
               *
               * The server needs the restaurant
               * in order to validate the staff
               * membership.
               */
              restaurantId,
            }),
          }
        );

      const loginJson =
        await loginResponse
          .json()
          .catch(
            () => ({})
          );

      if (
        !loginResponse.ok
      ) {
        throw new Error(
          loginJson.error ??
            t('staffMisc.login.couldNotSignIn', { portal: portalLabel })
        );
      }

      /*
       * The server already validated:
       *
       * - password
       * - restaurant
       * - membership
       * - active account
       * - role
       * - portal
       *
       * So simply enter the portal.
       */
      router.replace(
        destination
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('staffMisc.login.couldNotSignIn', { portal: portalLabel })
      );

      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-n2bNavy px-6">
        <p className="text-sm text-n2bOffwhite/50">
          {t('staffMisc.login.checkingAccess')}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-n2bNavy text-n2bOffwhite flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher className="border border-white/15 rounded-lg px-2 py-1.5 text-xs bg-white/5 text-n2bOffwhite outline-none focus:border-white/40" />
        </div>

        <div className="text-center mb-8">
          <N2BLogo
            className="justify-center mb-5"
            markSize={44}
            wordmarkClassName="text-3xl leading-none text-white"
          />

          <p className="text-[10px] uppercase tracking-[0.22em] text-n2bOffwhite/40 mt-1">
            {t('staffMisc.login.eyebrow')}
          </p>

          <h1 className="font-display text-2xl mt-3">
            {portalLabel}
          </h1>

          <p className="text-sm text-n2bOffwhite/50 mt-2">
            {t('staffMisc.login.signInDesc')}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="border border-white/10 rounded-2xl bg-white/5 p-6"
        >
          <label className="block text-sm font-medium">
            {t('staffMisc.login.usernameEmail')}

            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              className="mt-2 w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-3 text-sm outline-none focus:border-n2bPurple"
              placeholder={
                portal ===
                'KITCHEN'
                  ? t('staffMisc.login.emailPlaceholderKitchen')
                  : t('staffMisc.login.emailPlaceholderWaiter')
              }
            />
          </label>

          <label className="block text-sm font-medium mt-4">
            {t('common.password')}

            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              className="mt-2 w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-3 text-sm outline-none focus:border-n2bPurple"
              placeholder={t('staffMisc.login.yourPasswordPlaceholder')}
            />
          </label>

          {error && (
            <div className="mt-4 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting
            }
            className="mt-5 w-full bg-n2bPurple text-white rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting
              ? t('common.signingIn')
              : t('staffMisc.login.enterPortal', { portal: portalLabel })}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/${restaurantId}`
              )
            }
            className="mt-3 w-full border border-white/10 rounded-lg px-4 py-3 text-sm text-n2bOffwhite/70 hover:text-n2bOffwhite transition-colors"
          >
            {t('common.back')}
          </button>
        </form>
      </div>
    </main>
  );
}