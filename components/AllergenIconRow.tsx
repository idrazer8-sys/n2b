'use client';

import { matchAllergenKeys } from '@/src/lib/allergens';
import { ALLERGEN_ICONS, ALLERGEN_COLORS } from '@/components/branding/allergenIcons';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

// Renders one small badge per recognised allergen, ALONGSIDE the raw text
// (never instead of it — a manager's free-text entry is still the source
// of truth; the icons are a faster-to-scan supplement, and any allergen
// string that doesn't match the EU-14 vocabulary just has no icon). Each
// badge is a solid circle in that allergen's fixed brand color with a
// white pictogram inside, so the same allergen reads the same way on the
// customer menu, the kitchen ticket, and the order-history receipt.
export default function AllergenIconRow({
  allergens,
  size = 20,
  className = '',
}: {
  allergens: string[];
  size?: number;
  className?: string;
}) {
  const { t } = useI18n();
  const keys = matchAllergenKeys(allergens);

  if (keys.length === 0) return null;

  const iconSize = Math.round(size * 0.58);

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {keys.map((key) => {
        const Icon = ALLERGEN_ICONS[key];
        const label = t(`allergens.${key}`);
        return (
          <span
            key={key}
            title={label}
            aria-label={label}
            className="inline-flex shrink-0 items-center justify-center rounded-full text-white"
            style={{ width: size, height: size, background: ALLERGEN_COLORS[key] }}
          >
            <Icon size={iconSize} />
          </span>
        );
      })}
    </span>
  );
}
