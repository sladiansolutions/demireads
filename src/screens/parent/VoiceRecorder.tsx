import { useEffect, useRef, useState } from 'react';
import {
  isRecordingSupported,
  MAX_CLIP_MS,
  MicrophoneBlockedError,
  startRecording,
  type ActiveRecording,
} from '../../audio/recorder';
import { playClip } from '../../audio/player';

type Mode =
  | { kind: 'idle' }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'review'; blob: Blob; url: string }
  | { kind: 'saving' }
  | { kind: 'blocked' };

interface VoiceRecorderProps {
  /** What is being recorded, for the accessible labels. */
  label: string;
  onSave: (blob: Blob) => Promise<void>;
}

/**
 * Record a clip without leaving the app. Stops itself at MAX_CLIP_MS so a
 * forgotten recording cannot run on, and always offers a listen before the
 * clip replaces whatever was there.
 */
export default function VoiceRecorder({ label, onSave }: VoiceRecorderProps) {
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [elapsed, setElapsed] = useState(0);
  const recording = useRef<ActiveRecording | null>(null);
  const reviewUrl = useRef<string | null>(null);

  // Never leave the microphone open or an object URL behind.
  useEffect(
    () => () => {
      recording.current?.cancel();
      if (reviewUrl.current !== null) URL.revokeObjectURL(reviewUrl.current);
    },
    [],
  );

  async function finish() {
    const active = recording.current;
    recording.current = null;
    if (!active) return;
    const blob = await active.stop();
    if (reviewUrl.current !== null) URL.revokeObjectURL(reviewUrl.current);
    const url = URL.createObjectURL(blob);
    reviewUrl.current = url;
    setMode({ kind: 'review', blob, url });
  }

  useEffect(() => {
    if (mode.kind !== 'recording') return;
    const { startedAt } = mode;
    const timer = window.setInterval(() => {
      const ms = performance.now() - startedAt;
      setElapsed(ms);
      if (ms >= MAX_CLIP_MS) void finish();
    }, 100);
    return () => window.clearInterval(timer);
  }, [mode]);

  async function begin() {
    try {
      recording.current = await startRecording();
      setElapsed(0);
      setMode({ kind: 'recording', startedAt: performance.now() });
    } catch (error) {
      setMode({ kind: error instanceof MicrophoneBlockedError ? 'blocked' : 'idle' });
    }
  }

  function discard() {
    if (reviewUrl.current !== null) URL.revokeObjectURL(reviewUrl.current);
    reviewUrl.current = null;
    setMode({ kind: 'idle' });
  }

  async function keep(blob: Blob) {
    setMode({ kind: 'saving' });
    await onSave(blob);
    if (reviewUrl.current !== null) URL.revokeObjectURL(reviewUrl.current);
    reviewUrl.current = null;
    setMode({ kind: 'idle' });
  }

  // Without a microphone the file picker alongside is the whole answer.
  if (!isRecordingSupported()) return null;

  switch (mode.kind) {
    case 'recording':
      return (
        <span className="rec">
          <button type="button" className="parent__btn rec__stop" onClick={() => void finish()}>
            Stop {(elapsed / 1000).toFixed(1)}s
          </button>
          <span className="rec__dot" aria-hidden="true" />
          <span className="parent__muted">recording {label}</span>
        </span>
      );

    case 'review':
      return (
        <span className="rec">
          <button
            type="button"
            className="parent__btnQuiet"
            onClick={() => playClip(mode.url, () => {})}
          >
            Listen
          </button>
          <button type="button" className="parent__btn" onClick={() => void keep(mode.blob)}>
            Save
          </button>
          <button type="button" className="parent__btnQuiet" onClick={discard}>
            Discard
          </button>
        </span>
      );

    case 'saving':
      return <span className="parent__muted">Saving…</span>;

    case 'blocked':
      return (
        <span className="parent__muted">
          Microphone unavailable — use a file instead.
        </span>
      );

    default:
      return (
        <button
          type="button"
          className="parent__btn"
          aria-label={`Record ${label}`}
          onClick={() => void begin()}
        >
          Record
        </button>
      );
  }
}
