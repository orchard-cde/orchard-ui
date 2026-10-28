import { act, render } from '@testing-library/react';
import ThemeRegistry from '../ThemeRegistry';
import { resetTheme, stubMatchMedia, type MatchMediaStub } from '@/test/stubMatchMedia';

describe('ThemeRegistry', () => {
  let media: MatchMediaStub;

  beforeEach(() => {
    media = stubMatchMedia(false);
    document.documentElement.dataset.theme = 'light';
  });

  afterEach(() => {
    media.restore();
    resetTheme();
  });

  it('derives outlined input borders from the foreground token', () => {
    render(<ThemeRegistry>content</ThemeRegistry>);

    const css = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
      .join('')
      .replace(/\s/g, '');

    expect(css).toContain(
      '--mui-palette-common-onBackgroundChannel:var(--color-foreground-rgb)',
    );
  });

  it('follows an OS theme change while the preference is system', () => {
    render(<ThemeRegistry>content</ThemeRegistry>);

    act(() => media.setDark(true));
    expect(document.documentElement.dataset.theme).toBe('dark');

    act(() => media.setDark(false));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('ignores an OS theme change while a mode is pinned', () => {
    localStorage.setItem('orchard-theme', 'light');
    render(<ThemeRegistry>content</ThemeRegistry>);

    act(() => media.setDark(true));

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('stops following the OS after unmount', () => {
    const { unmount } = render(<ThemeRegistry>content</ThemeRegistry>);
    unmount();

    act(() => media.setDark(true));

    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
