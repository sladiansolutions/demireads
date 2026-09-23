/**
 * Settings, loaded from IndexedDB on launch and saved on every change.
 * The child side waits for the load so it never shows a stale name.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { hasStorage, type Settings } from '../storage/db';
import { loadSettings, saveSettings } from '../storage/settingsStore';
import { DEFAULT_SETTINGS } from '../content/defaultSettings';

export type { Settings };
export { DEFAULT_SETTINGS };

interface SettingsValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  loaded: boolean;
}

const SettingsContext = createContext<SettingsValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  loaded: true,
});

interface SettingsProviderProps {
  children: ReactNode;
  /**
   * Starting values, for tests that need a particular setting. Real launches
   * leave this out and read from IndexedDB.
   */
  initial?: Partial<Settings>;
}

export function SettingsProvider({ children, initial }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...initial }));
  // Without IndexedDB (unit tests, SSR) the defaults are already the truth.
  const [loaded, setLoaded] = useState(() => !hasStorage());

  useEffect(() => {
    if (!hasStorage()) return;
    let cancelled = false;
    void loadSettings().then((stored) => {
      if (cancelled) return;
      setSettings(stored);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo<SettingsValue>(
    () => ({ settings, updateSettings, loaded }),
    [settings, updateSettings, loaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  return useContext(SettingsContext).settings;
}

export function useUpdateSettings(): (patch: Partial<Settings>) => void {
  return useContext(SettingsContext).updateSettings;
}

export function useSettingsLoaded(): boolean {
  return useContext(SettingsContext).loaded;
}
