'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

// Catches any render/runtime error thrown by a page or component below the
// root layout that isn't already handled locally, so a bug never leaves the
// customer/staff looking at a blank screen or a raw Next.js stack trace.
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    // Never surface the raw message/stack to the user — just keep it in
    // the console for whoever is debugging this session.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
          {t('errorPages.error.eyebrow')}
        </p>

        <h1 className="font-display text-3xl mt-2">
          {t('errorPages.error.title')}
        </h1>

        <p className="text-sm text-ink/55 mt-3">
          {t('errorPages.error.body')}
        </p>

        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={reset}
            className="bg-ink text-paper px-5 py-2.5 rounded-lg text-sm font-medium"
          >
            {t('errorPages.error.retry')}
          </button>

          <Link
            href="/"
            className="border border-line px-5 py-2.5 rounded-lg text-sm font-medium"
          >
            {t('errorPages.error.homeLink')}
          </Link>
        </div>
      </div>
    </main>
  );
}
