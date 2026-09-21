import { describe, expect, it } from 'vitest';
import { fitWithin, letterAudioId, letterPhotoId, mediaId, numberAudioId, PHOTO_MAX_EDGE } from './mediaKeys';

describe('mediaId', () => {
  it('is stable for the same target, so a new photo replaces the old one', () => {
    expect(letterPhotoId('B')).toBe(letterPhotoId('B'));
  });

  it('ignores case in the letter key', () => {
    expect(letterPhotoId('b')).toBe(letterPhotoId('B'));
  });

  it('keeps photo and voice for one letter apart', () => {
    expect(letterPhotoId('B')).not.toBe(letterAudioId('B'));
  });

  it('keeps letters, numbers and the one-off clips apart', () => {
    const ids = [
      letterPhotoId('B'),
      letterAudioId('B'),
      numberAudioId(3),
      mediaId('audio', { type: 'goodnight' }),
      mediaId('audio', { type: 'song' }),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('fitWithin', () => {
  it('leaves a small photo alone', () => {
    expect(fitWithin(800, 600, PHOTO_MAX_EDGE)).toEqual({ width: 800, height: 600 });
  });

  it('scales a landscape photo by its longest edge', () => {
    expect(fitWithin(4032, 3024, 1200)).toEqual({ width: 1200, height: 900 });
  });

  it('scales a portrait photo by its longest edge', () => {
    expect(fitWithin(3024, 4032, 1200)).toEqual({ width: 900, height: 1200 });
  });

  it('survives a zero-sized image instead of dividing by zero', () => {
    expect(fitWithin(0, 0, 1200)).toEqual({ width: 0, height: 0 });
  });
});
