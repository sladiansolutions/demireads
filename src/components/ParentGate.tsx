import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { LockIcon } from './icons';
import './ParentGate.css';

const HOLD_MS = 3000;
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * A mouse press and hold also opens the gate. SPEC 4 asks for this as a
 * development convenience, but it matters on real hardware too: a touchscreen
 * laptop, or a tablet with a mouse attached, reports touch points, and a
 * trackpad never generates the two-finger touch events the gate needs.
 *
 * Keyed on the pointer being a mouse rather than on the device having no
 * touch, because a two-year-old with a tablet has no mouse.
 */
function isDeliberatePointer(pointerType: string): boolean {
  return pointerType === 'mouse' || import.meta.env.DEV;
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
  /** Shown when one finger is used, so the gate never looks broken. */
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<number | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const startedAt = useRef<number | null>(null);
  const fingerOnLock = useRef(false);

  /** Tell the parent what the gate wants. Silent: no sound for a child. */
  const nudge = useCallback(() => {
    setHint(true);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(false), 2500);
  }, []);

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
    setHint(false);
    window.clearTimeout(hintTimer.current);
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

  useEffect(
    () => () => {
      cancel();
      window.clearTimeout(hintTimer.current);
    },
    [cancel],
  );

  function onTouchStart(event: ReactTouchEvent) {
    fingerOnLock.current = true;
    // Both fingers already down on the lock itself.
    if (event.touches.length >= 2) start();
    // One finger: say so, rather than appearing broken.
    else nudge();
  }

  /**
   * Pointer events are handled for a mouse only. A touch that becomes part of
   * a multi-touch gesture gets pointercancel, and on Android that arrives the
   * instant the second finger lands — which cancelled the hold every time.
   * Touch is tracked through the touch listeners above instead.
   */
  function onPointerEnd(event: ReactPointerEvent) {
    if (event.pointerType === 'mouse') cancel();
  }

  return (
    <button
      type="button"
      className="quiet-btn quiet-btn--lock gate"
      aria-label="Parent area. Hold with two fingers for three seconds."
      title="Hold with two fingers for three seconds, or press and hold with a mouse"
      onTouchStart={onTouchStart}
      onPointerDown={(event) => {
        if (isDeliberatePointer(event.pointerType)) start();
      }}
      onPointerUp={onPointerEnd}
      onPointerLeave={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      {hint && <span className="gate__hint">Two fingers</span>}
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
