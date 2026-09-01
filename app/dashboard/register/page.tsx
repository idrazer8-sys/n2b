'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import N2BLogo from '@/components/branding/N2BLogo';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setError(json.error ?? t('authPages.register.couldNotCreate'));
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="theme-n2b min-h-screen bg-n2bNavy text-n2bOffwhite flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher className="border border-white/15 rounded-lg px-2 py-1.5 text-xs bg-white/5 text-n2bOffwhite outline-none focus:border-white/40" />
        </div>

        <div className="text-center mb-8">
          <N2BLogo
            className="justify-center mb-5"
            markSize={44}
            wordmarkClassName="text-3xl leading-none text-white"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-white/10 rounded-2xl bg-white/5 p-6 space-y-4"
        >
          <h1 className="font-display text-2xl text-center mb-2">{t('authPages.register.title')}</h1>

          <input
            required placeholder={t('authPages.register.fullNamePlaceholder')} value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-2.5 text-sm outline-none focus:border-n2bPurple"
          />
          <input
            type="email" required placeholder={t('common.email')} value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-2.5 text-sm outline-none focus:border-n2bPurple"
          />
          <input
            type="password" required minLength={10} placeholder={t('authPages.register.passwordPlaceholder')} value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-white/10 rounded-lg bg-white text-n2bNavy px-3 py-2.5 text-sm outline-none focus:border-n2bPurple"
          />

          {error && (
            <div className="border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button disabled={loading} className="w-full bg-n2bPurple text-white rounded-lg py-2.5 font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
            {loading ? t('authPages.register.creating') : t('authPages.register.createAccount')}
          </button>

          <p className="text-sm text-n2bOffwhite/50 text-center">
            {t('authPages.register.alreadyHaveAccount')} <a href="/dashboard/login" className="underline text-n2bOffwhite/80">{t('common.signIn')}</a>
          </p>
        </form>
      </div>
    </main>
  );
}
