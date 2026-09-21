import { describe, expect, it } from 'vitest';
import { TILE_COLORS, tileColorFor, tileStyleFor } from './tileColor';

describe('tileColorFor', () => {
  it('cycles tomato, teal, sun, plum by index', () => {
    expect([0, 1, 2, 3].map(tileColorFor)).toEqual(['tomato', 'teal', 'sun', 'plum']);
  });

  it('wraps around past the end of the cycle', () => {
    expect(tileColorFor(4)).toBe('tomato');
    expect(tileColorFor(7)).toBe('plum');
    expect(tileColorFor(26)).toBe('sun');
  });

  it('handles negative indexes without falling off the list', () => {
    expect(tileColorFor(-1)).toBe('plum');
    expect(tileColorFor(-4)).toBe('tomato');
  });
});

describe('tileStyleFor', () => {
  it('pairs each fill with its own text token', () => {
    expect(tileStyleFor(0)).toEqual({ fill: 'var(--tomato)', text: 'var(--on-tomato)' });
    expect(tileStyleFor(2)).toEqual({ fill: 'var(--sun)', text: 'var(--on-sun)' });
  });

  it('covers every color in the cycle', () => {
    const fills = TILE_COLORS.map((_, i) => tileStyleFor(i).fill);
    expect(new Set(fills).size).toBe(TILE_COLORS.length);
  });
});
