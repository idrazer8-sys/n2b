'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type Restaurant = {
  id: string;
  name: string;
  googleReviewUrl: string | null;

  acceptanceSlaSeconds: number | null;
  kitchenSlaSeconds: number | null;
  waiterSlaSeconds: number | null;
  totalServiceSlaSeconds: number | null;
  allowPayAtRestaurant: boolean;
};

type Membership = {
  role: string;
  restaurant: Restaurant;
};

const DEFAULT_ACCEPTANCE = '5';
const DEFAULT_KITCHEN = '10';
const DEFAULT_WAITER = '3';

function secondsToMinutes(
  seconds: number | null | undefined,
  fallback: string
) {
  if (
    seconds === null ||
    seconds === undefined ||
    !Number.isFinite(seconds)
  ) {
    return fallback;
  }

  return String(seconds / 60);
}

function minutesToSeconds(value: string) {
  const normalized = value
    .trim()
    .replace(',', '.');

  const minutes = Number(normalized);

  if (
    normalized === '' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    return null;
  }

  return Math.round(minutes * 60);
}

function parseMinutes(value: string) {
  const normalized = value
    .trim()
    .replace(',', '.');

  const minutes = Number(normalized);

  if (
    normalized === '' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    return null;
  }

  return minutes;
}

function formatMinutes(
  value: string | number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '—';
  }

  const minutes =
    typeof value === 'number'
      ? value
      : Number(
          String(value)
            .trim()
            .replace(',', '.')
        );

  if (
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    return '—';
  }

  if (Number.isInteger(minutes)) {
    return `${minutes} min`;
  }

  return `${minutes.toFixed(1)} min`;
}

function calculateTotalMinutes(
  acceptance: string,
  kitchen: string,
  waiter: string
) {
  const acceptanceMinutes =
    parseMinutes(acceptance);

  const kitchenMinutes =
    parseMinutes(kitchen);

  const waiterMinutes =
    parseMinutes(waiter);

  if (
    acceptanceMinutes === null ||
    kitchenMinutes === null ||
    waiterMinutes === null
  ) {
    return null;
  }

  return (
    acceptanceMinutes +
    kitchenMinutes +
    waiterMinutes
  );
}

