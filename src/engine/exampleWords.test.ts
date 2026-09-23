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
    expect(exampleWordsFor('M', 'Sebastian', ['mummy'])).toEqual(['Mummy', 'monkey']);
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
    expect(bookWordFor('T', 'Sebastian')).toBe('toy');
  });
});

describe('a word the parent typed', () => {
  it('wins over the bundled default', () => {
    expect(exampleWordsFor('T', 'Sebastian', [], { T: 'teddy' })).toEqual(['teddy', 'toy']);
  });

  it("wins over the child's own name", () => {
    expect(exampleWordsFor('S', 'Sebastian', [], { S: 'slide' })).toEqual(['slide', 'sun']);
  });

  it('wins over a family name', () => {
    expect(exampleWordsFor('M', 'Sebastian', ['Mummy'], { M: 'moon' })).toEqual(['moon', 'monkey']);
  });

  it('is ignored when blank or only spaces, rather than showing an empty page', () => {
    expect(exampleWordsFor('T', 'Sebastian', [], { T: '   ' })).toEqual(['toy', 'tiger']);
    expect(exampleWordsFor('T', 'Sebastian', [], { T: '' })).toEqual(['toy', 'tiger']);
  });

  it('is trimmed, so a stray space does not break the illustration lookup', () => {
    expect(exampleWordsFor('B', 'Sebastian', [], { B: ' ball ' })).toEqual(['ball', 'ball']);
  });

  it('only affects its own letter', () => {
    expect(exampleWordsFor('A', 'Sebastian', [], { T: 'teddy' })).toEqual(['apple', 'ant']);
  });

  it('reaches the Family Book page too', () => {
    expect(bookWordFor('T', 'Sebastian', [], { T: 'teddy' })).toBe('teddy');
  });
});
