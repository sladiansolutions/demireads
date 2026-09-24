import { useEffect, useRef, useState } from 'react';
import HomeButton from '../../components/HomeButton';
import SpeakerButton from '../../components/SpeakerButton';
import Illustration from '../../components/Illustration';
import { useSettings } from '../../app/settings';
import { useMedia } from '../../app/media';
import { useProgress } from '../../app/progress';
import { letterContent } from '../../content/letters';
import { coplayPrompt } from '../../content/coplay';
import { exampleWordsFor } from '../../engine/exampleWords';
import { tileStyleFor } from '../../engine/tileColor';
import { sayLetter, sayWord } from '../../audio/say';
import './LetterGarden.css';

const BOUNCE_MS = 320;
const COPLAY_EVERY = 5;
const COPLAY_MS = 5000;

/**
 * SPEC 3.2. The letters shown are the scheduler's active set: everything in
 * New or Learning, capped at seven. Letters he knows leave the garden and
 * come back in Find It as review.
 *
 * Taps here are exposures only: nothing on this screen is scored, and there
 * is no way to be wrong.
 */
export default function LetterGarden({ onHome }: { onHome: () => void }) {
  const { childName, familyNames, letterWords } = useSettings();
  const { photoUrl } = useMedia();
  const { activeSet, addExposure } = useProgress();

  const [picked, setPicked] = useState<string | null>(null);
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

  // Follow the scheduler's first letter until he picks one himself. A picked
  // letter that later leaves the active set falls back rather than vanishing.
  const selected = picked !== null && activeSet.includes(picked) ? picked : (activeSet[0] ?? null);

  function pick(letter: string) {
    setPicked(letter);
    setBouncing(letter);
    window.clearTimeout(bounceTimer.current);
    bounceTimer.current = window.setTimeout(() => setBouncing(null), BOUNCE_MS);

    const [word] = exampleWordsFor(letter, childName, familyNames, letterWords);
    sayLetter(letter, word);
    addExposure(letter);

    taps.current += 1;
    if (taps.current % COPLAY_EVERY === 0) {
      const { soundLabel } = letterContent(letter);
      setCoplay(coplayPrompt(taps.current / COPLAY_EVERY - 1, letter, soundLabel, word));
      window.clearTimeout(coplayTimer.current);
      coplayTimer.current = window.setTimeout(() => setCoplay(null), COPLAY_MS);
    }
  }

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

      {selected === null ? (
        <div className="garden__empty">
          {/* Only reachable if a parent has set every letter to Not started. */}
          <p>No letters are active. Set one to New in the parent area.</p>
        </div>
      ) : (
        <Spotlight
          selected={selected}
          activeSet={activeSet}
          bouncing={bouncing}
          photoUrl={photoUrl(selected)}
          words={exampleWordsFor(selected, childName, familyNames, letterWords)}
          onPick={pick}
        />
      )}
    </div>
  );
}

interface SpotlightProps {
  selected: string;
  activeSet: string[];
  bouncing: string | null;
  photoUrl: string | undefined;
  words: [string, string];
  onPick: (letter: string) => void;
}

function Spotlight({ selected, activeSet, bouncing, photoUrl, words, onPick }: SpotlightProps) {
  const content = letterContent(selected);
  const [word1, word2] = words;
  const spotlightColor = tileStyleFor(activeSet.indexOf(selected)).fill;

  return (
    <div className="garden__body">
      <div className="panel garden__spotlight">
        <div className="garden__bigLetter" style={{ color: spotlightColor }}>
          {content.letter}
        </div>

        <SpeakerButton
          text={`${content.letter} is for ${word1}`}
          onClick={() => sayLetter(selected, word1)}
        />

        <div className="garden__photos">
          {[word1, word2].map((word, slot) => (
            <div key={`${slot}-${word}`} className="garden__photo">
              <Illustration
                word={word}
                photoUrl={slot === 0 ? photoUrl : undefined}
                className="garden__photoSlot"
                onPress={() => sayWord(word)}
              />
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
              onClick={() => onPick(letter)}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
