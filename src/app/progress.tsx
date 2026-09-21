/**
 * Letter progress, shared by every screen that reads or writes it.
 *
 * The rules all live in src/engine/scheduler.ts. This file supplies the three
 * things the engine refuses to know about: today's date, the database, and
 * React. One copy in memory keeps the Letter Garden, Find It and the parent
 * wall from drifting apart.
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
import { dayKey } from '../engine/numbers';
import { buildLetterSequence } from '../engine/letterSequence';
import {
  activeSet as computeActiveSet,
  bootstrap,
  emptyProgress,
  introduce,
  override as applyOverride,
  recordAnswer,
  startSession,
  type Progress,
} from '../engine/scheduler';
import { loadProgress, putAllProgress, putProgress } from '../storage/letters';
import { hasStorage, type LetterState } from '../storage/db';
import { useSettings } from './settings';

interface ProgressValue {
  progress: Progress;
  /** Letters for the Letter Garden: states New and Learning, capped at seven. */
  activeSet: string[];
  /** The full order letters are introduced in. */
  sequence: string[];
  loaded: boolean;
  /** A Find It answer, the only thing that moves a letter between states. */
  answer: (letter: string, correct: boolean) => void;
  /** A tap or a page view: counted, but never evidence of knowing. */
  addExposure: (letter: string) => void;
  /** Parent override, which always wins. */
  setState: (letter: string, state: LetterState) => void;
}

const ProgressContext = createContext<ProgressValue>({
  progress: {},
  activeSet: [],
  sequence: [],
  loaded: false,
  answer: () => {},
  addExposure: () => {},
  setState: () => {},
});

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { childName, familyNames } = useSettings();
  const sequence = useMemo(() => buildLetterSequence(childName, familyNames), [childName, familyNames]);

  // Without IndexedDB (unit tests, SSR) there is nothing to read, so the
  // seeded set is already the truth and the screens can render immediately.
  const [progress, setProgress] = useState<Progress>(() => {
    const today = dayKey(new Date());
    const blank = emptyProgress(today);
    return hasStorage() ? blank : startSession(bootstrap(blank, sequence, today));
  });
  const [loaded, setLoaded] = useState(() => !hasStorage());

  /**
   * The latest progress, updated synchronously so two taps in quick
   * succession both build on the newer state. State updaters stay pure: React
   * may call them twice, and a database write does not belong in one.
   */
  const latest = useRef(progress);

  // On launch: seed on a fresh install, introduce at most one new letter for
  // today, and clear last session's misses (SPEC 5.3).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await loadProgress();
      const today = dayKey(new Date());
      let next = bootstrap(stored, sequence, today);
      next = introduce(next, sequence, today);
      next = startSession(next);
      if (cancelled) return;
      latest.current = next;
      setProgress(next);
      setLoaded(true);
      if (next !== stored) await putAllProgress(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [sequence]);

  const commit = useCallback((next: Progress, letter: string) => {
    latest.current = next;
    setProgress(next);
    const record = next[letter];
    if (record) void putProgress(record);
  }, []);

  const answer = useCallback(
    (letter: string, correct: boolean) => {
      commit(recordAnswer(latest.current, letter, correct, dayKey(new Date())), letter);
    },
    [commit],
  );

  const addExposure = useCallback(
    (letter: string) => {
      const record = latest.current[letter];
      if (!record) return;
      const updated = { ...record, exposures: record.exposures + 1 };
      commit({ ...latest.current, [letter]: updated }, letter);
    },
    [commit],
  );

  const setState = useCallback(
    (letter: string, state: LetterState) => {
      commit(applyOverride(latest.current, letter, state, dayKey(new Date())), letter);
    },
    [commit],
  );

  const value = useMemo<ProgressValue>(
    () => ({
      progress,
      activeSet: computeActiveSet(progress, sequence),
      sequence,
      loaded,
      answer,
      addExposure,
      setState,
    }),
    [progress, sequence, loaded, answer, addExposure, setState],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  return useContext(ProgressContext);
}
