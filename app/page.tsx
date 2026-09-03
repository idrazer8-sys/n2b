'use client';

import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo, { N2BMark } from '@/components/branding/N2BLogo';
import { formatCents } from '@/src/lib/format';
import {
  QrIcon,
  PaymentsIcon,
  KitchenIcon,
  WaiterBellIcon,
  AnalyticsIcon,
  GlobeIcon,
  StarIcon,
} from '@/components/branding/icons';

const FEATURES = [
  { icon: QrIcon, titleKey: 'marketing.feature1.title', bodyKey: 'marketing.feature1.body' },
  { icon: PaymentsIcon, titleKey: 'marketing.feature2.title', bodyKey: 'marketing.feature2.body' },
  { icon: KitchenIcon, titleKey: 'marketing.feature3.title', bodyKey: 'marketing.feature3.body' },
  { icon: WaiterBellIcon, titleKey: 'marketing.feature4.title', bodyKey: 'marketing.feature4.body' },
  { icon: AnalyticsIcon, titleKey: 'marketing.feature5.title', bodyKey: 'marketing.feature5.body' },
  { icon: GlobeIcon, titleKey: 'marketing.feature6.title', bodyKey: 'marketing.feature6.body' },
  { icon: StarIcon, titleKey: 'marketing.feature7.title', bodyKey: 'marketing.feature7.body' },
];

const WHY = [
  { titleKey: 'marketing.why1.title', bodyKey: 'marketing.why1.body' },
  { titleKey: 'marketing.why2.title', bodyKey: 'marketing.why2.body' },
  { titleKey: 'marketing.why3.title', bodyKey: 'marketing.why3.body' },
  { titleKey: 'marketing.why4.title', bodyKey: 'marketing.why4.body' },
];

const TIERS = [
  {
    id: 'BASIC',
    nameKey: 'billing.tierBasicName',
    taglineKey: 'billing.tierBasicTagline',
    priceMonthlyCents: 3900,
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
    featureKeys: [
      'billing.featureMultiLocation',
      'billing.featureStaffUnlimited',
      'billing.featureAnalyticsMultiLocation',
      'billing.featureAiImport',
      'billing.featureSupportDedicated',
    ],
  },
] as const;

