'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';

type StaffMember = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type Restaurant = {
  id: string;
  name: string;
  slug: string;
};

export default function WaiterSelectPage() {
  const params =
    useParams<{ restaurantId: string }>();

  const router = useRouter();

  const restaurantId =
    params.restaurantId;

  const { t } = useI18n();

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [staff, setStaff] =
    useState<StaffMember[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [
          restaurantsRes,
          staffRes,
        ] = await Promise.all([
          fetch('/api/restaurants', {
            credentials: 'include',
            cache: 'no-store',
          }),

          fetch(
            `/api/restaurants/${restaurantId}/staff`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
          ),
        ]);

        if (
          restaurantsRes.status === 401
        ) {
          router.push(
            '/login'
          );
          return;
        }

        const restaurantsJson =
          await restaurantsRes.json();

        const staffJson =
          await staffRes.json();

        if (!restaurantsRes.ok) {
          throw new Error(
            t('staffMisc.select.couldNotLoadAccess')
          );
        }

        if (!staffRes.ok) {
          throw new Error(
            staffJson?.error ??
              t('staffMisc.select.couldNotLoadWaiters')
          );
        }

        const membership =
          restaurantsJson.find(
            (item: {
              restaurant: Restaurant;
            }) =>
              item.restaurant.id ===
              restaurantId
          );

        if (!membership) {
          throw new Error(
            t('staffMisc.select.noAccess')
          );
        }

        setRestaurant(
          membership.restaurant
        );

        setStaff(
          Array.isArray(staffJson)
            ? staffJson
            : []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t('staffMisc.select.couldNotLoadWaiters')
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [restaurantId, router, t]);

  function openWaiter(
    staffId: string
  ) {
    router.push(
      `/staff/${restaurantId}?staffId=${encodeURIComponent(
        staffId
      )}`
    );
  }

  if (loading) {
    return (
      <main className="theme-n2b min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A134D]/40">
            {t('staffMisc.select.eyebrow')}
          </p>

          <h1 className="font-display text-3xl mt-2">
            {t('common.loading')}
          </h1>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="theme-n2b min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl">
            {t('staffMisc.select.unavailableTitle')}
          </h1>

          <p className="mt-3 text-sm text-[#1A134D]/60">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/${restaurantId}`
              )
            }
            className="mt-6 bg-[#1A134D] text-[#F5F6FA] px-5 py-3 text-xs uppercase tracking-[0.08em]"
          >
            {t('common.back')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="theme-n2b min-h-screen bg-[#F5F6FA] text-[#1A134D]">
      <header className="border-b border-[#1A134D]/10">
        <div className="max-w-3xl mx-auto px-4 py-7">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/${restaurantId}`
                )
              }
              className="text-xs uppercase tracking-[0.1em] text-[#1A134D]/50"
            >
              ← {t('common.back')}
            </button>

            <div className="flex items-center gap-4">
              <N2BLogo markSize={28} wordmarkClassName="text-lg leading-none text-[#1A134D]" />
              <LanguageSwitcher />
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A134D]/40 mt-7">
            {restaurant?.name}
          </p>

          <h1 className="font-display text-4xl mt-1">
            {t('staffMisc.select.chooseWaiter')}
          </h1>

          <p className="text-sm text-[#1A134D]/50 mt-2">
            {t('staffMisc.select.chooseWaiterDesc')}
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {staff.length === 0 ? (
          <div className="border border-[#1A134D]/10 p-8 text-center">
            <h2 className="font-display text-2xl">
              {t('staffMisc.select.noWaiters')}
            </h2>

            <p className="text-sm text-[#1A134D]/50 mt-2">
              {t('staffMisc.select.noWaitersDesc')}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/${restaurantId}/waiters`
                )
              }
              className="mt-6 bg-[#1A134D] text-[#F5F6FA] px-5 py-3 text-xs uppercase tracking-[0.08em]"
            >
              {t('staffMisc.select.manageWaiters')}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {staff.map((member, index) => (
              <button
                key={member.id}
                type="button"
                onClick={() =>
                  openWaiter(member.id)
                }
                className="text-left border border-[#1A134D]/10 bg-white/20 p-6 hover:border-[#1A134D]/30 hover:bg-white/40 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#1A134D]/40">
                      {t('staffMisc.select.waiterNumber', { number: index + 1 })}
                    </p>

                    <h2 className="font-display text-3xl mt-2">
                      {member.user.name}
                    </h2>

                    <p className="text-xs text-[#1A134D]/45 mt-2">
                      {member.user.email}
                    </p>
                  </div>

                  <span className="h-2.5 w-2.5 rounded-full bg-[#477052] mt-2" />
                </div>

                <div className="mt-6 text-xs uppercase tracking-[0.1em]">
                  {t('staffMisc.select.openSession')}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}