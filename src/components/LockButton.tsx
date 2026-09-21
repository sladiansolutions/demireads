import { LockIcon } from './icons';

/**
 * The only door to the parent area. Phase 2 adds the real gate: a two-finger
 * hold for 3 seconds with a filling ring (SPEC 4). Until then it is drawn but
 * inert, so no child-side path reaches settings.
 */
export default function LockButton() {
  return (
    <div
      className="quiet-btn quiet-btn--lock"
      role="img"
      aria-label="Parent area. Hold with two fingers to open. Not active until phase 2."
    >
      <LockIcon />
    </div>
  );
}
