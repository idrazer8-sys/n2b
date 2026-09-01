'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import { formatCents } from '@/src/lib/format';

type Tier = 'BASIC' | 'PRO' | 'BUSINESS';
type BillingPeriod = 'MONTHLY' | 'ANNUAL';

type MembershipStatus =
  | 'INCOMPLETE'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED';

type Membership = {
  tier: Tier | null;
  status: MembershipStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const TIERS: Array<{
  id: Tier;
  nameKey: string;
  taglineKey: string;
  priceMonthlyCents: number;
  priceAnnualCents: number;
  featureKeys: string[];
}> = [
  {
    id: 'BASIC',
    nameKey: 'billing.tierBasicName',
    taglineKey: 'billing.tierBasicTagline',
    priceMonthlyCents: 3900,
    priceAnnualCents: 39000,
    featureKeys: [
      'billing.featureTablesLimited',
      'billing.featureStaffLimited',
      'billing.featureAnalyticsBasic',
      'billing.featureSupportEmail',
    ],
  },
  {
    id: 'PRO',
    nameKey: 'billing.tierProName',
    taglineKey: 'billing.tierProTagline',
    priceMonthlyCents: 9900,
    priceAnnualCents: 99000,
    featureKeys: [
      'billing.featureTablesUnlimited',
      'billing.featureStaffUnlimited',
      'billing.featureAnalyticsFull',
      'billing.featureAiImport',
      'billing.featureSupportPriority',
    ],
  },
  {
    id: 'BUSINESS',
    nameKey: 'billing.tierBusinessName',
    taglineKey: 'billing.tierBusinessTagline',
    priceMonthlyCents: 24900,
    priceAnnualCents: 249000,
    featureKeys: [
      'billing.featureMultiLocation',
      'billing.featureStaffUnlimited',
      'billing.featureAnalyticsMultiLocation',
      'billing.featureAiImport',
      'billing.featureSupportDedicated',
    ],
  },
];

export default function BillingPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { t, locale } = useI18n();

  const [membership, setMembership] =
    useState<Membership | null>(null);

  const [currency, setCurrency] = useState('EUR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [billingPeriod, setBillingPeriod] =
    useState<BillingPeriod>('MONTHLY');

  const [checkingOutTier, setCheckingOutTier] =
    useState<Tier | null>(null);

  const [openingPortal, setOpeningPortal] =
    useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [membershipRes, restaurantsRes] = await Promise.all([
        fetch(
          `/api/restaurants/${params.restaurantId}/membership`,
          { credentials: 'include', cache: 'no-store' }
        ),
        fetch('/api/restaurants', {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      const membershipJson = await membershipRes.json();

      if (!membershipRes.ok) {
        throw new Error(
          membershipJson.error ?? t('billing.couldNotLoad')
        );
      }

      setMembership(membershipJson);

      const restaurantsJson = await restaurantsRes
        .json()
        .catch(() => []);

      if (Array.isArray(restaurantsJson)) {
        const mine = restaurantsJson.find(
          (item: { restaurant: { id: string; currency: string } }) =>
            item.restaurant.id === params.restaurantId
        );

        if (mine) setCurrency(mine.restaurant.currency);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('billing.couldNotLoad')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.restaurantId]);

  async function startTrial(tier: Tier) {
    setCheckingOutTier(tier);
    setError(null);

    try {
      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/membership/checkout`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, billingPeriod }),
        }
      );

      const json = await response.json();

      if (!response.ok || !json.checkoutUrl) {
        throw new Error(
          json.error ?? t('billing.couldNotStartCheckout')
        );
      }

      window.location.href = json.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('billing.couldNotStartCheckout')
      );
      setCheckingOutTier(null);
    }
  }

  async function openPortal() {
    setOpeningPortal(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/membership/portal`,
        { method: 'POST', credentials: 'include' }
      );

      const json = await response.json();

      if (!response.ok || !json.portalUrl) {
        throw new Error(
          json.error ?? t('billing.couldNotOpenPortal')
        );
      }

      window.location.href = json.portalUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('billing.couldNotOpenPortal')
      );
      setOpeningPortal(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const showTierSelection =
    !membership ||
    membership.status === 'INCOMPLETE' ||
    membership.status === 'CANCELED';

  const trialDaysLeft =
    membership?.trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(membership.trialEndsAt).getTime() -
              Date.now()) /
              86_400_000
          )
        )
      : null;

  return (
    <div className="theme-n2b max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
          {t('dashboardCore.paymentsSettings.eyebrow')}
        </p>

        <h1 className="font-display text-3xl mt-1">
          {t('billing.title')}
        </h1>

        <p className="text-sm text-ink/50 mt-2">
          {showTierSelection
            ? t('billing.subtitleChoose')
            : t('billing.subtitleManage')}
        </p>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-ink/40">{t('common.loading')}</p>
      )}

      {!loading && membership?.status === 'PAST_DUE' && (
        <div className="border border-amber-300 bg-amber-50 rounded-xl p-5">
          <h2 className="font-display text-xl text-amber-900">
            {t('billing.pastDueTitle')}
          </h2>
          <p className="text-sm text-amber-800 mt-1">
            {t('billing.pastDueBody')}
          </p>
          <button
            type="button"
            onClick={() => void openPortal()}
            disabled={openingPortal}
            className="mt-4 bg-n2bPurple text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {openingPortal
              ? t('billing.openingPortal')
              : t('billing.updatePaymentMethod')}
          </button>
        </div>
      )}

      {!loading &&
        membership &&
        (membership.status === 'TRIALING' ||
          membership.status === 'ACTIVE') && (
          <div className="border border-line rounded-xl p-6 bg-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                  {t('billing.currentPlanLabel')}
                </p>

                <h2 className="font-display text-2xl mt-1 flex items-center gap-2">
                  {membership.tier
                    ? t(
                        TIERS.find((tr) => tr.id === membership.tier)
                          ?.nameKey ?? 'billing.tierProName'
                      )
                    : '—'}

                  {membership.status === 'TRIALING' && (
                    <span className="text-xs font-medium bg-n2bLavender/40 text-n2bNavy rounded-full px-2.5 py-0.5">
                      {t('billing.trialBadge')}
                    </span>
                  )}
                </h2>

                {membership.status === 'TRIALING' &&
                  trialDaysLeft !== null && (
                    <p className="text-sm text-n2bPurple mt-2">
                      {trialDaysLeft <= 0
                        ? t('billing.trialLastDay')
                        : t('billing.trialDaysLeft', {
                            days: trialDaysLeft,
                          })}
                    </p>
                  )}

                {membership.currentPeriodEnd && (
                  <p className="text-sm text-ink/50 mt-2">
                    {membership.cancelAtPeriodEnd
                      ? t('billing.cancelScheduled', {
                          date: formatDate(
                            membership.currentPeriodEnd
                          ),
                        })
                      : t('billing.renewsOn', {
                          date: formatDate(
                            membership.currentPeriodEnd
                          ),
                        })}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => void openPortal()}
                disabled={openingPortal}
                className="border border-line rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {openingPortal
                  ? t('billing.openingPortal')
                  : t('billing.manageBilling')}
              </button>
            </div>
          </div>
        )}

      {!loading && showTierSelection && (
        <>
          <div className="flex justify-center">
            <div className="inline-flex border border-line rounded-lg overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setBillingPeriod('MONTHLY')}
                className={`px-4 py-2 ${
                  billingPeriod === 'MONTHLY'
                    ? 'bg-n2bPurple text-white'
                    : 'bg-white text-ink/60'
                }`}
              >
                {t('billing.monthly')}
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('ANNUAL')}
                className={`px-4 py-2 flex items-center gap-1.5 ${
                  billingPeriod === 'ANNUAL'
                    ? 'bg-n2bPurple text-white'
                    : 'bg-white text-ink/60'
                }`}
              >
                {t('billing.annual')}
                <span
                  className={`text-[10px] uppercase tracking-[0.05em] rounded-full px-1.5 py-0.5 ${
                    billingPeriod === 'ANNUAL'
                      ? 'bg-white/20 text-white'
                      : 'bg-n2bLavender/40 text-n2bNavy'
                  }`}
                >
                  {t('billing.annualSavings')}
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {TIERS.map((tier) => {
              const priceCents =
                billingPeriod === 'MONTHLY'
                  ? tier.priceMonthlyCents
                  : tier.priceAnnualCents;

              const isPro = tier.id === 'PRO';

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl border p-6 flex flex-col ${
                    isPro
                      ? 'border-n2bPurple bg-n2bPurple/[0.03] shadow-sm'
                      : 'border-line bg-white'
                  }`}
                >
                  <h3 className="font-display text-2xl">
                    {t(tier.nameKey)}
                  </h3>

                  <p className="text-sm text-ink/50 mt-1 min-h-[2.5rem]">
                    {t(tier.taglineKey)}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-3xl">
                      {formatCents(priceCents, currency)}
                    </span>
                    <span className="text-sm text-ink/40">
                      {billingPeriod === 'MONTHLY'
                        ? t('billing.perMonth')
                        : t('billing.perYear')}
                    </span>
                  </div>

                  <ul className="mt-5 space-y-2 flex-1">
                    {tier.featureKeys.map((key) => (
                      <li
                        key={key}
                        className="text-sm text-ink/70 flex items-start gap-2"
                      >
                        <span className="text-n2bPurple mt-0.5">
                          ✓
                        </span>
                        {t(key)}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => void startTrial(tier.id)}
                    disabled={checkingOutTier !== null}
                    className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
                      isPro
                        ? 'bg-n2bPurple text-white hover:opacity-90'
                        : 'border border-line text-ink hover:border-ink'
                    }`}
                  >
                    {checkingOutTier === tier.id
                      ? t('billing.startingTrial')
                      : t('billing.startTrial')}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-ink/40">
            {t('billing.cardRequiredNote')}
          </p>
        </>
      )}
    </div>
  );
}
