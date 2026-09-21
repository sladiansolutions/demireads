/**
 * Notes (SPEC 3.8): what he did away from the screen. Kept here because the
 * off-screen observations are the real measure of whether this is working.
 * JSON export of notes is phase 5.
 */

import { db, hasStorage, type Note } from './db';

export async function loadNotes(): Promise<Note[]> {
  if (!hasStorage()) return [];
  try {
    const database = await db();
    const notes = await database.getAll('notes');
    return notes.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export async function addNote(text: string): Promise<Note | undefined> {
  const trimmed = text.trim();
  if (trimmed.length === 0 || !hasStorage()) return undefined;
  const note: Note = {
    id: `note-${Date.now()}`,
    date: new Date().toISOString(),
    text: trimmed,
  };
  const database = await db();
  await database.put('notes', note);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  if (!hasStorage()) return;
  const database = await db();
  await database.delete('notes', id);
}
