import { render } from '@testing-library/react';
import colors from '@orchard-cde/design/tokens/colors';
import Button from '../Button';

const orchard = colors.color.orchard;

function emittedCss(): string {
  return [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
    .join('')
    .replace(/\s/g, '');
}

test('derives hover and focus colors from semantic tokens, not orchard steps', () => {
  render(
    <>
      <Button variant="primary">Plant</Button>
      <Button variant="ghost">Cancel</Button>
    </>,
  );

  const css = emittedCss();

  expect(css).toContain('color-mix(insrgb,var(--color-primary),var(--color-foreground)15%)');
  expect(css).toContain('rgb(var(--color-primary-rgb)/0.08)');
  expect(css).toContain('color-mix(insrgb,var(--color-primary),var(--color-foreground)40%)');
  expect(css).not.toContain(orchard['700'].value);
  expect(css).not.toContain(orchard['50'].value);
  expect(css).not.toContain(orchard['400'].value);
});
