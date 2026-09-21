import type { CSSProperties, ReactNode } from 'react';
import type { TileColor } from '../engine/tileColor';

/** Tile tokens that are not part of the four-colour index cycle. */
export type ExtraTone = 'teal-deep';

interface BigTileProps {
  /** A tile colour, or 'quiet' for a tile that is not lit yet. */
  tone: TileColor | ExtraTone | 'quiet';
  /** Read aloud by assistive tech. The child navigates by glyph, not text. */
  ariaLabel: string;
  label?: string;
  onClick: () => void;
  children: ReactNode;
}

export default function BigTile({ tone, ariaLabel, label, onClick, children }: BigTileProps) {
  const style =
    tone === 'quiet'
      ? undefined
      : ({ '--tile-fill': `var(--${tone})`, '--tile-text': `var(--on-${tone})` } as CSSProperties);

  return (
    <button
      type="button"
      className={tone === 'quiet' ? 'tile tile--quiet' : 'tile'}
      style={style}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
      {label !== undefined && <span className="tile__label">{label}</span>}
    </button>
  );
}
