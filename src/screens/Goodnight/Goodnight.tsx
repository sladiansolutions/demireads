import { useEffect, useRef } from 'react';
import ParentGate from '../../components/ParentGate';
import { useSettings } from '../../app/settings';
import { provisionalActiveSet } from '../../engine/letterSequence';
import { sayGoodnight } from '../../audio/say';
import './Goodnight.css';

/**
 * SPEC 3.7. The end of a session, and the only screen with nothing for the
 * child to do. It stays until a parent passes the gate, including across
 * closing and reopening the app.
 */
export default function Goodnight({ onParent }: { onParent: () => void }) {
  const { childName, familyNames, sequenceOverride } = useSettings();
  const spoken = useRef(false);

  // Once, and only once: this is a calm screen, not a loop.
  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    sayGoodnight(childName);
  }, [childName]);

  const sleepers = provisionalActiveSet(childName, familyNames, sequenceOverride ?? []).slice(0, 2);
  const tiles = [
    { key: 'first', text: sleepers[0] ?? 'S', fill: 'var(--tomato)' },
    { key: 'second', text: sleepers[1] ?? 'B', fill: 'var(--teal)' },
    { key: 'number', text: '3', fill: 'var(--plum)' },
  ];

  return (
    <div className="night">
      <svg className="night__sky" width="620" height="170" viewBox="0 0 620 170" aria-hidden="true">
        <circle cx="310" cy="85" r="70" fill="var(--sun-soft)" />
        <circle cx="345" cy="65" r="62" fill="var(--night)" />
        <circle cx="60" cy="40" r="5" fill="var(--sun-soft)" />
        <circle cx="140" cy="120" r="4" fill="var(--sun-soft)" />
        <circle cx="480" cy="30" r="6" fill="var(--sun-soft)" />
        <circle cx="560" cy="110" r="4" fill="var(--sun-soft)" />
        <circle cx="210" cy="30" r="3" fill="var(--sun-soft)" />
      </svg>

      <h1 className="night__title">Goodnight, letters!</h1>
      <div className="night__sub">See you tomorrow, {childName}.</div>

      <div className="night__sleepers">
        {tiles.map((tile) => (
          <div key={tile.key} className="night__sleeper">
            <div className="night__zzz">z z</div>
            <div className="night__tile" style={{ background: tile.fill }}>
              {tile.text}
            </div>
          </div>
        ))}
      </div>

      {/* The way out, for a parent only (SPEC 3.7). The line is for whoever
          is holding the tablet; he cannot read it. */}
      <div className="night__gate">
        <span className="night__hint">Hold two fingers here for 3 seconds</span>
        <ParentGate onOpen={onParent} />
      </div>
    </div>
  );
}
