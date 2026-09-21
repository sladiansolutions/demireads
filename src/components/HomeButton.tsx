import { HomeIcon } from './icons';

/** Always in the same corner, always the same shape: the one way back. */
export default function HomeButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="quiet-btn hit-child" aria-label="Home" onClick={onClick}>
      <HomeIcon />
    </button>
  );
}
