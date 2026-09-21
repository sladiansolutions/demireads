/**
 * Settings (SPEC 6). Phase 1 keeps them in memory with the defaults below;
 * phase 2 loads and saves them through src/storage/ and adds the parent area.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface Settings {
  childName: string;
  familyNames: string[];
  sessionMinutes: 5 | 10 | 15 | 20;
  songIntervalMs: number;
}

export const DEFAULT_SETTINGS: Settings = {
  childName: 'Sebastian',
  familyNames: [],
  sessionMinutes: 10,
  songIntervalMs: 700,
};

interface SettingsValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const value = useMemo<SettingsValue>(
    () => ({
      settings,
      updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
    }),
    [settings],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  return useContext(SettingsContext).settings;
}

export function useUpdateSettings(): (patch: Partial<Settings>) => void {
  return useContext(SettingsContext).updateSettings;
}
