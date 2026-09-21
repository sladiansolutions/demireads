import { useEffect, useState } from 'react';
import { addNote, deleteNote, loadNotes } from '../../storage/notes';
import type { Note } from '../../storage/db';

/** SPEC 3.8 notes. JSON export of these is phase 5. */
export default function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    void loadNotes().then(setNotes);
  }, []);

  async function save() {
    const note = await addNote(text);
    if (!note) return;
    setText('');
    setNotes(await loadNotes());
  }

  async function remove(id: string) {
    await deleteNote(id);
    setNotes(await loadNotes());
  }

  return (
    <div className="parent__stack">
      <label className="parent__label" htmlFor="notes">
        Notes: what did he do off the screen?
      </label>
      <textarea
        id="notes"
        rows={3}
        className="parent__textarea"
        placeholder="e.g. Pointed to S on the cereal box"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button type="button" className="parent__btn" onClick={() => void save()} disabled={text.trim() === ''}>
        Save note
      </button>

      {notes.length > 0 && (
        <ul className="parent__notes">
          {notes.map((note) => (
            <li key={note.id} className="parent__note">
              <div>
                <div className="parent__noteDate">{new Date(note.date).toLocaleDateString()}</div>
                <div>{note.text}</div>
              </div>
              <button type="button" className="parent__btnQuiet" onClick={() => void remove(note.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
