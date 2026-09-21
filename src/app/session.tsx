/**
 * Session controller (SPEC 5.6, 3.7). Owns the timer, the Goodnight lock and
 * the rule that the timer always wins.
 *
 * The engine in src/engine/sessionTimer.ts holds the arithmetic; this file
 * only supplies clocks, visibility and storage.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  begin,
  expire,
  isOver,
  minutesToMs,
  newSession,
  pause,
  reset,
  resume,
  type SessionState,
} from '../engine/sessionTimer';
import { clearLock, isLocked, lockUntilParent } from '../storage/lock';
import { useSettings } from './settings';

/** How often the timer is checked. A second is plenty for a ten-minute limit. */
const CHECK_MS = 1000;

interface SessionValue {
  /** True once the session is over: the child side shows Goodnight. */
  locked: boolean;
  /** Call from any child-side interaction; the first one starts the clock. */
  noteInteraction: () => void;
  /**
   * Hold the session open while something is mid-flight, so audio finishes
   * before Goodnight takes the screen. Returns the release function.
   */
  hold: () => () => void;
  /** Parent unlock: ends Goodnight and arms a fresh session. */
  unlock: () => Promise<void>;
}

const SessionContext = createContext<SessionValue>({
  locked: false,
  noteInteraction: () => {},
  hold: () => () => {},
  unlock: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const { sessionMinutes } = useSettings();
  const limitMs = minutesToMs(sessionMinutes);

  const [locked, setLocked] = useState(false);
  const state = useRef<SessionState>(newSession());
  const holds = useRef(0);
  const endPending = useRef(false);

  // A session that ended before the app was closed is still over (SPEC 3.7).
  useEffect(() => {
    void isLocked().then((stored) => {
      if (stored) setLocked(true);
    });
  }, []);

  const endNow = useCallback(() => {
    state.current = expire(state.current, performance.now());
    endPending.current = false;
    setLocked(true);
    void lockUntilParent();
  }, []);

  /** Ends the session, or waits for whatever is speaking to finish. */
  const endWhenIdle = useCallback(() => {
    if (holds.current > 0) {
      endPending.current = true;
      return;
    }
    endNow();
  }, [endNow]);

  const noteInteraction = useCallback(() => {
    if (locked) return;
    state.current = begin(state.current, performance.now());
  }, [locked]);

  const hold = useCallback(() => {
    holds.current += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      holds.current = Math.max(0, holds.current - 1);
      if (holds.current === 0 && endPending.current) endNow();
    };
  }, [endNow]);

  const unlock = useCallback(async () => {
    state.current = reset();
    holds.current = 0;
    endPending.current = false;
    setLocked(false);
    await clearLock();
  }, []);

  // Time only counts while the app is visible.
  useEffect(() => {
    const onVisibility = () => {
      const now = performance.now();
      state.current = document.hidden ? pause(state.current, now) : resume(state.current, now);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (locked) return;
    const timer = window.setInterval(() => {
      if (isOver(state.current, performance.now(), limitMs)) endWhenIdle();
    }, CHECK_MS);
    return () => window.clearInterval(timer);
  }, [locked, limitMs, endWhenIdle]);

  const value = useMemo<SessionValue>(
    () => ({ locked, noteInteraction, hold, unlock }),
    [locked, noteInteraction, hold, unlock],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}
