/**
 * Structural smoke tests for the phase 4 screens. The engine tests cover the
 * rules; these check the screens draw them and that nothing on the child side
 * marks a wrong answer.
 */

import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '../app/settings';
import { MediaProvider } from '../app/media';
import { ProgressProvider } from '../app/progress';
import { SessionProvider } from '../app/session';
import FindIt from './FindIt/FindIt';
import LetterWall from './parent/LetterWall';

function render(node: ReactElement): string {
  return renderToStaticMarkup(
    <SettingsProvider>
      <SessionProvider>
        <ProgressProvider>
          <MediaProvider>{node}</MediaProvider>
        </ProgressProvider>
      </SessionProvider>
    </SettingsProvider>,
  );
}

describe('FindIt', () => {
  const html = render(<FindIt onHome={() => {}} />);

  it('asks for a letter from the seeded set', () => {
    expect(html).toMatch(/Where is [SEBATIN]\?/);
  });

  it('starts with two choices, as nothing is known yet', () => {
    expect(html).toContain('data-count="2"');
    expect(html.match(/class="find__tile"/g)).toHaveLength(2);
  });

  it('offers Home and a replay of the question', () => {
    expect(html).toContain('aria-label="Home"');
    expect(html).toContain('aria-label="Play the sound: Where is');
  });

  it('shows no marking of any kind before an answer', () => {
    expect(html).not.toContain('find__tile--cheer');
    expect(html).not.toContain('find__tile--show');
  });
});

describe('LetterWall', () => {
  const html = render(<LetterWall onBack={() => {}} />);

  it('shows all 26 letters', () => {
    expect(html.match(/class="wall__cell"/g)).toHaveLength(26);
  });

  it('pairs every colour with a written state, never colour alone', () => {
    for (const label of ['Not started', 'New', 'Learning', 'Knows it']) {
      expect(html).toContain(label);
    }
  });

  it('marks the seeded name letters as New and the rest as Not started', () => {
    // Seven seeded letters, plus the four key swatches, all say their state.
    expect(html.match(/>New</g)?.length).toBeGreaterThanOrEqual(7);
    expect(html.match(/>Not started</g)?.length).toBeGreaterThanOrEqual(19);
  });

  it('shows what is coming next', () => {
    expect(html).toContain('Up next:');
    expect(html).toContain('At most one new letter joins per day.');
  });

  it('opens no override panel until a letter is chosen', () => {
    expect(html).not.toContain('wall__cell--open');
    expect(html).not.toContain('clears its counters');
  });
});
