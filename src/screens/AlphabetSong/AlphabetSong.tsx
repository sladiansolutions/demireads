import { useCallback, useEffect, useRef, useState } from 'react';
import HomeButton from '../../components/HomeButton';
import { useSettings } from '../../app/settings';
import { useMedia } from '../../app/media';
import { useSession } from '../../app/session';
import { ALPHABET } from '../../content/letters';
import { tileStyleFor } from '../../engine/tileColor';
import { SONG_AUDIO_ID } from '../../storage/mediaKeys';
import { sayLetterName } from '../../audio/say';
import { pauseClip, playClip, resumeClip, stopClip } from '../../audio/player';
import './AlphabetSong.css';

/**
 * SPEC 3.5. Letters light one at a time, in order, at a fixed interval. If a
 * parent recorded the song it plays alongside; timing marks that would sync
 * the two exactly are phase 5, so for now the interval is the metronome and
 * the recording is the music.
 *
 * Exposure only: nothing here is scored.
 */
export default function AlphabetSong({ onHome }: { onHome: () => void }) {
  const { songIntervalMs } = useSettings();
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

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1 >= ALPHABET.length ? current : current + 1));
    }, songIntervalMs);
    return () => window.clearInterval(timer);
  }, [playing, songIntervalMs]);

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
