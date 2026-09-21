/**
 * Parent-facing co-play prompts, shown for 5 seconds after every 5th tap in
 * the Letter Garden (SPEC 3.2). Text here is for the parent to read aloud;
 * the child is not expected to read it.
 */
export function coplayPrompt(index: number, letter: string, soundLabel: string, word: string): string {
  const lines = [
    `Ask him: what else starts with ${soundLabel}?`,
    `Say it together: ${letter} says ${soundLabel}.`,
    `Point at something ${letter} in the room.`,
    `Ask him to find the ${word}.`,
    `Trace the ${letter} on his hand with your finger.`,
  ];
  const count = lines.length;
  return lines[((index % count) + count) % count] as string;
}
