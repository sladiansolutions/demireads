import { describe, expect, it } from 'vitest';
import {
  base64ToBytes,
  BundleError,
  BUNDLE_APP,
  bundleFilename,
  bytesToBase64,
  planMediaMerge,
  summarize,
  validateBundle,
  type TransferBundle,
  type TransferMedia,
} from './transfer';
import { DEFAULT_SETTINGS } from '../content/defaultSettings';
import { newNumberProgress } from '../engine/numbers';

function media(id: string, kind: 'photo' | 'audio'): TransferMedia {
  return { id, kind, target: { type: 'letter', key: 'B' }, createdAt: '2026-09-21', type: 'image/jpeg', data: 'AAA=' };
}

function bundle(overrides: Partial<TransferBundle> = {}): TransferBundle {
  return {
    app: BUNDLE_APP,
    version: 1,
    exportedAt: '2026-09-21T10:00:00.000Z',
    settings: DEFAULT_SETTINGS,
    letters: [],
    numbers: newNumberProgress(),
    notes: [],
    media: [],
    ...overrides,
  };
}

describe('base64 round trip', () => {
  it('survives arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 127, 128, 255, 65, 10, 13]);
    expect([...base64ToBytes(bytesToBase64(bytes))]).toEqual([...bytes]);
  });

  it('handles an empty blob', () => {
    expect(bytesToBase64(new Uint8Array())).toBe('');
    expect(base64ToBytes('').length).toBe(0);
  });

  it('handles a blob larger than one chunk without overflowing the stack', () => {
    // 200KB, bigger than the 32KB chunk, in the range a photo actually hits.
    const bytes = new Uint8Array(200_000);
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = i % 256;
    const round = base64ToBytes(bytesToBase64(bytes));
    expect(round.length).toBe(bytes.length);
    expect(round[0]).toBe(0);
    expect(round[199_999]).toBe(bytes[199_999]);
  });
});

describe('validateBundle', () => {
  it('accepts one of ours', () => {
    expect(validateBundle(bundle()).app).toBe(BUNDLE_APP);
  });

  it('rejects anything that is not an object', () => {
    for (const junk of [null, 'hello', 42, undefined]) {
      expect(() => validateBundle(junk)).toThrow(BundleError);
    }
  });

  it('rejects a file from another app', () => {
    expect(() => validateBundle({ ...bundle(), app: 'something-else' })).toThrow(/different app/);
  });

  it('rejects a newer format rather than guessing at it', () => {
    expect(() => validateBundle({ ...bundle(), version: 99 })).toThrow(/newer version/);
  });

  it('rejects a damaged media entry', () => {
    expect(() => validateBundle({ ...bundle(), media: [{ id: 'x' }] })).toThrow(/damaged/);
    expect(() => validateBundle({ ...bundle(), media: [{ ...media('x', 'photo'), kind: 'video' }] })).toThrow(
      /neither a photo nor a voice/,
    );
  });

  it('tolerates a bundle with no notes or progress sections', () => {
    const bare = validateBundle({ app: BUNDLE_APP, version: 1, media: [] });
    expect(bare.notes).toEqual([]);
    expect(bare.letters).toEqual([]);
  });
});

describe('planMediaMerge', () => {
  it('separates new entries from replacements', () => {
    const plan = planMediaMerge(['photo:letter:B'], [media('photo:letter:B', 'photo'), media('audio:letter:B', 'audio')]);
    expect(plan.replaced).toEqual(['photo:letter:B']);
    expect(plan.added).toEqual(['audio:letter:B']);
  });

  it("means one parent's voices never overwrite the other's photos", () => {
    // Her export holds audio only; his tablet holds photos only.
    const hers = ['A', 'B', 'C'].map((l) => media(`audio:letter:${l}`, 'audio'));
    const his = ['A', 'B', 'C'].map((l) => `photo:letter:${l}`);
    const plan = planMediaMerge(his, hers);
    expect(plan.replaced).toEqual([]);
    expect(plan.added).toHaveLength(3);
  });
});

describe('summarize', () => {
  it('counts what an import would bring', () => {
    const summary = summarize(
      bundle({
        media: [media('photo:letter:A', 'photo'), media('audio:letter:A', 'audio'), media('audio:letter:B', 'audio')],
        notes: [{ id: 'n1', date: '2026-09-20', text: 'pointed at S' }],
      }),
    );
    expect(summary).toMatchObject({ photos: 1, voices: 2, notes: 1 });
  });

  it('counts only letters that have actually been touched', () => {
    const summary = summarize(
      bundle({
        letters: [
          { letter: 'A', state: 0, exposures: 0, correctByDay: {}, sessionMisses: 0, lastStateChange: '' },
          { letter: 'B', state: 0, exposures: 4, correctByDay: {}, sessionMisses: 0, lastStateChange: '' },
          { letter: 'C', state: 2, exposures: 0, correctByDay: {}, sessionMisses: 0, lastStateChange: '' },
        ],
      }),
    );
    expect(summary.letters).toBe(2);
  });
});

describe('bundleFilename', () => {
  it('is dated and named after the child', () => {
    expect(bundleFilename(new Date(2026, 8, 21), 'Sebastian')).toBe('sebastian-abc-backup-2026-09-21.json');
  });

  it('copes with spaces and punctuation in a name', () => {
    expect(bundleFilename(new Date(2026, 0, 5), "Jo-Anne  Mae")).toBe('jo-anne-mae-abc-backup-2026-01-05.json');
  });

  it('falls back when the name is empty', () => {
    expect(bundleFilename(new Date(2026, 0, 5), '   ')).toBe('child-abc-backup-2026-01-05.json');
  });
});
