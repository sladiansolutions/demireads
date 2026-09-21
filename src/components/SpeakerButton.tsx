import { SpeakerIcon } from './icons';

interface SpeakerButtonProps {
  /** Shown on the button and used as its accessible label. */
  text: string;
  onClick: () => void;
  variant?: 'ink' | 'teal';
}

export default function SpeakerButton({ text, onClick, variant = 'ink' }: SpeakerButtonProps) {
  return (
    <button
      type="button"
      className={variant === 'teal' ? 'speaker-btn speaker-btn--teal hit-child' : 'speaker-btn hit-child'}
      aria-label={`Play the sound: ${text}`}
      onClick={onClick}
    >
      <SpeakerIcon />
      <span>{text}</span>
    </button>
  );
}
