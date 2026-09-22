/**
 * Ways of asking for a letter in Find It. SPEC 3.6 gives "Where is [letter]?";
 * these rotate through variations so twenty rounds do not sound like one round
 * twenty times. Deterministic by index, so it is testable and never repeats
 * itself twice running.
 */
export function findItPrompt(index: number, letter: string): string {
  const lines = [
    `Where is ${letter}?`,
    `Can you find ${letter}?`,
    `Show me ${letter}!`,
    `Where's ${letter}?`,
    `Point to ${letter}!`,
  ];
  const count = lines.length;
  return lines[((index % count) + count) % count] as string;
}

/** What to say when he gets it. Also rotated, for the same reason. */
export function findItCheer(index: number, letter: string): string {
  const lines = [`Yes! ${letter}!`, `That's ${letter}!`, `You found ${letter}!`, `Good! ${letter}!`];
  const count = lines.length;
  return lines[((index % count) + count) % count] as string;
}
