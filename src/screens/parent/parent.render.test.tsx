import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '../../app/settings';
import { MediaProvider } from '../../app/media';
import ParentArea from './ParentArea';

function render(node: ReactElement): string {
  return renderToStaticMarkup(
    <SettingsProvider>
      <MediaProvider>{node}</MediaProvider>
    </SettingsProvider>,
  );
}

describe('ParentArea', () => {
  const html = render(<ParentArea onBack={() => {}} />);

  it('renders without throwing', () => {
    expect(html).toContain('Parent area');
  });

  it('offers a way back that needs no gate', () => {
    expect(html).toContain('Back to Sebastian&#x27;s side');
  });

  it('has the session length, names and book order controls', () => {
    expect(html).toContain('Minutes before the goodnight screen');
    expect(html).toContain('Child&#x27;s name');
    expect(html).toContain('Family Book order');
  });

  it('lists a media row for all 26 letters plus numbers and one-offs', () => {
    expect(html.match(/class="parent__row"/g)).toHaveLength(26 + 10 + 2);
  });

  it('warns that this tablet is the only copy', () => {
    expect(html).toContain('erases them');
  });
});
