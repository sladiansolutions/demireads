/**
 * Structural smoke tests. They do not check layout — that needs eyes on a
 * tablet — but they catch a screen that throws, a missing letter, or a
 * touch target that lost its minimum-size class.
 */

import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '../app/settings';
import Home from './Home/Home';
import LetterGarden from './LetterGarden/LetterGarden';
import FamilyBook from './FamilyBook/FamilyBook';

function render(node: ReactElement): string {
  return renderToStaticMarkup(<SettingsProvider>{node}</SettingsProvider>);
}

describe('Home', () => {
  const html = render(<Home onGo={() => {}} />);

  it('greets the child by name', () => {
    expect(html).toContain('Hi, Sebastian!');
  });

  it('shows four tiles, all lit now that every screen exists', () => {
    expect(html.match(/class="tile"/g)).toHaveLength(4);
    expect(html).not.toContain('tile--quiet');
    expect(html).not.toContain('Coming soon');
  });

  it('gives each tile its colour from the mockup', () => {
    for (const tone of ['tomato', 'teal', 'plum', 'sun']) {
      expect(html).toContain(`--tile-fill:var(--${tone})`);
    }
  });

  it('leads with the first letter of the name', () => {
    expect(html).toContain('>S</span>');
  });

  it('puts the parent gate in the corner, needing a deliberate hold', () => {
    expect(html).toContain('class="quiet-btn quiet-btn--lock gate"');
    expect(html).toContain('Hold with two fingers for three seconds');
    // The ring only exists mid-hold, so a fresh render has none.
    expect(html).not.toContain('gate__ring');
  });
});

describe('LetterGarden', () => {
  const html = render(<LetterGarden onHome={() => {}} />);

  it('shows the name letters as the active set, capped at 7', () => {
    const tiles = html.match(/aria-label="Letter ([A-Z])"/g) ?? [];
    expect(tiles).toHaveLength(7);
    expect(tiles.map((t) => t.slice(-2, -1)).join('')).toBe('SEBATIN');
  });

  it("uses the child's name as the first example word for S", () => {
    // No default picture of Sebastian exists, so that slot waits for a parent
    // photo, while "sun" shows its bundled illustration.
    expect(html).toContain('[PHOTO: Sebastian]');
    expect(html).toContain('class="illus garden__photoSlot"');
    expect(html).toContain('<img class="illus__img"');
  });

  it('offers a replay button labelled with the sound', () => {
    expect(html).toContain('S says /s/');
  });

  it('starts with no co-play prompt showing', () => {
    expect(html).toContain('class="garden__coplay"');
    expect(html).not.toContain('Ask him');
  });
});

describe('FamilyBook', () => {
  const html = render(<FamilyBook onHome={() => {}} />);

  it('opens on the first letter of the sequence', () => {
    expect(html).toContain('is for Sebastian');
    // Page one is a name page, so it shows the placeholder, not an icon.
    expect(html).toContain('[PHOTO: Sebastian]');
  });

  it('has a page dot for all 26 letters, one of them current', () => {
    expect(html.match(/class="book__dot"/g)).toHaveLength(25);
    expect(html.match(/class="book__dot book__dot--current"/g)).toHaveLength(1);
  });

  it('gives both arrows the enlarged child touch area', () => {
    expect(html.match(/round-btn[^"]*hit-child/g)).toHaveLength(2);
  });
});
