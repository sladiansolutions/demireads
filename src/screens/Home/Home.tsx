import type { ReactNode } from 'react';
import BigTile from '../../components/BigTile';
import ParentGate from '../../components/ParentGate';
import { BookGlyph, DuckGlyph, FindGlyph, NotesGlyph, SunIcon } from '../../components/icons';
import { useSettings } from '../../app/settings';
import { isBuilt, type Route } from '../../app/routes';
import { provisionalActiveSet } from '../../engine/letterSequence';
import type { TileColor } from '../../engine/tileColor';
import { speak } from '../../audio/speech';
import './Home.css';

interface Tile {
  route: Route;
  /**
   * The colour from the mockup, used once the screen exists. Find It has no
   * mockup, so it takes teal-deep: the one token in the palette that is not
   * already a tile.
   */
  tone: TileColor | 'teal-deep';
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
  {
    route: 'find',
    tone: 'teal-deep',
    label: 'Find It',
    ariaLabel: 'Find the letter',
    glyph: () => <FindGlyph />,
  },
];

/**
 * SPEC 3.1. Screens that do not exist yet are drawn unlit and answer a tap
 * with a word rather than nothing, so no tap is ever dead (rule 6). They
 * light up on their own once phase 3 adds them to BUILT.
 *
 * The lock in the corner is the only way to the parent area, and it takes a
 * deliberate two-finger hold (SPEC 4).
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
        <ParentGate onOpen={() => onGo('parent')} />
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
