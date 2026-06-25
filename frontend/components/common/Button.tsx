'use client';

import MuiButton from '@mui/material/Button';
import type { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import type { SxProps, Theme } from '@mui/material/styles';
import typography from '@/lib/design/tokens/typography.json';

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
// .base / .lg) so they stay in sync with lib/design/tokens/typography.json.
const fontSize = typography.typography.fontSize;
const SIZE_SX: Record<ButtonSize, SxProps<Theme>> = {
  sm: { minHeight: 32, fontSize: fontSize.sm.value },
  md: { minHeight: 40, fontSize: fontSize.base.value },
  lg: { minHeight: 48, fontSize: fontSize.lg.value },
};

function variantSx(variant: ButtonVariant): SxProps<Theme> {
  return (theme) => {
    const base = {
      textTransform: 'none' as const,
      // focus-visible: 2px orchard-400 ring
      '&.Mui-focusVisible': {
        outline: `2px solid ${theme.palette.orchard['400']}`,
        outlineOffset: 2,
      },
    };
    switch (variant) {
      case 'primary':
        // hover orchard-700 (spec) rather than MUI's default darken
        return {
          ...base,
          '&:hover': { backgroundColor: theme.palette.orchard['700'] },
        };
      case 'ghost':
        // hover orchard-50 background
        return {
          ...base,
          '&:hover': { backgroundColor: theme.palette.orchard['50'] },
        };
      default:
        // secondary + danger keep MUI defaults
        return base;
    }
  };
}

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
        variantSx(variant),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    />
  );
}
