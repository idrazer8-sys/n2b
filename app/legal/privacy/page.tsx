'use client';

import Link from 'next/link';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

const LAST_UPDATED = '2026-09-03';

export default function PrivacyPolicyPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-paper text-ink px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-xs text-ink/50 hover:text-ink transition-colors">
          ← {t('legal.backLink')}
        </Link>

        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40 mt-6">
          {t('legal.privacy.eyebrow')}
        </p>
        <h1 className="font-display text-3xl mt-2">{t('legal.privacy.title')}</h1>
        <p className="text-xs text-ink/40 mt-2">
          {t('legal.lastUpdated')}: {LAST_UPDATED}
        </p>

        <div className="mt-6 border border-amber-600/30 bg-amber-50 text-amber-900 text-sm px-4 py-3 rounded-lg">
          ⚠️ {t('legal.disclaimerBanner')}
        </div>

        <article className="mt-10 space-y-8 text-sm leading-relaxed text-ink/80 [&_h2]:font-display [&_h2]:text-lg [&_h2]:text-ink [&_h2]:mb-2 [&_h2]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          <section>
            <h2>1. Who we are</h2>
            <p>
              N2B (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a table-ordering platform used by
              restaurants (&ldquo;Restaurants&rdquo;, &ldquo;you&rdquo; if you manage one) and their
              customers (&ldquo;Diners&rdquo;). This policy explains what we collect, why, and what
              rights you have over it. It applies to the marketing site, the restaurant
              dashboard/kitchen/waiter portals, and the customer ordering pages.
            </p>
          </section>

          <section>
            <h2>2. What we collect</h2>
            <p>
              <strong>Restaurant staff accounts:</strong> name, email address, hashed password
              (never the plaintext password), and role/portal assignment.
            </p>
            <p>
              <strong>Diners:</strong> by design, ordering a meal creates no account and stores no
              personal information — a table visit is identified only by an anonymous session
              cookie scoped to that restaurant and table, an order history, and (if you choose to
              pay online) a Stripe-hosted checkout that we never see card details for. If a future
              feature adds receipts-by-email or a loyalty program, that would collect personal data
              and this policy would be updated to say so before it launches.
            </p>
            <p>
              <strong>Payment data:</strong> handled entirely by Stripe. We store only Stripe&rsquo;s
              own reference IDs (checkout session ID, payment intent ID) and a status — never card
              numbers, expiry dates, or CVCs.
            </p>
            <p>
              <strong>Automatically collected:</strong> standard server logs (IP address, user
              agent, request timestamps) and, if configured, error/crash reports via our error
              monitoring provider (Sentry) and product-usage signals via our hosting provider.
            </p>
          </section>

          <section>
            <h2>3. Why we collect it</h2>
            <ul>
              <li>To operate the ordering, kitchen, and payment flows you&rsquo;re actually using.</li>
              <li>To keep restaurant data isolated from other restaurants on the platform.</li>
              <li>To secure accounts (rate limiting, session cookies) against abuse.</li>
              <li>To diagnose and fix bugs when something breaks in production.</li>
              <li>To bill restaurants for their platform subscription, via Stripe.</li>
            </ul>
          </section>

          <section>
            <h2>4. Who we share it with</h2>
            <p>We use a small number of processors, each only for the purpose named:</p>
            <ul>
              <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
              <li><strong>Our database/hosting providers</strong> — storing and running the application.</li>
              <li><strong>Sentry</strong> (if configured) — error monitoring, to catch production crashes.</li>
              <li><strong>Google (Gemini API)</strong> (if configured) — AI-assisted menu import from photos, restaurant-side only.</li>
            </ul>
            <p>We do not sell personal data, and do not share it for third-party advertising.</p>
          </section>

          <section>
            <h2>5. Cookies</h2>
            <p>
              We use functional cookies only: a signed session cookie for staff logins, a signed
              per-table session cookie for diners (so your cart survives a page reload), and a
              language-preference cookie. None of these are advertising or cross-site tracking
              cookies.
            </p>
          </section>

          <section>
            <h2>6. Data retention</h2>
            <p>
              Order and payment records are retained for as long as the restaurant&rsquo;s account
              is active, for accounting and dispute-handling purposes, and as required by
              applicable tax/commerce law. Anonymous diner sessions expire automatically a few
              hours after a table visit ends.
            </p>
          </section>

          <section>
            <h2>7. Your rights</h2>
            <p>
              Depending on where you live, you may have rights to access, correct, delete, or
              export your personal data, and to object to certain processing. Restaurant staff can
              exercise these for their own account by contacting their restaurant&rsquo;s owner or
              us directly. This section is a placeholder pending legal review to confirm exact
              rights and processes for your jurisdiction(s).
            </p>
          </section>

          <section>
            <h2>8. Contact</h2>
            <p>
              [Insert your company&rsquo;s legal name, address, and a privacy contact email here
              before real launch.]
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
