import type { DietaryTagKey } from '@/src/lib/dietaryTags';

type IconProps = {
  className?: string;
  size?: number;
};

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Svg({ size = 16, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      {children}
    </svg>
  );
}

// Six dietary-preference tags shown alongside allergens on the customer
// menu. Same "icon supplements the word, never replaces it" rule.

function VegetarianIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20c-4-1-7-5-7-10 0-2 .5-4 1.5-5.5C8 3 10 3 12 4c3 1.5 5 4 5 8 0 4-2 7-5 8z" />
      <path d="M12 20V8" />
    </Svg>
  );
}

function VeganIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 12c-4 0-7-3-7-7 4 0 7 3 7 7z" />
      <path d="M12 12c4 0 7-3 7-7-4 0-7 3-7 7z" />
      <path d="M12 12v9" />
    </Svg>
  );
}

function SpicyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8.5 5.5c1-1.5 2.5-2.3 4-2" />
      <path d="M9.5 6.5c3-1 6.5 0 7.5 4 1 4-2 9.5-6.5 9.5-3 0-5-2.3-5-5.3 0-3 1.3-6 4-8.2z" />
    </Svg>
  );
}

function VerySpicyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <g transform="translate(-2.2 -1.2) scale(0.8)">
        <path d="M8.5 5.5c1-1.5 2.5-2.3 4-2" />
        <path d="M9.5 6.5c3-1 6.5 0 7.5 4 1 4-2 9.5-6.5 9.5-3 0-5-2.3-5-5.3 0-3 1.3-6 4-8.2z" />
      </g>
      <g transform="translate(2.2 1.2) scale(0.8)">
        <path d="M8.5 5.5c1-1.5 2.5-2.3 4-2" />
        <path d="M9.5 6.5c3-1 6.5 0 7.5 4 1 4-2 9.5-6.5 9.5-3 0-5-2.3-5-5.3 0-3 1.3-6 4-8.2z" />
      </g>
    </Svg>
  );
}

function GlutenFreeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v14" />
      <path d="M12 5.5c-2 0-3 1-3 2s1 1.5 3 1.5M12 5.5c2 0 3 1 3 2s-1 1.5-3 1.5" />
      <path d="M12 9c-2 0-3 1-3 2s1 1.5 3 1.5M12 9c2 0 3 1 3 2s-1 1.5-3 1.5" />
      <path d="M9.5 19l2.5-2 2.5 2" />
      <path d="M4.5 19.5l15-15" />
    </Svg>
  );
}

function DairyFreeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 3.5h5v2.8l1.5 2.7v10a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V9l1.5-2.7z" />
      <path d="M8 12h8" />
      <path d="M4.5 19.5l15-15" />
    </Svg>
  );
}

export const DIETARY_TAG_ICONS: Record<DietaryTagKey, (props: IconProps) => JSX.Element> = {
  VEGETARIAN: VegetarianIcon,
  VEGAN: VeganIcon,
  SPICY: SpicyIcon,
  VERY_SPICY: VerySpicyIcon,
  GLUTEN_FREE: GlutenFreeIcon,
  DAIRY_FREE: DairyFreeIcon,
};

// One fixed color per tag, distinct from the allergen palette in
// allergenIcons.tsx so the two icon rows never blend together visually.
export const DIETARY_TAG_COLORS: Record<DietaryTagKey, string> = {
  VEGETARIAN: '#4F8542',
  VEGAN: '#2F6B33',
  SPICY: '#D9622B',
  VERY_SPICY: '#A82F1F',
  GLUTEN_FREE: '#9C9280',
  DAIRY_FREE: '#5C8FB0',
};
