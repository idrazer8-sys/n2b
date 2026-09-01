'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type Restaurant = {
  id: string;
  name: string;
  slug: string;
};

type Membership = {
  role: string;
  restaurant: Restaurant;
};

/*
 * Dashboard landing page for OWNER/MANAGER accounts.
 *
 * There is a single login ("/") for the whole product. Once a user
 * authenticates, the server tells us their role and we land them
 * here automatically. From here an OWNER/MANAGER can jump into
 * Manager, Kitchen or Waiter WITHOUT signing in again — the same
 * session already carries enough proof of identity, and every
 * destination re-checks real authorization server-side against
 * RestaurantStaff (see requireRestaurantAccess /
 * requireRestaurantPortalAccess in src/lib/auth.ts).
 *
 * A STAFF account should never see this screen — it is redirected
 * straight to its Waiter panel.
 */
export default function RestaurantDashboardHome() {
  const params = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const restaurantId = params.restaurantId;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch('/api/restaurants', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(t('dashboardCore.hub.couldNotLoadAccess'));
        }

        const memberships = (await response.json()) as Membership[];
        const membership = memberships.find(
          (item) => item.restaurant.id === restaurantId
        );

        if (!membership) {
          throw new Error(t('dashboardCore.hub.noAccess'));
        }

        // STAFF accounts belong in the Waiter panel, not here.
        if (membership.role === 'STAFF') {
          router.replace(`/staff/${restaurantId}`);
          return;
        }

        if (!mounted) return;
        setRestaurant(membership.restaurant);
        setRole(membership.role);
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error
            ? err.message
            : t('dashboardCore.hub.couldNotLoad')
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [restaurantId, router]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-ink/50">
        {t('dashboardCore.hub.loading')}
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="py-20 text-center">
        <h1 className="font-display text-3xl">
          {t('dashboardCore.hub.unavailableTitle')}
        </h1>
        <p className="mt-3 text-sm text-ink/50">
          {error ?? t('dashboardCore.hub.couldNotLoad')}
        </p>
      </div>
    );
  }

  const options = [
    {
      title: t('dashboardCore.hub.managerTitle'),
      description: t('dashboardCore.hub.managerDescription'),
      action: () => router.push(`/dashboard/${restaurantId}/menu`),
    },
    {
      title: t('dashboardCore.hub.kitchenTitle'),
      description: t('dashboardCore.hub.kitchenDescription'),
      action: () => router.push(`/kitchen/${restaurantId}`),
    },
    {
      title: t('dashboardCore.hub.waiterTitle'),
      description: t('dashboardCore.hub.waiterDescription'),
      action: () => router.push(`/staff/${restaurantId}`),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="text-center mb-10">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40">
          {t('dashboardCore.hub.eyebrow')}
        </p>
        <h1 className="font-display text-4xl mt-2">{restaurant.name}</h1>
        <p className="text-sm text-ink/50 mt-2">
          {t('dashboardCore.hub.whereToGo')}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.title}
            type="button"
            onClick={option.action}
            className="text-left border border-line rounded-2xl p-6 hover:bg-black/[0.025] hover:border-ink/30 transition"
          >
            <div className="h-10 w-10 rounded-full bg-ink text-paper flex items-center justify-center text-xs font-semibold">
              {option.title.charAt(0)}
            </div>
            <h2 className="font-display text-2xl mt-5">{option.title}</h2>
            <p className="text-sm text-ink/50 mt-2 leading-6">
              {option.description}
            </p>
            <div className="mt-6 text-xs uppercase tracking-[0.1em]">
              {t('dashboardCore.hub.enter')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
