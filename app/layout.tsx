import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { I18nProvider } from '@/src/lib/i18n/I18nProvider';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from '@/src/lib/i18n/locales';

export const metadata: Metadata = {
  title: 'N2B — Restaurant Operations Automated',
  description: 'Smarter restaurants. Happier customers. A more efficient tomorrow.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  const initialLocale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html lang={initialLocale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink font-body antialiased">
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
