import { useCallback, useEffect, useRef, useState } from 'react';
import HomeButton from '../../components/HomeButton';
import { DuckGlyph } from '../../components/icons';
import { useSession } from '../../app/session';
import { dayKey, pickCount, recordRound, type NumberProgressState } from '../../engine/numbers';
import { loadNumberProgress, saveNumberProgress } from '../../storage/numbers';
import { numberWord, sayNumber, sayTotal } from '../../audio/say';
import './CountDucks.css';

/** Long enough for "Three ducks!" to finish before Goodnight could take over. */
const FINALE_MS = 2500;

/**
 * SPEC 3.4 and 5.5. Every tap counts up and says the number; the last tap
 * shows the total. There is no wrong tap here: ducks can be counted in any
 * order, and an already-counted duck simply says its own number again.
 */
export default function CountDucks({ onHome }: { onHome: () => void }) {
  const { noteInteraction, hold } = useSession();
  const [progress, setProgress] = useState<NumberProgressState | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  /** Duck indexes in the order they were tapped. */
  const [counted, setCounted] = useState<number[]>([]);
  const previous = useRef<number | null>(null);

  const deal = useCallback((state: NumberProgressState) => {
    const next = pickCount(state.currentMax, previous.current);
    previous.current = next;
    setTotal(next);
    setCounted([]);
  }, []);

  useEffect(() => {
    void loadNumberProgress().then((state) => {
      setProgress(state);
      deal(state);
    });
  }, [deal]);

  function tap(index: number) {
    noteInteraction();

    const already = counted.indexOf(index);
    if (already !== -1) {
      // Not a mistake, just a repeat: say its number again.
      sayNumber(already + 1);
      return;
    }

    const order = [...counted, index];
    setCounted(order);
    sayNumber(order.length);

    if (total === null || order.length < total) return;

    // The round is done. Hold the session open so the total is never cut off
    // mid-word by the timer (SPEC 5.6).
    const release = hold();
    window.setTimeout(() => {
      sayTotal(total, 'ducks');
      window.setTimeout(release, FINALE_MS);
    }, 450);

    if (progress !== null) {
      const updated = recordRound(progress, dayKey(new Date()));
      setProgress(updated);
      void saveNumberProgress(updated);
    }
  }

  function again() {
    noteInteraction();
    if (progress !== null) deal(progress);
  }

  const done = total !== null && counted.length === total;
  const caption = counted.length === 0 ? 'Tap a duck!' : done ? `${numberWord(counted.length)} ducks!` : `${numberWord(counted.length)}!`;

  return (
    <div className="screen ducks">
      <div className="ducks__header">
        <div className="screen__header">
          <HomeButton onClick={onHome} />
          <div className="screen__title">Count the Ducks</div>
        </div>
        <button type="button" className="ducks__again hit-child" aria-label="Count again" onClick={again}>
          Again
        </button>
      </div>

      <div className="ducks__count">
        <div className="ducks__numeral">{counted.length === 0 ? '' : counted.length}</div>
        <div className="ducks__caption">{caption}</div>
      </div>

      <div className="ducks__pond">
        {total === null
          ? null
          : Array.from({ length: total }, (_, index) => {
              const position = counted.indexOf(index);
              const isCounted = position !== -1;
              return (
                <div key={index} className="ducks__slot">
                  <div className="ducks__badge" style={{ visibility: isCounted ? 'visible' : 'hidden' }}>
                    {position + 1}
                  </div>
                  <button
                    type="button"
                    className={isCounted ? 'ducks__duck ducks__duck--counted' : 'ducks__duck'}
                    aria-label={isCounted ? `Duck number ${position + 1}` : 'Duck'}
                    onClick={() => tap(index)}
                  >
                    <DuckGlyph width={130} />
                  </button>
                </div>
              );
            })}
      </div>
    </div>
  );
}
