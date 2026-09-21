/**
 * Default illustrations, one per example word. Bundled from
 * src/assets/illustrations (see CREDITS.md there) so nothing is fetched at
 * runtime. A parent photo always wins over these (SPEC 3.2); phase 2 adds
 * that lookup ahead of this one.
 *
 * Five words have no icon that reads clearly at age two — igloo, jam, jug,
 * quilt, zip — and deliberately fall through to the dashed placeholder.
 */

const files = import.meta.glob('../assets/illustrations/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const BY_WORD = new Map<string, string>(
  Object.entries(files).map(([path, url]) => {
    const file = path.slice(path.lastIndexOf('/') + 1);
    return [file.replace(/\.svg$/, ''), url];
  }),
);

/** Undefined when there is no default picture for the word. */
export function illustrationFor(word: string): string | undefined {
  return BY_WORD.get(word.toLowerCase());
}

export const ILLUSTRATED_WORDS: readonly string[] = [...BY_WORD.keys()].sort();
