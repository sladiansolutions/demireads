/** Every screen the app can show. Routing is in-app state, not URLs: the child
 *  side has no address bar and no back button to get lost in. */
export type Route = 'home' | 'letters' | 'book' | 'numbers' | 'song';

/** Screens that exist as of phase 1. The rest are built in phase 3. */
export const BUILT: readonly Route[] = ['home', 'letters', 'book'];

export function isBuilt(route: Route): boolean {
  return BUILT.includes(route);
}