export default function MarketingPage() {
  const { t } = useI18n();

  return (
    <div className="bg-white text-n2bNavy">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-n2bNavy/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <N2BLogo markSize={30} wordmarkClassName="text-lg leading-none text-white" />

          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition-colors">
              {t('marketing.nav.features')}
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              {t('marketing.nav.pricing')}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden sm:block border border-white/15 rounded-lg px-2 py-1.5 text-xs bg-white/5 text-white outline-none focus:border-white/40" />

            <a
              href="/login"
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              {t('marketing.nav.login')}
            </a>

            <a
              href="/dashboard/register"
              className="bg-n2bPurple text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t('marketing.nav.getStarted')}
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-n2bNavy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 50% at 80% 10%, rgba(91,61,255,0.35), transparent), radial-gradient(50% 40% at 10% 90%, rgba(139,108,255,0.25), transparent)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-n2bLavender">
              {t('marketing.hero.eyebrow')}
            </p>

            <h1 className="font-display text-4xl md:text-6xl font-black leading-[1.05] mt-4 tracking-tight">
              {t('marketing.hero.headline')}
            </h1>

            <p className="text-white/70 text-base md:text-lg mt-6 max-w-lg">
              {t('marketing.hero.subheadline')}
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <a
                href="/dashboard/register"
                className="bg-n2bPurple text-white rounded-lg px-6 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {t('marketing.hero.ctaPrimary')}
              </a>

              <a
                href="#features"
                className="border border-white/20 text-white rounded-lg px-6 py-3.5 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                {t('marketing.hero.ctaSecondary')}
              </a>
            </div>

            <p className="text-xs text-white/40 mt-5">{t('marketing.hero.trustNote')}</p>
          </div>

          {/* Dashboard preview card */}
          <div className="relative">
            <div className="rounded-2xl border border-white/10 bg-n2bNavy shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
                <N2BMark size={18} />
                <span className="text-xs font-semibold text-white/80">N2B</span>
                <span className="ml-auto flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                  <span className="h-2 w-2 rounded-full bg-white/15" />
                </span>
              </div>

              <div className="p-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'INGRESOS', value: '€1,284' },
                  { label: 'PEDIDOS', value: '38' },
                  { label: 'MESAS', value: '12' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  >
                    <p className="text-[9px] uppercase tracking-[0.1em] text-white/35">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold text-white mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[9px] uppercase tracking-[0.1em] text-white/35 mb-3">
                    Pedidos por hora
                  </p>
                  <div className="flex items-end gap-1.5 h-16">
                    {[30, 55, 40, 70, 90, 65, 45, 80, 60, 35].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-n2bPurple"
                        style={{ height: `${h}%`, opacity: 0.5 + (h / 100) * 0.5 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* QR table card, floating */}
            <div className="hidden sm:block absolute -bottom-8 -left-8 w-40 rounded-xl border border-white/10 bg-n2bNavy shadow-2xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <N2BMark size={16} />
                <span className="text-[10px] font-semibold text-white/80">N2B</span>
              </div>
              <div className="aspect-square rounded bg-white grid grid-cols-5 grid-rows-5 gap-0.5 p-1.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      [0, 1, 2, 5, 6, 10, 4, 9, 14, 20, 21, 22, 24, 12, 13, 18].includes(i)
                        ? 'bg-n2bNavy rounded-[1px]'
                        : ''
                    }
                  />
                ))}
              </div>
              <p className="text-center text-[10px] text-white/50 mt-2">
                {t('marketing.qr.tableLabel')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN / PROBLEM */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-n2bPurple font-medium">
          {t('marketing.pain.eyebrow')}
        </p>

        <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 leading-tight">
          {t('marketing.pain.headline')}
        </h2>

        <p className="text-n2bNavy/60 text-base md:text-lg mt-5 max-w-2xl mx-auto">
          {t('marketing.pain.body')}
        </p>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-n2bOffwhite py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.2em] text-n2bPurple font-medium">
              {t('marketing.features.eyebrow')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
              {t('marketing.features.headline')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.titleKey}
                  className="bg-white rounded-2xl border border-n2bNavy/8 p-6"
                >
                  <div className="h-10 w-10 rounded-lg bg-n2bPurple/10 flex items-center justify-center text-n2bPurple">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-lg mt-4">{t(feature.titleKey)}</h3>
                  <p className="text-sm text-n2bNavy/55 mt-2 leading-relaxed">
                    {t(feature.bodyKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY N2B — persuasion cards */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-n2bPurple font-medium">
            {t('marketing.why.eyebrow')}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
            {t('marketing.why.headline')}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mt-12">
          {WHY.map((item, index) => (
            <div
              key={item.titleKey}
              className="border border-n2bNavy/8 rounded-2xl p-6 flex gap-4"
            >
              <span className="shrink-0 h-9 w-9 rounded-full bg-n2bNavy text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold text-lg">{t(item.titleKey)}</h3>
                <p className="text-sm text-n2bNavy/55 mt-1.5 leading-relaxed">
                  {t(item.bodyKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCT PREVIEW / QR */}
      <section className="bg-n2bNavy text-white py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-n2bLavender font-medium">
              {t('marketing.preview.eyebrow')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
              {t('marketing.preview.headline')}
            </h2>
            <p className="text-white/60 mt-4 max-w-md">{t('marketing.preview.body')}</p>

            <div className="mt-10 pt-8 border-t border-white/10">
              <p className="text-[11px] uppercase tracking-[0.2em] text-n2bLavender font-medium">
                {t('marketing.qr.eyebrow')}
              </p>
              <p className="text-white/60 mt-3 max-w-md text-sm">{t('marketing.qr.body')}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <div className="rounded-xl bg-n2bNavy border border-white/10 overflow-hidden">
              <div className="flex">
                <div className="w-32 bg-white/[0.03] border-r border-white/10 py-4 px-3 space-y-2 text-[10px] text-white/50">
                  <div className="flex items-center gap-1.5 px-1 pb-3">
                    <N2BMark size={14} />
                    <span className="font-semibold text-white/80">N2B</span>
                  </div>
                  {['Panel', 'Menú', 'Mesas', 'Pedidos', 'Analítica', 'Personal', 'Pagos'].map(
                    (item, i) => (
                      <div
                        key={item}
                        className={`px-2 py-1.5 rounded ${
                          i === 3 ? 'bg-n2bPurple text-white' : ''
                        }`}
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>

                <div className="flex-1 p-4 space-y-2">
                  {[
                    { n: '#128', s: 'NUEVO', c: 'bg-n2bPurple' },
                    { n: '#127', s: 'EN COCINA', c: 'bg-amber-500' },
                    { n: '#126', s: 'LISTO', c: 'bg-emerald-500' },
                  ].map((order) => (
                    <div
                      key={order.n}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs"
                    >
                      <span className="text-white/70">{order.n}</span>
                      <span
                        className={`${order.c} text-white text-[9px] uppercase tracking-[0.08em] rounded-full px-2 py-0.5`}
                      >
                        {order.s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.2em] text-n2bPurple font-medium">
            {t('marketing.pricing.eyebrow')}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
            {t('marketing.pricing.headline')}
          </h2>
          <p className="text-n2bNavy/55 mt-4">{t('marketing.pricing.subheadline')}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3 mt-12">
          {TIERS.map((tier) => {
            const isPro = tier.id === 'PRO';

            return (
              <div
                key={tier.id}
                className={`rounded-2xl border p-6 flex flex-col ${
                  isPro
                    ? 'border-n2bPurple bg-n2bPurple/[0.03] shadow-lg md:-translate-y-2'
                    : 'border-n2bNavy/10 bg-white'
                }`}
              >
                <h3 className="font-display text-2xl">{t(tier.nameKey)}</h3>
                <p className="text-sm text-n2bNavy/50 mt-1 min-h-[2.5rem]">
                  {t(tier.taglineKey)}
                </p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold">
                    {formatCents(tier.priceMonthlyCents, 'EUR')}
                  </span>
                  <span className="text-sm text-n2bNavy/40">
                    {t('billing.perMonth')}
                  </span>
                </div>

                <ul className="mt-5 space-y-2 flex-1">
                  {tier.featureKeys.map((key) => (
                    <li key={key} className="text-sm text-n2bNavy/70 flex items-start gap-2">
                      <span className="text-n2bPurple mt-0.5">✓</span>
                      {t(key)}
                    </li>
                  ))}
                </ul>

                <a
                  href="/dashboard/register"
                  className={`mt-6 text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 ${
                    isPro
                      ? 'bg-n2bPurple text-white'
                      : 'border border-n2bNavy/15 text-n2bNavy'
                  }`}
                >
                  {t('billing.startTrial')}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-n2bNavy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(50% 60% at 50% 0%, rgba(91,61,255,0.4), transparent)',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-black leading-tight">
            {t('marketing.finalCta.headline')}
          </h2>
          <p className="text-white/65 mt-5 max-w-xl mx-auto">{t('marketing.finalCta.body')}</p>

          <a
            href="/dashboard/register"
            className="inline-block mt-8 bg-n2bPurple text-white rounded-lg px-8 py-4 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {t('marketing.finalCta.cta')}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-n2bNavy border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <N2BLogo markSize={24} wordmarkClassName="text-base leading-none text-white" />
            <p className="text-xs text-white/40 mt-2">{t('marketing.footer.tagline')}</p>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/60">
            <a href="/login" className="hover:text-white transition-colors">
              {t('marketing.footer.linkLogin')}
            </a>
            <a href="/dashboard/register" className="hover:text-white transition-colors">
              {t('marketing.footer.linkRegister')}
            </a>
            <a href="/legal/terms" className="hover:text-white transition-colors">
              {t('legal.footer.termsLink')}
            </a>
            <a href="/legal/privacy" className="hover:text-white transition-colors">
              {t('legal.footer.privacyLink')}
            </a>
            <LanguageSwitcher className="border border-white/15 rounded-lg px-2 py-1.5 text-xs bg-white/5 text-white outline-none focus:border-white/40" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-8 text-xs text-white/30">
          {t('marketing.footer.copyright')}
        </div>
      </footer>
    </div>
  );
}
