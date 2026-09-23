/**
 * Structural smoke tests for the phase 3 screens. Layout still needs eyes on
 * a tablet; these catch a screen that throws or loses a control.
 */

import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '../app/settings';
import { MediaProvider } from '../app/media';
import { SessionProvider } from '../app/session';
import CountDucks from './CountDucks/CountDucks';
import AlphabetSong from './AlphabetSong/AlphabetSong';
import Goodnight from './Goodnight/Goodnight';

function render(node: ReactElement): string {
  return renderToStaticMarkup(
    <SettingsProvider>
      <SessionProvider>
        <MediaProvider>{node}</MediaProvider>
      </SessionProvider>
    </SettingsProvider>,
  );
}

describe('CountDucks', () => {
  const html = render(<CountDucks onHome={() => {}} />);

  it('invites the first tap', () => {
    expect(html).toContain('Tap a duck!');
  });

  it('offers Home and Again', () => {
    expect(html).toContain('aria-label="Home"');
    expect(html).toContain('aria-label="Count again"');
  });

  it('starts with an empty numeral rather than a zero', () => {
    expect(html).toContain('class="ducks__numeral"></div>');
  });
});

describe('AlphabetSong', () => {
  const html = render(<AlphabetSong onHome={() => {}} />);

  it('shows all 26 letters, none lit yet', () => {
    expect(html.match(/class="song__tile"/g)).toHaveLength(26);
    expect(html).not.toContain('song__tile--current');
  });

  it('starts paused, in play mode, offering both ways in', () => {
    expect(html).toContain('aria-label="Play all the letters"');
    expect(html).toContain('aria-label="Touch a letter to hear it"');
  });

  it('starts in play mode, so the tiles are not yet targets', () => {
    expect(html).toContain('class="song__grid"');
    expect(html).not.toContain('song__grid--touch');
    // Only the two mode buttons and Home are pressable.
    expect(html.match(/<button/g)).toHaveLength(3);
  });
});

describe('Goodnight', () => {
  const html = render(<Goodnight onParent={() => {}} />);

  it('says goodnight by name', () => {
    expect(html).toContain('Goodnight, letters!');
    expect(html).toContain('See you tomorrow, Sebastian.');
  });

  it('has a parent gate and nothing else to press', () => {
    expect(html).toContain('class="quiet-btn quiet-btn--lock gate"');
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it('shows his own letters asleep', () => {
    expect(html.match(/class="night__tile"/g)).toHaveLength(3);
  });
});
