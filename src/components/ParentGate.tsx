import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { LockIcon } from './icons';
import './ParentGate.css';

const HOLD_MS = 3000;
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * SPEC 4. Two fingers held on the lock for three seconds. Releasing early
 * cancels silently: no sound, no message, nothing for a child to discover.
 *
 * The ring is driven by requestAnimationFrame rather than a CSS transition
 * on purpose. Under prefers-reduced-motion the global rules clamp transition
 * durations, which would fill the ring long before the hold completed and
 * lie about how much longer to wait.
 */
export default function ParentGate({ onOpen }: { onOpen: () => void }) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | undefined>(undefined);
  const startedAt = useRef<number | null>(null);

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

  useEffect(() => cancel, [cancel]);

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length >= 2) start();
  }

  function onTouchEnd(event: TouchEvent) {
    // Any finger leaving ends the hold.
    if (event.touches.length < 2) cancel();
  }

  // Desktop development only: a mouse hold stands in for two fingers (SPEC 4).
  const devMouse = import.meta.env.DEV
    ? { onMouseDown: start, onMouseUp: cancel, onMouseLeave: cancel }
    : {};

  return (
    <button
      type="button"
      className="quiet-btn quiet-btn--lock gate"
      aria-label="Parent area. Hold with two fingers for three seconds."
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={cancel}
      onContextMenu={(event) => event.preventDefault()}
      {...devMouse}
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
