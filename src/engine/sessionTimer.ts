/**
 * Session timer (SPEC 5.6). Pure state plus explicit timestamps: no clocks,
 * no browser APIs, so the rules can be tested exactly.
 *
 * Three rules, in the order they matter:
 *   1. Nothing starts until the child's first interaction after unlock.
 *   2. Time only counts while the app is visible.
 *   3. When the limit is reached the current interaction finishes, then
 *      Goodnight shows. Nothing here cuts audio off mid-word.
 */

export interface SessionState {
  /** When the child first touched anything. Null until then. */
  startedAt: number | null;
  /** Visible time banked from earlier stretches. */
  bankedMs: number;
  /** When the current visible stretch began. Null while hidden or stopped. */
  runningSince: number | null;
  expired: boolean;
}

export function newSession(): SessionState {
  return { startedAt: null, bankedMs: 0, runningSince: null, expired: false };
}

export function hasStarted(state: SessionState): boolean {
  return state.startedAt !== null;
}

/** The child's first interaction. Later calls change nothing. */
export function begin(state: SessionState, now: number): SessionState {
  if (state.startedAt !== null) return state;
  return { startedAt: now, bankedMs: 0, runningSince: now, expired: false };
}

/** The app went to the background, or a screen stopped counting. */
export function pause(state: SessionState, now: number): SessionState {
  if (state.runningSince === null) return state;
  return {
    ...state,
    bankedMs: state.bankedMs + Math.max(0, now - state.runningSince),
    runningSince: null,
  };
}

/** The app came back to the foreground. Does nothing before the first tap. */
export function resume(state: SessionState, now: number): SessionState {
  if (state.startedAt === null || state.expired || state.runningSince !== null) return state;
  return { ...state, runningSince: now };
}

export function elapsedMs(state: SessionState, now: number): number {
  if (state.runningSince === null) return state.bankedMs;
  return state.bankedMs + Math.max(0, now - state.runningSince);
}

export function remainingMs(state: SessionState, now: number, limitMs: number): number {
  return Math.max(0, limitMs - elapsedMs(state, now));
}

export function isOver(state: SessionState, now: number, limitMs: number): boolean {
  return state.expired || (hasStarted(state) && elapsedMs(state, now) >= limitMs);
}

/** Freeze the clock at the moment Goodnight takes over. */
export function expire(state: SessionState, now: number): SessionState {
  const stopped = pause(state, now);
  return { ...stopped, expired: true };
}

/** After the parent unlocks: a clean slate, waiting for the next first tap. */
export function reset(): SessionState {
  return newSession();
}

export function minutesToMs(minutes: number): number {
  return minutes * 60_000;
}
