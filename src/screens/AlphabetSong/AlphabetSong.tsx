import { useCallback, useEffect, useRef, useState } from 'react';
import HomeButton from '../../components/HomeButton';
import { PlayIcon, PauseIcon, TouchIcon } from '../../components/icons';
import { useSettings } from '../../app/settings';
import { useMedia } from '../../app/media';
import { useProgress } from '../../app/progress';
import { useSession } from '../../app/session';
import { ALPHABET } from '../../content/letters';
import { tileStyleFor } from '../../engine/tileColor';
import { fallbackIntervalMs, indexAt, marksUsable } from '../../engine/songMarks';
import { SONG_AUDIO_ID } from '../../storage/mediaKeys';
import { sayLetterName } from '../../audio/say';
import { currentClipTime, pauseClip, playClip, resumeClip, stopClip } from '../../audio/player';
import './AlphabetSong.css';

/**
 * SPEC 3.5, in two modes.
 *
 * **Play all** runs A to Z on its own. If a parent has tapped along to their
 * recording the letters follow those marks, so the lighting matches the
 * singing; otherwise they advance on a fixed interval, and past the end of a
 * partial set of marks, on the average gap between the marks that exist.
 *
 * **Touch** waits for him. Every letter is a target, and tapping one lights
 * it and says its name. Nothing moves unless he moves it, which is the mode
 * for a child who wants to stop on W for a while.
 *
 * Exposure only in both: nothing here is scored.
 */
type Mode = 'play' | 'touch';

export default function AlphabetSong({ onHome }: { onHome: () => void }) {
  const { songIntervalMs, songMarks } = useSettings();
  const { urlFor } = useMedia();
  const { addExposure } = useProgress();
  const { noteInteraction, hold } = useSession();

  const [mode, setMode] = useState<Mode>('play');
  const [index, setIndex] = useState(-1);
  const [touched, setTouched] = useState<number | null>(null);
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

  function togglePlay() {
    noteInteraction();
    setMode('play');
    setTouched(null);

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

  function chooseTouch() {
    noteInteraction();
    stop();
    setIndex(-1);
    setMode('touch');
  }

  function tap(i: number, letter: string) {
    noteInteraction();
    setTouched(i);
    sayLetterName(letter);
    addExposure(letter);
  }

  return (
    <div className="screen song">
      <div className="song__header">
        <div className="screen__header">
          <HomeButton onClick={onHome} />
          <div className="screen__title">A to Z Song</div>
        </div>

        {/* Two ways to use the screen. Both are pictures, not words (rule 4). */}
        <div className="song__modes">
          <button
            type="button"
            className={
              mode === 'play'
                ? 'round-btn round-btn--dark hit-child'
                : 'round-btn hit-child'
            }
            aria-label={playing ? 'Pause' : 'Play all the letters'}
            aria-pressed={mode === 'play'}
            onClick={togglePlay}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            type="button"
            className={
              mode === 'touch'
                ? 'round-btn round-btn--dark hit-child'
                : 'round-btn hit-child'
            }
            aria-label="Touch a letter to hear it"
            aria-pressed={mode === 'touch'}
            onClick={chooseTouch}
          >
            <TouchIcon />
          </button>
        </div>
      </div>

      <div className={mode === 'touch' ? 'song__grid song__grid--touch' : 'song__grid'}>
        {ALPHABET.map((letter, i) => {
          // Playing lights everything up to here; touching lights just one.
          const lit = mode === 'touch' ? i === touched : i <= index;
          const current = mode === 'touch' ? i === touched : i === index;
          const { fill, text } = tileStyleFor(i);
          const className = current ? 'song__tile song__tile--current' : 'song__tile';
          const style = lit ? { background: fill, color: text } : undefined;

          if (mode === 'touch') {
            return (
              <button
                key={letter}
                type="button"
                className={className}
                style={style}
                aria-label={`Letter ${letter}`}
                onClick={() => tap(i, letter)}
              >
                {letter}
              </button>
            );
          }

          return (
            <div key={letter} className={className} style={style}>
              {letter}
            </div>
          );
        })}
      </div>
    </div>
  );
}
