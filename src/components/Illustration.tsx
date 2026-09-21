import { illustrationFor } from '../content/illustrations';
import { PhotoIcon } from './icons';

interface IllustrationProps {
  /** The example word this picture stands for. */
  word: string;
  className?: string;
  /** Size of the camera glyph in the empty state. */
  placeholderIconSize?: number;
}

/**
 * A picture for an example word: the bundled default today, a parent photo
 * from phase 2 onward, and a dashed placeholder when there is neither.
 */
export default function Illustration({ word, className, placeholderIconSize = 40 }: IllustrationProps) {
  const src = illustrationFor(word);
  const classes = className === undefined ? '' : ` ${className}`;

  if (src === undefined) {
    return (
      <div className={`photo-slot${classes}`}>
        <PhotoIcon size={placeholderIconSize} />
        <span>[PHOTO: {word}]</span>
      </div>
    );
  }

  // alt is empty because the word is always written or spoken next to it.
  return (
    <div className={`illus${classes}`}>
      <img className="illus__img" src={src} alt="" />
    </div>
  );
}
