import type { ReactNode } from 'react';
import { illustrationFor } from '../content/illustrations';
import { PhotoIcon } from './icons';

interface IllustrationProps {
  /** The example word this picture stands for. */
  word: string;
  /** A parent photo for this letter. Wins over the default (SPEC 3.2). */
  photoUrl?: string | undefined;
  className?: string;
  /** Size of the camera glyph in the empty state. */
  placeholderIconSize?: number;
  /**
   * Called when the picture is tapped. Given one, the slot becomes a button:
   * he reaches for the pictures expecting them to do something, so they say
   * what they are.
   */
  onPress?: (() => void) | undefined;
}

/**
 * A picture for an example word: the parent's photo if there is one, else the
 * bundled illustration, else a dashed placeholder. A photo fills the slot; a
 * flat illustration sits inside it with room to breathe.
 *
 * Every slot is the same size whether it is a picture or a placeholder, and
 * all of them are tappable when `onPress` is given — including the
 * placeholders, so a picture-less word still answers a tap.
 */
export default function Illustration({
  word,
  photoUrl,
  className,
  placeholderIconSize = 40,
  onPress,
}: IllustrationProps) {
  const src = photoUrl ?? illustrationFor(word);
  const classes = className === undefined ? '' : ` ${className}`;
  const isPhoto = photoUrl !== undefined;

  const inside: ReactNode =
    src === undefined ? (
      <>
        <PhotoIcon size={placeholderIconSize} />
        <span>[PHOTO: {word}]</span>
      </>
    ) : (
      // alt is empty because the word is always written or spoken alongside.
      <img className="illus__img" src={src} alt="" />
    );

  const base = src === undefined ? 'photo-slot' : `illus${isPhoto ? ' illus--photo' : ''}`;

  if (onPress === undefined) {
    return <div className={`${base}${classes}`}>{inside}</div>;
  }

  return (
    <button
      type="button"
      className={`${base}${classes} illus--pressable`}
      aria-label={`Hear ${word}`}
      onClick={onPress}
    >
      {inside}
    </button>
  );
}
