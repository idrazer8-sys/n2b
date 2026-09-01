export function N2BMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="n2bMarkGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A134D" />
          <stop offset="100%" stopColor="#5B3DFF" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="12" fill="url(#n2bMarkGrad)" />

      {/* table top + legs */}
      <path
        d="M14 20h20M18 20v10M30 20v10"
        stroke="#F5F6FA"
        strokeWidth="2.25"
        strokeLinecap="round"
      />

      {/* left chair */}
      <path
        d="M9 15v9M9 24h5v6"
        stroke="#CDBBFF"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* right chair */}
      <path
        d="M39 15v9M39 24h-5v6"
        stroke="#CDBBFF"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function N2BWordmark({
  className,
  tagline,
  taglineClassName,
}: {
  className?: string;
  tagline?: string;
  taglineClassName?: string;
}) {
  return (
    <span className={className}>
      <span className="font-black tracking-tight">N2B</span>
      {tagline && (
        <span
          className={
            taglineClassName ??
            'block text-[9px] font-semibold uppercase tracking-[0.2em] opacity-60'
          }
        >
          {tagline}
        </span>
      )}
    </span>
  );
}

export default function N2BLogo({
  markSize = 36,
  showTagline = false,
  className,
  markClassName,
  wordmarkClassName,
}: {
  markSize?: number;
  showTagline?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <N2BMark size={markSize} className={markClassName} />
      <N2BWordmark
        className={wordmarkClassName ?? 'text-xl leading-none'}
        tagline={showTagline ? 'Restaurant Operations Automated' : undefined}
      />
    </span>
  );
}
