'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_LOCALE,
  Locale,
  LOCALE_COOKIE,
  isLocale,
} from './locales';
import { buildDictionary } from './dictionaries';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(
  template: string,
  vars?: Record<string, string | number>
) {
  if (!vars) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    vars[key] !== undefined ? String(vars[key]) : match
  );
}

function readLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : null;

  return isLocale(value) ? value : null;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ?? DEFAULT_LOCALE
  );

  // Reconcile with the cookie on mount — covers the case where the
  // server-rendered guess (or default) doesn't match what the visitor
  // last chose on this device.
  useEffect(() => {
    const fromCookie = readLocaleCookie();

    if (fromCookie && fromCookie !== locale) {
      setLocaleState(fromCookie);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const dictionary = useMemo(() => buildDictionary(locale), [locale]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const template = dictionary[key];

      if (template === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[i18n] Missing translation key: ${key}`);
        }
        return key;
      }

      return interpolate(template, vars);
    },
    [dictionary]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);

  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return ctx;
}
