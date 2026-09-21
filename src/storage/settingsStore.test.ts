import { describe, expect, it } from 'vitest';
import { mergeSettings } from './settingsStore';
import { DEFAULT_SETTINGS } from '../content/defaultSettings';

describe('mergeSettings', () => {
  it('uses the defaults when nothing is stored', () => {
    expect(mergeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps stored values', () => {
    const merged = mergeSettings({ childName: 'Seb', sessionMinutes: 15 });
    expect(merged.childName).toBe('Seb');
    expect(merged.sessionMinutes).toBe(15);
  });

  it('fills in a setting added after the record was written', () => {
    // A tablet that stored settings before bookOrder existed must still open.
    const merged = mergeSettings({ childName: 'Seb' });
    expect(merged.bookOrder).toBe('sequence');
    expect(merged.songIntervalMs).toBe(700);
  });
});
