import { useCallback, useEffect, useRef, useState } from 'react';
import HomeButton from '../../components/HomeButton';
import { useSettings } from '../../app/settings';
import { useMedia } from '../../app/media';
import { useSession } from '../../app/session';
import { ALPHABET } from '../../content/letters';
import { tileStyleFor } from '../../engine/tileColor';
import { fallbackIntervalMs, indexAt, marksUsable } from '../../engine/songMarks';
import { SONG_AUDIO_ID } from '../../storage/mediaKeys';
import { sayLetterName } from '../../audio/say';
import { currentClipTime, pauseClip, playClip, resumeClip, stopClip } from '../../audio/player';
import './AlphabetSong.css';

/**
 * SPEC 3.5. Letters light one at a time, in order.
 *
 * If a parent has tapped along to their recording, the letters follow those
 * marks, so the lighting matches the singing. Otherwise they advance on a
 * fixed interval — and past the end of a partial set of marks, on the average
 * gap between the marks that do exist.
 *
 * Exposure only: nothing here is scored.
 */
export default function AlphabetSong({ onHome }: { onHome: () => void }) {
  const { songIntervalMs, songMarks } = useSettings();
  const { urlFor } = useMedia();
  const { noteInteraction, hold } = useSession();

  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const release = useRef<(() => void) | null>(null);
  const spoken = useRef(-1);
  const songUrl = urlFor(SONG_AUDIO_ID);

  const letUp = useCallback(() => {
    release.current?.();
    release.current = null;
  }, []);

  const stop = useCallback(() => {
    setPlaying(false);
    stopClip();
    letUp();
  }, [letUp]);

  // Leaving the screen must not leave audio playing or the session held open.
  useEffect(() => () => {
    stopClip();
    release.current?.();
  }, []);

  const marks = songMarks ?? [];
  const synced = marksUsable(marks) && songUrl !== undefined;

  // Synced: follow the clip's own clock, so drift cannot accumulate.
  useEffect(() => {
    if (!playing || !synced) return;
    const timer = window.setInterval(() => {
      const at = currentClipTime();
      if (at === null) return;
      const fromMarks = indexAt(marks, at);
      setIndex((current) => {
        if (fromMarks > current) return fromMarks;
        // Past the last mark, keep going on the average gap.
        if (fromMarks === marks.length - 1 && current >= marks.length - 1) {
          const gap = fallbackIntervalMs(marks, songIntervalMs) / 1000;
          const overrun = at - (marks[marks.length - 1] as number);
          const extra = Math.floor(overrun / gap);
          const next = marks.length - 1 + extra;
          return Math.min(next, ALPHABET.length - 1);
        }
        return current;
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [playing, synced, marks, songIntervalMs]);

  // Unsynced: a plain metronome.
  useEffect(() => {
    if (!playing || synced) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1 >= ALPHABET.length ? current : current + 1));
    }, songIntervalMs);
    return () => window.clearInterval(timer);
  }, [playing, synced, songIntervalMs]);

  // Name each letter as its turn comes, unless a recorded song is the audio.
  // Tracked by ref so a re-render cannot make a letter speak twice.
  useEffect(() => {
    if (!playing || index < 0 || songUrl !== undefined) return;
    if (spoken.current === index) return;
    spoken.current = index;
    sayLetterName(ALPHABET[index] as string);
  }, [playing, index, songUrl]);

  // The song is over once Z has had its turn.
  useEffect(() => {
    if (playing && index >= ALPHABET.length - 1) {
      const timer = window.setTimeout(() => {
        stop();
        setIndex(-1);
      }, songIntervalMs);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [playing, index, songIntervalMs, stop]);

  function toggle() {
    noteInteraction();

    if (playing) {
      setPlaying(false);
      pauseClip();
      letUp();
      return;
    }

    // Hold the session open: a song should not be cut off part way.
    release.current = hold();
    setPlaying(true);

    if (index < 0) {
      spoken.current = -1;
      setIndex(0);
      if (songUrl !== undefined) playClip(songUrl, () => {});
    } else if (songUrl !== undefined) {
      resumeClip();
    }
  }

  return (
    <div className="screen song">
      <div className="song__header">
        <div className="screen__header">
          <HomeButton onClick={onHome} />
          <div className="screen__title">A to Z Song</div>
        </div>
        <button
          type="button"
          className="round-btn round-btn--dark hit-child"
          aria-label={playing ? 'Pause the song' : 'Play the song'}
          onClick={toggle}
        >
          {playing ? (
            <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M8 5l12 7-12 7z" />
            </svg>
          )}
        </button>
      </div>

      <div className="song__grid">
        {ALPHABET.map((letter, i) => {
          const lit = i <= index;
          const current = i === index;
          const { fill, text } = tileStyleFor(i);
          return (
            <div
              key={letter}
              className={current ? 'song__tile song__tile--current' : 'song__tile'}
              style={lit ? { background: fill, color: text } : undefined}
            >
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
}
