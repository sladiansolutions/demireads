/**
 * The 26 letters.
 *
 * `words` are the two example words shown in the Letter Garden spotlight; the
 * first is also the Family Book word and the one spoken on a tap.
 *
 * `soundLabel` is the phonics sound as a parent reads it, used in the co-play
 * prompts. `soundSpoken` is the same sound written for speech synthesis,
 * which reads "/b/" as "slash b slash". Nothing speaks it at the moment: the
 * Letter Garden says what the letter stands for instead. Both are kept
 * because the sound is still the thing the co-play prompts ask about.
 */

export interface LetterContent {
  letter: string;
  soundLabel: string;
  soundSpoken: string;
  words: [string, string];
}

export const LETTERS: readonly LetterContent[] = [
  { letter: 'A', soundLabel: '/a/', soundSpoken: 'ah', words: ['apple', 'ant'] },
  { letter: 'B', soundLabel: '/b/', soundSpoken: 'buh', words: ['ball', 'banana'] },
  { letter: 'C', soundLabel: '/k/', soundSpoken: 'kuh', words: ['car', 'cat'] },
  { letter: 'D', soundLabel: '/d/', soundSpoken: 'duh', words: ['dog', 'duck'] },
  { letter: 'E', soundLabel: '/e/', soundSpoken: 'eh', words: ['egg', 'elephant'] },
  { letter: 'F', soundLabel: '/f/', soundSpoken: 'fff', words: ['fish', 'flower'] },
  { letter: 'G', soundLabel: '/g/', soundSpoken: 'guh', words: ['goat', 'grapes'] },
  { letter: 'H', soundLabel: '/h/', soundSpoken: 'huh', words: ['hat', 'house'] },
  { letter: 'I', soundLabel: '/i/', soundSpoken: 'ih', words: ['igloo', 'insect'] },
  { letter: 'J', soundLabel: '/j/', soundSpoken: 'juh', words: ['jar', 'jam'] },
  { letter: 'K', soundLabel: '/k/', soundSpoken: 'kuh', words: ['key', 'kite'] },
  { letter: 'L', soundLabel: '/l/', soundSpoken: 'lll', words: ['leaf', 'lion'] },
  { letter: 'M', soundLabel: '/m/', soundSpoken: 'mmm', words: ['moon', 'milk'] },
  { letter: 'N', soundLabel: '/n/', soundSpoken: 'nnn', words: ['nose', 'nest'] },
  { letter: 'O', soundLabel: '/o/', soundSpoken: 'oh', words: ['owl', 'orange'] },
  { letter: 'P', soundLabel: '/p/', soundSpoken: 'puh', words: ['pig', 'pear'] },
  { letter: 'Q', soundLabel: '/kw/', soundSpoken: 'kwuh', words: ['queen', 'quilt'] },
  { letter: 'R', soundLabel: '/r/', soundSpoken: 'rrr', words: ['rain', 'rabbit'] },
  { letter: 'S', soundLabel: '/s/', soundSpoken: 'sss', words: ['sun', 'star'] },
  { letter: 'T', soundLabel: '/t/', soundSpoken: 'tuh', words: ['train', 'tiger'] },
  { letter: 'U', soundLabel: '/u/', soundSpoken: 'uh', words: ['umbrella', 'up'] },
  { letter: 'V', soundLabel: '/v/', soundSpoken: 'vvv', words: ['van', 'violin'] },
  { letter: 'W', soundLabel: '/w/', soundSpoken: 'wuh', words: ['water', 'wheel'] },
  { letter: 'X', soundLabel: '/ks/', soundSpoken: 'ks', words: ['xylophone', 'fox'] },
  { letter: 'Y', soundLabel: '/y/', soundSpoken: 'yuh', words: ['yellow', 'yo-yo'] },
  { letter: 'Z', soundLabel: '/z/', soundSpoken: 'zzz', words: ['zebra', 'zip'] },
];

const BY_LETTER = new Map(LETTERS.map((l) => [l.letter, l]));

export function letterContent(letter: string): LetterContent {
  const found = BY_LETTER.get(letter.toUpperCase());
  if (!found) throw new Error(`No content for letter "${letter}"`);
  return found;
}

export const ALPHABET: readonly string[] = LETTERS.map((l) => l.letter);
