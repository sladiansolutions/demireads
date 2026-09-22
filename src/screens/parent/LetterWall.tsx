import { useState } from 'react';
import { useProgress } from '../../app/progress';
import SequenceEditor from './SequenceEditor';
import { STATE_LABELS } from '../../storage/letters';
import { ALPHABET } from '../../content/letters';
import { nextToIntroduce, qualifyingDays } from '../../engine/scheduler';
import type { LetterState } from '../../storage/db';
import './ParentArea.css';
import './LetterWall.css';

const STATES: LetterState[] = [0, 1, 2, 3];

/** Colour is always paired with a written label on the parent side (SPEC 9). */
const SWATCH: Record<LetterState, { background: string; color: string }> = {
  0: { background: 'var(--ground)', color: 'var(--ink-muted)' },
  1: { background: 'var(--sand)', color: 'var(--ink)' },
  2: { background: 'var(--sun)', color: 'var(--ink)' },
  3: { background: 'var(--teal)', color: 'var(--on-color)' },
};

/**
 * SPEC 3.9, plus the manual override from 3.8. Every letter, its state, and a
 * way to set it by hand — which always wins over the scheduler and resets
 * that letter's counters.
 */
export default function LetterWall({ onBack }: { onBack: () => void }) {
  const { progress, sequence, setState } = useProgress();
  const [open, setOpen] = useState<string | null>(null);

  const upNext = sequence.filter((letter) => (progress[letter]?.state ?? 0) === 0).slice(0, 5);
  const waiting = nextToIntroduce(progress, sequence);

  return (
    <div className="parent">
      <div className="parent__header">
        <h1 className="parent__title">All 26 letters</h1>
        <button type="button" className="parent__back" onClick={onBack}>
          Back to parent area
        </button>
      </div>

      <section className="parent__card">
        <div className="wall__key">
          {STATES.map((state) => (
            <span key={state} className="wall__keyItem">
              <span className="wall__keySwatch" style={SWATCH[state]} />
              {STATE_LABELS[state]}
            </span>
          ))}
        </div>

        <div className="wall__grid">
          {ALPHABET.map((letter) => {
            const record = progress[letter];
            const state = record?.state ?? 0;
            return (
              <button
                key={letter}
                type="button"
                className={open === letter ? 'wall__cell wall__cell--open' : 'wall__cell'}
                style={SWATCH[state]}
                onClick={() => setOpen(open === letter ? null : letter)}
              >
                <span className="wall__letter">{letter}</span>
                <span className="wall__state">{STATE_LABELS[state]}</span>
                {record !== undefined && record.exposures > 0 && (
                  <span className="wall__meta">{record.exposures} taps</span>
                )}
              </button>
            );
          })}
        </div>

        <p className="parent__muted">
          Up next: {upNext.join(', ') || 'every letter has been started'}.
          {waiting !== undefined && ' At most one new letter joins per day.'}
        </p>
      </section>

      <section className="parent__card">
        <h2 className="parent__cardTitle">What comes next</h2>
        <SequenceEditor />
      </section>

      {open !== null && (
        <section className="parent__card">
          <h2 className="parent__cardTitle">
            {open}: {STATE_LABELS[progress[open]?.state ?? 0]}
          </h2>

          <p className="parent__muted">
            {(() => {
              const record = progress[open];
              if (!record) return null;
              const days = qualifyingDays(record);
              const parts = [
                `${record.exposures} taps and pages`,
                `${days} of the 2 days needed to move up`,
                `${record.sessionMisses} misses this session`,
              ];
              return parts.join(' · ');
            })()}
          </p>

          <div className="parent__choices">
            {STATES.map((state) => (
              <button
                key={state}
                type="button"
                className={
                  (progress[open]?.state ?? 0) === state
                    ? 'parent__choice parent__choice--on'
                    : 'parent__choice'
                }
                onClick={() => setState(open, state)}
              >
                {STATE_LABELS[state]}
              </button>
            ))}
          </div>

          <p className="parent__muted">
            Setting a letter by hand wins over the scheduler and clears its counters, so the two days
            of evidence start again from here.
          </p>
        </section>
      )}
    </div>
  );
}
