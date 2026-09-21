import { useRef, useState, type ChangeEvent } from 'react';
import { useMedia } from '../../app/media';
import { useSettings } from '../../app/settings';
import { LETTERS } from '../../content/letters';
import { bookWordFor } from '../../engine/exampleWords';
import { deleteMedia, saveAudio, savePhoto } from '../../storage/media';
import { mediaId } from '../../storage/mediaKeys';
import type { MediaTarget } from '../../storage/db';

interface Pending {
  kind: 'photo' | 'audio';
  target: MediaTarget;
  label: string;
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * SPEC 3.8 photos and voices. One photo and one voice clip per letter, one
 * clip per number, plus the goodnight line and the song. Picking a file opens
 * the tablet's own sheet, so "Take Photo" works straight into the app.
 */
export default function MediaLibrary() {
  const { childName, familyNames } = useSettings();
  const { urlFor, reload } = useMedia();
  const photoInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const pending = useRef<Pending | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function pick(kind: 'photo' | 'audio', target: MediaTarget, label: string) {
    pending.current = { kind, target, label };
    (kind === 'photo' ? photoInput : audioInput).current?.click();
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const job = pending.current;
    event.target.value = ''; // so picking the same file twice still fires
    if (!file || !job) return;

    setBusy(mediaId(job.kind, job.target));
    try {
      if (job.kind === 'photo') await savePhoto(job.target, file, job.label);
      else await saveAudio(job.target, file, job.label);
      await reload();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    await deleteMedia(id);
    await reload();
  }

  function row(options: {
    label: string;
    target: MediaTarget;
    withPhoto: boolean;
  }) {
    const { label, target, withPhoto } = options;
    const photoId = mediaId('photo', target);
    const audioId = mediaId('audio', target);
    const photo = urlFor(photoId);
    const audio = urlFor(audioId);
    const saving = busy === photoId || busy === audioId;

    return (
      <div className="parent__row" key={`${target.type}:${target.key ?? ''}`}>
        <div className="parent__rowMain">
          {withPhoto &&
            (photo === undefined ? (
              <div className="parent__thumb parent__thumb--empty" aria-hidden="true" />
            ) : (
              <img className="parent__thumb" src={photo} alt={`Photo for ${label}`} />
            ))}
          <div>
            <div className="parent__rowLabel">{label}</div>
            <div className="parent__muted">
              {saving
                ? 'Saving…'
                : [withPhoto ? (photo ? 'photo' : null) : null, audio ? 'voice' : null]
                    .filter(Boolean)
                    .join(' and ') || 'using the built-in voice'}
            </div>
          </div>
        </div>

        <div className="parent__rowActions">
          {withPhoto && (
            <button type="button" className="parent__btnQuiet" onClick={() => pick('photo', target, label)}>
              {photo === undefined ? 'Add photo' : 'Replace'}
            </button>
          )}
          <button type="button" className="parent__btn" onClick={() => pick('audio', target, label)}>
            {audio === undefined ? 'Add voice' : 'Replace voice'}
          </button>
          {(photo !== undefined || audio !== undefined) && (
            <button
              type="button"
              className="parent__btnQuiet"
              onClick={() => {
                if (photo !== undefined) void remove(photoId);
                if (audio !== undefined) void remove(audioId);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="parent__stack">
      <p className="parent__muted">
        Photos and clips stay on this tablet, in this app's own storage. They are never uploaded and
        never added to the project. Anything you skip uses the built-in voice and picture.
      </p>

      <input ref={photoInput} type="file" accept="image/*" hidden onChange={(e) => void onFile(e)} />
      <input ref={audioInput} type="file" accept="audio/*" hidden onChange={(e) => void onFile(e)} />

      <h3 className="parent__subhead">Letters</h3>
      <div className="parent__rows">
        {LETTERS.map((letter) =>
          row({
            label: `${letter.letter} is for ${bookWordFor(letter.letter, childName, familyNames)}`,
            target: { type: 'letter', key: letter.letter },
            withPhoto: true,
          }),
        )}
      </div>

      <h3 className="parent__subhead">Counting voices</h3>
      <div className="parent__rows">
        {NUMBERS.map((n) => row({ label: `Number ${n}`, target: { type: 'number', key: String(n) }, withPhoto: false }))}
      </div>

      <h3 className="parent__subhead">One-off clips</h3>
      <div className="parent__rows">
        {row({ label: 'Goodnight line', target: { type: 'goodnight' }, withPhoto: false })}
        {row({ label: 'A to Z song', target: { type: 'song' }, withPhoto: false })}
      </div>

      <p className="parent__muted">
        Recording inside the app comes later; for now record on the tablet (Voice Memos or similar),
        save to Files, then pick the file here. Clips under five seconds work best.
      </p>
    </div>
  );
}
