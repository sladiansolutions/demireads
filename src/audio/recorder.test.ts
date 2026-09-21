import { describe, expect, it } from 'vitest';
import { MAX_CLIP_MS, MIME_CANDIDATES, pickMimeType } from './recorder';

describe('pickMimeType', () => {
  it('prefers Opus in WebM where the browser has it', () => {
    expect(pickMimeType(() => true)).toBe('audio/webm;codecs=opus');
  });

  it('falls back to MP4 on Safari, which supports neither WebM option', () => {
    const safari = (type: string) => type === 'audio/mp4';
    expect(pickMimeType(safari)).toBe('audio/mp4');
  });

  it('returns an empty string when nothing is supported, letting the browser choose', () => {
    expect(pickMimeType(() => false)).toBe('');
  });

  it('only ever offers audio types', () => {
    for (const type of MIME_CANDIDATES) expect(type.startsWith('audio/')).toBe(true);
  });
});

describe('MAX_CLIP_MS', () => {
  it('leaves room for a short phrase without allowing a runaway recording', () => {
    expect(MAX_CLIP_MS).toBeGreaterThan(3000);
    expect(MAX_CLIP_MS).toBeLessThanOrEqual(10000);
  });
});
