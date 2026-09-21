import { useMemo, useRef, useState, type TouchEvent } from 'react';
import HomeButton from '../../components/HomeButton';
import SpeakerButton from '../../components/SpeakerButton';
import Illustration from '../../components/Illustration';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons';
import { useSettings } from '../../app/settings';
import { useMedia } from '../../app/media';
import { bookWordFor } from '../../engine/exampleWords';
import { bookSequence } from '../../engine/letterSequence';
import { tileStyleFor } from '../../engine/tileColor';
import { sayBookPage } from '../../audio/say';
import { recordExposure } from '../../storage/letters';
import './FamilyBook.css';

const SWIPE_MIN_PX = 40;

/**
 * SPEC 3.3. All 26 letters from day one. No questions, no scoring, and the
 * arrows wrap so a tap never does nothing. Page order follows the parent's
 * choice: his own letters first, or plain A to Z.
 */
export default function FamilyBook({ onHome }: { onHome: () => void }) {
  const { childName, familyNames, bookOrder } = useSettings();
  const { photoUrl } = useMedia();

  const sequence = useMemo(
    () => bookSequence(bookOrder, childName, familyNames),
    [bookOrder, childName, familyNames],
  );

  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<'next' | 'back'>('next');
  const touchStartX = useRef<number | null>(null);

  const letter = sequence[page] ?? 'A';
  const word = bookWordFor(letter, childName, familyNames);
  const { fill } = tileStyleFor(page);

  function goTo(next: number) {
    const wrapped = ((next % sequence.length) + sequence.length) % sequence.length;
    setDirection(next > page ? 'next' : 'back');
    setPage(wrapped);
    const nextLetter = sequence[wrapped] ?? 'A';
    sayBookPage(nextLetter, bookWordFor(nextLetter, childName, familyNames));
    void recordExposure(nextLetter);
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined) return;
    const dx = end - start;
    if (Math.abs(dx) < SWIPE_MIN_PX) return;
    goTo(dx < 0 ? page + 1 : page - 1);
  }

  return (
    <div className="screen book">
      <div className="screen__header">
        <HomeButton onClick={onHome} />
        <div className="screen__title">Family Book</div>
      </div>

      <div className="book__body">
        <button
          type="button"
          className="round-btn hit-child"
          aria-label="Previous page"
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeftIcon />
        </button>

        <div
          className="panel book__page"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={onTouchEnd}
        >
          {/* Keyed by page so each turn replays the slide. */}
          <div key={`${letter}-${page}`} className={`book__slide book__slide--${direction}`}>
            <Illustration
              word={word}
              photoUrl={photoUrl(letter)}
              className="book__photoSlot"
              placeholderIconSize={64}
            />

            <div className="book__text">
              <div className="book__letter" style={{ color: fill }}>
                {letter}
              </div>
              <div className="book__phrase">is for {word}</div>
              <SpeakerButton text={word} variant="teal" onClick={() => sayBookPage(letter, word)} />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="round-btn round-btn--dark hit-child"
          aria-label="Next page"
          onClick={() => goTo(page + 1)}
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="book__dots" aria-hidden="true">
        {sequence.map((dotLetter, index) => (
          <span
            key={dotLetter}
            className={index === page ? 'book__dot book__dot--current' : 'book__dot'}
            style={index === page ? { background: fill } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
