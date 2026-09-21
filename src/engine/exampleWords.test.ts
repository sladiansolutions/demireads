import { describe, expect, it } from 'vitest';
import { bookWordFor, exampleWordsFor } from './exampleWords';

describe('exampleWordsFor', () => {
  it('uses the default words when no name matches', () => {
    expect(exampleWordsFor('B', 'Sebastian')).toEqual(['ball', 'banana']);
  });

  it("puts the child's name first on its own initial", () => {
    expect(exampleWordsFor('S', 'Sebastian')).toEqual(['Sebastian', 'sun']);
  });

  it('uses a family name on its initial, capitalized', () => {
    expect(exampleWordsFor('M', 'Sebastian', ['mummy'])).toEqual(['Mummy', 'moon']);
  });

  it('prefers the child over a family member sharing an initial', () => {
    expect(exampleWordsFor('S', 'Sebastian', ['Sadie'])).toEqual(['Sebastian', 'sun']);
  });

  it('is unfazed by an empty name', () => {
    expect(exampleWordsFor('A', '', [''])).toEqual(['apple', 'ant']);
  });
});

describe('bookWordFor', () => {
  it('is the first example word', () => {
    expect(bookWordFor('S', 'Sebastian')).toBe('Sebastian');
    expect(bookWordFor('T', 'Sebastian')).toBe('train');
  });
});
