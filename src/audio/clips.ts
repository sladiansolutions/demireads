/**
 * Bridge between stored voice clips and the code that wants to say something.
 * The media provider registers a resolver at launch; without one, everything
 * falls back to speech synthesis (SPEC 7).
 */

type Resolver = (id: string) => string | undefined;

let resolve: Resolver | null = null;

export function setClipResolver(resolver: Resolver | null): void {
  resolve = resolver;
}

export function clipUrl(id: string): string | undefined {
  return resolve?.(id);
}
