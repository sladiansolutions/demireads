import { useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import { LockIcon } from './icons';
import './ParentGate.css';

const HOLD_MS = 3000;
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** A device with no touch points is not the child's tablet, so a press and
 *  hold is safe there. SPEC 4 asks for this in development; it also keeps a
 *  deployed build usable from a desktop browser. */
function pressAndHoldAllowed(): boolean {
  if (import.meta.env.DEV) return true;
  return typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) === 0;
}

/**
 * SPEC 4. Two fingers held on the lock for three seconds. Releasing early
 * cancels silently: no sound, no message, nothing for a child to discover.
 *
 * The second finger is counted on the document, not on the button. Each touch
 * is delivered to whatever element it landed on, so requiring both fingers to
 * hit one small target made the gate almost impossible to open.
 *
 * The ring is driven by requestAnimationFrame rather than a CSS transition,
 * because the reduced-motion rules clamp transition durations and would fill
 * it in 120ms while the hold still took three seconds.
 */
export default function ParentGate({ onOpen }: { onOpen: () => void }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | undefined>(undefined);
  const startedAt = useRef<number | null>(null);
  const fingerOnLock = useRef(false);

  const cancel = useCallback(() => {
    startedAt.current = null;
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    setProgress(0);
  }, []);

  const tick = useCallback(() => {
    if (startedAt.current === null) return;
    const elapsed = performance.now() - startedAt.current;
    const next = Math.min(1, elapsed / HOLD_MS);
    setProgress(next);
    if (next >= 1) {
      cancel();
      fingerOnLock.current = false;
      onOpen();
      return;
    }
    frame.current = requestAnimationFrame(tick);
  }, [cancel, onOpen]);

  const start = useCallback(() => {
    if (startedAt.current !== null) return;
    startedAt.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  }, [tick]);

  // Watch the whole document, so the second finger can land anywhere.
  useEffect(() => {
    const onStart = (event: TouchEvent) => {
      if (fingerOnLock.current && event.touches.length >= 2) start();
    };
    const onEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) cancel();
      if (event.touches.length === 0) fingerOnLock.current = false;
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [start, cancel]);

  useEffect(() => cancel, [cancel]);

  function onTouchStart(event: ReactTouchEvent) {
    fingerOnLock.current = true;
    // Both fingers already down on the lock itself.
    if (event.touches.length >= 2) start();
  }

  const pressAndHold = pressAndHoldAllowed()
    ? { onMouseDown: start, onMouseUp: cancel, onMouseLeave: cancel }
    : {};

  return (
    <button
      type="button"
      className="quiet-btn quiet-btn--lock gate"
      aria-label="Parent area. Hold with two fingers for three seconds."
      title="Hold with two fingers for three seconds"
      onTouchStart={onTouchStart}
      onContextMenu={(event) => event.preventDefault()}
      {...pressAndHold}
    >
      <LockIcon />
      {progress > 0 && (
        <svg className="gate__ring" width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
          <circle
            cx="30"
            cy="30"
            r={RING_RADIUS}
            fill="none"
            stroke="var(--teal)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            transform="rotate(-90 30 30)"
          />
        </svg>
      )}
    </button>
  );
}
