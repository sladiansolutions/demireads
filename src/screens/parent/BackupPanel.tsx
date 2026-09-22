import { useRef, useState, type ChangeEvent } from 'react';
import { useSettings, useUpdateSettings } from '../../app/settings';
import { backupAge } from '../../storage/backupAge';
import { useMedia } from '../../app/media';
import { bundleFilename, summarize, validateBundle, type BundleSummary } from '../../storage/transfer';
import { applyBundle, buildBundle, downloadBundle, type ImportResult } from '../../storage/transferStore';

type State =
  | { kind: 'idle' }
  | { kind: 'working'; what: string }
  | { kind: 'exported'; summary: BundleSummary; filename: string }
  | { kind: 'imported'; result: ImportResult }
  | { kind: 'failed'; message: string };

/**
 * Backup, and handing work between two parents' devices.
 *
 * Photos and clips live only in this tablet's browser storage, so this file
 * is both the only backup and the only way a clip recorded on another device
 * can get here. Settings and progress are left alone unless asked for, so
 * importing one parent's voices cannot undo the other's setup.
 */
export default function BackupPanel() {
  const { childName, lastExportAt } = useSettings();
  const update = useUpdateSettings();
  const { reload } = useMedia();
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [withSettings, setWithSettings] = useState(false);
  const [withProgress, setWithProgress] = useState(false);

  const age = backupAge(lastExportAt, new Date());

  async function exportAll() {
    setState({ kind: 'working', what: 'Packing everything up' });
    try {
      const bundle = await buildBundle();
      const filename = bundleFilename(new Date(), childName);
      downloadBundle(bundle, filename);
      update({ lastExportAt: new Date().toISOString() });
      setState({ kind: 'exported', summary: summarize(bundle), filename });
    } catch (error) {
      setState({ kind: 'failed', message: error instanceof Error ? error.message : 'Export failed.' });
    }
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setState({ kind: 'working', what: 'Reading the backup' });
    try {
      const bundle = validateBundle(JSON.parse(await file.text()));
      const result = await applyBundle(bundle, { settings: withSettings, progress: withProgress });
      await reload();
      setState({ kind: 'imported', result });
    } catch (error) {
      setState({
        kind: 'failed',
        message: error instanceof Error ? error.message : 'That file could not be read.',
      });
    }
  }

  return (
    <div className="parent__stack">
      <p className="parent__muted">
        One file holds every photo, voice clip, note and setting. Keep a copy somewhere safe: this
        tablet is otherwise the only place they exist.
      </p>

      {/* SPEC 8: say when the last backup was, and nudge when it is old. */}
      <p className={age.stale ? 'parent__warn' : 'parent__value'}>{age.message}</p>

      <div className="parent__choices">
        <button type="button" className="parent__btn" onClick={() => void exportAll()}>
          Export everything
        </button>
        <button type="button" className="parent__btnQuiet" onClick={() => fileInput.current?.click()}>
          Import a backup
        </button>
      </div>

      <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e)} />

      <p className="parent__muted">
        An import always adds photos, clips and notes, replacing only entries with the same letter. So
        one of you can record the voices on another device, export, send the file here, and import it
        without disturbing the photos on this tablet.
      </p>

      <label className="parent__check">
        <input type="checkbox" checked={withSettings} onChange={(e) => setWithSettings(e.target.checked)} />
        Also import settings (names, session length, words)
      </label>
      <label className="parent__check">
        <input type="checkbox" checked={withProgress} onChange={(e) => setWithProgress(e.target.checked)} />
        Also import letter and number progress
      </label>

      {state.kind === 'working' && <p className="parent__value">{state.what}…</p>}

      {state.kind === 'exported' && (
        <p className="parent__value">
          Saved {state.filename}: {state.summary.photos} photos, {state.summary.voices} voices,{' '}
          {state.summary.notes} notes.
        </p>
      )}

      {state.kind === 'imported' && (
        <p className="parent__value">
          Imported {state.result.photos} photos, {state.result.voices} voices, {state.result.notes} notes.
        </p>
      )}

      {state.kind === 'failed' && <p className="parent__warn">{state.message}</p>}
    </div>
  );
}
