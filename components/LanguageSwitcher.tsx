'use client';

import { useI18n } from '@/src/lib/i18n/I18nProvider';
import { LOCALES, LOCALE_LABELS, Locale } from '@/src/lib/i18n/locales';

export default function LanguageSwitcher({
  className,
}: {
  className?: string;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <select
      aria-label={t('common.language')}
      value={locale}
      onChange={(event) => setLocale(event.target.value as Locale)}
      className={
        className ??
        'border border-line rounded-lg px-2 py-1.5 text-xs bg-white text-black outline-none focus:border-black'
      }
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {LOCALE_LABELS[code]}
        </option>
      ))}
    </select>
  );
}
