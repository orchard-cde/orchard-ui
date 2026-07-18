'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@/components/common/Button';
import BeeTypeSelector from './BeeTypeSelector';
import BeeConfigForm from './BeeConfigForm';
import { createBee } from '@/lib/api/bees';
import type { BeeType } from '@/types/orchard';

interface AttachBeeDialogProps {
  open: boolean;
  onClose: () => void;
  groveId: string;
}

export default function AttachBeeDialog({ open, onClose, groveId }: AttachBeeDialogProps) {
  const [selectedType, setSelectedType] = useState<BeeType | null>(null);
  const [version, setVersion] = useState('');
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAttach = async () => {
    if (!selectedType) return;
    setLoading(true);
    setError(null);
    try {
      await createBee(groveId, {
        beeType: selectedType,
        version: version || undefined,
        configOverrides: Object.keys(configValues).length > 0 ? configValues : undefined,
      });
      onClose();
    } catch (e) {
      setError((e as { message: string }).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedType(null);
      setVersion('');
      setConfigValues({});
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Attach Bee</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <BeeTypeSelector
            selectedType={selectedType}
            onSelect={setSelectedType}
            version={version}
            onVersionChange={setVersion}
          />
          {selectedType && (
            <BeeConfigForm
              beeType={selectedType}
              values={configValues}
              onChange={setConfigValues}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="ghost" onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleAttach}
          disabled={!selectedType || loading}
        >
          {loading ? 'Attaching…' : 'Attach'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
