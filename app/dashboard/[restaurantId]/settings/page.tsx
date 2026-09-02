'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type Settings = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  address: string | null;
  phone: string | null;
  currency: string;
  timezone: string;
  brandPrimaryColor: string;
  isOpen: boolean;
  isActive: boolean;
  googleReviewUrl: string | null;
  acceptanceSlaSeconds: number | null;
  kitchenSlaSeconds: number | null;
  waiterSlaSeconds: number | null;
  totalServiceSlaSeconds: number | null;
};

function formatDuration(
  seconds: number | null,
  notConfiguredLabel: string
) {
  if (seconds === null) return notConfiguredLabel;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

export default function SettingsPage() {
  const params = useParams();
  const { t } = useI18n();
  const restaurantId = params.restaurantId as string;

  const [settings, setSettings] =
    useState<Settings | null>(null);

  const [googleReviewUrl, setGoogleReviewUrl] =
    useState('');

  const [acceptanceSla, setAcceptanceSla] =
    useState('');

  const [kitchenSla, setKitchenSla] =
    useState('');

  const [waiterSla, setWaiterSla] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const [togglingOpen, setTogglingOpen] =
    useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/restaurants/${restaurantId}/settings`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              t('dashboardCore.settings.unableToLoad')
          );
        }

        setSettings(data);

        setGoogleReviewUrl(
          data.googleReviewUrl || ''
        );

        setAcceptanceSla(
          data.acceptanceSlaSeconds !== null
            ? String(data.acceptanceSlaSeconds)
            : ''
        );

        setKitchenSla(
          data.kitchenSlaSeconds !== null
            ? String(data.kitchenSlaSeconds)
            : ''
        );

        setWaiterSla(
          data.waiterSlaSeconds !== null
            ? String(data.waiterSlaSeconds)
            : ''
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t('dashboardCore.settings.unableToLoadShort')
        );
      } finally {
        setLoading(false);
      }
    }

    if (restaurantId) {
      loadSettings();
    }
  }, [restaurantId]);

  async function saveSettings() {
    try {
      setSaving(true);
      setMessage('');
      setError('');

      const body: Record<string, unknown> = {};

      if (googleReviewUrl.trim() === '') {
        body.googleReviewUrl = null;
      } else {
        body.googleReviewUrl =
          googleReviewUrl.trim();
      }

      body.acceptanceSlaSeconds =
        acceptanceSla === ''
          ? null
          : Number(acceptanceSla);

      body.kitchenSlaSeconds =
        kitchenSla === ''
          ? null
          : Number(kitchenSla);

      body.waiterSlaSeconds =
        waiterSla === ''
          ? null
          : Number(waiterSla);

      const response = await fetch(
        `/api/restaurants/${restaurantId}/settings`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            t('dashboardCore.settings.unableToSave')
        );
      }

      setSettings((current) =>
        current
          ? {
              ...current,
              googleReviewUrl:
                data.googleReviewUrl,
              acceptanceSlaSeconds:
                data.acceptanceSlaSeconds,
              kitchenSlaSeconds:
                data.kitchenSlaSeconds,
              waiterSlaSeconds:
                data.waiterSlaSeconds,
              totalServiceSlaSeconds:
                data.totalServiceSlaSeconds,
            }
          : current
      );

      setMessage(
        t('dashboardCore.settings.savedSuccess')
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('dashboardCore.settings.unableToSave')
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleOpen(next: boolean) {
    if (!settings) return;

    const previous = settings.isOpen;

    setSettings((current) =>
      current ? { ...current, isOpen: next } : current
    );

    setTogglingOpen(true);
    setError('');

    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/settings`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isOpen: next }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            t('dashboardCore.settings.unableToSave')
        );
      }
    } catch (err) {
      setSettings((current) =>
        current ? { ...current, isOpen: previous } : current
      );

      setError(
        err instanceof Error
          ? err.message
          : t('dashboardCore.settings.unableToSave')
      );
    } finally {
      setTogglingOpen(false);
    }
  }

  const calculatedTotal =
    acceptanceSla !== '' &&
    kitchenSla !== '' &&
    waiterSla !== ''
      ? Number(acceptanceSla) +
        Number(kitchenSla) +
        Number(waiterSla)
      : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border bg-white p-8">
            {t('dashboardCore.settings.loading')}
          </div>
        </div>
      </main>
    );
  }

  if (error && !settings) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboardCore.settings.title')}
          </h1>

          <p className="mt-1 text-gray-600">
            {t('dashboardCore.settings.subtitle')}
          </p>
        </div>

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('dashboardCore.settings.restaurantHeading')}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {t('dashboardCore.settings.restaurantSubtitle')}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('dashboardCore.settings.restaurantName')}
              </label>

              <input
                value={settings?.name || ''}
                disabled
                className="w-full rounded-lg border bg-gray-100 px-3 py-2.5 text-gray-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('dashboardCore.settings.slug')}
              </label>

              <input
                value={settings?.slug || ''}
                disabled
                className="w-full rounded-lg border bg-gray-100 px-3 py-2.5 text-gray-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('dashboardCore.settings.currency')}
              </label>

              <input
                value={settings?.currency || ''}
                disabled
                className="w-full rounded-lg border bg-gray-100 px-3 py-2.5 text-gray-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('dashboardCore.settings.timezone')}
              </label>

              <input
                value={settings?.timezone || ''}
                disabled
                className="w-full rounded-lg border bg-gray-100 px-3 py-2.5 text-gray-600"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('dashboardCore.settings.googleReviewsHeading')}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {t('dashboardCore.settings.googleReviewsSubtitle')}
            </p>
          </div>

          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t('dashboardCore.settings.googleReviewUrlLabel')}
          </label>

          <input
            type="url"
            value={googleReviewUrl}
            onChange={(e) =>
              setGoogleReviewUrl(e.target.value)
            }
            placeholder="https://g.page/r/..."
            className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-300"
          />

          <p className="mt-2 text-xs text-gray-500">
            {t('dashboardCore.settings.googleReviewHelp')}
          </p>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('dashboardCore.settings.slaHeading')}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {t('dashboardCore.settings.slaSubtitle')}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('dashboardCore.settings.acceptanceLabel')}
              </label>

              <input
                type="number"
                min="30"
                max="1800"
                value={acceptanceSla}
                onChange={(e) =>
                  setAcceptanceSla(e.target.value)
                }
                placeholder="300"
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-300"
              />

              <p className="mt-1 text-xs text-gray-500">
                {t('dashboardCore.settings.staffResponseTime')}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('dashboardCore.settings.acceptedLabel')}
              </label>

              <input
                type="number"
                min="60"
                max="3600"
                value={kitchenSla}
                onChange={(e) =>
                  setKitchenSla(e.target.value)
                }
                placeholder="1200"
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-300"
              />

              <p className="mt-1 text-xs text-gray-500">
                {t('dashboardCore.settings.kitchenPrepTarget')}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('dashboardCore.settings.readyLabel')}
              </label>

              <input
                type="number"
                min="30"
                max="1800"
                value={waiterSla}
                onChange={(e) =>
                  setWaiterSla(e.target.value)
                }
                placeholder="1800"
                className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-gray-300"
              />

              <p className="mt-1 text-xs text-gray-500">
                {t('dashboardCore.settings.waiterDeliveryTarget')}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">
                {t('dashboardCore.settings.totalServiceSla')}
              </span>

              <span className="text-lg font-bold text-gray-900">
                {formatDuration(
                  calculatedTotal,
                  t('dashboardCore.settings.notConfigured')
                )}
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              {t('dashboardCore.settings.calculatedAutomatically')}
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('dashboardCore.settings.currentStatusHeading')}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-500">
                    {t('dashboardCore.settings.restaurantStatusLabel')}
                  </div>

                  <div className="mt-1 font-semibold text-gray-900">
                    {settings?.isOpen
                      ? t('dashboardCore.settings.open')
                      : t('dashboardCore.settings.closed')}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={settings?.isOpen ?? false}
                  disabled={!settings || togglingOpen}
                  onClick={() =>
                    void toggleOpen(!settings?.isOpen)
                  }
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                    settings?.isOpen
                      ? 'bg-black'
                      : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      settings?.isOpen
                        ? 'translate-x-5'
                        : ''
                    }`}
                  />
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                {t('dashboardCore.settings.restaurantStatusDescription')}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-gray-500">
                {t('dashboardCore.settings.accountLabel')}
              </div>

              <div className="mt-1 font-semibold text-gray-900">
                {settings?.isActive
                  ? t('common.active')
                  : t('common.inactive')}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end pb-8">
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? t('common.saving')
              : t('dashboardCore.settings.saveSettings')}
          </button>
        </div>
      </div>
    </main>
  );
}