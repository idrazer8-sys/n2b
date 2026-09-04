'use client';

import { useEffect, useState } from 'react';
import { formatCents } from '@/src/lib/format';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import { ALLERGEN_KEYS, matchAllergenKeys, type AllergenKey } from '@/src/lib/allergens';
import { ALLERGEN_ICONS, ALLERGEN_COLORS } from '@/components/branding/allergenIcons';
import AllergenIconRow from '@/components/AllergenIconRow';
import { DIETARY_TAG_KEYS, matchDietaryTagKeys, type DietaryTagKey } from '@/src/lib/dietaryTags';
import { DIETARY_TAG_ICONS, DIETARY_TAG_COLORS } from '@/components/branding/dietaryTagIcons';
import DietaryTagIconRow from '@/components/DietaryTagIconRow';

type Item = {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
  description: string | null;
  imageUrl?: string | null;
  vatRateBps: number;
  allergens: string[];
  dietaryTags: string[];
};

type Category = {
  id: string;
  name: string;
  items: Item[];
  kitchenKind: 'FOOD' | 'DRINKS' | 'DESSERT';
};

type Restaurant = {
  id: string;
  name: string;
  currency: string;
};

type Membership = {
  role: string;
  restaurant: Restaurant;
};

export default function MenuManagementPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { restaurantId } = params;
  const { t } = useI18n();

  const [categories, setCategories] = useState<Category[] | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);

      const [menuRes, restaurantsRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}/menu/categories`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/restaurants', {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      if (!menuRes.ok) {
        throw new Error(t('menuTables.editor.couldNotLoadMenu'));
      }

      if (!restaurantsRes.ok) {
        throw new Error(t('menuTables.editor.couldNotLoadRestaurant'));
      }

      const menu = (await menuRes.json()) as Category[];
      const memberships =
        (await restaurantsRes.json()) as Membership[];

      const membership = memberships.find(
        (item) => item.restaurant.id === restaurantId
      );

      setCategories(menu);
      setRestaurant(membership?.restaurant ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.editor.couldNotLoadMenu')
      );
    }
  }

  useEffect(() => {
    load();
  }, [restaurantId]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();

    const name = newCategoryName.trim();
    if (!name) return;

    try {
      setError(null);

      const res = await fetch(
        `/api/restaurants/${restaurantId}/menu/categories`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error ?? t('menuTables.editor.couldNotCreateCategory')
        );
      }

      setNewCategoryName('');
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.editor.couldNotCreateCategory')
      );
    }
  }

  async function updateCategoryKind(
    category: Category,
    kitchenKind: Category['kitchenKind']
  ) {
    setCategories(
      (prev) =>
        prev?.map((c) =>
          c.id === category.id ? { ...c, kitchenKind } : c
        ) ?? prev
    );

    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/menu/categories/${category.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kitchenKind }),
        }
      );

      if (!res.ok) {
        throw new Error();
      }
    } catch {
      setError(
        t('menuTables.editor.couldNotUpdateCategoryKind')
      );
      await load();
    }
  }

  async function toggleAvailability(item: Item) {
    try {
      setError(null);

      const res = await fetch(
        `/api/restaurants/${restaurantId}/menu/items/${item.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isAvailable: !item.isAvailable,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error ?? t('menuTables.editor.couldNotUpdateAvailability')
        );
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.editor.couldNotUpdateAvailability')
      );
    }
  }

  async function deleteItem(item: Item) {
    const confirmed = window.confirm(
      t('menuTables.editor.confirmDeleteItem', { name: item.name })
    );

    if (!confirmed) return;

    try {
      setError(null);

      const res = await fetch(
        `/api/restaurants/${restaurantId}/menu/items/${item.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error ?? t('menuTables.editor.couldNotDeleteItem')
        );
      }

      setEditingItemId(null);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.editor.couldNotDeleteItem')
      );
    }
  }

  if (!categories) {
    return (
      <div className="text-sm text-ink/50">
        {t('menuTables.editor.loadingMenu')}
      </div>
    );
  }

  const currency = restaurant?.currency || 'EUR';

  return (
    <div className="pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
            {t('menuTables.editor.eyebrow')}
          </p>

          <h1 className="font-display text-3xl mt-1">
            {t('menuTables.editor.heading')}
          </h1>

          <p className="text-sm text-ink/50 mt-2">
            {t('menuTables.editor.subheading')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={`/dashboard/${restaurantId}/menu/import`}
            className="text-xs uppercase tracking-[0.1em] border border-line rounded-full px-4 py-2 hover:bg-black/[0.02]"
          >
            {t('menuTables.editor.importFromPhotos')}
          </a>

          <div className="text-xs uppercase tracking-[0.12em] text-ink/40">
            {currency}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category.id}>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-baseline gap-3">
                <h2 className="font-display text-2xl">
                  {category.name}
                </h2>

                <span className="text-xs text-ink/40">
                  {category.items.length}{' '}
                  {category.items.length === 1
                    ? t('menuTables.editor.itemSingular')
                    : t('menuTables.editor.itemPlural')}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-ink/50">
                  {t('menuTables.editor.categoryKindLabel')}
                  <select
                    value={category.kitchenKind}
                    onChange={(e) =>
                      void updateCategoryKind(
                        category,
                        e.target.value as Category['kitchenKind']
                      )
                    }
                    className="border border-line rounded-md px-1.5 py-1 text-xs bg-paper"
                  >
                    <option value="FOOD">
                      {t('menuTables.editor.categoryKindFood')}
                    </option>
                    <option value="DRINKS">
                      {t('menuTables.editor.categoryKindDrinks')}
                    </option>
                    <option value="DESSERT">
                      {t('menuTables.editor.categoryKindDessert')}
                    </option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setAddingItemTo(
                      addingItemTo === category.id
                        ? null
                        : category.id
                    )
                  }
                  className="text-sm text-accent underline underline-offset-2"
                >
                  {addingItemTo === category.id
                    ? t('common.cancel')
                    : `+ ${t('menuTables.editor.addItem')}`}
                </button>
              </div>
            </div>

            {category.kitchenKind === 'DRINKS' && (
              <p className="text-xs text-ink/40 -mt-2 mb-3">
                {t('menuTables.editor.categoryKindDrinksHint')}
              </p>
            )}

            {addingItemTo === category.id && (
              <NewItemForm
                restaurantId={restaurantId}
                categoryId={category.id}
                currency={currency}
                onDone={() => {
                  setAddingItemTo(null);
                  load();
                }}
              />
            )}

            <div className="border border-line rounded-xl overflow-hidden">
              {category.items.length === 0 ? (
                <div className="px-4 py-7 text-sm text-ink/40">
                  {t('menuTables.editor.noItemsYet')}
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {category.items.map((item) => (
                    <div key={item.id}>
                      <div className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={
                                  item.isAvailable
                                    ? 'font-medium'
                                    : 'font-medium line-through text-ink/40'
                                }
                              >
                                {item.name}
                              </p>

                              <span
                                className={`text-[10px] uppercase tracking-[0.1em] px-2 py-1 rounded-full ${
                                  item.isAvailable
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-ink/5 text-ink/40'
                                }`}
                              >
                                {item.isAvailable
                                  ? t('menuTables.editor.available')
                                  : t('menuTables.editor.unavailable')}
                              </span>
                            </div>

                            {item.description && (
                              <p className="mt-1 text-sm text-ink/50">
                                {item.description}
                              </p>
                            )}

                            <p className="mt-2 text-sm tabular flex items-center gap-2">
                              {formatCents(
                                item.priceCents,
                                currency
                              )}
                              <span className="text-xs text-ink/40">
                                {t('menuTables.editor.vatBadge', {
                                  rate: (item.vatRateBps / 100).toString(),
                                })}
                              </span>
                            </p>

                            {item.allergens.length > 0 && (
                              <AllergenIconRow allergens={item.allergens} size={18} className="mt-1.5" />
                            )}

                            {item.dietaryTags.length > 0 && (
                              <DietaryTagIconRow
                                dietaryTags={item.dietaryTags}
                                size={18}
                                className="mt-1.5"
                              />
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingItemId(
                                  editingItemId === item.id
                                    ? null
                                    : item.id
                                )
                              }
                              className="text-xs border border-line rounded-full px-3 py-1.5"
                            >
                              {editingItemId === item.id
                                ? t('common.close')
                                : t('common.edit')}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleAvailability(item)
                              }
                              className="text-xs border border-line rounded-full px-3 py-1.5"
                            >
                              {item.isAvailable
                                ? t('menuTables.editor.markUnavailable')
                                : t('menuTables.editor.markAvailable')}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteItem(item)
                              }
                              className="text-xs border border-red-200 text-red-700 rounded-full px-3 py-1.5"
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        </div>

                        {editingItemId === item.id && (
                          <EditItemForm
                            restaurantId={restaurantId}
                            item={item}
                            currency={currency}
                            onDone={() => {
                              setEditingItemId(null);
                              load();
                            }}
                            onCancel={() =>
                              setEditingItemId(null)
                            }
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <form
        onSubmit={addCategory}
        className="mt-10 border border-line rounded-xl p-5"
      >
        <p className="text-[10px] uppercase tracking-[0.16em] text-ink/40 mb-2">
          {t('menuTables.editor.addCategory')}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={t('menuTables.editor.categoryNamePlaceholder')}
            className="border border-line rounded-lg px-3 py-2 text-sm flex-1"
          />

          <button
            type="submit"
            className="bg-ink text-paper rounded-lg px-4 py-2 text-sm"
          >
            {t('menuTables.editor.addCategory')}
          </button>
        </div>
      </form>
    </div>
  );
}

const VAT_PRESET_OPTIONS = ['400', '1000', '2100'];

function VatRateFields({
  choice,
  onChoiceChange,
  customPercent,
  onCustomPercentChange,
}: {
  choice: string;
  onChoiceChange: (value: string) => void;
  customPercent: string;
  onCustomPercentChange: (value: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div>
      <label className="block text-xs text-ink/50 mb-1">
        {t('menuTables.editor.vatRateLabel')}
      </label>
      <div className="flex items-center gap-2">
        <select
          value={choice}
          onChange={(e) => onChoiceChange(e.target.value)}
          className="border border-line rounded-lg px-3 py-2 text-sm bg-paper"
        >
          <option value="400">4%</option>
          <option value="1000">10%</option>
          <option value="2100">21%</option>
          <option value="custom">
            {t('menuTables.editor.vatRateCustomOption')}
          </option>
        </select>

        {choice === 'custom' && (
          <div className="flex items-center gap-1.5">
            <input
              required
              inputMode="decimal"
              value={customPercent}
              onChange={(e) => onCustomPercentChange(e.target.value)}
              placeholder={t('menuTables.editor.vatRateCustomPlaceholder')}
              className="w-24 border border-line rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-sm text-ink/50">%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AllergenPicker({
  selectedKeys,
  onToggle,
}: {
  selectedKeys: Set<AllergenKey>;
  onToggle: (key: AllergenKey) => void;
}) {
  const { t } = useI18n();

  return (
    <div>
      <label className="block text-xs text-ink/50 mb-1.5">
        {t('menuTables.editor.allergensLabel')}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {ALLERGEN_KEYS.map((key) => {
          const Icon = ALLERGEN_ICONS[key];
          const active = selectedKeys.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors ${
                active ? 'border-transparent text-white' : 'border-line text-ink/60'
              }`}
              style={active ? { background: ALLERGEN_COLORS[key] } : undefined}
            >
              <Icon size={14} />
              {t(`allergens.${key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DietaryTagPicker({
  selectedKeys,
  onToggle,
}: {
  selectedKeys: Set<DietaryTagKey>;
  onToggle: (key: DietaryTagKey) => void;
}) {
  const { t } = useI18n();

  return (
    <div>
      <label className="block text-xs text-ink/50 mb-1.5">
        {t('menuTables.editor.dietaryTagsLabel')}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {DIETARY_TAG_KEYS.map((key) => {
          const Icon = DIETARY_TAG_ICONS[key];
          const active = selectedKeys.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs transition-colors ${
                active ? 'border-transparent text-white' : 'border-line text-ink/60'
              }`}
              style={active ? { background: DIETARY_TAG_COLORS[key] } : undefined}
            >
              <Icon size={14} />
              {t(`dietaryTags.${key}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NewItemForm({
  restaurantId,
  categoryId,
  currency,
  onDone,
}: {
  restaurantId: string;
  categoryId: string;
  currency: string;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [vatChoice, setVatChoice] = useState('1000');
  const [vatCustomPercent, setVatCustomPercent] = useState('');
  const [allergenKeys, setAllergenKeys] = useState<Set<AllergenKey>>(new Set());
  const [dietaryTagKeys, setDietaryTagKeys] = useState<Set<DietaryTagKey>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleAllergen(key: AllergenKey) {
    setAllergenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleDietaryTag(key: DietaryTagKey) {
    setDietaryTagKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const numericPrice = Number(price);

    if (!name.trim()) {
      setError(t('menuTables.editor.enterItemName'));
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError(t('menuTables.editor.enterValidPrice'));
      return;
    }

    let vatRateBps: number;
    if (vatChoice === 'custom') {
      const numericVatRate = Number(vatCustomPercent);
      if (!Number.isFinite(numericVatRate) || numericVatRate < 0 || numericVatRate > 100) {
        setError(t('menuTables.editor.enterValidVatRate'));
        return;
      }
      vatRateBps = Math.round(numericVatRate * 100);
    } else {
      vatRateBps = Number(vatChoice);
    }

    if (imageUrl.trim()) {
      try {
        new URL(imageUrl.trim());
      } catch {
        setError(t('menuTables.editor.invalidImageUrl'));
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/menu/items`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId,
            name: name.trim(),
            description: description.trim() || undefined,
            priceCents: Math.round(numericPrice * 100),
            imageUrl: imageUrl.trim() || undefined,
            vatRateBps,
            allergens: Array.from(allergenKeys).map((key) => t(`allergens.${key}`)),
            dietaryTags: Array.from(dietaryTagKeys).map((key) => t(`dietaryTags.${key}`)),
            modifiers: [],
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error ?? t('menuTables.editor.couldNotCreateItem')
        );
      }

      onDone();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.editor.couldNotCreateItem')
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border border-line rounded-xl p-4 mb-4 space-y-3 bg-black/[0.015]"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('menuTables.editor.dishNamePlaceholder')}
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />

        <input
          required
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={t('menuTables.editor.pricePlaceholder', { currency })}
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('menuTables.editor.shortDescriptionPlaceholder')}
        className="w-full border border-line rounded-lg px-3 py-2 text-sm"
      />

      <input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder={t('menuTables.editor.imageUrlOptionalPlaceholder')}
        className="w-full border border-line rounded-lg px-3 py-2 text-sm"
      />

      <VatRateFields
        choice={vatChoice}
        onChoiceChange={setVatChoice}
        customPercent={vatCustomPercent}
        onCustomPercentChange={setVatCustomPercent}
      />

      <AllergenPicker selectedKeys={allergenKeys} onToggle={toggleAllergen} />

      <DietaryTagPicker selectedKeys={dietaryTagKeys} onToggle={toggleDietaryTag} />

      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          disabled={saving}
          className="bg-ink text-paper rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {saving ? t('common.saving') : t('menuTables.editor.saveItem')}
        </button>

        <button
          type="button"
          onClick={onDone}
          className="text-sm text-ink/50 px-2"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}

function EditItemForm({
  restaurantId,
  item,
  currency,
  onDone,
  onCancel,
}: {
  restaurantId: string;
  item: Item;
  currency: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(
    item.description ?? ''
  );
  const [price, setPrice] = useState(
    (item.priceCents / 100).toFixed(2)
  );
  const [imageUrl, setImageUrl] = useState(
    item.imageUrl ?? ''
  );
  const [vatChoice, setVatChoice] = useState(
    VAT_PRESET_OPTIONS.includes(String(item.vatRateBps))
      ? String(item.vatRateBps)
      : 'custom'
  );
  const [vatCustomPercent, setVatCustomPercent] = useState(
    VAT_PRESET_OPTIONS.includes(String(item.vatRateBps))
      ? ''
      : (item.vatRateBps / 100).toString()
  );
  const [allergenKeys, setAllergenKeys] = useState<Set<AllergenKey>>(
    () => new Set(matchAllergenKeys(item.allergens))
  );
  const [dietaryTagKeys, setDietaryTagKeys] = useState<Set<DietaryTagKey>>(
    () => new Set(matchDietaryTagKeys(item.dietaryTags))
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleAllergen(key: AllergenKey) {
    setAllergenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleDietaryTag(key: DietaryTagKey) {
    setDietaryTagKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const numericPrice = Number(price);

    if (!name.trim()) {
      setError(t('menuTables.editor.enterItemName'));
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError(t('menuTables.editor.enterValidPrice'));
      return;
    }

    let vatRateBps: number;
    if (vatChoice === 'custom') {
      const numericVatRate = Number(vatCustomPercent);
      if (!Number.isFinite(numericVatRate) || numericVatRate < 0 || numericVatRate > 100) {
        setError(t('menuTables.editor.enterValidVatRate'));
        return;
      }
      vatRateBps = Math.round(numericVatRate * 100);
    } else {
      vatRateBps = Number(vatChoice);
    }

    if (imageUrl.trim()) {
      try {
        new URL(imageUrl.trim());
      } catch {
        setError(t('menuTables.editor.invalidImageUrl'));
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/menu/items/${item.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            priceCents: Math.round(numericPrice * 100),
            imageUrl: imageUrl.trim() || null,
            vatRateBps,
            allergens: Array.from(allergenKeys).map((key) => t(`allergens.${key}`)),
            dietaryTags: Array.from(dietaryTagKeys).map((key) => t(`dietaryTags.${key}`)),
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          json.error ?? t('menuTables.editor.couldNotUpdateItem')
        );
      }

      onDone();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('menuTables.editor.couldNotUpdateItem')
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 border border-line rounded-xl p-4 space-y-3 bg-black/[0.015]"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />

        <input
          required
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border border-line rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('menuTables.editor.descriptionPlaceholder')}
        className="w-full border border-line rounded-lg px-3 py-2 text-sm"
      />

      <input
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder={t('menuTables.editor.imageUrlPlaceholder')}
        className="w-full border border-line rounded-lg px-3 py-2 text-sm"
      />

      <VatRateFields
        choice={vatChoice}
        onChoiceChange={setVatChoice}
        customPercent={vatCustomPercent}
        onCustomPercentChange={setVatCustomPercent}
      />

      <AllergenPicker selectedKeys={allergenKeys} onToggle={toggleAllergen} />

      <DietaryTagPicker selectedKeys={dietaryTagKeys} onToggle={toggleDietaryTag} />

      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          disabled={saving}
          className="bg-ink text-paper rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {saving ? t('common.saving') : t('menuTables.editor.saveChanges')}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-ink/50 px-2"
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
