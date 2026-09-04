'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import { FONT_PAIRINGS, isFontPairingKey, googleFontsHref, type FontPairingKey } from '@/src/lib/fontPairings';

type DraftModifierOption = {
  name: string;
  priceDelta: string;
};

type DraftModifier = {
  name: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  isRequired: boolean;
  options: DraftModifierOption[];
};

type DraftItem = {
  name: string;
  description: string;
  // '' means the AI could not read the price with confidence — this item
  // is blocked from publishing until the manager fills it in by hand, per
  // "never invent a price" (see extractedMenuItemSchema in src/lib/ai.ts).
  price: string;
  allergens: string[];
  modifiers: DraftModifier[];
};

type DraftCategory = {
  name: string;
  items: DraftItem[];
};

// Deterministic, computed from the draft itself — never asks the AI to
// self-report confidence. A missing/blank price or a duplicate name is
// something the app can just check, more reliably than an LLM grading its
// own work.
type DraftIssue = {
  categoryIndex: number;
  itemIndex: number | null; // null = a category-level issue (e.g. empty)
  message: string;
};

type Step = 'upload' | 'reviewing';

type BrandingSuggestion = {
  accentColor: string | null;
  fontPairing: FontPairingKey | null;
};

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
  const [branding, setBranding] = useState<BrandingSuggestion | null>(null);
  const [applyBranding, setApplyBranding] = useState(true);

  // Computed straight from the draft, not asked of the AI — a blank price
  // or a repeated name is something the app can just check deterministically,
  // which is more trustworthy than an LLM grading its own extraction.
  const issues = useMemo<DraftIssue[]>(() => {
    const found: DraftIssue[] = [];

    draft.forEach((category, categoryIndex) => {
      if (category.items.length === 0) {
        found.push({
          categoryIndex,
          itemIndex: null,
          message: t('menuTables.import.issueEmptyCategory'),
        });
        return;
      }

      const seenNames = new Map<string, number>();

      category.items.forEach((item, itemIndex) => {
        const numericPrice = Number(item.price);

        if (item.price.trim() === '' || !Number.isFinite(numericPrice)) {
          found.push({
            categoryIndex,
            itemIndex,
            message: t('menuTables.import.issueMissingPrice'),
          });
        }

        const key = item.name.trim().toLowerCase();
        if (key) {
          const firstIndex = seenNames.get(key);
          if (firstIndex !== undefined) {
            found.push({
              categoryIndex,
              itemIndex,
              message: t('menuTables.import.issueDuplicateName'),
            });
          } else {
            seenNames.set(key, itemIndex);
          }
        }
      });
    });

    return found;
  }, [draft, t]);

  const blockingIssueCount = issues.filter((issue) => issue.itemIndex !== null).length;

  function issueMessagesFor(categoryIndex: number, itemIndex: number): string[] {
    return issues
      .filter((issue) => issue.categoryIndex === categoryIndex && issue.itemIndex === itemIndex)
      .map((issue) => issue.message);
  }

  // Loads the suggested font pairing's Google Font so the preview card
  // actually renders in that typeface, not just names it.
  useEffect(() => {
    const pairing = branding?.fontPairing;
    if (!isFontPairingKey(pairing)) return;

    if (document.querySelector(`link[data-font-pairing="${pairing}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = googleFontsHref(pairing);
    link.dataset.fontPairing = pairing;
    document.head.appendChild(link);
  }, [branding?.fontPairing]);

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

      type RawItem = {
        name: string;
        description: string | null;
        price: number | null;
        allergens?: string[];
        modifiers?: {
          name: string;
          selectionType?: 'SINGLE' | 'MULTIPLE';
          isRequired?: boolean;
          options: { name: string; priceDelta?: number }[];
        }[];
      };

      const categories: DraftCategory[] = (json.categories ?? []).map(
        (category: { name: string; items: RawItem[] }) => ({
          name: category.name,
          items: category.items.map((item) => ({
            name: item.name,
            description: item.description ?? '',
            price: item.price === null ? '' : String(item.price),
            allergens: item.allergens ?? [],
            modifiers: (item.modifiers ?? []).map((modifier) => ({
              name: modifier.name,
              selectionType: modifier.selectionType === 'MULTIPLE' ? 'MULTIPLE' : 'SINGLE',
              isRequired: modifier.isRequired ?? false,
              options: modifier.options.map((option) => ({
                name: option.name,
                priceDelta: String(option.priceDelta ?? 0),
              })),
            })),
          })),
        })
      );

      if (categories.length === 0) {
        setError(t('menuTables.import.noItemsFound'));
        return;
      }

      const suggestion: BrandingSuggestion = {
        accentColor:
          typeof json.branding?.accentColor === 'string' ? json.branding.accentColor : null,
        fontPairing: isFontPairingKey(json.branding?.fontPairing)
          ? json.branding.fontPairing
          : null,
      };

      setBranding(
        suggestion.accentColor || suggestion.fontPairing ? suggestion : null
      );
      setApplyBranding(true);
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

  function removeModifier(categoryIndex: number, itemIndex: number, modifierIndex: number) {
    setDraft((current) =>
      current.map((category, ci) =>
        ci !== categoryIndex
          ? category
          : {
              ...category,
              items: category.items.map((item, ii) =>
                ii !== itemIndex
                  ? item
                  : { ...item, modifiers: item.modifiers.filter((_, mi) => mi !== modifierIndex) }
              ),
            }
      )
    );
  }

  function updateModifierOptionPrice(
    categoryIndex: number,
    itemIndex: number,
    modifierIndex: number,
    optionIndex: number,
    priceDelta: string
  ) {
    setDraft((current) =>
      current.map((category, ci) =>
        ci !== categoryIndex
          ? category
          : {
              ...category,
              items: category.items.map((item, ii) =>
                ii !== itemIndex
                  ? item
                  : {
                      ...item,
                      modifiers: item.modifiers.map((modifier, mi) =>
                        mi !== modifierIndex
                          ? modifier
                          : {
                              ...modifier,
                              options: modifier.options.map((option, oi) =>
                                oi !== optionIndex ? option : { ...option, priceDelta }
                              ),
                            }
                      ),
                    }
              ),
            }
      )
    );
  }

  function removeCategory(categoryIndex: number) {
    setDraft((current) => current.filter((_, ci) => ci !== categoryIndex));
  }

  async function publish() {
    if (blockingIssueCount > 0) {
      setError(t('menuTables.import.fixIssuesBeforePublishing'));
      return;
    }

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
              modifiers: item.modifiers.map((modifier) => ({
                name: modifier.name.trim(),
                selectionType: modifier.selectionType,
                isRequired: modifier.isRequired,
                options: modifier.options.map((option) => ({
                  name: option.name.trim(),
                  priceDelta: Number(option.priceDelta) || 0,
                })),
              })),
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

      // Best-effort: a rejected branding update shouldn't block the menu
      // itself from having published — the manager can still set it by
      // hand in Settings.
      if (applyBranding && branding && (branding.accentColor || branding.fontPairing)) {
        await fetch(`/api/restaurants/${restaurantId}/settings`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(branding.accentColor ? { brandPrimaryColor: branding.accentColor } : {}),
            ...(branding.fontPairing ? { brandFontPairing: branding.fontPairing } : {}),
          }),
        }).catch(() => {});
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
          <p className="text-sm text-ink/50 mb-4">
            {t('menuTables.import.reviewSubheading')}
          </p>

          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm ${
              blockingIssueCount > 0
                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                : 'bg-green-50 text-green-900 border border-green-200'
            }`}
          >
            {t('menuTables.import.foundSummary', {
              items: String(draft.reduce((sum, c) => sum + c.items.length, 0)),
              categories: String(draft.length),
              modifiers: String(
                draft.reduce(
                  (sum, c) => sum + c.items.reduce((s, i) => s + i.modifiers.length, 0),
                  0
                )
              ),
            })}
            {blockingIssueCount > 0 && (
              <>
                {' '}
                {t('menuTables.import.foundIssues', { count: String(blockingIssueCount) })}
              </>
            )}
          </div>

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
                  {category.items.map((item, itemIndex) => {
                    const itemIssues = issueMessagesFor(categoryIndex, itemIndex);
                    const priceHasIssue = itemIssues.includes(
                      t('menuTables.import.issueMissingPrice')
                    );

                    return (
                      <div
                        key={itemIndex}
                        className="border-b border-line/60 pb-3"
                      >
                        <div className="grid grid-cols-[1fr_auto] gap-2">
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
                              className={`w-24 border rounded-lg px-3 py-2 text-sm text-right ${
                                priceHasIssue
                                  ? 'border-amber-400 bg-amber-50'
                                  : 'border-line'
                              }`}
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

                        {itemIssues.length > 0 && (
                          <p className="mt-1.5 text-xs text-amber-700">
                            {itemIssues.join(' · ')}
                          </p>
                        )}

                        {item.modifiers.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {item.modifiers.map((modifier, modifierIndex) => (
                              <div
                                key={modifierIndex}
                                className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-black/[0.02] px-3 py-2 text-xs"
                              >
                                <span className="font-medium">{modifier.name}</span>
                                <span className="text-ink/40">
                                  {modifier.selectionType === 'MULTIPLE'
                                    ? t('menuTables.import.modifierMultiple')
                                    : t('menuTables.import.modifierSingle')}
                                </span>

                                {modifier.options.map((option, optionIndex) => (
                                  <span key={optionIndex} className="inline-flex items-center gap-1 text-ink/70">
                                    {option.name}
                                    <input
                                      value={option.priceDelta}
                                      onChange={(event) =>
                                        updateModifierOptionPrice(
                                          categoryIndex,
                                          itemIndex,
                                          modifierIndex,
                                          optionIndex,
                                          event.target.value
                                        )
                                      }
                                      inputMode="decimal"
                                      className="w-12 border border-line rounded px-1 py-0.5 text-right"
                                    />
                                  </span>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => removeModifier(categoryIndex, itemIndex, modifierIndex)}
                                  className="ml-auto text-red-700"
                                >
                                  {t('common.remove')}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {category.items.length === 0 && (
                    <p className="text-xs text-ink/40">{t('menuTables.import.noItemsInCategory')}</p>
                  )}
                </div>
              </section>
            ))}
          </div>

          {branding && (branding.accentColor || branding.fontPairing) && (
            <div className="mt-8 border border-line rounded-2xl p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-sm font-medium uppercase tracking-[0.1em] text-ink/60">
                  {t('menuTables.import.brandingHeading')}
                </h3>

                <label className="flex items-center gap-2 text-xs text-ink/60">
                  <input
                    type="checkbox"
                    checked={applyBranding}
                    onChange={(event) => setApplyBranding(event.target.checked)}
                  />
                  {t('menuTables.import.applyBranding')}
                </label>
              </div>

              <div className="flex items-center gap-5">
                {branding.accentColor && (
                  <span
                    className="h-12 w-12 rounded-full border border-line shrink-0"
                    style={{ background: branding.accentColor }}
                    title={branding.accentColor}
                  />
                )}

                {branding.fontPairing && (
                  <p
                    className="text-3xl leading-tight"
                    style={{ fontFamily: `'${FONT_PAIRINGS[branding.fontPairing].display}', serif` }}
                  >
                    {t('menuTables.import.brandingFontSample')}
                  </p>
                )}
              </div>

              <p className="mt-3 text-xs text-ink/40">
                {t('menuTables.import.brandingHint')}
              </p>
            </div>
          )}

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
              disabled={publishing || blockingIssueCount > 0}
              onClick={publish}
              title={
                blockingIssueCount > 0
                  ? t('menuTables.import.fixIssuesBeforePublishing')
                  : undefined
              }
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
