import type { AllergenKey } from '@/src/lib/allergens';

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

// The 14 EU-regulated allergens (Regulation (EU) 1169/2011, Annex II).
// Simple, distinct pictograms rather than literal illustrations — good
// enough to recognise at a glance next to the text, which is the point
// (icons are always shown alongside the words, never instead of them).

function GlutenIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3v14" />
      <path d="M12 5.5c-2 0-3 1-3 2s1 1.5 3 1.5M12 5.5c2 0 3 1 3 2s-1 1.5-3 1.5" />
      <path d="M12 9c-2 0-3 1-3 2s1 1.5 3 1.5M12 9c2 0 3 1 3 2s-1 1.5-3 1.5" />
      <path d="M9.5 19l2.5-2 2.5 2" />
    </Svg>
  );
}

function CrustaceansIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 12c0-3 1.8-5 4-5s4 2 4 5-1.8 6-4 6-4-3-4-6z" />
      <path d="M8 10l-3-1.5M8 14l-3 1.5M16 10l3-1.5M16 14l3 1.5" />
      <path d="M10.5 7.5V5M13.5 7.5V5" />
    </Svg>
  );
}

function EggsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4c-3 4-5 8-5 11a5 5 0 0 0 10 0c0-3-2-7-5-11z" />
    </Svg>
  );
}

function FishIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12c3-3.5 7-5 10-5 4 0 7 2.5 8 5-1 2.5-4 5-8 5-3 0-7-1.5-10-5z" />
      <path d="M17.5 10l2.5-2.5v9l-2.5-2.5" />
      <path d="M7.5 11v0" />
    </Svg>
  );
}

function PeanutsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 4c-2 0-3.5 1.7-3.5 4 0 1-1 1.5-1 3.5S6.5 15 6.5 16c0 2.3 1.5 4 3.5 4 1.7 0 3-1.2 3-2.8 0-.8.5-1.2 1-1.7C15 14.5 16 13 16 11c0-1.5-.8-2.2-1.3-2.8-.4-.5-.7-1-.7-1.7C14 4.9 12.5 4 11 4c-.4 0-.7 0-1 0z" />
      <path d="M11 10.5v0M11 13.5v0" />
    </Svg>
  );
}

function SoyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 5c3-1 6-1 8 1.5-1.5 3-4 4-7 3.5" />
      <circle cx="9.5" cy="7.5" r="1.6" />
      <path d="M16 12c1 2.5-.5 5-3 6-3 1-6.5 0-8-2.5 1.5-3 4-4 7-3.5" />
      <circle cx="14.5" cy="16.5" r="1.6" />
    </Svg>
  );
}

function MilkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.5 3.5h5v2.8l1.5 2.7v10a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V9l1.5-2.7z" />
      <path d="M8 12h8" />
    </Svg>
  );
}

function TreeNutsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 6c-3 0-5 2.8-5 6.5S9 20 12 20s5-3.8 5-7.5S15 6 12 6z" />
      <path d="M9 6.5C9 4.5 10.3 3 12 3s3 1.5 3 3.5" />
      <path d="M12 10v6" />
    </Svg>
  );
}

function CeleryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21V9M8.5 21V11M15.5 21V11" />
      <path d="M6 9c1-3 3-5 6-6 3 1 5 3 6 6-2 1.5-4 2-6 2s-4-.5-6-2z" />
    </Svg>
  );
}

function MustardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 9h6l1 2v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9z" />
      <path d="M10 9V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v3" />
      <path d="M9 14h6" />
    </Svg>
  );
}

function SesameIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="8" cy="9" rx="2" ry="3" transform="rotate(-20 8 9)" />
      <ellipse cx="14" cy="7" rx="2" ry="3" transform="rotate(10 14 7)" />
      <ellipse cx="17" cy="13" rx="2" ry="3" transform="rotate(60 17 13)" />
      <ellipse cx="10" cy="16" rx="2" ry="3" transform="rotate(-50 10 16)" />
    </Svg>
  );
}

function SulphitesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 3h8" />
      <path d="M10 3v5.5L6.5 14A4 4 0 0 0 10 20h4a4 4 0 0 0 3.5-6L14 8.5V3" />
      <path d="M8 15h8" />
    </Svg>
  );
}

function LupinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21V9" />
      <ellipse cx="9" cy="7" rx="2.2" ry="3.3" transform="rotate(-25 9 7)" />
      <ellipse cx="15" cy="7" rx="2.2" ry="3.3" transform="rotate(25 15 7)" />
      <ellipse cx="12" cy="5" rx="2.2" ry="3.3" />
    </Svg>
  );
}

function MolluscsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 13c0-5 3.5-9 8-9s8 4 8 9" />
      <path d="M4 13h16l-1.5 3.5a3 3 0 0 1-2.8 1.9H8.3a3 3 0 0 1-2.8-1.9z" />
      <path d="M12 4v9M8.5 6.5v6.5M15.5 6.5v6.5" />
    </Svg>
  );
}

export const ALLERGEN_ICONS: Record<AllergenKey, (props: IconProps) => JSX.Element> = {
  GLUTEN: GlutenIcon,
  CRUSTACEANS: CrustaceansIcon,
  EGGS: EggsIcon,
  FISH: FishIcon,
  PEANUTS: PeanutsIcon,
  SOY: SoyIcon,
  MILK: MilkIcon,
  TREE_NUTS: TreeNutsIcon,
  CELERY: CeleryIcon,
  MUSTARD: MustardIcon,
  SESAME: SesameIcon,
  SULPHITES: SulphitesIcon,
  LUPIN: LupinIcon,
  MOLLUSCS: MolluscsIcon,
};

// One fixed brand color per allergen — never reassigned, never reused for
// anything else, so the same allergen reads as the same color everywhere
// it appears (customer menu, kitchen ticket, order history). Distinct
// hues across the wheel so no two neighbours are easily confused.
export const ALLERGEN_COLORS: Record<AllergenKey, string> = {
  GLUTEN: '#D8A23F',
  CRUSTACEANS: '#BE4A3E',
  EGGS: '#D9A727',
  FISH: '#4C79AE',
  PEANUTS: '#8B5A3C',
  SOY: '#6E8F46',
  MILK: '#86AFDA',
  TREE_NUTS: '#6B4C64',
  CELERY: '#93B97C',
  MUSTARD: '#C89A2E',
  SESAME: '#B7AC90',
  SULPHITES: '#7B5EA6',
  LUPIN: '#4A8E8B',
  MOLLUSCS: '#57687F',
};
