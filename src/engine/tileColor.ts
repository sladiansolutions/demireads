/**
 * Tile colors cycle in the order tomato, teal, sun, plum by item index.
 * Pure data, so screens never hard-code a color.
 */

export const TILE_COLORS = ['tomato', 'teal', 'sun', 'plum'] as const;

export type TileColor = (typeof TILE_COLORS)[number];

export interface TileStyle {
  /** CSS custom property for the tile background. */
  fill: string;
  /** CSS custom property for text and icons on that background. */
  text: string;
}

export function tileColorFor(index: number): TileColor {
  const count = TILE_COLORS.length;
  const wrapped = ((index % count) + count) % count;
  // wrapped is always in range, so the lookup cannot be undefined.
  return TILE_COLORS[wrapped] as TileColor;
}

export function tileStyleFor(index: number): TileStyle {
  const color = tileColorFor(index);
  return { fill: `var(--${color})`, text: `var(--on-${color})` };
}
