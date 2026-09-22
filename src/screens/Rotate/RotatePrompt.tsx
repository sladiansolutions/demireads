import './RotatePrompt.css';

/**
 * Shown instead of a child screen when the tablet is upright. The child side
 * is drawn for landscape (SPEC 2), and asking for a turn is kinder than
 * cramming seven screens into a shape they were not designed for.
 *
 * The picture carries the message, since he cannot read (rule 4); the line
 * underneath is for whoever is holding the tablet.
 */
export default function RotatePrompt() {
  return (
    <div className="rotate">
      <svg className="rotate__icon" width="200" height="200" viewBox="0 0 120 120" aria-hidden="true">
        {/* An upright tablet, turning. */}
        <rect x="38" y="16" width="44" height="72" rx="7" fill="var(--sand)" stroke="var(--ink)" strokeWidth="3" />
        <circle cx="60" cy="80" r="3" fill="var(--ink-quiet)" />
        <path
          d="M26 96a40 40 0 0 1 68 0"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M94 96l-9-6 1 12z" fill="var(--teal)" />
      </svg>

      <div className="rotate__title">Turn the tablet</div>
      <p className="rotate__hint">These screens are made for landscape.</p>
    </div>
  );
}
