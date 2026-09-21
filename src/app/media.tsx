/**
 * Parent photos and voice clips, loaded once at launch and handed out as
 * object URLs. One tablet, a few dozen small files: loading them all up
 * front keeps every screen synchronous and simple.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { MediaAsset } from '../storage/db';
import { loadAllMedia } from '../storage/media';
import { letterPhotoId } from '../storage/mediaKeys';
import { setClipResolver } from '../audio/clips';

interface MediaEntry {
  asset: MediaAsset;
  url: string;
}

interface MediaValue {
  /** Parent photo for a letter, if one has been added. */
  photoUrl: (letter: string) => string | undefined;
  /** Any stored clip or photo by its media id. */
  urlFor: (id: string) => string | undefined;
  assetFor: (id: string) => MediaAsset | undefined;
  /** Re-read everything after the parent adds or removes a file. */
  reload: () => Promise<void>;
}

const MediaContext = createContext<MediaValue>({
  photoUrl: () => undefined,
  urlFor: () => undefined,
  assetFor: () => undefined,
  reload: async () => {},
});

export function MediaProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Map<string, MediaEntry>>(new Map());
  const urls = useRef<string[]>([]);

  const revokeAll = useCallback(() => {
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current = [];
  }, []);

  const reload = useCallback(async () => {
    const assets = await loadAllMedia();
    revokeAll();
    const next = new Map<string, MediaEntry>();
    for (const asset of assets) {
      const url = URL.createObjectURL(asset.blob);
      urls.current.push(url);
      next.set(asset.id, { asset, url });
    }
    setEntries(next);
  }, [revokeAll]);

  useEffect(() => {
    void reload();
    return revokeAll;
  }, [reload, revokeAll]);

  const value = useMemo<MediaValue>(() => {
    const urlFor = (id: string) => entries.get(id)?.url;
    return {
      urlFor,
      photoUrl: (letter: string) => urlFor(letterPhotoId(letter)),
      assetFor: (id: string) => entries.get(id)?.asset,
      reload,
    };
  }, [entries, reload]);

  // Let the audio layer find recordings without importing React.
  useEffect(() => {
    setClipResolver(value.urlFor);
    return () => setClipResolver(null);
  }, [value]);

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia(): MediaValue {
  return useContext(MediaContext);
}
