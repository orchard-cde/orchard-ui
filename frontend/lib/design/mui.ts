// @ts-expect-error - @orchard-cde/design ships CJS without TS declarations
import themeOptions from '@orchard-cde/design/platforms/mui';

// palette.mode stays 'light', so MUI would default common.onBackground to
// black, and outlined input borders (onBackground at 0.23) vanish on dark.
export default {
  ...themeOptions,
  palette: {
    ...themeOptions.palette,
    common: {
      onBackground: 'var(--color-foreground)',
      onBackgroundChannel: 'var(--color-foreground-rgb)',
    },
  },
};
