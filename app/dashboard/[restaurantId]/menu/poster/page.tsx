'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatCents } from '@/src/lib/format';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type Item = {
  id: string;
  name: string;
  priceCents: number;
  posterX: number | null;
  posterY: number | null;
};

type Category = {
  id: string;
  name: string;
  items: Item[];
};

// Manual drag-to-position editor for Poster mode (see
// Restaurant.menuLayoutMode / MenuItem.posterX/posterY in schema.prisma).
// No AI positioning here at all, by design — the manager drags each
// item's "Name  $Price" pill directly onto their own photo. Position is
// computed as a percentage of the rendered <img>'s own bounding box, so
// it stays correct at any viewport width with no separate scale-factor
// tracking needed (the <img> sets the wrapper's size via normal layout
// flow; the wrapper never has a fixed size of its own).
export default function MenuPosterPage() {
  const params = useParams();
  const { t } = useI18n();
  const restaurantId = params.restaurantId as string;

  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [currency, setCurrency] = useState('EUR');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragItemId = useRef<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');

        const [settingsRes, categoriesRes] = await Promise.all([
          fetch(`/api/restaurants/${restaurantId}/settings`, { cache: 'no-store' }),
          fetch(`/api/restaurants/${restaurantId}/menu/categories`, { cache: 'no-store' }),
        ]);

        const settingsData = await settingsRes.json();
        const categoriesData = await categoriesRes.json();

        if (!settingsRes.ok) throw new Error(settingsData?.error || t('menuTables.poster.couldNotLoad'));
        if (!categoriesRes.ok) throw new Error(categoriesData?.error || t('menuTables.poster.couldNotLoad'));

        setBackgroundUrl(settingsData.menuBackgroundUrl ?? null);
        setCurrency(settingsData.currency || 'EUR');
        setCategories(categoriesData as Category[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('menuTables.poster.couldNotLoad'));
      } finally {
        setLoading(false);
      }
    }

    if (restaurantId) load();
  }, [restaurantId]);

  function updateItemLocal(itemId: string, x: number | null, y: number | null) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) =>
          item.id === itemId ? { ...item, posterX: x, posterY: y } : item
        ),
      }))
    );
  }

  async function persistPosition(itemId: string, x: number | null, y: number | null) {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/menu/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posterX: x, posterY: y }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || t('menuTables.poster.couldNotSave'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('menuTables.poster.couldNotSave'));
    }
  }

  function clampedPositionFromEvent(e: PointerEvent | React.PointerEvent): { x: number; y: number } | null {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    return { x, y };
  }

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const itemId = dragItemId.current;
    if (!itemId) return;
    const pos = clampedPositionFromEvent(e);
    if (!pos) return;
    updateItemLocal(itemId, pos.x, pos.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const itemId = dragItemId.current;
    dragItemId.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    if (!itemId) return;
    const pos = clampedPositionFromEvent(e);
    if (!pos) return;
    void persistPosition(itemId, pos.x, pos.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlePointerMove]);

  function startDrag(e: React.PointerEvent, itemId: string) {
    e.stopPropagation();
    e.preventDefault();
    dragItemId.current = itemId;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function placeAtCenter(itemId: string) {
    updateItemLocal(itemId, 0.5, 0.5);
    void persistPosition(itemId, 0.5, 0.5);
  }

  function unplace(itemId: string) {
    updateItemLocal(itemId, null, null);
    void persistPosition(itemId, null, null);
  }

  const placedItems = categories.flatMap((category) =>
    category.items.filter((item) => item.posterX !== null && item.posterY !== null)
  );

  const unplacedByCategory = categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => item.posterX === null || item.posterY === null),
    }))
    .filter((category) => category.items.length > 0);

  if (loading) {
    return (
      <div className="pb-12">
        <div className="border border-line rounded-xl p-8 text-sm text-ink/60">
          {t('menuTables.poster.loading')}
        </div>
      </div>
    );
  }

  if (!backgroundUrl) {
    return (
      <div className="pb-12">
        <h1 className="font-display text-3xl mb-4">{t('menuTables.poster.title')}</h1>
        <div className="border border-line rounded-xl p-8 text-sm text-ink/60">
          {t('menuTables.poster.noBackground')}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 space-y-6">
      <div>
        <h1 className="font-display text-3xl">{t('menuTables.poster.title')}</h1>
        <p className="text-sm text-ink/50 mt-2">{t('menuTables.poster.subtitle')}</p>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div
          ref={canvasRef}
          className="relative w-full select-none overflow-hidden rounded-xl border border-line"
        >
          <img src={backgroundUrl} alt="" className="block w-full h-auto pointer-events-none" draggable={false} />

          {placedItems.map((item) => (
            <div
              key={item.id}
              onPointerDown={(e) => startDrag(e, item.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none whitespace-nowrap rounded-full border border-ink/10 bg-white/95 px-3 py-1.5 text-xs shadow-md active:cursor-grabbing"
              style={{ left: `${(item.posterX ?? 0) * 100}%`, top: `${(item.posterY ?? 0) * 100}%` }}
            >
              <span className="font-medium text-ink">{item.name}</span>
              <span className="ml-1.5 tabular-nums text-ink/50">{formatCents(item.priceCents, currency)}</span>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => unplace(item.id)}
                className="ml-2 text-ink/40 hover:text-red-600"
                aria-label={t('menuTables.poster.remove')}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="border border-line rounded-xl p-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-ink/60 mb-4">
            {t('menuTables.poster.unplacedHeading')}
          </h2>

          {unplacedByCategory.length === 0 ? (
            <p className="text-sm text-ink/50">{t('menuTables.poster.allPlaced')}</p>
          ) : (
            <div className="space-y-5">
              {unplacedByCategory.map((category) => (
                <div key={category.id}>
                  <p className="text-xs uppercase tracking-[0.08em] text-ink/40 mb-2">{category.name}</p>
                  <div className="space-y-1.5">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 border border-line rounded-lg px-3 py-2 text-sm"
                      >
                        <span>{item.name}</span>
                        <button
                          type="button"
                          onClick={() => placeAtCenter(item.id)}
                          className="shrink-0 text-xs border border-line rounded-full px-3 py-1 hover:bg-ink/5"
                        >
                          {t('menuTables.poster.place')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-5 text-xs text-ink/40">{t('menuTables.poster.dragHint')}</p>
        </div>
      </div>
    </div>
  );
}
