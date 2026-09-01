'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import N2BLogo from '@/components/branding/N2BLogo';

type Membership = {
  role: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function DashboardHome() {
  const router = useRouter();
  const { t } = useI18n();

  const [memberships, setMemberships] =
    useState<Membership[] | null>(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const [error, setError] =
    useState<string | null>(null);

  async function load() {
    const res = await fetch(
      '/api/restaurants',
      {
        credentials: 'include',
        cache: 'no-store',
      }
    );

    if (res.status === 401) {
      router.push('/login');
      return;
    }

    setMemberships(await res.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function createRestaurant(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError(null);

    const res = await fetch(
      '/api/restaurants',
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          name,
          slug,
        }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      setError(
        json.error ??
          t('dashboardCore.list.couldNotCreate')
      );
      return;
    }

    router.push(
      `/dashboard/${json.id}/billing`
    );
  }

  if (!memberships) {
    return (
      <div className="theme-n2b min-h-screen bg-paper">
        <div className="p-8 text-sm text-ink/50">
          {t('dashboardCore.list.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="theme-n2b min-h-screen bg-paper text-ink">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <N2BLogo markSize={32} wordmarkClassName="text-lg leading-none" />
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-2xl">
            {t('dashboardCore.list.title')}
          </h1>

          <button
            type="button"
            onClick={() =>
              setShowCreate((v) => !v)
            }
            className="text-sm bg-n2bPurple text-white rounded-full px-4 py-2 hover:opacity-90 transition-opacity"
          >
            {t('dashboardCore.list.newRestaurant')}
          </button>
        </div>

      {showCreate && (
        <form
          onSubmit={createRestaurant}
          className="mb-8 border border-line rounded-xl p-5 space-y-3"
        >
          <input
            required
            placeholder={t('dashboardCore.list.namePlaceholder')}
            value={name}
            onChange={(e) => {
              const value =
                e.target.value;

              setName(value);

              setSlug(
                value
                  .toLowerCase()
                  .trim()
                  .replace(
                    /[^a-z0-9]+/g,
                    '-'
                  )
                  .replace(
                    /(^-|-$)/g,
                    ''
                  )
              );
            }}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />

          <div className="text-sm text-ink/50">
            yourdomain.com/r/

            <input
              required
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value)
              }
              className="border-b border-line px-1 py-0.5 w-40 inline-block"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="bg-ink text-paper rounded-lg px-4 py-2 text-sm"
          >
            {t('dashboardCore.list.create')}
          </button>
        </form>
      )}

      <ul className="divide-y divide-line">
        {memberships.map((membership) => (
          <li
            key={
              membership.restaurant.id
            }
          >
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/dashboard/${membership.restaurant.id}`
                )
              }
              className="w-full flex items-center justify-between py-4 hover:bg-black/[0.02] px-2 -mx-2 rounded text-left"
            >
              <div>
                <p className="font-medium">
                  {membership.restaurant.name}
                </p>

                <p className="text-sm text-ink/50">
                  /r/
                  {membership.restaurant.slug}
                </p>
              </div>

              <span className="text-xs uppercase tracking-wide text-ink/40">
                {membership.role}
              </span>
            </button>
          </li>
        ))}

        {memberships.length === 0 && (
          <p className="text-sm text-ink/50 py-6">
            {t('dashboardCore.list.empty')}
          </p>
        )}
      </ul>
      </div>
    </div>
  );
}