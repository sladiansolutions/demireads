/** Every screen the app can show. Routing is in-app state, not URLs: the child
 *  side has no address bar and no back button to get lost in. */
export type Route = 'home' | 'letters' | 'book' | 'numbers' | 'song' | 'find' | 'parent' | 'wall';

/** Child-side screens that exist. Home reads this to decide which tiles light. */
export const BUILT: readonly Route[] = ['home', 'letters', 'book', 'numbers', 'song', 'find'];

export function isBuilt(route: Route): boolean {
  return BUILT.includes(route);
}

/**
 * Where a back gesture should go. Android's back button navigates history,
 * and this app keeps no history, so without this the first swipe leaves the
 * app altogether — one gesture out of the child's side.
 *
 * Nothing here can truly trap him: SPEC 2 is explicit that single-app mode is
 * the operating system's job (screen pinning on Android, Guided Access on
 * iPad). This only stops an accidental swipe from ending the session.
 */
export function backTarget(route: Route, locked: boolean): Route | null {
  // Goodnight holds until a parent passes the gate (SPEC 3.7).
  if (locked) return null;
  if (route === 'wall') return 'parent';
  if (route === 'home') return null;
  // Every other screen, child or parent, goes home.
  return 'home';
}
