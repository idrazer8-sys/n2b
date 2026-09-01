'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

/*
 * There is only ONE login screen for the whole product now (the root
 * page, "/"). The user signs in once with email + password and the
 * server decides where they land based on their RestaurantStaff role
 * (see /api/auth/login, portal: "AUTO").
 *
 * This route is kept only so old links/bookmarks/QR codes pointing at
 * "/staff/[restaurantId]/login" keep working — it just forwards to the
 * single login screen.
 */
export default function WaiterLoginRedirect() {
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
