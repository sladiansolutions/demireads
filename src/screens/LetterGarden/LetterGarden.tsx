import { useEffect, useRef, useState } from 'react';
import HomeButton from '../../components/HomeButton';
import SpeakerButton from '../../components/SpeakerButton';
import Illustration from '../../components/Illustration';
import { useSettings } from '../../app/settings';
import { letterContent } from '../../content/letters';
import { coplayPrompt } from '../../content/coplay';
import { exampleWordsFor } from '../../engine/exampleWords';
import { provisionalActiveSet } from '../../engine/letterSequence';
import { tileStyleFor } from '../../engine/tileColor';
import { sayLetter } from '../../audio/say';
import './LetterGarden.css';

const BOUNCE_MS = 320;
const COPLAY_EVERY = 5;
const COPLAY_MS = 5000;

/**
 * SPEC 3.2. Taps here are exposures only: nothing on this screen is scored,
 * and there is no way to be wrong.
 */
export default function LetterGarden({ onHome }: { onHome: () => void }) {
  const { childName, familyNames } = useSettings();
  const activeSet = provisionalActiveSet(childName, familyNames);

  const [selected, setSelected] = useState(() => activeSet[0] ?? 'A');
  const [bouncing, setBouncing] = useState<string | null>(null);
  const [coplay, setCoplay] = useState<string | null>(null);
  const taps = useRef(0);
  const bounceTimer = useRef<number | undefined>(undefined);
  const coplayTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(bounceTimer.current);
      window.clearTimeout(coplayTimer.current);
    },
    [],
  );

  const content = letterContent(selected);
  const [word1, word2] = exampleWordsFor(selected, childName, familyNames);

  function pick(letter: string) {
    setSelected(letter);
    setBouncing(letter);
    window.clearTimeout(bounceTimer.current);
    bounceTimer.current = window.setTimeout(() => setBouncing(null), BOUNCE_MS);

    sayLetter(letter, exampleWordsFor(letter, childName, familyNames)[0]);

    taps.current += 1;
    if (taps.current % COPLAY_EVERY === 0) {
      const { soundLabel } = letterContent(letter);
      const [firstWord] = exampleWordsFor(letter, childName, familyNames);
      setCoplay(coplayPrompt(taps.current / COPLAY_EVERY - 1, letter, soundLabel, firstWord));
      window.clearTimeout(coplayTimer.current);
      coplayTimer.current = window.setTimeout(() => setCoplay(null), COPLAY_MS);
    }
  }

  const spotlightColor = tileStyleFor(activeSet.indexOf(selected)).fill;

  return (
    <div className="screen garden">
      <div className="screen__header">
        <HomeButton onClick={onHome} />
        <div className="screen__title">Letter Garden</div>
        {/* Parent-facing, five seconds, never in the child's way (SPEC 3.2). */}
        <div className="garden__coplay" aria-live="polite">
          {coplay}
        </div>
      </div>

      <div className="garden__body">
        <div className="panel garden__spotlight">
          <div className="garden__bigLetter" style={{ color: spotlightColor }}>
            {content.letter}
          </div>

          <SpeakerButton
            text={`${content.letter} says ${content.soundLabel}`}
            onClick={() => sayLetter(selected, word1)}
          />

          <div className="garden__photos">
            {[word1, word2].map((word) => (
              <div key={word} className="garden__photo">
                <Illustration word={word} className="garden__photoSlot" />
                <div className="garden__word">{word}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="garden__grid">
          {activeSet.map((letter, index) => {
            const { fill, text } = tileStyleFor(index);
            const classes = ['garden__tile'];
            if (letter === selected) classes.push('garden__tile--selected');
            if (letter === bouncing) classes.push('tile--bouncing');
            return (
              <button
                key={letter}
                type="button"
                className={classes.join(' ')}
                style={{ background: fill, color: text }}
                aria-label={`Letter ${letter}`}
                onClick={() => pick(letter)}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
