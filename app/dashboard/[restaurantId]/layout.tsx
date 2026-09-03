'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SupportChatWidget from '@/components/SupportChatWidget';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';
import {
  DashboardIcon,
  MenuBookIcon,
  TableIcon,
  OrdersIcon,
  AnalyticsIcon,
  PaymentsIcon,
  MembershipIcon,
  StaffIcon,
  KitchenIcon,
  WaiterBellIcon,
  SignOutIcon,
  FloorPlanIcon,
  CalendarIcon,
  BanknoteIcon,
  ReceiptIcon,
} from '@/components/branding/icons';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type MembershipStatus =
  | 'INCOMPLETE'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED';

export default function RestaurantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { restaurantId: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const base = `/dashboard/${params.restaurantId}`;
  const billingHref = `${base}/billing`;

  const [membershipStatus, setMembershipStatus] =
    useState<MembershipStatus | null>(null);

  const [trialDaysLeft, setTrialDaysLeft] =
    useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkMembership() {
      try {
        const response = await fetch(
          `/api/restaurants/${params.restaurantId}/membership`,
          { credentials: 'include', cache: 'no-store' }
        );

        if (response.status === 401) {
          router.replace('/login');
          return;
        }

        const json = await response.json();
        if (cancelled) return;

        setMembershipStatus(json.status);

        if (json.status === 'TRIALING' && json.trialEndsAt) {
          setTrialDaysLeft(
            Math.max(
              0,
              Math.ceil(
                (new Date(json.trialEndsAt).getTime() - Date.now()) /
                  86_400_000
              )
            )
          );
        }

        const active =
          json.status === 'TRIALING' || json.status === 'ACTIVE';

        if (!active && pathname !== billingHref) {
          router.replace(billingHref);
        }
      } catch {
        // Best-effort — a failed check doesn't lock the user out of an
        // already-rendered page.
      }
    }

    void checkMembership();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.restaurantId, pathname]);

  const NAV = [
    { key: 'hub', label: t('dashboardCore.nav.dashboard'), href: base, icon: DashboardIcon },
    { key: 'menu', label: t('dashboardCore.nav.menu'), href: `${base}/menu`, icon: MenuBookIcon },
    { key: 'tables', label: t('dashboardCore.nav.tables'), href: `${base}/tables`, icon: TableIcon },
    { key: 'piso', label: t('floorPlan.title'), href: `${base}/piso`, icon: FloorPlanIcon },
    { key: 'reservations', label: t('reservations.title'), href: `${base}/reservations`, icon: CalendarIcon },
    { key: 'cash', label: t('cashDrawer.title'), href: `${base}/cash`, icon: BanknoteIcon },
    { key: 'orders', label: t('dashboardCore.nav.orders'), href: `${base}/orders`, icon: OrdersIcon },
    { key: 'analytics', label: t('dashboardCore.nav.analytics'), href: `${base}/analytics`, icon: AnalyticsIcon },
    { key: 'financials', label: t('financials.title'), href: `${base}/financials`, icon: ReceiptIcon },
    { key: 'waiters', label: t('dashboardCore.nav.waiters'), href: `${base}/waiters`, icon: StaffIcon },
    { key: 'payments', label: t('dashboardCore.nav.payments'), href: `${base}/settings/payments`, icon: PaymentsIcon },
    { key: 'billing', label: t('billing.title'), href: billingHref, icon: MembershipIcon },
  ];

  const PORTALS = [
    { key: 'kitchen', label: t('dashboardCore.nav.kitchen'), href: `/kitchen/${params.restaurantId}`, icon: KitchenIcon },
    { key: 'waiter', label: t('dashboardCore.nav.waiter'), href: `/staff/${params.restaurantId}`, icon: WaiterBellIcon },
  ];

  function isActive(href: string) {
    if (href === base) return pathname === base;
    return pathname?.startsWith(href) ?? false;
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  }

  return (
    <div className="theme-n2b min-h-screen bg-paper text-ink">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-n2bNavy text-n2bOffwhite">
        <div className="px-5 pt-6 pb-5">
          <N2BLogo
            markSize={32}
            wordmarkClassName="text-lg leading-none text-white"
          />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <a
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-n2bPurple text-white'
                    : 'text-n2bOffwhite/65 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/10">
            <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.15em] text-n2bOffwhite/35">
              {t('dashboardCore.nav.portalsHeading')}
            </p>

            {PORTALS.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-n2bOffwhite/65 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Icon size={18} />
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>

        <div className="px-3 pb-5 pt-3 border-t border-white/10 space-y-2">
          <LanguageSwitcher className="w-full border border-white/15 rounded-lg px-2 py-1.5 text-xs bg-white/5 text-n2bOffwhite outline-none focus:border-white/40" />

          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-n2bOffwhite/65 transition-colors hover:bg-white/5 hover:text-white"
          >
            <SignOutIcon size={18} />
            {t('common.signOut')}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden bg-n2bNavy text-n2bOffwhite">
        <div className="flex items-center justify-between px-4 py-3">
          <N2BLogo markSize={26} wordmarkClassName="text-base leading-none text-white" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="border border-white/15 rounded-lg px-2 py-1 text-xs bg-white/5 text-n2bOffwhite outline-none" />
            <button
              type="button"
              onClick={() => void signOut()}
              className="border border-white/15 rounded-lg px-2 py-1.5 text-n2bOffwhite/70"
              aria-label={t('common.signOut')}
            >
              <SignOutIcon size={16} />
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto no-scrollbar px-3 pb-3">
          {[...NAV, ...PORTALS].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <a
                key={item.key}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap ${
                  active
                    ? 'bg-n2bPurple text-white'
                    : 'bg-white/5 text-n2bOffwhite/65'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="md:pl-64">
        {membershipStatus === 'TRIALING' &&
          pathname !== billingHref && (
            <div className="bg-n2bLavender/25 border-b border-n2bPurple/20 px-6 py-2.5 text-center text-sm text-n2bNavy">
              {trialDaysLeft !== null && trialDaysLeft <= 0
                ? t('billing.trialBannerLastDay')
                : t('billing.trialBannerText', {
                    days: trialDaysLeft ?? 0,
                  })}{' '}
              <a
                href={billingHref}
                className="underline font-medium"
              >
                {t('billing.trialBannerManageLink')}
              </a>
            </div>
          )}

        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </div>

      <SupportChatWidget restaurantId={params.restaurantId} />
    </div>
  );
}
