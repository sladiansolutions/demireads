import { useSettings, useUpdateSettings } from '../../app/settings';
import { useProgress } from '../../app/progress';
import { STATE_LABELS } from '../../storage/letters';

/**
 * Reordering which letters come next (BUILD_PLAN phase 5).
 *
 * The list shows the order letters will be introduced in. Moving one to the
 * front is the useful move — he points at a letter on a cereal box, and it
 * can be next — so each row offers that plus a nudge up or down.
 *
 * The stored list may be partial: whatever a parent has arranged is honoured,
 * and the usual rule (his name, then family initials, then the default order)
 * fills in everything below it.
 */
export default function SequenceEditor() {
  const { sequenceOverride } = useSettings();
  const update = useUpdateSettings();
  const { progress, sequence } = useProgress();

  /** The letters still to come, which is what reordering affects. */
  const upcoming = sequence.filter((letter) => (progress[letter]?.state ?? 0) === 0);

  /** Write a new order, keeping it as short as it can be. */
  function arrange(letters: string[]) {
    update({ sequenceOverride: letters });
  }

  function moveToFront(letter: string) {
    arrange([letter, ...(sequenceOverride ?? []).filter((l) => l !== letter)]);
  }

  /**
   * Nudge within the upcoming list. The whole list up to that point has to be
   * written down, because an override only fixes the letters it names.
   */
  function nudge(letter: string, direction: -1 | 1) {
    const index = upcoming.indexOf(letter);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= upcoming.length) return;
    const next = [...upcoming];
    next[index] = next[target] as string;
    next[target] = letter;
    arrange(next);
  }

  if (upcoming.length === 0) {
    return <p className="parent__muted">Every letter has been started, so there is nothing left to order.</p>;
  }

  return (
    <div className="parent__stack">
      <p className="parent__muted">
        The order letters join the Letter Garden in, at most one a day. Move a letter to the front
        when he starts noticing it somewhere.
      </p>

      <ol className="seq">
        {upcoming.slice(0, 12).map((letter, index) => (
          <li key={letter} className="seq__row">
            <span className="seq__rank">{index + 1}</span>
            <span className="seq__letter">{letter}</span>
            <span className="parent__muted seq__state">{STATE_LABELS[progress[letter]?.state ?? 0]}</span>
            <span className="seq__actions">
              <button
                type="button"
                className="parent__btnQuiet"
                onClick={() => nudge(letter, -1)}
                disabled={index === 0}
                aria-label={`Move ${letter} earlier`}
              >
                ↑
              </button>
              <button
                type="button"
                className="parent__btnQuiet"
                onClick={() => nudge(letter, 1)}
                disabled={index === upcoming.length - 1}
                aria-label={`Move ${letter} later`}
              >
                ↓
              </button>
              {index > 0 && (
                <button type="button" className="parent__btn" onClick={() => moveToFront(letter)}>
                  Next up
                </button>
              )}
            </span>
          </li>
        ))}
      </ol>

      {upcoming.length > 12 && (
        <p className="parent__muted">…and {upcoming.length - 12} more, in the usual order.</p>
      )}

      {sequenceOverride !== undefined && sequenceOverride.length > 0 && (
        <button
          type="button"
          className="parent__btnQuiet parent__btnWide"
          onClick={() => update({ sequenceOverride: [] })}
        >
          Back to the usual order
        </button>
      )}
    </div>
  );
}
