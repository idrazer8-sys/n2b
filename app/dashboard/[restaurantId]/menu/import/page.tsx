'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type DraftItem = {
  name: string;
  description: string;
  price: string;
  allergens: string[];
};

type DraftCategory = {
  name: string;
  items: DraftItem[];
};

type Step = 'upload' | 'reviewing';

const MAX_PHOTOS = 12;
const MAX_DIMENSION = 1600;

type ResizeMessages = {
  couldNotReadFile: (name: string) => string;
  couldNotDecodeFile: (name: string) => string;
  canvasNotSupported: string;
};

function resizeToJpegBase64(
  file: File,
  messages: ResizeMessages
): Promise<{ mediaType: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error(messages.couldNotReadFile(file.name)));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error(messages.couldNotDecodeFile(file.name)));

      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error(messages.canvasNotSupported));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const base64 = dataUrl.split(',')[1] ?? '';

        resolve({ mediaType: 'image/jpeg', base64 });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

export default function MenuImportPage() {
  const params = useParams<{ restaurantId: string }>();
  const router = useRouter();
  const restaurantId = params.restaurantId;
  const { t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [previews, setPreviews] = useState<string[]>([]);
  const [pending, setPending] = useState<{ mediaType: string; base64: string }[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftCategory[]>([]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setError(null);

    const selected = Array.from(files).slice(0, MAX_PHOTOS);

    try {
      const messages: ResizeMessages = {
        couldNotReadFile: (name) =>
          t('menuTables.import.couldNotReadFile', { name }),
        couldNotDecodeFile: (name) =>
          t('menuTables.import.couldNotDecodeFile', { name }),
        canvasNotSupported: t('menuTables.import.canvasNotSupported'),
      };

      const encoded = await Promise.all(
        selected.map((file) => resizeToJpegBase64(file, messages))
      );
      setPending(encoded);
      setPreviews(encoded.map((image) => `data:${image.mediaType};base64,${image.base64}`));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.import.couldNotReadPhotos')
      );
    }
  }

  async function analyze() {
    if (pending.length === 0) {
      setError(t('menuTables.import.chooseAtLeastOnePhoto'));
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/menu/import`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: pending }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json.error ?? t('menuTables.import.couldNotAnalyzePhotos')
        );
      }

      const categories: DraftCategory[] = (json.categories ?? []).map(
        (category: { name: string; items: { name: string; description: string | null; price: number; allergens?: string[] }[] }) => ({
          name: category.name,
          items: category.items.map((item) => ({
            name: item.name,
            description: item.description ?? '',
            price: String(item.price),
            allergens: item.allergens ?? [],
          })),
        })
      );

      if (categories.length === 0) {
        setError(t('menuTables.import.noItemsFound'));
        return;
      }

      setDraft(categories);
      setStep('reviewing');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.import.couldNotAnalyzePhotos')
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function updateItem(categoryIndex: number, itemIndex: number, patch: Partial<DraftItem>) {
    setDraft((current) =>
      current.map((category, ci) =>
        ci !== categoryIndex
          ? category
          : {
              ...category,
              items: category.items.map((item, ii) =>
                ii !== itemIndex ? item : { ...item, ...patch }
              ),
            }
      )
    );
  }

  function removeItem(categoryIndex: number, itemIndex: number) {
    setDraft((current) =>
      current.map((category, ci) =>
        ci !== categoryIndex
          ? category
          : { ...category, items: category.items.filter((_, ii) => ii !== itemIndex) }
      )
    );
  }

  function updateCategoryName(categoryIndex: number, name: string) {
    setDraft((current) =>
      current.map((category, ci) => (ci !== categoryIndex ? category : { ...category, name }))
    );
  }

  function removeCategory(categoryIndex: number) {
    setDraft((current) => current.filter((_, ci) => ci !== categoryIndex));
  }

  async function publish() {
    setPublishing(true);
    setError(null);

    try {
      const payload = {
        categories: draft.map((category) => ({
          name: category.name,
          items: category.items
            .filter((item) => item.name.trim().length > 0)
            .map((item) => ({
              name: item.name.trim(),
              description: item.description.trim() || null,
              price: Number(item.price) || 0,
              allergens: item.allergens,
            })),
        })),
      };

      const response = await fetch(
        `/api/restaurants/${restaurantId}/menu/import/publish`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json.error ?? t('menuTables.import.couldNotPublishMenu')
        );
      }

      router.push(`/dashboard/${restaurantId}/menu`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.import.couldNotPublishMenu')
      );
      setPublishing(false);
    }
  }

  return (
    <div className="pb-16">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
          {t('menuTables.editor.eyebrow')}
        </p>
        <h1 className="font-display text-3xl mt-1">
          {t('menuTables.editor.importFromPhotos')}
        </h1>
        <p className="text-sm text-ink/50 mt-2 max-w-xl">
          {t('menuTables.import.subheading')}
        </p>
      </div>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="border border-line rounded-2xl p-6 max-w-xl">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-line rounded-xl py-10 text-sm text-ink/60 hover:bg-black/[0.02]"
          >
            {previews.length > 0
              ? t('menuTables.import.photosSelected', {
                  count: previews.length,
                })
              : t('menuTables.import.tapToChoosePhotos')}
          </button>

          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {previews.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={index}
                  src={src}
                  alt={t('menuTables.import.menuPhotoAlt', {
                    number: index + 1,
                  })}
                  className="aspect-square object-cover rounded-lg border border-line"
                />
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={analyzing || pending.length === 0}
            onClick={analyze}
            className="mt-6 w-full bg-ink text-paper rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
          >
            {analyzing
              ? t('menuTables.import.readingWithAi')
              : t('menuTables.import.analyzeWithAi')}
          </button>
        </div>
      )}

      {step === 'reviewing' && (
        <div className="max-w-2xl">
          <p className="text-sm text-ink/50 mb-6">
            {t('menuTables.import.reviewSubheading')}
          </p>

          <div className="space-y-8">
            {draft.map((category, categoryIndex) => (
              <section key={categoryIndex} className="border border-line rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    value={category.name}
                    onChange={(event) =>
                      updateCategoryName(categoryIndex, event.target.value)
                    }
                    className="flex-1 font-display text-xl border-b border-line pb-1 outline-none focus:border-ink bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(categoryIndex)}
                    className="text-xs text-red-700 uppercase tracking-[0.08em]"
                  >
                    {t('menuTables.import.removeCategory')}
                  </button>
                </div>

                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="grid grid-cols-[1fr_auto] gap-2 border-b border-line/60 pb-3"
                    >
                      <div className="space-y-2">
                        <input
                          value={item.name}
                          onChange={(event) =>
                            updateItem(categoryIndex, itemIndex, { name: event.target.value })
                          }
                          placeholder={t('menuTables.import.itemNamePlaceholder')}
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                          value={item.description}
                          onChange={(event) =>
                            updateItem(categoryIndex, itemIndex, { description: event.target.value })
                          }
                          placeholder={t('menuTables.import.descriptionOptionalPlaceholder')}
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <input
                          value={item.price}
                          onChange={(event) =>
                            updateItem(categoryIndex, itemIndex, { price: event.target.value })
                          }
                          inputMode="decimal"
                          placeholder={t('menuTables.import.pricePlaceholderZero')}
                          className="w-24 border border-line rounded-lg px-3 py-2 text-sm text-right"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(categoryIndex, itemIndex)}
                          className="text-xs text-red-700"
                        >
                          {t('common.remove')}
                        </button>
                      </div>
                    </div>
                  ))}

                  {category.items.length === 0 && (
                    <p className="text-xs text-ink/40">{t('menuTables.import.noItemsInCategory')}</p>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="border border-line rounded-lg px-4 py-3 text-sm"
            >
              {t('common.back')}
            </button>

            <button
              type="button"
              disabled={publishing}
              onClick={publish}
              className="flex-1 bg-ink text-paper rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              {publishing
                ? t('menuTables.import.publishing')
                : t('menuTables.import.publishMenu')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
