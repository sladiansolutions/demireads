/**
 * SPEC 8. Ask the browser to keep our data. Photos and voice clips are the
 * only copy the family has until media export lands in phase 5, so this runs
 * on first launch and its result is shown in the parent area.
 */

export interface StorageStatus {
  persisted: boolean;
  /** Bytes in use and available, when the browser reports them. */
  usage?: number;
  quota?: number;
}

export async function requestPersistentStorage(): Promise<StorageStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage) return { persisted: false };

  let persisted = false;
  try {
    persisted = (await navigator.storage.persisted?.()) ?? false;
    if (!persisted) persisted = (await navigator.storage.persist?.()) ?? false;
  } catch {
    persisted = false;
  }

  try {
    const estimate = await navigator.storage.estimate?.();
    return {
      persisted,
      ...(estimate?.usage !== undefined ? { usage: estimate.usage } : {}),
      ...(estimate?.quota !== undefined ? { quota: estimate.quota } : {}),
    };
  } catch {
    return { persisted };
  }
}
