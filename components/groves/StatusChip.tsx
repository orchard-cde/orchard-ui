'use client';

import Chip from '@mui/material/Chip';
import type { GroveState } from '@/types/orchard';

interface StatusChipProps {
  state: GroveState;
}

const STATE_CONFIG: Record<
  GroveState,
  { label: string; color: 'primary' | 'success' | 'error' }
> = {
  PREPARING: { label: 'Preparing', color: 'primary' },
  PLANTING: { label: 'Planting', color: 'primary' },
  GROWING: { label: 'Growing', color: 'primary' },
  FLOURISHING: { label: 'Flourishing', color: 'success' },
  BLIGHTED: { label: 'Blighted', color: 'error' },
};

export default function StatusChip({ state }: StatusChipProps) {
  const config = STATE_CONFIG[state] ?? { label: state, color: 'primary' };
  return <Chip label={config.label} color={config.color} size="small" />;
}
