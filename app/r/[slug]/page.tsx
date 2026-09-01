'use client';

import CustomerMenu from '@/components/CustomerMenu';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

export default function TableMenuPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: {
    t?: string;
    desserts?: string;
  };
}) {
  const { t } = useI18n();

  if (!searchParams.t) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <p className="font-display text-2xl mb-2">
            {t('customerFlow.noTable.title')}
          </p>

          <p className="text-ink/60">
            {t('customerFlow.noTable.body')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CustomerMenu
      slug={params.slug}
      token={searchParams.t}
      dessertOnly={searchParams.desserts === '1'}
    />
  );
}
