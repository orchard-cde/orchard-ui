import { render } from '@testing-library/react';
import ThemeRegistry from '@/components/ThemeRegistry';
import Button from '../Button';
import { resetTheme, stubMatchMedia, type MatchMediaStub } from '@/test/stubMatchMedia';

// Only the Button's own rules: the theme also emits the orchard scale as
// --mui-palette-orchard-* variables on :root, which is not what is under test.
function buttonCss(): string {
  return [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
    .filter((text) => text.includes('MuiButton'))
    .join('')
    .replace(/\s/g, '');
}

describe('Button', () => {
  let media: MatchMediaStub;

  beforeEach(() => {
    media = stubMatchMedia(false);
    document.documentElement.dataset.theme = 'light';
  });

  afterEach(() => {
    media.restore();
    resetTheme();
  });

  it('derives hover and focus colors from semantic tokens, not orchard steps', () => {
    render(
      <ThemeRegistry>
        <Button variant="primary">Plant</Button>
        <Button variant="ghost">Cancel</Button>
      </ThemeRegistry>,
    );

    const css = buttonCss();

    expect(css).toContain('color-mix(insrgb,var(--color-primary),var(--color-foreground)15%)');
    expect(css).toContain('rgb(var(--color-primary-rgb)/0.08)');
    expect(css).toContain('color-mix(insrgb,var(--color-primary),var(--color-foreground)40%)');
    expect(css).not.toContain('#1d5e2d');
    expect(css).not.toContain('#f0f9f1');
    expect(css).not.toContain('#4aad5e');
  });
});
