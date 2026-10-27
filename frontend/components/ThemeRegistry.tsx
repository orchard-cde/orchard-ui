'use client';

import { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { subscribe } from '@orchard-cde/design/theme';
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
  // The runtime only listens for OS theme changes while subscribed, and this
  // is the one component mounted on every route.
  useEffect(() => subscribe(() => {}), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
