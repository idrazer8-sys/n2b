'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import { FONT_PAIRINGS, FONT_PAIRING_KEYS, isFontPairingKey, googleFontsHref, type FontPairingKey } from '@/src/lib/fontPairings';

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
  brandFontPairing: string | null;
  menuBackgroundUrl: string | null;
  menuLayoutMode: string;
  menuBackgroundBlur: number;
  menuBackgroundTint: number;
  menuFontScale: string;
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

  const [brandPrimaryColor, setBrandPrimaryColor] =
    useState('#111111');

  const [brandFontPairing, setBrandFontPairing] =
    useState<'default' | FontPairingKey>('default');

  const [menuLayoutMode, setMenuLayoutMode] =
    useState<'LIST' | 'POSTER'>('LIST');

  const [menuBackgroundBlur, setMenuBackgroundBlur] =
    useState(18);

  const [menuBackgroundTint, setMenuBackgroundTint] =
    useState(0.55);

  const [menuFontScale, setMenuFontScale] =
    useState<'small' | 'medium' | 'large'>('medium');

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

  const [removingBackground, setRemovingBackground] =
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

        setBrandPrimaryColor(
          data.brandPrimaryColor || '#111111'
        );

        setBrandFontPairing(
          isFontPairingKey(data.brandFontPairing)
            ? data.brandFontPairing
            : 'default'
        );

        setMenuLayoutMode(
          data.menuLayoutMode === 'POSTER' ? 'POSTER' : 'LIST'
        );

        setMenuBackgroundBlur(
          typeof data.menuBackgroundBlur === 'number' ? data.menuBackgroundBlur : 18
        );

        setMenuBackgroundTint(
          typeof data.menuBackgroundTint === 'number' ? data.menuBackgroundTint : 0.55
        );

        setMenuFontScale(
          data.menuFontScale === 'small' || data.menuFontScale === 'large'
            ? data.menuFontScale
            : 'medium'
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

  // Loads the currently-selected pairing's Google Font so the live sample
  // below the picker actually renders in that typeface.
  useEffect(() => {
    if (!isFontPairingKey(brandFontPairing)) return;

    if (document.querySelector(`link[data-font-pairing="${brandFontPairing}"]`)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = googleFontsHref(brandFontPairing);
    link.dataset.fontPairing = brandFontPairing;
    document.head.appendChild(link);
  }, [brandFontPairing]);

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

      body.brandPrimaryColor = brandPrimaryColor;

      body.brandFontPairing =
        brandFontPairing === 'default' ? null : brandFontPairing;

      body.menuLayoutMode = menuLayoutMode;
      body.menuBackgroundBlur = menuBackgroundBlur;
      body.menuBackgroundTint = menuBackgroundTint;
      body.menuFontScale = menuFontScale;

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
              brandPrimaryColor:
                data.brandPrimaryColor,
              brandFontPairing:
                data.brandFontPairing,
              menuLayoutMode:
                data.menuLayoutMode,
              menuBackgroundBlur:
                data.menuBackgroundBlur,
              menuBackgroundTint:
                data.menuBackgroundTint,
              menuFontScale:
                data.menuFontScale,
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

  async function removeBackground() {
    if (!settings) return;

    setRemovingBackground(true);
    setError('');

    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/settings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ menuBackgroundUrl: null }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || t('dashboardCore.settings.unableToSave')
        );
      }

      setSettings((current) =>
        current ? { ...current, menuBackgroundUrl: null } : current
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('dashboardCore.settings.unableToSave')
      );
    } finally {
      setRemovingBackground(false);
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

  const disabledFieldClass =
    'w-full border border-line rounded-lg px-3 py-2 text-sm bg-ink/5 text-ink/60';

  const inputClass =
    'w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink';

  const cardHeadingClass =
    'text-sm font-medium uppercase tracking-[0.1em] text-ink/60 mb-4';

  const labelClass = 'block text-xs text-ink/50 mb-1';

  if (loading) {
    return (
      <div className="pb-12">
        <div className="border border-line rounded-xl p-8 text-sm text-ink/60">
          {t('dashboardCore.settings.loading')}
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="pb-12">
        <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
          {settings?.name}
        </p>

        <h1 className="font-display text-3xl mt-1">
          {t('dashboardCore.settings.title')}
        </h1>

        <p className="text-sm text-ink/50 mt-2">
          {t('dashboardCore.settings.subtitle')}
        </p>
      </div>

      {message && (
        <div className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-line rounded-xl p-5">
          <h2 className={cardHeadingClass}>
            {t('dashboardCore.settings.restaurantHeading')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {t('dashboardCore.settings.restaurantName')}
              </label>

              <input
                value={settings?.name || ''}
                disabled
                className={disabledFieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t('dashboardCore.settings.slug')}
              </label>

              <input
                value={settings?.slug || ''}
                disabled
                className={disabledFieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t('dashboardCore.settings.currency')}
              </label>

              <input
                value={settings?.currency || ''}
                disabled
                className={disabledFieldClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t('dashboardCore.settings.timezone')}
              </label>

              <input
                value={settings?.timezone || ''}
                disabled
                className={disabledFieldClass}
              />
            </div>
          </div>
        </section>

        <section className="border border-line rounded-xl p-5">
          <h2 className={cardHeadingClass}>
            {t('dashboardCore.settings.googleReviewsHeading')}
          </h2>

          <label className={labelClass}>
            {t('dashboardCore.settings.googleReviewUrlLabel')}
          </label>

          <input
            type="url"
            value={googleReviewUrl}
            onChange={(e) =>
              setGoogleReviewUrl(e.target.value)
            }
            placeholder="https://g.page/r/..."
            className={inputClass}
          />

          <p className="mt-2 text-xs text-ink/50">
            {t('dashboardCore.settings.googleReviewHelp')}
          </p>
        </section>
      </div>

      <section className="border border-line rounded-xl p-5">
        <h2 className={cardHeadingClass}>
          {t('dashboardCore.settings.brandingHeading')}
        </h2>

        <p className="text-xs text-ink/50 -mt-3 mb-4">
          {t('dashboardCore.settings.brandingSubtitle')}
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              {t('dashboardCore.settings.brandColorLabel')}
            </label>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandPrimaryColor}
                onChange={(e) => setBrandPrimaryColor(e.target.value)}
                className="h-9 w-9 border border-line rounded-md p-0.5 shrink-0"
              />

              <input
                value={brandPrimaryColor}
                onChange={(e) => setBrandPrimaryColor(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              {t('dashboardCore.settings.brandFontLabel')}
            </label>

            <select
              value={brandFontPairing}
              onChange={(e) =>
                setBrandFontPairing(e.target.value as 'default' | FontPairingKey)
              }
              className={inputClass}
            >
              <option value="default">
                {t('dashboardCore.settings.brandFontDefault')}
              </option>
              {FONT_PAIRING_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(
                    `dashboardCore.settings.brandFont${key
                      .split('-')
                      .map((part) => part[0].toUpperCase() + part.slice(1))
                      .join('')}`
                  )}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="mt-4 border border-line rounded-lg p-4"
          style={{
            fontFamily: isFontPairingKey(brandFontPairing)
              ? `'${FONT_PAIRINGS[brandFontPairing].display}', serif`
              : undefined,
          }}
        >
          <p className="text-2xl" style={{ color: brandPrimaryColor }}>
            {t('dashboardCore.settings.brandFontSample')}
          </p>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <label className={labelClass}>
            {t('dashboardCore.settings.menuFontScaleLabel')}
          </label>

          <select
            value={menuFontScale}
            onChange={(e) =>
              setMenuFontScale(e.target.value as 'small' | 'medium' | 'large')
            }
            className={inputClass}
          >
            <option value="small">{t('dashboardCore.settings.menuFontScaleSmall')}</option>
            <option value="medium">{t('dashboardCore.settings.menuFontScaleMedium')}</option>
            <option value="large">{t('dashboardCore.settings.menuFontScaleLarge')}</option>
          </select>
        </div>

        {settings?.menuBackgroundUrl && (
          <div className="mt-4 border-t border-line pt-4">
            <label className={labelClass}>
              {t('dashboardCore.settings.menuBackgroundLabel')}
            </label>

            <div className="flex items-center gap-3">
              <div
                className="h-14 w-14 rounded-lg border border-line shrink-0"
                style={{
                  backgroundImage: `url(${settings.menuBackgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />

              <button
                type="button"
                onClick={removeBackground}
                disabled={removingBackground}
                className="text-xs border border-line rounded-full px-3 py-1.5 disabled:opacity-50"
              >
                {removingBackground
                  ? t('common.saving')
                  : t('dashboardCore.settings.removeMenuBackground')}
              </button>
            </div>

            <p className="mt-2 text-xs text-ink/50">
              {t('dashboardCore.settings.menuBackgroundHelp')}
            </p>

            <div className="mt-5">
              <label className={labelClass}>
                {t('dashboardCore.settings.menuLayoutModeLabel')}
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMenuLayoutMode('LIST')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                    menuLayoutMode === 'LIST'
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink/70'
                  }`}
                >
                  {t('dashboardCore.settings.menuLayoutModeList')}
                </button>

                <button
                  type="button"
                  onClick={() => setMenuLayoutMode('POSTER')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                    menuLayoutMode === 'POSTER'
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink/70'
                  }`}
                >
                  {t('dashboardCore.settings.menuLayoutModePoster')}
                </button>
              </div>

              <p className="mt-2 text-xs text-ink/50">
                {menuLayoutMode === 'POSTER'
                  ? t('dashboardCore.settings.menuLayoutModePosterHelp')
                  : t('dashboardCore.settings.menuLayoutModeListHelp')}
              </p>

              {menuLayoutMode === 'POSTER' && (
                <Link
                  href={`/dashboard/${restaurantId}/menu/poster`}
                  className="mt-3 inline-block text-xs underline text-ink/70 hover:text-ink"
                >
                  {t('dashboardCore.settings.editPosterPositionsLink')}
                </Link>
              )}
            </div>

            {menuLayoutMode === 'LIST' && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    {t('dashboardCore.settings.menuBackgroundBlurLabel')} ({menuBackgroundBlur}px)
                  </label>

                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={menuBackgroundBlur}
                    onChange={(e) => setMenuBackgroundBlur(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {t('dashboardCore.settings.menuBackgroundTintLabel')} ({Math.round(menuBackgroundTint * 100)}%)
                  </label>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(menuBackgroundTint * 100)}
                    onChange={(e) => setMenuBackgroundTint(Number(e.target.value) / 100)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="border border-line rounded-xl p-5">
        <h2 className={cardHeadingClass}>
          {t('dashboardCore.settings.slaHeading')}
        </h2>

        <p className="text-xs text-ink/50 -mt-3 mb-4">
          {t('dashboardCore.settings.slaSubtitle')}
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className={labelClass}>
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
              className={inputClass}
            />

            <p className="mt-1 text-xs text-ink/50">
              {t('dashboardCore.settings.staffResponseTime')}
            </p>
          </div>

          <div>
            <label className={labelClass}>
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
              className={inputClass}
            />

            <p className="mt-1 text-xs text-ink/50">
              {t('dashboardCore.settings.kitchenPrepTarget')}
            </p>
          </div>

          <div>
            <label className={labelClass}>
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
              className={inputClass}
            />

            <p className="mt-1 text-xs text-ink/50">
              {t('dashboardCore.settings.waiterDeliveryTarget')}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('dashboardCore.settings.totalServiceSla')}
            </span>

            <span className="font-display text-lg">
              {formatDuration(
                calculatedTotal,
                t('dashboardCore.settings.notConfigured')
              )}
            </span>
          </div>

          <p className="mt-1 text-xs text-ink/50">
            {t('dashboardCore.settings.calculatedAutomatically')}
          </p>
        </div>
      </section>

      <section className="border border-line rounded-xl p-5">
        <h2 className={cardHeadingClass}>
          {t('dashboardCore.settings.currentStatusHeading')}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-line rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-ink/50">
                  {t('dashboardCore.settings.restaurantStatusLabel')}
                </div>

                <div className="mt-1 text-sm font-medium">
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
                  settings?.isOpen ? 'bg-ink' : 'bg-ink/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings?.isOpen ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <p className="mt-2 text-xs text-ink/50">
              {t('dashboardCore.settings.restaurantStatusDescription')}
            </p>
          </div>

          <div className="border border-line rounded-lg p-4">
            <div className="text-xs text-ink/50">
              {t('dashboardCore.settings.accountLabel')}
            </div>

            <div className="mt-1 text-sm font-medium">
              {settings?.isActive
                ? t('common.active')
                : t('common.inactive')}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="bg-ink text-white text-sm font-medium rounded-lg px-6 py-2.5 disabled:opacity-50"
        >
          {saving
            ? t('common.saving')
            : t('dashboardCore.settings.saveSettings')}
        </button>
      </div>
    </div>
  );
}