export default function PaymentsSettingsPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { t } = useI18n();

  const [loading, setLoading] =
    useState(false);

  const [savingReview, setSavingReview] =
    useState(false);

  const [savingSla, setSavingSla] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [saved, setSaved] =
    useState(false);

  const [slaSaved, setSlaSaved] =
    useState(false);

  const [reviewUrl, setReviewUrl] =
    useState('');

  const [restaurantName, setRestaurantName] =
    useState('');

  const [allowPayAtRestaurant, setAllowPayAtRestaurant] =
    useState(true);

  const [savingPayAtRestaurant, setSavingPayAtRestaurant] =
    useState(false);

  // Editable draft values
  const [acceptanceSla, setAcceptanceSla] =
    useState(DEFAULT_ACCEPTANCE);

  const [kitchenSla, setKitchenSla] =
    useState(DEFAULT_KITCHEN);

  const [waiterSla, setWaiterSla] =
    useState(DEFAULT_WAITER);

  // Last successfully saved values
  const [savedAcceptanceSla, setSavedAcceptanceSla] =
    useState(DEFAULT_ACCEPTANCE);

  const [savedKitchenSla, setSavedKitchenSla] =
    useState(DEFAULT_KITCHEN);

  const [savedWaiterSla, setSavedWaiterSla] =
    useState(DEFAULT_WAITER);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setError(null);

        const res = await fetch(
          '/api/restaurants',
          {
            credentials: 'include',
            cache: 'no-store',
          }
        );

        const json =
          await res.json();

        if (!res.ok) {
          throw new Error(
            json.error ??
              t('dashboardCore.paymentsSettings.couldNotLoad')
          );
        }

        const memberships =
          json as Membership[];

        const mine =
          memberships.find(
            (item) =>
              item.restaurant.id ===
              params.restaurantId
          );

        if (!mine) {
          throw new Error(
            t('dashboardCore.paymentsSettings.restaurantNotFound')
          );
        }

        if (cancelled) {
          return;
        }

        setRestaurantName(
          mine.restaurant.name
        );

        setReviewUrl(
          mine.restaurant.googleReviewUrl ??
            ''
        );

        setAllowPayAtRestaurant(
          mine.restaurant.allowPayAtRestaurant
        );

        const acceptance =
          secondsToMinutes(
            mine.restaurant
              .acceptanceSlaSeconds,
            DEFAULT_ACCEPTANCE
          );

        const kitchen =
          secondsToMinutes(
            mine.restaurant
              .kitchenSlaSeconds,
            DEFAULT_KITCHEN
          );

        const waiter =
          secondsToMinutes(
            mine.restaurant
              .waiterSlaSeconds,
            DEFAULT_WAITER
          );

        // Draft
        setAcceptanceSla(
          acceptance
        );

        setKitchenSla(
          kitchen
        );

        setWaiterSla(
          waiter
        );

        // Saved snapshot
        setSavedAcceptanceSla(
          acceptance
        );

        setSavedKitchenSla(
          kitchen
        );

        setSavedWaiterSla(
          waiter
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : t('dashboardCore.paymentsSettings.couldNotLoad')
        );
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [params.restaurantId]);

  // Draft total — changes while editing
  const draftTotalServiceSla =
    useMemo(() => {
      return calculateTotalMinutes(
        acceptanceSla,
        kitchenSla,
        waiterSla
      );
    }, [
      acceptanceSla,
      kitchenSla,
      waiterSla,
    ]);

  // Saved total — changes ONLY after Save
  const savedTotalServiceSla =
    useMemo(() => {
      return calculateTotalMinutes(
        savedAcceptanceSla,
        savedKitchenSla,
        savedWaiterSla
      );
    }, [
      savedAcceptanceSla,
      savedKitchenSla,
      savedWaiterSla,
    ]);

  const canSave =
    minutesToSeconds(
      acceptanceSla
    ) !== null &&
    minutesToSeconds(
      kitchenSla
    ) !== null &&
    minutesToSeconds(
      waiterSla
    ) !== null;

  function resetDraftToSaved() {
    setAcceptanceSla(
      savedAcceptanceSla
    );

    setKitchenSla(
      savedKitchenSla
    );

    setWaiterSla(
      savedWaiterSla
    );

    setError(null);
    setSlaSaved(false);
  }

  function resetToDefaults() {
    setAcceptanceSla(
      DEFAULT_ACCEPTANCE
    );

    setKitchenSla(
      DEFAULT_KITCHEN
    );

    setWaiterSla(
      DEFAULT_WAITER
    );

    setError(null);
    setSlaSaved(false);
  }

  async function startOnboarding() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/restaurants/${params.restaurantId}/stripe/connect`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json.error ??
            t('dashboardCore.paymentsSettings.couldNotStartStripe')
        );
      }

      window.location.href =
        json.onboardingUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('dashboardCore.paymentsSettings.couldNotStartStripe')
      );

      setLoading(false);
    }
  }

  async function togglePayAtRestaurant(
    next: boolean
  ) {
    setSavingPayAtRestaurant(true);
    setError(null);

    const previous = allowPayAtRestaurant;
    setAllowPayAtRestaurant(next);

    try {
      const res = await fetch(
        `/api/restaurants/${params.restaurantId}/settings`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            allowPayAtRestaurant: next,
          }),
        }
      );

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json.error ??
            t('dashboardCore.paymentsSettings.couldNotSavePayment')
        );
      }
    } catch (err) {
      setAllowPayAtRestaurant(previous);

      setError(
        err instanceof Error
          ? err.message
          : t('dashboardCore.paymentsSettings.couldNotSavePayment')
      );
    } finally {
      setSavingPayAtRestaurant(false);
    }
  }

  async function saveReviewUrl() {
    setSavingReview(true);
    setError(null);
    setSaved(false);

    try {
      const clean =
        reviewUrl.trim() || null;

      const res = await fetch(
        `/api/restaurants/${params.restaurantId}/settings`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            googleReviewUrl: clean,
          }),
        }
      );

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json.error ??
            t('dashboardCore.paymentsSettings.couldNotSaveReview')
        );
      }

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('dashboardCore.paymentsSettings.couldNotSaveReview')
      );
    } finally {
      setSavingReview(false);
    }
  }

  async function saveSlaSettings() {
    setSavingSla(true);
    setError(null);
    setSlaSaved(false);

    try {
      const acceptance =
        minutesToSeconds(
          acceptanceSla
        );

      const kitchen =
        minutesToSeconds(
          kitchenSla
        );

      const waiter =
        minutesToSeconds(
          waiterSla
        );

      if (
        acceptance === null ||
        kitchen === null ||
        waiter === null
      ) {
        throw new Error(
          t('dashboardCore.paymentsSettings.slaAllRequired')
        );
      }

      if (
        acceptance < 30 ||
        acceptance > 1800
      ) {
        throw new Error(
          t('dashboardCore.paymentsSettings.acceptanceRange')
        );
      }

      if (
        kitchen < 60 ||
        kitchen > 3600
      ) {
        throw new Error(
          t('dashboardCore.paymentsSettings.kitchenRange')
        );
      }

      if (
        waiter < 30 ||
        waiter > 1800
      ) {
        throw new Error(
          t('dashboardCore.paymentsSettings.waiterRange')
        );
      }

      const res = await fetch(
        `/api/restaurants/${params.restaurantId}/settings`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            acceptanceSlaSeconds:
              acceptance,

            kitchenSlaSeconds:
              kitchen,

            waiterSlaSeconds:
              waiter,
          }),
        }
      );

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json.error ??
            t('dashboardCore.paymentsSettings.couldNotSaveSla')
        );
      }

      /*
       * IMPORTANT:
       * Only update the saved snapshot after
       * the API confirms the save succeeded.
       *
       * Editing the form afterwards will NOT
       * change these saved values.
       */
      setSavedAcceptanceSla(
        String(acceptance / 60)
      );

      setSavedKitchenSla(
        String(kitchen / 60)
      );

      setSavedWaiterSla(
        String(waiter / 60)
      );

      setSlaSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('dashboardCore.paymentsSettings.couldNotSaveSla')
      );
    } finally {
      setSavingSla(false);
    }
  }

  const inputClass =
    'w-32 h-11 border border-line rounded-lg px-3 py-2 text-base bg-white text-black outline-none focus:border-black';

  return (
    <div className="max-w-2xl space-y-10">

      {/* HEADER */}

      <section>
        <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
          {t('dashboardCore.paymentsSettings.eyebrow')}
        </p>

        <h1 className="font-display text-3xl mt-1">
          {t('dashboardCore.paymentsSettings.title')}
        </h1>

        {restaurantName && (
          <p className="text-sm text-ink/50 mt-2">
            {restaurantName}
          </p>
        )}
      </section>

      {/* ERROR */}

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PAYMENTS */}

      <section className="border border-line p-6">
        <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
          {t('dashboardCore.paymentsSettings.paymentsEyebrow')}
        </p>

        <h2 className="font-display text-2xl mt-1">
          {t('dashboardCore.paymentsSettings.stripeHeading')}
        </h2>

        <p className="text-sm text-ink/60 mt-2 mb-6">
          {t('dashboardCore.paymentsSettings.stripeDescription')}
        </p>

        <button
          type="button"
          onClick={startOnboarding}
          disabled={loading}
          className="bg-ink text-paper rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
        >
          {loading
            ? t('dashboardCore.paymentsSettings.redirecting')
            : t('dashboardCore.paymentsSettings.connectStripe')}
        </button>

        <div className="mt-6 border-t border-line pt-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-black">
              {t('dashboardCore.paymentsSettings.payAtRestaurantLabel')}
            </p>

            <p className="text-xs text-ink/50 mt-1 max-w-sm">
              {t('dashboardCore.paymentsSettings.payAtRestaurantDescription')}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={allowPayAtRestaurant}
            disabled={savingPayAtRestaurant}
            onClick={() =>
              void togglePayAtRestaurant(
                !allowPayAtRestaurant
              )
            }
            className={`relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
              allowPayAtRestaurant
                ? 'bg-ink'
                : 'bg-ink/20'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                allowPayAtRestaurant
                  ? 'translate-x-5'
                  : ''
              }`}
            />
          </button>
        </div>
      </section>

      {/* GOOGLE REVIEWS */}

      <section className="border border-line p-6">
        <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
          {t('dashboardCore.paymentsSettings.customerExperienceEyebrow')}
        </p>

        <h2 className="font-display text-2xl mt-1">
          {t('dashboardCore.paymentsSettings.googleReviewsHeading')}
        </h2>

        <p className="text-sm text-ink/60 mt-2">
          {t('dashboardCore.paymentsSettings.googleReviewsDescription')}
        </p>

        <input
          value={reviewUrl}
          onChange={(e) =>
            setReviewUrl(
              e.target.value
            )
          }
          placeholder="https://g.page/r/..."
          className="mt-4 w-full border border-line rounded-lg px-3 py-2 text-sm bg-white text-black"
        />

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={saveReviewUrl}
            disabled={savingReview}
            className="bg-ink text-paper rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {savingReview
              ? t('common.saving')
              : t('dashboardCore.paymentsSettings.saveReviewLink')}
          </button>

          {saved && (
            <span className="text-sm text-green-700">
              {t('common.saved')}
            </span>
          )}
        </div>
      </section>

      {/* SLA */}

      <section className="border border-line p-6">

        <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
          {t('dashboardCore.paymentsSettings.serviceIntelligenceEyebrow')}
        </p>

        <h2 className="font-display text-2xl mt-1">
          {t('dashboardCore.paymentsSettings.slaHeading')}
        </h2>

        <p className="text-sm text-ink/60 mt-2">
          {t('dashboardCore.paymentsSettings.slaDescription')}
        </p>

        <div className="mt-6 space-y-7">

          {/* ACCEPTANCE */}

          <div>
            <label
              htmlFor="acceptance-sla"
              className="block text-sm font-medium text-black"
            >
              {t('dashboardCore.paymentsSettings.orderAcceptanceLabel')}
            </label>

            <p className="text-xs text-ink/45 mt-1">
              {t('dashboardCore.paymentsSettings.createdToAccepted')}
            </p>

            <div className="mt-2 flex items-center gap-3">
              <input
                id="acceptance-sla"
                type="text"
                inputMode="decimal"
                value={acceptanceSla}
                onChange={(e) => {
                  setAcceptanceSla(
                    e.target.value
                  );
                  setSlaSaved(false);
                }}
                className={inputClass}
                autoComplete="off"
              />

              <span className="text-sm text-ink/50">
                {t('dashboardCore.paymentsSettings.minutes')}
              </span>
            </div>

            <p className="text-xs text-ink/45 mt-2">
              {t('dashboardCore.paymentsSettings.savedValue')}{' '}
              <strong className="text-black">
                {formatMinutes(
                  savedAcceptanceSla
                )}
              </strong>
            </p>
          </div>

          {/* KITCHEN */}

          <div>
            <label
              htmlFor="kitchen-sla"
              className="block text-sm font-medium text-black"
            >
              {t('dashboardCore.paymentsSettings.kitchenServiceLabel')}
            </label>

            <p className="text-xs text-ink/45 mt-1">
              {t('dashboardCore.paymentsSettings.acceptedToReady')}
            </p>

            <div className="mt-2 flex items-center gap-3">
              <input
                id="kitchen-sla"
                type="text"
                inputMode="decimal"
                value={kitchenSla}
                onChange={(e) => {
                  setKitchenSla(
                    e.target.value
                  );
                  setSlaSaved(false);
                }}
                className={inputClass}
                autoComplete="off"
              />

              <span className="text-sm text-ink/50">
                {t('dashboardCore.paymentsSettings.minutes')}
              </span>
            </div>

            <p className="text-xs text-ink/45 mt-2">
              {t('dashboardCore.paymentsSettings.savedValue')}{' '}
              <strong className="text-black">
                {formatMinutes(
                  savedKitchenSla
                )}
              </strong>
            </p>
          </div>

          {/* WAITER */}

          <div>
            <label
              htmlFor="waiter-sla"
              className="block text-sm font-medium text-black"
            >
              {t('dashboardCore.paymentsSettings.waiterDeliveryLabel')}
            </label>

            <p className="text-xs text-ink/45 mt-1">
              {t('dashboardCore.paymentsSettings.readyToServed')}
            </p>

            <div className="mt-2 flex items-center gap-3">
              <input
                id="waiter-sla"
                type="text"
                inputMode="decimal"
                value={waiterSla}
                onChange={(e) => {
                  setWaiterSla(
                    e.target.value
                  );
                  setSlaSaved(false);
                }}
                className={inputClass}
                autoComplete="off"
              />

              <span className="text-sm text-ink/50">
                {t('dashboardCore.paymentsSettings.minutes')}
              </span>
            </div>

            <p className="text-xs text-ink/45 mt-2">
              {t('dashboardCore.paymentsSettings.savedValue')}{' '}
              <strong className="text-black">
                {formatMinutes(
                  savedWaiterSla
                )}
              </strong>
            </p>
          </div>

          {/* DRAFT TOTAL */}

          <div className="border-t border-line pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">
                  {t('dashboardCore.paymentsSettings.totalServiceLabel')}
                </p>

                <p className="text-xs text-ink/45 mt-1">
                  {t('dashboardCore.paymentsSettings.createdToServed')}
                </p>
              </div>

              <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
                {t('dashboardCore.paymentsSettings.automatic')}
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <p className="font-display text-4xl text-black">
                {formatMinutes(
                  draftTotalServiceSla
                )}
              </p>
            </div>

            <p className="text-xs text-ink/45 mt-2">
              {t('dashboardCore.paymentsSettings.currentDraft', {
                acceptance: acceptanceSla || '—',
                kitchen: kitchenSla || '—',
                waiter: waiterSla || '—',
              })}
            </p>
          </div>
        </div>

        {/* SAVE CONTROLS */}

        <div className="mt-7 border-t border-line pt-5 flex flex-wrap items-center gap-3">

          <button
            type="button"
            onClick={saveSlaSettings}
            disabled={
              savingSla ||
              !canSave
            }
            className="bg-ink text-paper rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {savingSla
              ? t('common.saving')
              : t('dashboardCore.paymentsSettings.saveSla')}
          </button>

          <button
            type="button"
            onClick={resetDraftToSaved}
            disabled={savingSla}
            className="border border-line text-ink rounded-lg px-4 py-2.5 text-sm hover:border-ink disabled:opacity-50"
          >
            {t('dashboardCore.paymentsSettings.undoChanges')}
          </button>

          <button
            type="button"
            onClick={resetToDefaults}
            disabled={savingSla}
            className="border border-line text-ink rounded-lg px-4 py-2.5 text-sm hover:border-ink disabled:opacity-50"
          >
            {t('dashboardCore.paymentsSettings.resetToDefaults')}
          </button>

          {slaSaved && (
            <span className="text-sm text-green-700">
              {t('common.saved')}
            </span>
          )}
        </div>
      </section>

      {/* SAVED TARGETS */}

      <section className="border border-dashed border-line p-5">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('dashboardCore.paymentsSettings.configurationEyebrow')}
            </p>

            <h2 className="font-display text-xl mt-1">
              {t('dashboardCore.paymentsSettings.savedTargetsHeading')}
            </h2>

            <p className="text-xs text-ink/45 mt-1">
              {t('dashboardCore.paymentsSettings.lastSavedValues')}
            </p>
          </div>

          <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
            {t('dashboardCore.paymentsSettings.persisted')}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="bg-ink/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('dashboardCore.paymentsSettings.acceptanceShort')}
            </p>

            <p className="font-display text-2xl mt-1">
              {formatMinutes(
                savedAcceptanceSla
              )}
            </p>
          </div>

          <div className="bg-ink/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('dashboardCore.paymentsSettings.kitchenShort')}
            </p>

            <p className="font-display text-2xl mt-1">
              {formatMinutes(
                savedKitchenSla
              )}
            </p>
          </div>

          <div className="bg-ink/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('dashboardCore.paymentsSettings.waiterShort')}
            </p>

            <p className="font-display text-2xl mt-1">
              {formatMinutes(
                savedWaiterSla
              )}
            </p>
          </div>

          <div className="bg-ink/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('common.total')}
            </p>

            <p className="font-display text-2xl mt-1">
              {formatMinutes(
                savedTotalServiceSla
              )}
            </p>
          </div>

        </div>

        <p className="text-[10px] text-ink/35 mt-4">
          {t('dashboardCore.paymentsSettings.autoCalculatedFooter')}
        </p>
      </section>

    </div>
  );
}