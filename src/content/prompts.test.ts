import { describe, expect, it } from 'vitest';
import { findItCheer, findItPrompt } from './prompts';

describe('findItPrompt', () => {
  it('names the letter every time', () => {
    for (let i = 0; i < 10; i += 1) expect(findItPrompt(i, 'B')).toContain('B');
  });

  it('varies from one round to the next', () => {
    const first = findItPrompt(0, 'B');
    expect(findItPrompt(1, 'B')).not.toBe(first);
  });

  it('offers several distinct phrasings before repeating', () => {
    const seen = new Set([0, 1, 2, 3, 4].map((i) => findItPrompt(i, 'B')));
    expect(seen.size).toBe(5);
  });

  it('cycles rather than running out', () => {
    expect(findItPrompt(5, 'B')).toBe(findItPrompt(0, 'B'));
    expect(findItPrompt(-1, 'B')).toBe(findItPrompt(4, 'B'));
  });
});

describe('findItCheer', () => {
  it('always celebrates and names the letter', () => {
    for (let i = 0; i < 8; i += 1) {
      const line = findItCheer(i, 'S');
      expect(line).toContain('S');
      expect(line).toMatch(/!$/);
    }
  });

  it('varies between rounds', () => {
    expect(findItCheer(1, 'S')).not.toBe(findItCheer(0, 'S'));
  });
});
