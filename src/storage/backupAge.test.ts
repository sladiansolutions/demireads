import { describe, expect, it } from 'vitest';
import { backupAge, STALE_DAYS } from './backupAge';

const NOW = new Date('2026-09-21T12:00:00.000Z');

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString();
}

describe('backupAge', () => {
  it('treats never having exported as stale, and says what is at stake', () => {
    const age = backupAge(undefined, NOW);
    expect(age.days).toBeNull();
    expect(age.stale).toBe(true);
    expect(age.message).toMatch(/No backup yet/);
    expect(age.message).toMatch(/photos and voices/);
  });

  it('handles an empty or damaged date without throwing', () => {
    expect(backupAge('', NOW).stale).toBe(true);
    expect(backupAge('not a date', NOW).stale).toBe(true);
  });

  it('reads naturally for today and yesterday', () => {
    expect(backupAge(daysAgo(0), NOW).message).toBe('Last backup today.');
    expect(backupAge(daysAgo(1), NOW).message).toBe('Last backup yesterday.');
    expect(backupAge(daysAgo(5), NOW).message).toBe('Last backup 5 days ago.');
  });

  it('is not stale inside the window', () => {
    const age = backupAge(daysAgo(STALE_DAYS - 1), NOW);
    expect(age.stale).toBe(false);
    expect(age.message).not.toMatch(/Worth exporting/);
  });

  it('nudges once the window has passed', () => {
    const age = backupAge(daysAgo(STALE_DAYS), NOW);
    expect(age.stale).toBe(true);
    expect(age.message).toMatch(/Worth exporting again/);
  });

  it('never reports negative days if a clock is behind', () => {
    const future = new Date(NOW.getTime() + 86_400_000).toISOString();
    expect(backupAge(future, NOW).days).toBe(0);
  });
});
