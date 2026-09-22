import { describe, expect, it } from 'vitest';
import { fallbackIntervalMs, indexAt, marksUsable, normalizeMarks } from './songMarks';

describe('normalizeMarks', () => {
  it('sorts taps into order', () => {
    expect(normalizeMarks([2, 1, 3])).toEqual([1, 2, 3]);
  });

  it('drops anything that is not a usable number', () => {
    expect(normalizeMarks([1, 'two', null, NaN, -4, undefined, 2])).toEqual([1, 2]);
  });

  it('drops duplicate moments, which would light two letters at once', () => {
    expect(normalizeMarks([1, 1, 2, 2, 3])).toEqual([1, 2, 3]);
  });

  it('never keeps more than 26', () => {
    const many = Array.from({ length: 40 }, (_, i) => i * 0.5);
    expect(normalizeMarks(many)).toHaveLength(26);
  });

  it('accepts an empty list', () => {
    expect(normalizeMarks([])).toEqual([]);
  });
});

describe('indexAt', () => {
  const marks = [1, 2, 3.5, 5];

  it('is -1 before the first mark, so nothing lights early', () => {
    expect(indexAt(marks, 0)).toBe(-1);
    expect(indexAt(marks, 0.99)).toBe(-1);
  });

  it('lights a letter exactly on its mark', () => {
    expect(indexAt(marks, 1)).toBe(0);
    expect(indexAt(marks, 2)).toBe(1);
  });

  it('holds the last letter reached between marks', () => {
    expect(indexAt(marks, 2.9)).toBe(1);
    expect(indexAt(marks, 3.5)).toBe(2);
  });

  it('holds the final letter past the end', () => {
    expect(indexAt(marks, 99)).toBe(3);
  });

  it('copes with no marks at all', () => {
    expect(indexAt([], 5)).toBe(-1);
  });
});

describe('marksUsable', () => {
  it('needs at least two marks to mean anything', () => {
    expect(marksUsable([])).toBe(false);
    expect(marksUsable([1])).toBe(false);
    expect(marksUsable([1, 2])).toBe(true);
  });
});

describe('fallbackIntervalMs', () => {
  it('falls back to the setting when there is nothing to measure', () => {
    expect(fallbackIntervalMs([], 700)).toBe(700);
    expect(fallbackIntervalMs([1], 700)).toBe(700);
  });

  it('averages the gaps that were tapped', () => {
    expect(fallbackIntervalMs([0, 1, 2, 3], 700)).toBe(1000);
    expect(fallbackIntervalMs([0, 0.5, 1], 700)).toBe(500);
  });

  it('refuses a silly interval from a stray double tap', () => {
    expect(fallbackIntervalMs([0, 0.01, 0.02], 700)).toBe(250);
    expect(fallbackIntervalMs([0, 30, 60], 700)).toBe(3000);
  });
});
