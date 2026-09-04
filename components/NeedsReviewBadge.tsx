'use client';

// A small "AI isn't fully sure about this" indicator, following the same
// fixed-color circular-badge convention as AllergenIconRow/DietaryTagIconRow
// (components/AllergenIconRow.tsx) — a solid-color circle sized to its
// container, title/aria-label carrying the reason, never color alone.
export default function NeedsReviewBadge({
  reason,
  size = 16,
}: {
  reason: string;
  size?: number;
}) {
  const iconSize = Math.round(size * 0.6);

  return (
    <span
      title={reason}
      aria-label={reason}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-500 text-white"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={iconSize}
        height={iconSize}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="8" x2="12" y2="13" />
        <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
      </svg>
    </span>
  );
}
