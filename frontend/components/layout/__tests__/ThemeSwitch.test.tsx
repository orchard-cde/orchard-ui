import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeSwitch from '../ThemeSwitch';
import { resetTheme, stubMatchMedia, type MatchMediaStub } from '@/test/stubMatchMedia';

describe('ThemeSwitch', () => {
  let media: MatchMediaStub;

  beforeEach(() => {
    resetTheme();
    media = stubMatchMedia(false);
  });

  afterEach(() => {
    media.restore();
    resetTheme();
  });

  async function openMenu(name: RegExp = /^Theme/) {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name }));
    return user;
  }

  function checked() {
    return screen
      .getAllByRole('menuitemradio')
      .filter((item) => item.getAttribute('aria-checked') === 'true')
      .map((item) => item.textContent);
  }

  it('defaults to system and offers light, dark and system', async () => {
    render(<ThemeSwitch />);

    await openMenu(/^Theme: System$/);

    expect(
      screen.getAllByRole('menuitemradio').map((item) => item.textContent),
    ).toEqual(['Light', 'Dark', 'System']);
    expect(checked()).toEqual(['System']);
  });

  it('applies and persists a pinned mode', async () => {
    render(<ThemeSwitch />);
    const user = await openMenu();

    await user.click(screen.getByRole('menuitemradio', { name: 'Dark' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('orchard-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeTruthy();
  });

  it('clears the stored mode and follows the OS when system is chosen', async () => {
    media.restore();
    media = stubMatchMedia(true);
    localStorage.setItem('orchard-theme', 'light');
    render(<ThemeSwitch />);
    const user = await openMenu(/^Theme: Light$/);

    await user.click(screen.getByRole('menuitemradio', { name: 'System' }));

    expect(localStorage.getItem('orchard-theme')).toBeNull();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('marks system after switching from dark on a dark OS', async () => {
    media.restore();
    media = stubMatchMedia(true);
    localStorage.setItem('orchard-theme', 'dark');
    render(<ThemeSwitch />);
    const user = await openMenu(/^Theme: Dark$/);

    await user.click(screen.getByRole('menuitemradio', { name: 'System' }));
    await openMenu(/^Theme: System$/);

    expect(checked()).toEqual(['System']);
  });

  it('restores the stored preference on mount', async () => {
    localStorage.setItem('orchard-theme', 'dark');
    render(<ThemeSwitch />);

    await openMenu(/^Theme: Dark$/);

    expect(checked()).toEqual(['Dark']);
  });
});
