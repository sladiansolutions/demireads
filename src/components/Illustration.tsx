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
}

/**
 * A picture for an example word: the parent's photo if there is one, else the
 * bundled illustration, else a dashed placeholder. A photo fills the slot; a
 * flat illustration sits inside it with room to breathe.
 */
export default function Illustration({
  word,
  photoUrl,
  className,
  placeholderIconSize = 40,
}: IllustrationProps) {
  const src = photoUrl ?? illustrationFor(word);
  const classes = className === undefined ? '' : ` ${className}`;

  if (src === undefined) {
    return (
      <div className={`photo-slot${classes}`}>
        <PhotoIcon size={placeholderIconSize} />
        <span>[PHOTO: {word}]</span>
      </div>
    );
  }

  const isPhoto = photoUrl !== undefined;
  return (
    <div className={`illus${isPhoto ? ' illus--photo' : ''}${classes}`}>
      {/* alt is empty because the word is always written or spoken alongside. */}
      <img className="illus__img" src={src} alt="" />
    </div>
  );
}
