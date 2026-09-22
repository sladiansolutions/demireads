/**
 * How long since the last backup (SPEC 8). Pure, so the wording and the
 * threshold are testable without a clock.
 *
 * This matters more here than in most apps: until an export exists, the
 * tablet holds the only copy of every photo and recording.
 */

export const STALE_DAYS = 30;

export interface BackupAge {
  /** Days since the last export, or null if there has never been one. */
  days: number | null;
  /** True when a reminder is warranted. */
  stale: boolean;
  /** One line for the parent area. */
  message: string;
}

export function backupAge(lastExportAt: string | undefined, now: Date): BackupAge {
  if (lastExportAt === undefined || lastExportAt === '') {
    return {
      days: null,
      stale: true,
      message: 'No backup yet. If this tablet is lost or cleared, the photos and voices go with it.',
    };
  }

  const then = new Date(lastExportAt);
  if (Number.isNaN(then.getTime())) {
    return { days: null, stale: true, message: 'No backup yet.' };
  }

  const days = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86_400_000));
  const when = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;

  if (days >= STALE_DAYS) {
    return { days, stale: true, message: `Last backup ${when}. Worth exporting again.` };
  }
  return { days, stale: false, message: `Last backup ${when}.` };
}
