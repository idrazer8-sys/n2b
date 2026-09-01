'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

/*
 * This used to be a "choose Manager / Waiter / Kitchen" screen that
 * pointed at a single hardcoded restaurant. The product now has ONE
 * login ("/") that detects the user's role automatically, so this
 * route just forwards there.
 */
export default function StaffEntryRedirect() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-n2bOffwhite px-6">
      <p className="text-sm text-n2bNavy/50">{t('authPages.redirecting')}</p>
    </main>
  );
}
