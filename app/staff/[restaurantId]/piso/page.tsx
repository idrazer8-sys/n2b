'use client';

import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';
import PisoBoard from '@/components/piso/PisoBoard';

export default function StaffPisoPage() {
  const params = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const restaurantId = params.restaurantId;
  const { t } = useI18n();

  return (
    <main className="theme-n2b pb-12 px-4 pt-6 max-w-5xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <N2BLogo markSize={26} wordmarkClassName="text-base leading-none text-ink" className="mb-4" />
          <h1 className="font-display text-4xl mt-1">{t('floorPlan.title')}</h1>
          <p className="text-sm text-ink/50 mt-2">{t('floorPlan.subtitleWaiter')}</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => router.push(`/staff/${restaurantId}`)}
            className="border border-line rounded-lg px-3 py-2 text-xs"
          >
            {t('staffMisc.tables.backToWaiter')}
          </button>
        </div>
      </div>

      <PisoBoard restaurantId={restaurantId} editable={false} scopeToMine />
    </main>
  );
}
