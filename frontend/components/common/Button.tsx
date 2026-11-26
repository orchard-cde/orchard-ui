'use client';

import MuiButton from '@mui/material/Button';
import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import type { SxProps, Theme } from '@mui/material/styles';
import typography from '@orchard-cde/design/tokens/typography';

// Shared Button per @orchard-cde/design components/button.md. A thin wrapper over
// MUI Button that maps the design-system variant/size vocabulary onto MUI props +
// theme tokens, so call sites stay in the design-system's terms.

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const MUI_VARIANT: Record<ButtonVariant, MuiButtonProps['variant']> = {
  primary: 'contained',
  secondary: 'outlined',
  ghost: 'text',
  danger: 'contained',
};

const MUI_COLOR: Record<ButtonVariant, MuiButtonProps['color']> = {
  primary: 'primary',
  secondary: 'primary',
  ghost: 'primary',
  // Semantic `error` token is not yet defined (tokens/colors.json _meta.tbd);
  // fall back to MUI's default error palette until it is.
  danger: 'error',
};

const MUI_SIZE: Record<ButtonSize, MuiButtonProps['size']> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

// Heights from the spec; font sizes consume the design tokens (font-size.sm /
// .base / .lg) so they stay in sync with @orchard-cde/design.
const fontSize = typography.typography.fontSize;
const SIZE_SX: Record<ButtonSize, SxProps<Theme>> = {
  sm: { minHeight: 32, fontSize: fontSize.sm.value },
  md: { minHeight: 40, fontSize: fontSize.base.value },
  lg: { minHeight: 48, fontSize: fontSize.lg.value },
};

// Hover and focus colors mix the primary token toward the foreground token, so
// they step darker in light mode and lighter in dark mode without a per-mode
// selector. Fixed orchard steps would stay light-tuned under data-theme="dark".
const PRIMARY_HOVER = 'color-mix(in srgb, var(--color-primary), var(--color-foreground) 15%)';
const GHOST_HOVER = 'rgb(var(--color-primary-rgb) / 0.08)';
const FOCUS_RING = 'color-mix(in srgb, var(--color-primary), var(--color-foreground) 40%)';

const BASE_SX = {
  textTransform: 'none' as const,
  '&.Mui-focusVisible': {
    outline: `2px solid ${FOCUS_RING}`,
    outlineOffset: 2,
  },
};

const VARIANT_SX: Record<ButtonVariant, SxProps<Theme>> = {
  primary: { ...BASE_SX, '&:hover': { backgroundColor: PRIMARY_HOVER } },
  ghost: { ...BASE_SX, '&:hover': { backgroundColor: GHOST_HOVER } },
  // secondary + danger keep MUI defaults
  secondary: BASE_SX,
  danger: BASE_SX,
};

export default function Button({
  variant = 'primary',
  size = 'md',
  sx,
  ...rest
}: ButtonProps) {
  return (
    <MuiButton
      variant={MUI_VARIANT[variant]}
      color={MUI_COLOR[variant]}
      size={MUI_SIZE[size]}
      sx={[
        SIZE_SX[size],
        VARIANT_SX[variant],
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    />
  );
}
