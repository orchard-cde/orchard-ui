'use client';

import { useState } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Plus, Trash2 } from 'lucide-react';
import type { BeeType } from '@/types/orchard';
import { BEE_TYPE_SCHEMAS } from './BeeConfigSchema';

interface BeeConfigFormProps {
  beeType: BeeType;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export default function BeeConfigForm({ beeType, values, onChange }: BeeConfigFormProps) {
  const schema = BEE_TYPE_SCHEMAS[beeType];
  const [kvPairs, setKvPairs] = useState<Array<{ key: string; value: string }>>([]);

  if (beeType === 'CUSTOM') {
    const handleAddPair = () => {
      const newPairs = [...kvPairs, { key: '', value: '' }];
      setKvPairs(newPairs);
      onChange(Object.fromEntries(newPairs.map((p) => [p.key, p.value])));
    };

    const handleRemovePair = (index: number) => {
      const newPairs = kvPairs.filter((_, i) => i !== index);
      setKvPairs(newPairs);
      onChange(Object.fromEntries(newPairs.map((p) => [p.key, p.value])));
    };

    const handlePairChange = (index: number, field: 'key' | 'value', val: string) => {
      const newPairs = [...kvPairs];
      newPairs[index] = { ...newPairs[index], [field]: val };
      setKvPairs(newPairs);
      onChange(Object.fromEntries(newPairs.map((p) => [p.key, p.value])));
    };

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>Configuration</Typography>
        <Stack spacing={1}>
          {kvPairs.map((pair, index) => (
            <Stack direction="row" spacing={1} key={index}>
              <TextField
                label="Key"
                size="small"
                value={pair.key}
                onChange={(e) => handlePairChange(index, 'key', e.target.value)}
              />
              <TextField
                label="Value"
                size="small"
                value={pair.value}
                onChange={(e) => handlePairChange(index, 'value', e.target.value)}
              />
              <IconButton onClick={() => handleRemovePair(index)} aria-label="remove field">
                <Trash2 size={18} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button
          startIcon={<Plus size={16} />}
          onClick={handleAddPair}
          sx={{ mt: 1 }}
          size="small"
        >
          Add field
        </Button>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {schema.fields.map((field) => {
        if (field.type === 'select') {
          return (
            <TextField
              key={field.key}
              label={field.label}
              select
              size="small"
              value={values[field.key] ?? field.defaultValue ?? ''}
              onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
            >
              {field.options?.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
          );
        }

        if (field.type === 'textarea') {
          return (
            <TextField
              key={field.key}
              label={field.label}
              multiline
              minRows={3}
              size="small"
              value={values[field.key] ?? ''}
              onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
            />
          );
        }

        return (
          <TextField
            key={field.key}
            label={field.label}
            type={field.type === 'number' ? 'number' : 'text'}
            size="small"
            value={values[field.key] ?? ''}
            onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
          />
        );
      })}
    </Stack>
  );
}
