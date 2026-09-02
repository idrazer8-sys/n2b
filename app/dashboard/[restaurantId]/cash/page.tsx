'use client';

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type Denomination = {
  valueCents: number;
  quantity: number;
  updatedAt: string | null;
};

function formatValue(valueCents: number, currency: string) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(valueCents / 100);
}

const BILL_THRESHOLD_CENTS = 500; // 5 EUR and above are bills, below are coins

export default function CashDrawerPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { restaurantId } = params;
  const { t } = useI18n();

  const [denominations, setDenominations] = useState<Denomination[] | null>(
    null
  );
  const [currency, setCurrency] = useState('EUR');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const [drawerRes, settingsRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}/cash-drawer`, {
          credentials: 'include',
        }),
        fetch(`/api/restaurants/${restaurantId}/settings`, {
          credentials: 'include',
        }),
      ]);

      if (!drawerRes.ok) {
        throw new Error(t('cashDrawer.loadError'));
      }

      const drawerJson = await drawerRes.json();
      const settingsJson = await settingsRes.json().catch(() => ({}));

      setDenominations(drawerJson.denominations ?? []);
      setCurrency(settingsJson.currency ?? 'EUR');
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t('cashDrawer.loadError')
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  function updateQuantity(valueCents: number, quantity: number) {
    setSaved(false);
    setDenominations((prev) =>
      (prev ?? []).map((item) =>
        item.valueCents === valueCents
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      )
    );
  }

  async function save() {
    if (!denominations) return;

    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/cash-drawer`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          denominations: denominations.map((item) => ({
            valueCents: item.valueCents,
            quantity: item.quantity,
          })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setDenominations(json.denominations ?? denominations);
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  const bills = (denominations ?? []).filter(
    (item) => item.valueCents >= BILL_THRESHOLD_CENTS
  );
  const coins = (denominations ?? []).filter(
    (item) => item.valueCents < BILL_THRESHOLD_CENTS
  );

  const totalCents = (denominations ?? []).reduce(
    (sum, item) => sum + item.valueCents * item.quantity,
    0
  );

  return (
    <div className="pb-12">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
          {t('cashDrawer.eyebrow')}
        </p>
        <h1 className="font-display text-3xl mt-1">{t('cashDrawer.title')}</h1>
        <p className="text-sm text-ink/50 mt-2">{t('cashDrawer.subtitle')}</p>
        <p className="text-xs text-ink/40 mt-1">{t('cashDrawer.note')}</p>
      </div>

      {loadError && <p className="mb-4 text-sm text-red-600">{loadError}</p>}

      {denominations && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-line rounded-xl p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-ink/60 mb-4">
              {t('cashDrawer.bills')}
            </h2>

            <div className="space-y-2">
              {bills.map((item) => (
                <div
                  key={item.valueCents}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-medium w-24">
                    {formatValue(item.valueCents, currency)}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(
                        item.valueCents,
                        Number(e.target.value) || 0
                      )
                    }
                    className="w-24 border border-line rounded-lg px-3 py-1.5 text-sm text-right"
                  />
                  <span className="text-xs text-ink/40 w-28 text-right">
                    {t('cashDrawer.subtotal')}:{' '}
                    {formatValue(item.valueCents * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-line rounded-xl p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-ink/60 mb-4">
              {t('cashDrawer.coins')}
            </h2>

            <div className="space-y-2">
              {coins.map((item) => (
                <div
                  key={item.valueCents}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-medium w-24">
                    {formatValue(item.valueCents, currency)}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(
                        item.valueCents,
                        Number(e.target.value) || 0
                      )
                    }
                    className="w-24 border border-line rounded-lg px-3 py-1.5 text-sm text-right"
                  />
                  <span className="text-xs text-ink/40 w-28 text-right">
                    {t('cashDrawer.subtotal')}:{' '}
                    {formatValue(item.valueCents * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {denominations && (
        <div className="mt-6 border border-line rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-ink/50">
              {t('cashDrawer.total')}
            </p>
            <p className="font-display text-2xl mt-1">
              {formatValue(totalCents, currency)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="bg-ink text-white text-sm font-medium rounded-lg px-5 py-2.5 disabled:opacity-50"
          >
            {saving
              ? t('cashDrawer.saving')
              : saved
              ? t('cashDrawer.saved')
              : t('cashDrawer.save')}
          </button>
        </div>
      )}
    </div>
  );
}
