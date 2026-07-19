'use client';

import Chip from '@mui/material/Chip';
import type { BeeState } from '@/types/orchard';

interface BeeStatusChipProps {
  state: BeeState;
}

const STATE_CONFIG: Record<
  BeeState,
  { label: string; color: 'default' | 'primary' | 'success' | 'error' }
> = {
  HATCHING: { label: 'Hatching', color: 'primary' },
  HIBERNATING: { label: 'Hibernating', color: 'default' },
  BUZZING: { label: 'Buzzing', color: 'success' },
  POLLINATING: { label: 'Pollinating', color: 'success' },
  SMOKED: { label: 'Smoked', color: 'error' },
};

export default function BeeStatusChip({ state }: BeeStatusChipProps) {
  const config = STATE_CONFIG[state] ?? { label: state, color: 'primary' };
  return <Chip label={config.label} color={config.color} size="small" />;
}
