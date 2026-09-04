'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCents } from '@/src/lib/format';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AllergenIconRow from '@/components/AllergenIconRow';

type ModifierOption = {
  id: string;
  name: string;
  priceDeltaCents: number;
  isAvailable: boolean;
};

type Modifier = {
  id: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  isRequired: boolean;
  minSelect: number;
  maxSelect: number | null;
  options: ModifierOption[];
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  allergens: string[];
  modifiers: Modifier[];
};

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

type MenuResponse = {
  restaurant: {
    name: string;
    logoUrl: string | null;
    currency: string;
    isOpen: boolean;
    brandPrimaryColor: string;
  };
  table: {
    id: string;
    label: string;
  };
  session: {
    id: string;
    partySize: number | null;
  };
  categories: Category[];
};

type BlockedTableInfo = {
  id: string;
  label: string;
};

type BlockedInfo = {
  table: BlockedTableInfo;
  availableTables: BlockedTableInfo[];
};

type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  selectedOptionIds: string[];
  selectedOptionsLabel: string;
  notes?: string;
};

export default function CustomerMenu({
  slug,
  token,
  dessertOnly = false,
}: {
  slug: string;
  token: string;
  dessertOnly?: boolean;
}) {
  const [data, setData] = useState<MenuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockedInfo, setBlockedInfo] = useState<BlockedInfo | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // A ref, not just the `submitting` state — two rapid taps (very real on
  // mobile) can both fire submitOrder() in the same tick, before React has
  // re-rendered the button as disabled or this closure has seen the state
  // update. The ref is mutated synchronously, so the second call sees it
  // immediately regardless of render timing, and can't place a duplicate
  // order for the same cart.
  const submittingRef = useRef(false);
  const [dessertMode, setDessertMode] = useState(dessertOnly);
  const [partySize, setPartySize] = useState<number | null>(null);
  const [partySizeDraft, setPartySizeDraft] = useState(2);
  const [confirmingPartySize, setConfirmingPartySize] = useState(false);
  const [partySizeError, setPartySizeError] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    fetch(
      `/api/public/restaurants/${slug}/menu?t=${encodeURIComponent(token)}`,
      {
        credentials: 'include',
      }
    )
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (body && body.blocked) {
            setBlockedInfo({
              table: body.table,
              availableTables: body.availableTables ?? [],
            });
            return null;
          }

          throw new Error(body.error ?? t('customerFlow.menu.couldNotLoad'));
        }

        return body as MenuResponse;
      })
      .then((json: MenuResponse | null) => {
        if (!json) {
          return;
        }

        setData(json);
        setPartySize(json.session?.partySize ?? null);

        setDessertMode(dessertOnly);

        const dessertCategories = json.categories.filter(
          (category: Category) =>
            /dessert|postre|postres/i.test(category.name)
        );

        setActiveCategory(
          (dessertMode
            ? dessertCategories[0]
            : json.categories[0]
          )?.id ?? null
        );
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : t('customerFlow.menu.couldNotLoad')
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token, dessertOnly]);

  const cartTotalCents = useMemo(
    () =>
      cart.reduce(
        (sum, line) => sum + line.unitPriceCents * line.quantity,
        0
      ),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart]
  );

  function addToCart(line: CartLine) {
    setCart((previous) => [...previous, line]);
    setActiveItem(null);
  }

  function removeLine(key: string) {
    setCart((previous) => previous.filter((line) => line.key !== key));
  }

  async function submitOrder() {
    if (!data || cart.length === 0 || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const orderRes = await fetch('/api/public/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantSlug: slug,
          lines: cart.map((line) => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
            selectedOptionIds: line.selectedOptionIds,
            notes: line.notes,
          })),
        }),
      });

      const order = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(order.error ?? t('customerFlow.menu.couldNotPlaceOrder'));
      }

      window.location.href =
        `/r/${slug}/order/${order.id}`;
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : t('common.somethingWentWrong')
      );
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function confirmPartySize() {
    setConfirmingPartySize(true);
    setPartySizeError(null);

    try {
      const res = await fetch(`/api/public/restaurants/${slug}/party-size`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partySize: partySizeDraft }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error ?? t('common.somethingWentWrong'));
      }

      setPartySize(json.session?.partySize ?? partySizeDraft);
    } catch (err) {
      setPartySizeError(
        err instanceof Error ? err.message : t('common.somethingWentWrong')
      );
    } finally {
      setConfirmingPartySize(false);
    }
  }

  if (blockedInfo) {
    return (
      <div className="min-h-screen bg-[#f7f3ec] text-[#29251f] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#29251f]/50 mb-2">
            {blockedInfo.table.label}
          </p>

          <h1 className="font-display text-2xl leading-tight mb-3">
            {t('customerFlow.reservationBlock.title')}
          </h1>

          <p className="text-sm text-[#29251f]/60 mb-6">
            {t('customerFlow.reservationBlock.subtitle')}
          </p>

          {blockedInfo.availableTables.length > 0 ? (
            <div className="text-left border border-[#29251f]/10 rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#29251f]/40 mb-3">
                {t('customerFlow.reservationBlock.availableTables')}
              </p>

              <div className="flex flex-wrap gap-2">
                {blockedInfo.availableTables.map((table) => (
                  <span
                    key={table.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full border border-[#29251f]/15 text-sm"
                  >
                    {table.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#29251f]/50">
              {t('customerFlow.reservationBlock.noneAvailable')}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f7f3ec] flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-3xl text-[#29251f] mb-3">
            {t('customerFlow.menu.unavailable')}
          </p>
          <p className="text-[#29251f]/60">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f7f3ec] flex items-center justify-center">
        <p className="text-[#29251f]/50 text-sm tracking-[0.15em] uppercase">
          {t('customerFlow.menu.preparing')}
        </p>
      </div>
    );
  }

  if (partySize === null) {
    return (
      <div className="min-h-screen bg-[#f7f3ec] text-[#29251f] flex items-center justify-center px-6">
        <div className="w-full max-w-xs text-center">
          {data.restaurant.logoUrl ? (
            <img
              src={data.restaurant.logoUrl}
              alt={data.restaurant.name}
              className="mx-auto h-14 w-14 object-contain mb-5"
            />
          ) : (
            <div className="mx-auto mb-5 text-[#7b2d26] text-3xl" aria-hidden="true">
              
            </div>
          )}

          <p className="text-[11px] uppercase tracking-[0.28em] text-[#29251f]/50 mb-2">
            {data.restaurant.name}
          </p>

          <h1 className="font-display text-2xl leading-tight mb-2">
            {t('customerFlow.partySize.title')}
          </h1>

          <p className="text-sm text-[#29251f]/60 mb-6">
            {t('customerFlow.partySize.subtitle')}
          </p>

          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              type="button"
              aria-label={t('customerFlow.partySize.decrease')}
              onClick={() =>
                setPartySizeDraft((n) => Math.max(1, n - 1))
              }
              className="h-11 w-11 rounded-full border border-[#29251f]/20 text-xl leading-none flex items-center justify-center hover:bg-[#29251f]/5"
            >
              −
            </button>

            <span className="font-display text-5xl w-16 text-center tabular-nums">
              {partySizeDraft}
            </span>

            <button
              type="button"
              aria-label={t('customerFlow.partySize.increase')}
              onClick={() =>
                setPartySizeDraft((n) => Math.min(30, n + 1))
              }
              className="h-11 w-11 rounded-full border border-[#29251f]/20 text-xl leading-none flex items-center justify-center hover:bg-[#29251f]/5"
            >
              +
            </button>
          </div>

          <p className="text-xs text-[#29251f]/50 mb-4">
            {partySizeDraft === 1
              ? `1 ${t('customerFlow.partySize.person')}`
              : `${partySizeDraft} ${t('customerFlow.partySize.people')}`}
          </p>

          {partySizeError && (
            <p className="text-xs text-red-600 mb-3">{partySizeError}</p>
          )}

          <button
            type="button"
            onClick={() => void confirmPartySize()}
            disabled={confirmingPartySize}
            className="w-full bg-[#7b2d26] text-white rounded-lg py-3 text-sm font-medium tracking-wide disabled:opacity-60"
          >
            {t('customerFlow.partySize.confirm')}
          </button>
        </div>
      </div>
    );
  }

  const accent = data.restaurant.brandPrimaryColor || '#7b2d26';

  const isDessertOnly = dessertOnly || dessertMode;

  const visibleCategories = isDessertOnly
    ? data.categories.filter((category) =>
        /dessert|postre|postres/i.test(category.name)
      )
    : data.categories.filter((category) =>
        !/dessert|postre|postres/i.test(category.name)
      );

  return (
    <div
      className="min-h-screen bg-[#f7f3ec] text-[#29251f] pb-32"
      style={
        {
          '--accent': accent,
        } as React.CSSProperties
      }
    >
      <header className="bg-[#f7f3ec] border-b border-[#29251f]/10">
        <div className="max-w-2xl mx-auto px-5 pt-5">
          <div className="flex justify-end">
            <LanguageSwitcher className="border border-[#29251f]/15 rounded-lg px-2 py-1.5 text-xs bg-white/60 text-[#29251f] outline-none focus:border-[#29251f]" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 pt-3 pb-5">
          <div className="text-center">
            {data.restaurant.logoUrl ? (
              <img
                src={data.restaurant.logoUrl}
                alt={data.restaurant.name}
                className="mx-auto h-16 w-16 object-contain mb-4"
              />
            ) : (
              <div className="mx-auto mb-4 text-[#7b2d26] text-3xl" aria-hidden="true">
                
              </div>
            )}

            <p className="text-[11px] uppercase tracking-[0.28em] text-[#29251f]/50 mb-2">
              {t('customerFlow.menu.welcome')}
            </p>

            <h1 className="font-display text-4xl leading-tight">
              {data.restaurant.name}
            </h1>

            <div className="mt-4 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.16em] text-[#29251f]/55">
              <span>{data.table.label}</span>
              <span className="text-[#7b2d26]">-</span>
              <span>
                {data.restaurant.isOpen ? t('customerFlow.menu.open') : t('customerFlow.menu.closed')}
              </span>
            </div>
          </div>

          {!data.restaurant.isOpen && (
            <div className="mt-5 border border-[#8d332c]/20 bg-[#8d332c]/5 px-4 py-3 text-center text-sm text-[#8d332c]">
              {t('customerFlow.menu.notAcceptingOrders')}
            </div>
          )}
        </div>

        <nav className="max-w-2xl mx-auto px-5">
          <div className="flex justify-center gap-7 overflow-x-auto no-scrollbar">
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);

                  document
                    .getElementById(`category-${category.id}`)
                    ?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                }}
                className={`relative whitespace-nowrap pb-4 text-xs uppercase tracking-[0.16em] transition-colors ${
                  activeCategory === category.id
                    ? 'text-[#7b2d26]'
                    : 'text-[#29251f]/45'
                }`}
              >
                {category.name}

                {activeCategory === category.id && (
                  <span className="absolute bottom-0 left-1/2 h-px w-8 -translate-x-1/2 bg-[#7b2d26]" />
                )}
              </button>
            ))}
          </div>
          </nav>
      </header>

      <main className="max-w-2xl mx-auto px-5">
        {visibleCategories.map((category) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            className="pt-12 scroll-mt-32"
          >
            <div className="text-center mb-7">
              <div className="flex items-center justify-center gap-4">
                <span className="h-px w-10 bg-[#29251f]/15" />

                <h2 className="font-display text-2xl">
                  {category.name}
                </h2>

                <span className="h-px w-10 bg-[#29251f]/15" />
              </div>
            </div>

            <div className="space-y-1">
              {category.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="group w-full text-left border-b border-[#29251f]/10 py-5 transition-colors hover:bg-[#29251f]/[0.025]"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-xl group-hover:text-[#7b2d26] transition-colors">
                      {item.name}
                    </span>

                    <span className="flex-1 border-b border-dotted border-[#29251f]/20 translate-y-[-4px]" />

                    <span className="text-base tabular-nums">
                      {formatCents(
                        item.priceCents,
                        data.restaurant.currency
                      )}
                    </span>
                  </div>

                  {item.description && (
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#29251f]/55">
                      {item.description}
                    </p>
                  )}

                  {item.allergens.length > 0 && (
                    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-[#29251f]/35">
                      <AllergenIconRow allergens={item.allergens} />
                      {t('customerFlow.menu.contains', { allergens: item.allergens.join(', ') })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        ))}

      {!dessertOnly && (
        <div className="pb-12 pt-10">
          <a
            href={`/r/${slug}?t=${encodeURIComponent(token)}&desserts=1`}
            className="block w-full border border-[#29251f]/20 py-4 text-center text-sm font-medium transition-colors hover:bg-[#29251f]/[0.03]"
          >
            {t('customerFlow.menu.skipToDessert')}
          </a>
        </div>
      )}
      </main>

      {activeItem && (
        <ItemModal
          item={activeItem}
          currency={data.restaurant.currency}
          accent={accent}
          onClose={() => setActiveItem(null)}
          onAdd={addToCart}
        />
      )}

      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-5 left-5 right-5 z-20 mx-auto flex max-w-2xl items-center justify-between border border-[#29251f]/10 bg-[#29251f] px-5 py-4 text-[#f7f3ec] shadow-xl"
        >
          <span className="text-sm">
            {t('customerFlow.menu.yourOrderCount', {
              count: cartCount,
              itemWord:
                cartCount === 1
                  ? t('customerFlow.menu.item')
                  : t('customerFlow.menu.items'),
            })}
          </span>

          <span className="font-medium tabular-nums">
            {formatCents(
              cartTotalCents,
              data.restaurant.currency
            )}
          </span>
        </button>
      )}

      {cartOpen && (
        <CartDrawer
          lines={cart}
          currency={data.restaurant.currency}
          totalCents={cartTotalCents}
          submitting={submitting}
          error={submitError}
          disabled={!data.restaurant.isOpen}
          accent={accent}
          onClose={() => setCartOpen(false)}
          onRemove={removeLine}
          onSubmit={submitOrder}
        />
      )}
    </div>
  );
}

function ItemModal({
  item,
  currency,
  accent,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  currency: string;
  accent: string;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] =
    useState<string | null>(null);
  const { t } = useI18n();

  function toggleOption(modifier: Modifier, optionId: string) {
    setSelected((previous) => {
      const current = previous[modifier.id] ?? [];

      if (modifier.selectionType === 'SINGLE') {
        return {
          ...previous,
          [modifier.id]: current.includes(optionId)
            ? []
            : [optionId],
        };
      }

      const isSelected = current.includes(optionId);
      const max = modifier.maxSelect ?? Infinity;

      if (!isSelected && current.length >= max) {
        return previous;
      }

      return {
        ...previous,
        [modifier.id]: isSelected
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  }

  const unitPriceCents =
    item.priceCents +
    item.modifiers
      .flatMap((modifier) =>
        modifier.options.filter((option) =>
          (selected[modifier.id] ?? []).includes(option.id)
        )
      )
      .reduce(
        (sum, option) => sum + option.priceDeltaCents,
        0
      );

  function handleAdd() {
    for (const modifier of item.modifiers) {
      const count = (selected[modifier.id] ?? []).length;

      if (modifier.isRequired && count === 0) {
        setValidationError(
          t('customerFlow.item.chooseOptionFor', { name: modifier.name })
        );
        return;
      }

      if (modifier.minSelect && count < modifier.minSelect) {
        setValidationError(
          t('customerFlow.item.chooseAtLeastFor', {
            min: modifier.minSelect,
            name: modifier.name,
          })
        );
        return;
      }
    }

    const selectedOptionIds = Object.values(selected).flat();

    const optionNames = item.modifiers
      .flatMap((modifier) =>
        modifier.options.filter((option) =>
          (selected[modifier.id] ?? []).includes(option.id)
        )
      )
      .map((option) => option.name);

    onAdd({
      key: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      name: item.name,
      unitPriceCents,
      quantity,
      selectedOptionIds,
      selectedOptionsLabel: optionNames.join(', '),
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#29251f]/55 p-0 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-y-auto bg-[#f7f3ec] sm:max-h-[88vh] sm:border sm:border-[#29251f]/10"
        onClick={(event) => event.stopPropagation()}
      >
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-56 w-full object-cover"
          />
        )}

        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-3xl">
                {item.name}
              </h3>

              {item.description && (
                <p className="mt-2 text-sm leading-relaxed text-[#29251f]/55">
                  {item.description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-xs uppercase tracking-[0.15em] text-[#29251f]/45"
            >
              {t('common.close')}
            </button>
          </div>

          {item.allergens.length > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-[#29251f]/35">
              <AllergenIconRow allergens={item.allergens} />
              {t('customerFlow.menu.contains', { allergens: item.allergens.join(', ') })}
            </p>
          )}

          {item.modifiers.map((modifier) => (
            <fieldset key={modifier.id} className="mt-7">
              <legend className="flex items-center gap-2 font-display text-lg">
                {modifier.name}

                {modifier.isRequired && (
                  <span className="font-sans text-[10px] uppercase tracking-[0.1em] text-[#29251f]/40">
                    {t('common.required')}
                  </span>
                )}
              </legend>

              <div className="mt-3 space-y-2">
                {modifier.options.map((option) => {
                  const checked = (
                    selected[modifier.id] ?? []
                  ).includes(option.id);

                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center justify-between border px-4 py-3 transition-colors ${
                        checked
                          ? 'border-[#7b2d26] bg-[#7b2d26]/5'
                          : 'border-[#29251f]/10'
                      } ${
                        !option.isAvailable
                          ? 'pointer-events-none opacity-40'
                          : ''
                      }`}
                    >
                      <span className="flex items-center gap-3 text-sm">
                        <input
                          type={
                            modifier.selectionType === 'SINGLE'
                              ? 'radio'
                              : 'checkbox'
                          }
                          checked={checked}
                          onChange={() =>
                            toggleOption(
                              modifier,
                              option.id
                            )
                          }
                          style={{
                            accentColor: accent,
                          }}
                        />

                        {option.name}
                      </span>

                      {option.priceDeltaCents > 0 && (
                        <span className="text-sm tabular-nums text-[#29251f]/55">
                          +
                          {formatCents(
                            option.priceDeltaCents,
                            currency
                          )}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="mt-7">
            <label className="font-display text-lg">
              {t('customerFlow.item.specialInstructions')}
            </label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value.slice(0, 280))
              }
              placeholder={t('customerFlow.item.notesPlaceholder')}
              rows={3}
              className="mt-3 w-full resize-none border border-[#29251f]/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-[#7b2d26]"
            />
          </div>

          {validationError && (
            <p className="mt-4 text-sm text-[#8d332c]">
              {validationError}
            </p>
          )}

          <div className="mt-7 flex gap-3">
            <div className="flex items-center border border-[#29251f]/15">
              <button
                onClick={() =>
                  setQuantity((value) =>
                    Math.max(1, value - 1)
                  )
                }

                className="h-12 w-12 text-lg"
                aria-label={t('customerFlow.item.decreaseQuantity')}
              >
                -</button>

              <span className="w-8 text-center tabular-nums">
                {quantity}
              </span>

              <button
                onClick={() =>
                  setQuantity((value) =>
                    Math.min(20, value + 1)
                  )
                }
                className="h-12 w-12 text-lg"
                aria-label={t('customerFlow.item.increaseQuantity')}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAdd}
              className="flex-1 bg-[#29251f] px-5 py-3 text-sm font-medium text-[#f7f3ec] transition-opacity hover:opacity-90"
            >
              {t('customerFlow.item.addToOrder', {
                price: formatCents(unitPriceCents * quantity, currency),
              })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  lines,
  currency,
  totalCents,
  submitting,
  error,
  disabled,
  accent,
  onClose,
  onRemove,
  onSubmit,
}: {
  lines: CartLine[];
  currency: string;
  totalCents: number;
  submitting: boolean;
  error: string | null;
  disabled: boolean;
  accent: string;
  onClose: () => void;
  onRemove: (key: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useI18n();

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#29251f]/55 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#f7f3ec] sm:max-h-[85vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#29251f]/10 p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#29251f]/40">
              {t('customerFlow.cart.tableOrder')}
            </p>
            <h3 className="font-display text-3xl">
              {t('customerFlow.cart.yourOrder')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-xs uppercase tracking-[0.15em] text-[#29251f]/45"
          >
            {t('common.close')}
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-6">
          <div className="space-y-5">
            {lines.map((line) => (
              <div
                key={line.key}
                className="border-b border-[#29251f]/10 pb-5"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-sm text-[#29251f]/45">
                    {t('customerFlow.cart.quantityPrefix', { quantity: line.quantity })}
                  </span>

                  <span className="flex-1 font-display text-lg">
                    {line.name}
                  </span>

                  <span className="text-sm tabular-nums">
                    {formatCents(
                      line.unitPriceCents * line.quantity,
                      currency
                    )}
                  </span>
                </div>

                {line.selectedOptionsLabel && (
                  <p className="ml-7 mt-1 text-xs text-[#29251f]/50">
                    {line.selectedOptionsLabel}
                  </p>
                )}

                {line.notes && (
                  <p className="ml-7 mt-1 text-xs italic text-[#29251f]/40">
                    &ldquo;{line.notes}&rdquo;
                  </p>
                )}

                <button
                  onClick={() => onRemove(line.key)}
                  className="ml-7 mt-2 text-[10px] uppercase tracking-[0.12em] text-[#8d332c]"
                >
                  {t('common.remove')}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#29251f]/10 p-6">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-xl">{t('common.total')}</span>

            <span className="text-xl font-medium tabular-nums">
              {formatCents(totalCents, currency)}
            </span>
          </div>

          {error && (
            <p className="mt-3 text-sm text-[#8d332c]">
              {error}
            </p>
          )}

          <button
            onClick={onSubmit}
            disabled={submitting || disabled}
            style={{
              backgroundColor: accent,
            }}
            className="mt-5 w-full py-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? t('customerFlow.cart.preparingPayment')
              : disabled
                ? t('customerFlow.cart.restaurantClosed')
                : t('customerFlow.cart.continueToPayment')}
          </button>

          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.12em] text-[#29251f]/35">
            {t('customerFlow.cart.securePayment')}
          </p>

          <p className="mt-2 text-center text-[10px] text-[#29251f]/35">
            {t('legal.agreementLeadIn')}{' '}
            <a href="/legal/terms" className="underline hover:text-[#29251f]/60">
              {t('legal.inlineTermsLink')}
            </a>{' '}
            {t('legal.and')}{' '}
            <a href="/legal/privacy" className="underline hover:text-[#29251f]/60">
              {t('legal.inlinePrivacyLink')}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}