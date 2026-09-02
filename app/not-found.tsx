'use client';

import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
          {t('errorPages.notFound.eyebrow')}
        </p>

        <h1 className="font-display text-3xl mt-2">
          {t('errorPages.notFound.title')}
        </h1>

        <p className="text-sm text-ink/55 mt-3">
          {t('errorPages.notFound.body')}
        </p>

        <Link
          href="/"
          className="inline-block mt-6 bg-ink text-paper px-5 py-2.5 rounded-lg text-sm font-medium"
        >
          {t('errorPages.notFound.homeLink')}
        </Link>
      </div>
    </main>
  );
}
