import { useEffect } from 'react';

/**
 * Turn the system back gesture into in-app navigation.
 *
 * A history entry is pushed so the first back press has something to consume,
 * and re-pushed on every pop so there is always one spare. A parent can still
 * leave with the home button or the recents switcher; this only keeps a stray
 * swipe from dropping out of the app mid-session.
 */
export function useBackGuard(onBack: () => void): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.history) return;

    const arm = () => window.history.pushState({ abcGuard: true }, '');
    arm();

    const onPop = () => {
      arm();
      onBack();
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [onBack]);
}
