import { useEffect, useState } from 'react';
import { useSettings, useUpdateSettings } from '../../app/settings';
import { useSession } from '../../app/session';
import { requestPersistentStorage, type StorageStatus } from '../../storage/persist';
import ProgressSummary from './ProgressSummary';
import MediaLibrary from './MediaLibrary';
import NotesPanel from './NotesPanel';
import './ParentArea.css';

const SESSION_CHOICES = [5, 10, 15, 20] as const;

function megabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/**
 * SPEC 3.8. Reached only through the parent gate; leaving needs no gate.
 * Manual override and JSON export are phase 4 and 5.
 */
export default function ParentArea({ onBack }: { onBack: () => void }) {
  const settings = useSettings();
  const update = useUpdateSettings();
  const { unlock } = useSession();
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  // Raw text, so a half-typed "Mummy, " keeps its comma while you type.
  const [familyText, setFamilyText] = useState(() => settings.familyNames.join(', '));

  useEffect(() => {
    void requestPersistentStorage().then(setStorage);
  }, []);

  return (
    <div className="parent">
      <div className="parent__header">
        <h1 className="parent__title">Parent area</h1>
        <button type="button" className="parent__back" onClick={onBack}>
          Back to {settings.childName}'s side
        </button>
      </div>

      <div className="parent__grid">
        <div className="parent__column">
          <section className="parent__card">
            <h2 className="parent__cardTitle">Session length</h2>
            <label className="parent__label" htmlFor="minutes">
              Minutes before the goodnight screen
            </label>
            <input
              id="minutes"
              type="range"
              min={5}
              max={20}
              step={5}
              value={settings.sessionMinutes}
              className="parent__range"
              onChange={(event) => {
                const minutes = Number(event.target.value) as (typeof SESSION_CHOICES)[number];
                update({ sessionMinutes: minutes });
              }}
            />
            <div className="parent__value">{settings.sessionMinutes} minutes</div>
            <p className="parent__muted">The timer starts on his first tap and always wins.</p>
          </section>

          <section className="parent__card">
            <h2 className="parent__cardTitle">Names</h2>
            <label className="parent__label" htmlFor="childName">
              Child's name
            </label>
            <input
              id="childName"
              type="text"
              className="parent__input"
              value={settings.childName}
              onChange={(event) => update({ childName: event.target.value })}
            />
            <label className="parent__label" htmlFor="familyNames">
              Family names, separated by commas
            </label>
            <input
              id="familyNames"
              type="text"
              className="parent__input"
              placeholder="Mummy, Daddy, Grandma"
              value={familyText}
              onChange={(event) => {
                setFamilyText(event.target.value);
                update({
                  familyNames: event.target.value
                    .split(',')
                    .map((name) => name.trim())
                    .filter((name) => name.length > 0),
                });
              }}
            />
            <p className="parent__muted">
              His name letters come first in the letter order, then these initials. Each name also becomes
              the example word for its own letter.
            </p>
          </section>

          <section className="parent__card">
            <h2 className="parent__cardTitle">Family Book order</h2>
            <div className="parent__choices">
              <button
                type="button"
                className={settings.bookOrder === 'sequence' ? 'parent__choice parent__choice--on' : 'parent__choice'}
                onClick={() => update({ bookOrder: 'sequence' })}
              >
                His letters first
              </button>
              <button
                type="button"
                className={settings.bookOrder === 'alphabet' ? 'parent__choice parent__choice--on' : 'parent__choice'}
                onClick={() => update({ bookOrder: 'alphabet' })}
              >
                A to Z
              </button>
            </div>
            <p className="parent__muted">
              A to Z makes it easier to check your photos are all in; his letters first is better for
              reading it with him.
            </p>
          </section>

          <section className="parent__card">
            <h2 className="parent__cardTitle">Session</h2>
            <button type="button" className="parent__btn parent__btnWide" onClick={() => void unlock()}>
              Start a fresh session
            </button>
            <p className="parent__muted">
              Ends the goodnight screen if it is showing, and puts the timer back to a full
              {' '}
              {settings.sessionMinutes} minutes. The clock starts again on his next tap, not now.
            </p>
          </section>

          <section className="parent__card">
            <h2 className="parent__cardTitle">Letter progress</h2>
            <ProgressSummary />
          </section>

          <section className="parent__card">
            <h2 className="parent__cardTitle">Storage</h2>
            {storage === null ? (
              <p className="parent__muted">Checking…</p>
            ) : (
              <>
                <div className="parent__value">
                  {storage.persisted ? 'The browser has agreed to keep this data' : 'Not guaranteed by the browser'}
                </div>
                {storage.usage !== undefined && (
                  <p className="parent__muted">
                    Using {megabytes(storage.usage)}
                    {storage.quota !== undefined ? ` of about ${megabytes(storage.quota)}` : ''}.
                  </p>
                )}
              </>
            )}
            <p className="parent__warn">
              Photos, clips and progress live only on this tablet. Clearing this site's data or deleting the
              app from the home screen erases them, and there is no backup yet.
            </p>
          </section>
        </div>

        <div className="parent__column">
          <section className="parent__card parent__card--grow">
            <h2 className="parent__cardTitle">Photos and voices</h2>
            <MediaLibrary />
          </section>

          <section className="parent__card">
            <h2 className="parent__cardTitle">Notes</h2>
            <NotesPanel />
          </section>
        </div>
      </div>
    </div>
  );
}
