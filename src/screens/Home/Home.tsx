import type { ReactNode } from 'react';
import BigTile from '../../components/BigTile';
import LockButton from '../../components/LockButton';
import { BookGlyph, DuckGlyph, NotesGlyph, SunIcon } from '../../components/icons';
import { useSettings } from '../../app/settings';
import { isBuilt, type Route } from '../../app/routes';
import { provisionalActiveSet } from '../../engine/letterSequence';
import type { TileColor } from '../../engine/tileColor';
import { speak } from '../../audio/speech';
import './Home.css';

interface Tile {
  route: Route;
  /** The color from the mockup, used once the screen exists. */
  tone: TileColor;
  label: string;
  ariaLabel: string;
  glyph: (firstLetter: string) => ReactNode;
}

const TILES: readonly Tile[] = [
  {
    route: 'letters',
    tone: 'tomato',
    label: 'Letters',
    ariaLabel: 'Letter Garden',
    glyph: (firstLetter) => <span className="home__letterBadge">{firstLetter}</span>,
  },
  {
    route: 'book',
    tone: 'teal',
    label: 'Family Book',
    ariaLabel: 'Family Alphabet Book',
    glyph: () => <BookGlyph />,
  },
  {
    route: 'numbers',
    tone: 'plum',
    label: '1 2 3',
    ariaLabel: 'Count the Ducks',
    glyph: () => <DuckGlyph />,
  },
  {
    route: 'song',
    tone: 'sun',
    label: 'A to Z',
    ariaLabel: 'A to Z song',
    glyph: () => <NotesGlyph />,
  },
];

/**
 * SPEC 3.1. Screens that do not exist yet are drawn unlit and answer a tap
 * with a word rather than nothing, so no tap is ever dead (rule 6). They
 * light up on their own once phase 3 adds them to BUILT.
 */
export default function Home({ onGo }: { onGo: (route: Route) => void }) {
  const { childName, familyNames } = useSettings();
  const firstLetter = provisionalActiveSet(childName, familyNames)[0] ?? 'A';

  return (
    <div className="screen home">
      <div className="home__header">
        <div className="home__greeting">
          <SunIcon />
          <h1 className="home__title">Hi, {childName}!</h1>
        </div>
        <LockButton />
      </div>

      <div className="home__tiles">
        {TILES.map((tile) => {
          const ready = isBuilt(tile.route);
          return (
            <BigTile
              key={tile.route}
              tone={ready ? tile.tone : 'quiet'}
              label={tile.label}
              ariaLabel={ready ? tile.ariaLabel : `${tile.ariaLabel}. Coming soon.`}
              onClick={ready ? () => onGo(tile.route) : () => speak('Soon!')}
            >
              {tile.glyph(firstLetter)}
            </BigTile>
          );
        })}
      </div>
    </div>
  );
}
