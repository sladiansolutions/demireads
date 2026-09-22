import { describe, expect, it } from 'vitest';
import { backTarget, BUILT, isBuilt } from './routes';

describe('backTarget', () => {
  it('sends every child screen home', () => {
    for (const route of ['letters', 'book', 'numbers', 'song', 'find'] as const) {
      expect(backTarget(route, false)).toBe('home');
    }
  });

  it('does nothing on Home, so a swipe cannot leave the app', () => {
    expect(backTarget('home', false)).toBeNull();
  });

  it('steps the parent side back one level at a time', () => {
    expect(backTarget('wall', false)).toBe('parent');
    expect(backTarget('parent', false)).toBe('home');
  });

  it('holds Goodnight whatever the screen was, until the gate is passed', () => {
    for (const route of ['home', 'letters', 'find', 'parent', 'wall'] as const) {
      expect(backTarget(route, true)).toBeNull();
    }
  });
});

describe('isBuilt', () => {
  it('lists every child screen as built', () => {
    expect([...BUILT].sort()).toEqual(['book', 'find', 'home', 'letters', 'numbers', 'song']);
    expect(isBuilt('parent')).toBe(false);
  });
});
