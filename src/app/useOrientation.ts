import { useEffect, useState } from 'react';

/**
 * Portrait or landscape, as a subscription.
 *
 * The child screens are drawn for 1180 x 820 landscape (SPEC 2) and look
 * cramped turned upright, so they ask to be turned back rather than trying to
 * reflow. The parent area adapts instead: it is text and lists, and a parent
 * holding a phone has every right to use it upright.
 */
export function useIsPortrait(): boolean {
  const [portrait, setPortrait] = useState(() => matches());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(orientation: portrait)');
    const onChange = () => setPortrait(query.matches);
    query.addEventListener('change', onChange);
    // Some Android browsers report the old orientation until after the resize.
    window.addEventListener('resize', onChange);
    onChange();
    return () => {
      query.removeEventListener('change', onChange);
      window.removeEventListener('resize', onChange);
    };
  }, []);

  return portrait;
}

function matches(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(orientation: portrait)').matches;
}

/**
 * Ask the device to stay landscape. Only installed, fullscreen contexts are
 * allowed to do this, and it throws or rejects everywhere else, so the result
 * is deliberately ignored: the rotate screen is the real answer.
 */
export function tryLockLandscape(): void {
  try {
    const orientation = window.screen?.orientation as
      | (ScreenOrientation & { lock?: (o: string) => Promise<void> })
      | undefined;
    void orientation?.lock?.('landscape').catch(() => {});
  } catch {
    // Not permitted here; nothing to do.
  }
}
