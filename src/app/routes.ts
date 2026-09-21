/** Every screen the app can show. Routing is in-app state, not URLs: the child
 *  side has no address bar and no back button to get lost in. */
export type Route = 'home' | 'letters' | 'book' | 'numbers' | 'song' | 'find' | 'parent' | 'wall';

/** Child-side screens that exist. Home reads this to decide which tiles light. */
export const BUILT: readonly Route[] = ['home', 'letters', 'book', 'numbers', 'song', 'find'];

export function isBuilt(route: Route): boolean {
  return BUILT.includes(route);
}
