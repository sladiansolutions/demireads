import { useProgress } from '../../app/progress';
import { STATE_LABELS } from '../../storage/letters';
import type { LetterState } from '../../storage/db';

/**
 * SPEC 3.9 in miniature. Color is always paired with a text label, because a
 * parent view must not rely on color alone.
 */
const ROWS: LetterState[] = [1, 2, 3];

const ROW_STYLE: Record<LetterState, { background: string; color: string }> = {
  0: { background: 'var(--sand)', color: 'var(--ink)' },
  1: { background: 'var(--sand)', color: 'var(--ink)' },
  2: { background: 'var(--sun)', color: 'var(--ink)' },
  3: { background: 'var(--teal)', color: 'var(--on-color)' },
};

export default function ProgressSummary() {
  const { progress, sequence } = useProgress();
  const all = Object.values(progress);
  const byState = (state: LetterState) => all.filter((p) => p.state === state).map((p) => p.letter);
  const notStarted = byState(0).length;
  const exposures = all.reduce((total, p) => total + p.exposures, 0);
  const upNext = sequence.filter((letter) => (progress[letter]?.state ?? 0) === 0).slice(0, 5);

  return (
    <div className="parent__stack">
      {ROWS.map((state) => {
        const letters = byState(state);
        return (
          <div key={state} className="parent__progressRow">
            <div className="parent__progressLabel">{STATE_LABELS[state]}</div>
            {letters.length === 0 ? (
              <span className="parent__muted">none yet</span>
            ) : (
              <div className="parent__chips">
                {letters.map((letter) => (
                  <span key={letter} className="parent__chip" style={ROW_STYLE[state]}>
                    {letter}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <p className="parent__muted">
        {notStarted} of 26 not started. {exposures} taps and pages so far.
      </p>
      <p className="parent__muted">
        Up next: {upNext.join(', ') || 'nothing left'}. Only Find It moves a letter between these
        boxes; taps in the Letter Garden are exposure, not evidence.
      </p>
    </div>
  );
}
