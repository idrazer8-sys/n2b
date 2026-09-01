'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

/*
 * The single login screen now lives at "/login" ("/" is the public
 * marketing site). This route is kept so old links pointing at
 * "/dashboard/login" keep working.
 */
export default function DashboardLoginRedirect() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <p className="text-sm text-ink/50">{t('authPages.redirecting')}</p>
    </main>
  );
}
