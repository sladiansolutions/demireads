/**
 * Photos and voice clips. Parents pick a file through the OS sheet (camera
 * roll, or Take Photo straight into the app) and the blob goes into
 * IndexedDB. Nothing is uploaded anywhere: there is nowhere to upload to.
 */

import { db, hasStorage, type MediaAsset, type MediaTarget } from './db';
import { fitWithin, mediaId, PHOTO_MAX_EDGE } from './mediaKeys';

/** Re-encode quality for stored photos. */
const PHOTO_QUALITY = 0.85;

/**
 * JPEG rather than WebP. Where a browser cannot encode the type asked for it
 * silently produces PNG instead, and a 1200px PNG photograph is several
 * megabytes. JPEG encoding is supported everywhere and photos have no alpha.
 */
const PHOTO_TYPE = 'image/jpeg';

/**
 * Shrink and re-encode a picked photo. A tablet photo is 3-5MB and the
 * biggest slot on screen is 480 CSS px, so this keeps 26 letters to a few
 * megabytes. Re-encoding also drops the EXIF block, GPS included, and
 * `imageOrientation` bakes in the rotation so portrait photos are upright.
 */
export async function processPhoto(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file; // Unsupported format: keep the original rather than lose it.
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height, PHOTO_MAX_EDGE);

  try {
    if (typeof OffscreenCanvas === 'function') {
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');
      if (!context) return file;
      context.drawImage(bitmap, 0, 0, width, height);
      return await canvas.convertToBlob({ type: PHOTO_TYPE, quality: PHOTO_QUALITY });
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, PHOTO_TYPE, PHOTO_QUALITY),
    );
    return blob ?? file;
  } finally {
    bitmap.close();
  }
}

async function put(asset: MediaAsset): Promise<void> {
  const database = await db();
  await database.put('media', asset);
}

export async function savePhoto(target: MediaTarget, file: Blob, label?: string): Promise<void> {
  const blob = await processPhoto(file);
  await put({
    id: mediaId('photo', target),
    kind: 'photo',
    target,
    ...(label === undefined ? {} : { label }),
    blob,
    createdAt: new Date().toISOString(),
  });
}

/** Voice clips are stored as picked: they are already small (SPEC 7). */
export async function saveAudio(target: MediaTarget, file: Blob, label?: string): Promise<void> {
  await put({
    id: mediaId('audio', target),
    kind: 'audio',
    target,
    ...(label === undefined ? {} : { label }),
    blob: file,
    createdAt: new Date().toISOString(),
  });
}

export async function loadAllMedia(): Promise<MediaAsset[]> {
  if (!hasStorage()) return [];
  try {
    const database = await db();
    return await database.getAll('media');
  } catch {
    return [];
  }
}

export async function deleteMedia(id: string): Promise<void> {
  const database = await db();
  await database.delete('media', id);
}
