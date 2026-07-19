'use client';

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Bot, Sparkles, Terminal, Code, Settings } from 'lucide-react';
import type { BeeType } from '@/types/orchard';
import { BEE_TYPE_SCHEMAS } from './BeeConfigSchema';

const ICON_MAP: Record<string, React.ReactNode> = {
  Bot: <Bot size={18} />,
  Sparkles: <Sparkles size={18} />,
  Terminal: <Terminal size={18} />,
  Code: <Code size={18} />,
  Settings: <Settings size={18} />,
};

interface BeeTypeSelectorProps {
  selectedType: BeeType | null;
  onSelect: (type: BeeType) => void;
  version: string;
  onVersionChange: (version: string) => void;
}

const ALL_TYPES: BeeType[] = ['CLAUDE_CODE', 'GEMINI', 'CODEX', 'KIRO', 'OPENCODE', 'CUSTOM'];

import FormHelperText from '@mui/material/FormHelperText';

// ...

export default function BeeTypeSelector({
  selectedType,
  onSelect,
  version,
  onVersionChange,
}: BeeTypeSelectorProps) {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>Bee Type</Typography>
      <ToggleButtonGroup
        value={selectedType}
        exclusive
        onChange={(_, value) => value && onSelect(value)}
        fullWidth
        size="small"
        sx={{ mb: 1 }}
      >
        {ALL_TYPES.map((type) => {
          const config = BEE_TYPE_SCHEMAS[type];
          return (
            <ToggleButton
              key={type}
              value={type}
              disabled={type !== 'OPENCODE'}
              title={type !== 'OPENCODE' ? `${config.label} is currently unsupported server-side` : undefined}
            >
              {ICON_MAP[config.icon]} {config.label}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
      <FormHelperText sx={{ mb: 2 }}>
        Only OpenCode is functional server-side currently. Other types are disabled.
      </FormHelperText>
      <TextField
        label="Version"
        size="small"
        fullWidth
        value={version}
        onChange={(e) => onVersionChange(e.target.value)}
        placeholder="e.g. latest"
      />
    </Box>
  );
}
