/**
 * Recording a voice clip in the app (SPEC 7). Uploading a clip recorded
 * elsewhere always stays available, because browser support and microphone
 * permissions vary and a blocked microphone must not block a parent.
 */

/** Longest clip we keep. SPEC 7 asks for under five seconds. */
export const MAX_CLIP_MS = 6000;

/**
 * Candidates in preference order: Opus in WebM where it exists (Chrome,
 * Android), MP4/AAC on Safari and iOS. An empty string means "let the browser
 * choose", which is the right last resort.
 */
export const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
] as const;

/** Pure, so the choice is testable without a microphone. */
export function pickMimeType(isSupported: (type: string) => boolean): string {
  return MIME_CANDIDATES.find((type) => isSupported(type)) ?? '';
}

export function isRecordingSupported(): boolean {
  return (
    typeof MediaRecorder === 'function' &&
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices?.getUserMedia !== undefined
  );
}

export interface ActiveRecording {
  /** Resolves with the finished clip and releases the microphone. */
  stop: () => Promise<Blob>;
  /** Throws the clip away and releases the microphone. */
  cancel: () => void;
}

export class MicrophoneBlockedError extends Error {
  constructor() {
    super('The microphone is not available');
    this.name = 'MicrophoneBlockedError';
  }
}

export async function startRecording(): Promise<ActiveRecording> {
  if (!isRecordingSupported()) throw new MicrophoneBlockedError();

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new MicrophoneBlockedError();
  }

  const mimeType = pickMimeType((type) => MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(stream, mimeType === '' ? {} : { mimeType });
  const chunks: Blob[] = [];
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });
  recorder.start();

  /** Leaving a track live keeps the tablet's recording indicator on. */
  const release = () => {
    for (const track of stream.getTracks()) track.stop();
  };

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        recorder.addEventListener('stop', () => {
          release();
          resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
        });
        if (recorder.state === 'inactive') {
          release();
          resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
          return;
        }
        recorder.stop();
      }),
    cancel: () => {
      if (recorder.state !== 'inactive') recorder.stop();
      release();
    },
  };
}
