import { useCallback, useEffect, useRef, useState } from 'react';
import HomeButton from '../../components/HomeButton';
import SpeakerButton from '../../components/SpeakerButton';
import { useProgress } from '../../app/progress';
import { useSession } from '../../app/session';
import { nextRound, type Round } from '../../engine/findIt';
import { findItCheer, findItPrompt } from '../../content/prompts';
import { tileStyleFor } from '../../engine/tileColor';
import { speak } from '../../audio/speech';
import { playCheer } from '../../audio/chime';
import './FindIt.css';

/** Long enough to hear the answer before the next question arrives. */
const AFTER_CORRECT_MS = 2200;
const AFTER_MISS_MS = 3000;

type Feedback =
  | { kind: 'asking' }
  | { kind: 'correct'; letter: string }
  | { kind: 'miss'; tapped: string; target: string };

/**
 * SPEC 3.6. The only screen that produces evidence of knowing a letter, and
 * the only one where a tap can be wrong — which is exactly why rule 1 bites
 * hardest here.
 *
 * A wrong tap names what he tapped and then shows the right answer, warmly.
 * No buzzer, no red, no shake, no score. The difference between right and
 * wrong is that the right answer gets a cheer: three rising notes and a
 * bounce. There is no sound for a miss at all (rule 1).
 */
export default function FindIt({ onHome }: { onHome: () => void }) {
  const { progress, loaded, answer } = useProgress();
  const { noteInteraction, hold } = useSession();

  // Dealt during the first render where there is anything to ask, so the
  // screen never flashes its empty state on a tablet that has progress.
  const [round, setRound] = useState<Round | null>(() => nextRound(progress, null) ?? null);
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'asking' });
  const previous = useRef<string | null>(round?.target ?? null);
  const [roundNumber, setRoundNumber] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const release = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      release.current?.();
    },
    [],
  );

  /** The question as it is currently phrased, spoken and shown. */
  const question = findItPrompt(roundNumber, round?.target ?? '');

  const ask = useCallback(
    (letter: string) => {
      speak(findItPrompt(roundNumber, letter));
    },
    [roundNumber],
  );

  const deal = useCallback(() => {
    const next = nextRound(progress, previous.current);
    if (!next) return;
    previous.current = next.target;
    setRound(next);
    setRoundNumber((n) => n + 1);
    setFeedback({ kind: 'asking' });
  }, [progress]);

  // The timer below fires after the answer has been recorded, so it has to
  // reach the newest deal rather than the one captured when he tapped.
  const dealRef = useRef(deal);
  dealRef.current = deal;

  // Once progress has been read from the database, deal the first round.
  useEffect(() => {
    if (!loaded || round !== null) return;
    deal();
  }, [loaded, round, deal]);

  // Ask the question whenever a new target appears. Kept out of deal() so the
  // question is asked exactly once per round, however the round arrived.
  const asked = useRef<string | null>(null);
  useEffect(() => {
    const target = round?.target;
    if (target === undefined || asked.current === target) return;
    asked.current = target;
    ask(target);
  }, [round, ask]);

  function tap(letter: string) {
    noteInteraction();
    if (round === null || feedback.kind !== 'asking') return;

    const correct = letter === round.target;
    answer(round.target, correct);

    // Hold the session open so the reply is never cut off by the timer.
    release.current?.();
    release.current = hold();

    if (correct) {
      setFeedback({ kind: 'correct', letter });
      // Sound first, then the words, so they do not talk over each other.
      playCheer();
      window.setTimeout(() => speak(findItCheer(roundNumber, letter)), 420);
    } else {
      setFeedback({ kind: 'miss', tapped: letter, target: round.target });
      // Name what he tapped, then show the one that was asked for (SPEC 3.6).
      speak(`That's ${letter}. Here's ${round.target}.`);
    }

    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => {
        release.current?.();
        release.current = null;
        dealRef.current();
      },
      correct ? AFTER_CORRECT_MS : AFTER_MISS_MS,
    );
  }

  if (round === null) {
    return (
      <div className="screen find">
        <div className="screen__header">
          <HomeButton onClick={onHome} />
          <div className="screen__title">Find It</div>
        </div>
        <div className="find__empty">
          {/* Parent-facing: the child sees no instruction text (rule 4). */}
          <p>Letters appear here once the Letter Garden has some to practise.</p>
        </div>
      </div>
    );
  }

  const prompt =
    feedback.kind === 'correct'
      ? findItCheer(roundNumber, feedback.letter)
      : feedback.kind === 'miss'
        ? `That's ${feedback.tapped}. Here's ${feedback.target}.`
        : question;

  return (
    <div className="screen find">
      <div className="find__header">
        <div className="screen__header">
          <HomeButton onClick={onHome} />
          <div className="screen__title">Find It</div>
        </div>
        <SpeakerButton text={question} onClick={() => ask(round.target)} />
      </div>

      <div className={feedback.kind === 'correct' ? 'find__prompt find__prompt--cheer' : 'find__prompt'}>
        {prompt}
      </div>

      <div className="find__choices" data-count={round.choices.length}>
        {round.choices.map((letter, index) => {
          const { fill, text } = tileStyleFor(round.palette + index);
          const isTarget = letter === round.target;
          const classes = ['find__tile'];
          if (feedback.kind === 'correct' && isTarget) classes.push('find__tile--cheer');
          // A miss gently highlights the right answer; the tapped tile is
          // left alone rather than marked.
          if (feedback.kind === 'miss' && isTarget) classes.push('find__tile--show');
          return (
            <button
              key={letter}
              type="button"
              className={classes.join(' ')}
              style={{ background: fill, color: text }}
              aria-label={`Letter ${letter}`}
              onClick={() => tap(letter)}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
