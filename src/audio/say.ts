/**
 * What the app says, as opposed to how it says it. Playback priority follows
 * SPEC 7: a parent recording first, then speech synthesis. (There are no
 * bundled default recordings; the synthetic voice is the middle and last
 * step at once.)
 */

import { letterContent } from '../content/letters';
import { letterAudioId } from '../storage/mediaKeys';
import { clipUrl } from './clips';
import { playClip } from './player';
import { speak } from './speech';

function say(clipId: string, line: string): void {
  const url = clipUrl(clipId);
  const speakLine = () => speak(line);
  if (url === undefined) {
    speakLine();
    return;
  }
  playClip(url, speakLine);
}

/** Letter Garden tap: "B. B says buh. Ball." (SPEC 3.2) */
export function sayLetter(letter: string, exampleWord?: string): void {
  const { letter: L, soundSpoken, words } = letterContent(letter);
  const word = exampleWord ?? words[0];
  say(letterAudioId(L), `${L}. ${L} says ${soundSpoken}. ${word}.`);
}

/** Family Book page: "S is for Sebastian." (SPEC 3.3) */
export function sayBookPage(letter: string, word: string): void {
  const L = letter.toUpperCase();
  say(letterAudioId(L), `${L} is for ${word}.`);
}

export function sayWord(word: string): void {
  speak(word);
}
