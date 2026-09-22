import { useEffect, useRef, useState } from 'react';
import { useSettings, useUpdateSettings } from '../../app/settings';
import { useMedia } from '../../app/media';
import { SONG_AUDIO_ID } from '../../storage/mediaKeys';
import { ALPHABET } from '../../content/letters';
import { LETTER_COUNT, marksUsable, normalizeMarks } from '../../engine/songMarks';

/**
 * Teaching the app when each letter is sung (BUILD_PLAN phase 5).
 *
 * The parent plays their own recording and taps once per letter. Each tap
 * stores that moment in the clip, and the A to Z Song then lights letters in
 * time with the singing instead of on a fixed interval.
 *
 * Stopping early is fine: the marks that exist are used, and the rest of the
 * alphabet falls back to the average gap between them.
 */
export default function SongMarksPanel() {
  const { songMarks, songIntervalMs } = useSettings();
  const update = useUpdateSettings();
  const { urlFor } = useMedia();
  const songUrl = urlFor(SONG_AUDIO_ID);

  const audio = useRef<HTMLAudioElement | null>(null);
  const [tapping, setTapping] = useState(false);
  const [taps, setTaps] = useState<number[]>([]);

  const saved = songMarks ?? [];

  // Never leave the clip playing behind us.
  useEffect(
    () => () => {
      audio.current?.pause();
      audio.current = null;
    },
    [],
  );

  function begin() {
    if (songUrl === undefined) return;
    const element = new Audio(songUrl);
    audio.current = element;
    setTaps([]);
    setTapping(true);
    element.addEventListener('ended', () => finish());
    void element.play().catch(() => setTapping(false));
  }

  function mark() {
    const at = audio.current?.currentTime;
    if (at === undefined) return;
    setTaps((current) => (current.length >= LETTER_COUNT ? current : [...current, at]));
  }

  function finish() {
    audio.current?.pause();
    audio.current = null;
    setTapping(false);
    setTaps((current) => {
      update({ songMarks: normalizeMarks(current) });
      return current;
    });
  }

  function cancel() {
    audio.current?.pause();
    audio.current = null;
    setTapping(false);
    setTaps([]);
  }

  if (songUrl === undefined) {
    return (
      <p className="parent__muted">
        Add a song clip above first, then you can tap along with it here so the letters light in time
        with the singing.
      </p>
    );
  }

  const next = ALPHABET[taps.length] ?? null;

  return (
    <div className="parent__stack">
      {tapping ? (
        <>
          <button type="button" className="parent__btn marks__tap" onClick={mark}>
            {next === null ? 'All 26 marked' : `Tap on ${next}`}
          </button>
          <p className="parent__muted">
            {taps.length} of {LETTER_COUNT} marked. Tap the moment each letter is sung.
          </p>
          <div className="parent__choices">
            <button type="button" className="parent__btnQuiet" onClick={finish}>
              Save what I have
            </button>
            <button type="button" className="parent__btnQuiet" onClick={cancel}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="parent__muted">
            {marksUsable(saved)
              ? `${saved.length} letters are timed to your recording. The rest follow the average gap.`
              : `No timings yet, so letters light every ${songIntervalMs}ms.`}
          </p>
          <div className="parent__choices">
            <button type="button" className="parent__btn" onClick={begin}>
              {marksUsable(saved) ? 'Tap along again' : 'Tap along to the song'}
            </button>
            {saved.length > 0 && (
              <button
                type="button"
                className="parent__btnQuiet"
                onClick={() => update({ songMarks: [] })}
              >
                Clear timings
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
