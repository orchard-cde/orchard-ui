'use client';

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import StatusChip from './StatusChip';
import type { GroveResponse } from '@/types/orchard';

interface GroveCardProps {
  grove: GroveResponse;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString();
}

export default function GroveCard({ grove, onDelete }: GroveCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await onDelete(grove.id);
    } finally {
      setDeleting(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="div" gutterBottom>
            {grove.name}
          </Typography>
          <StatusChip state={grove.state} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {grove.repositoryUrl}
            {grove.branch ? ` @ ${grove.branch}` : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Last accessed: {formatDate(grove.lastAccessedAt)}
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Button size="small" component={Link} href={`/groves/${grove.id}`}>
            Open
          </Button>
          <IconButton
            size="small"
            color="error"
            onClick={() => setDialogOpen(true)}
            aria-label="delete grove"
          >
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Delete Grove</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{grove.name}</strong>? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
