'use client';

import { matchDietaryTagKeys } from '@/src/lib/dietaryTags';
import { DIETARY_TAG_ICONS, DIETARY_TAG_COLORS } from '@/components/branding/dietaryTagIcons';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

// Same pattern as AllergenIconRow — a colored badge per recognised tag,
// alongside whatever text the manager actually entered, never instead of
// it. A distinct color set from the allergen badges (see
// dietaryTagIcons.tsx) so the two rows never blend together.
export default function DietaryTagIconRow({
  dietaryTags,
  size = 20,
  className = '',
}: {
  dietaryTags: string[];
  size?: number;
  className?: string;
}) {
  const { t } = useI18n();
  const keys = matchDietaryTagKeys(dietaryTags);

  if (keys.length === 0) return null;

  const iconSize = Math.round(size * 0.58);

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      {keys.map((key) => {
        const Icon = DIETARY_TAG_ICONS[key];
        const label = t(`dietaryTags.${key}`);
        return (
          <span
            key={key}
            title={label}
            aria-label={label}
            className="inline-flex shrink-0 items-center justify-center rounded-full text-white"
            style={{ width: size, height: size, background: DIETARY_TAG_COLORS[key] }}
          >
            <Icon size={iconSize} />
          </span>
        );
      })}
    </span>
  );
}
