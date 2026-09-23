/**
 * Inline SVG icons, traced from docs/design-reference/. Inline so nothing is
 * fetched at runtime. All are decorative: the surrounding control carries the
 * accessible label.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function HomeIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={2.2} {...stroke} aria-hidden="true">
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

export function LockIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={2.2} {...stroke} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function SpeakerIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={2.2} {...stroke} aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={2.6} {...stroke} aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={2.6} {...stroke} aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function PhotoIcon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={1.8} {...stroke} aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function SunIcon({ size = 84 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 84 84" aria-hidden="true">
      <circle cx="42" cy="42" r="20" fill="var(--sun)" />
      <g stroke="var(--sun)" strokeWidth="6" strokeLinecap="round">
        <line x1="42" y1="6" x2="42" y2="14" />
        <line x1="42" y1="70" x2="42" y2="78" />
        <line x1="6" y1="42" x2="14" y2="42" />
        <line x1="70" y1="42" x2="78" y2="42" />
        <line x1="17" y1="17" x2="22" y2="22" />
        <line x1="62" y1="62" x2="67" y2="67" />
        <line x1="67" y1="17" x2="62" y2="22" />
        <line x1="17" y1="67" x2="22" y2="62" />
      </g>
    </svg>
  );
}

/** Home tile glyph: an open book with a photo in it. */
export function BookGlyph({ size = 190 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <rect x="12" y="20" width="96" height="80" rx="12" fill="var(--ground)" />
      <circle cx="82" cy="44" r="10" fill="var(--sun)" />
      <path d="M20 90 L48 56 L68 78 L80 66 L100 90 Z" fill="var(--teal)" />
    </svg>
  );
}

/** Home tile glyph: a duck, for counting. */
export function DuckGlyph({ width = 200 }: { width?: number }) {
  return (
    <svg width={width} height={width * (166 / 200)} viewBox="0 0 120 100" aria-hidden="true">
      <ellipse cx="55" cy="68" rx="42" ry="26" fill="var(--sun)" />
      <circle cx="88" cy="38" r="20" fill="var(--sun)" />
      <path d="M104 36 L118 42 L104 48 Z" fill="#E07A2E" />
      <circle cx="92" cy="33" r="3.5" fill="var(--ink)" />
      <path d="M30 62 Q48 50 62 64" fill="none" stroke="#D9A632" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Home tile glyph: musical notes, for the A to Z song. */
export function NotesGlyph({ size = 170 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={1.8} {...stroke} aria-hidden="true">
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  );
}

/** Home tile glyph for Find It: a letter under a magnifying glass. */
export function FindGlyph({ size = 180 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="52" cy="52" r="34" fill="var(--ground)" />
      <text
        x="52"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Fredoka, sans-serif"
        fontSize="46"
        fontWeight="700"
        fill="var(--teal-deep)"
      >
        B
      </text>
      <circle cx="52" cy="52" r="34" fill="none" stroke="currentColor" strokeWidth="8" />
      <line
        x1="78"
        y1="78"
        x2="102"
        y2="102"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlayIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5l12 7-12 7z" />
    </svg>
  );
}

export function PauseIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.5" />
      <rect x="14" y="5" width="4" height="14" rx="1.5" />
    </svg>
  );
}

/** A fingertip on a surface, with ripples: the "touch a letter" mode. */
export function TouchIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.6" fill="currentColor" />
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6.6 6.6a7.6 7.6 0 0 0 0 10.8" />
        <path d="M17.4 6.6a7.6 7.6 0 0 1 0 10.8" />
      </g>
    </svg>
  );
}
