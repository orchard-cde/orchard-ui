export {};

// The @orchard-cde/design theme (@orchard-cde/design/platforms/mui) exposes the
// full orchard scale on `palette.orchard` for `sx`/`styled` consumers that need
// a specific step (e.g. orchard-700 hover, orchard-400 focus ring). Augment
// MUI's palette types so those steps are typed.
declare module '@mui/material/styles' {
  interface Palette {
    orchard: Record<string, string>;
  }
  interface PaletteOptions {
    orchard?: Record<string, string>;
  }
}
