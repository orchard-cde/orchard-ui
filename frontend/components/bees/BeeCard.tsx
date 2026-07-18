'use client';

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Stack from '@mui/material/Stack';
import { Bot, Sparkles, Terminal, Code, Settings } from 'lucide-react';
import Button from '@/components/common/Button';
import BeeStateStepper from './BeeStateStepper';
import BeeStatusChip from './BeeStatusChip';
import { wakeBee, smokeBee, removeBee } from '@/lib/api/bees';
import type { BeeResponse, BeeType } from '@/types/orchard';

const ICON_MAP: Record<BeeType, React.ReactNode> = {
  CLAUDE_CODE: <Bot size={18} />,
  GEMINI: <Sparkles size={18} />,
  CODEX: <Terminal size={18} />,
  KIRO: <Code size={18} />,
  OPENCODE: <Terminal size={18} />,
  CUSTOM: <Settings size={18} />,
};

const TYPE_LABELS: Record<BeeType, string> = {
  CLAUDE_CODE: 'Claude Code',
  GEMINI: 'Gemini CLI',
  CODEX: 'Codex',
  KIRO: 'Kiro CLI',
  OPENCODE: 'OpenCode',
  CUSTOM: 'Custom',
};

interface BeeCardProps {
  bee: BeeResponse;
  onAction: () => void;
}

export default function BeeCard({ bee, onAction }: BeeCardProps) {
  const [confirmAction, setConfirmAction] = useState<'smoke' | 'remove' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canWake = bee.state === 'HIBERNATING' || bee.state === 'SMOKED';
  const canSmoke = bee.state === 'BUZZING' || bee.state === 'POLLINATING';
  const canRemove = bee.state === 'SMOKED' || bee.state === 'HIBERNATING';

  const handleAction = async (action: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      onAction();
    } catch (e) {
      setError((e as { message: string }).message);
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleWake = () => handleAction(() => wakeBee(bee.groveId, bee.id));
  const handleSmoke = () => handleAction(() => smokeBee(bee.groveId, bee.id));
  const handleRemove = () => handleAction(() => removeBee(bee.groveId, bee.id));

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            {ICON_MAP[bee.type]}
            <Typography variant="subtitle1">{TYPE_LABELS[bee.type]}</Typography>
            <BeeStatusChip state={bee.state} />
          </Box>
          <BeeStateStepper currentState={bee.state} />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Hatched {new Date(bee.hatchedAt).toLocaleString()}
          </Typography>
          {bee.startedAt && (
            <Typography variant="caption" color="text.secondary" display="block">
              Started {new Date(bee.startedAt).toLocaleString()}
            </Typography>
          )}
        </CardContent>
        <CardActions>
          {canWake && (
            <Button variant="ghost" size="sm" onClick={handleWake} disabled={loading}>
              Wake
            </Button>
          )}
          {canSmoke && (
            <Button variant="danger" size="sm" onClick={() => setConfirmAction('smoke')} disabled={loading}>
              Stop
            </Button>
          )}
          {canRemove && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmAction('remove')} disabled={loading}>
              Remove
            </Button>
          )}
        </CardActions>
      </Card>

      <Dialog open={confirmAction !== null} onClose={() => setConfirmAction(null)}>
        <DialogTitle>{confirmAction === 'smoke' ? 'Stop Bee' : 'Remove Bee'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'smoke'
              ? 'This will stop the bee. You can wake it later.'
              : 'This will permanently remove the bee.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="ghost" onClick={() => setConfirmAction(null)} disabled={loading}>Cancel</Button>
          <Button
            variant={confirmAction === 'smoke' ? 'danger' : 'danger'}
            onClick={confirmAction === 'smoke' ? handleSmoke : handleRemove}
            disabled={loading}
          >
            {loading ? 'Working…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
