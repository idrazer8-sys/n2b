'use client';

import { useI18n } from '@/src/lib/i18n/I18nProvider';
import PisoBoard from '@/components/piso/PisoBoard';

export default function DashboardPisoPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { t } = useI18n();

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="font-display text-3xl mt-1">{t('floorPlan.title')}</h1>
        <p className="text-sm text-ink/50 mt-2">
          {t('floorPlan.subtitleManager')}
        </p>
      </div>

      <PisoBoard
        restaurantId={params.restaurantId}
        editable
        scopeToMine={false}
      />
    </div>
  );
}
