'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import themeOptions from '@/lib/design/mui';

// Maps the orchard green scale onto palette.primary (+ fontFamily, 8px radius)
// from the vendored design tokens. Semantic colors (success/warning/error/info)
// intentionally stay MUI defaults until those tokens are decided.
const theme = createTheme(themeOptions);

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
