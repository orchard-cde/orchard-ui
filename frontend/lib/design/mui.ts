// Vendored MUI theme options from the @orchard-cde/design tokens package
// (mirrors platforms/_tokens.js + platforms/mui.js, source commit 96a90cc).
//
// Vendored as local source — rather than depended on via npm — until the design
// package publishes to npm. A `file:` directory dependency symlinks to a sibling
// repo outside this project root, which breaks the Next dev server and CI builds;
// vendoring the token JSON + this transformer keeps everything in-repo. When the
// package publishes, replace this with `import themeOptions from
// '@orchard-cde/design/platforms/mui'`. Re-sync the tokens/*.json + this file if
// the design package changes before then.
//
// Maps the orchard scale onto MUI's `primary` palette. Semantic colors
// (success/warning/error/info) are intentionally omitted — see
// tokens/colors.json `_meta.tbd`; MUI's defaults stand until those are decided.
import type { ThemeOptions } from '@mui/material/styles';
import colors from './tokens/colors.json';
import typography from './tokens/typography.json';
import spacing from './tokens/spacing.json';

// { "50": { value: "#.." } } -> { "50": "#.." }
function flattenScale(
  scale: Record<string, { value: string }>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, token] of Object.entries(scale)) {
    if (key.startsWith('_')) continue;
    out[key] = token.value;
  }
  return out;
}

const orchard = flattenScale(colors.color.orchard);
const background = colors.color.background.value;
const foreground = colors.color.foreground.value;
const fontFamilySans = typography.typography.fontFamily.sans.value;
const radius = spacing.radius.DEFAULT.value;

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      light: orchard['400'],
      main: orchard['600'],
      dark: orchard['800'],
      contrastText: '#ffffff',
    },
    background: {
      default: background,
      paper: '#ffffff',
    },
    text: {
      primary: foreground,
    },
    // Expose the full scale for `sx`/`styled` consumers that need a specific step.
    orchard,
  },
  typography: {
    fontFamily: fontFamilySans,
  },
  shape: {
    // MUI expects a unitless pixel number.
    borderRadius: parseInt(radius, 10),
  },
};

export default themeOptions;
