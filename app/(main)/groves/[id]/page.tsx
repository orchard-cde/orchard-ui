'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';
import GroveStateStepper from '@/components/groves/GroveStateStepper';
import SshConfigBlock from '@/components/groves/SshConfigBlock';
import StatusChip from '@/components/groves/StatusChip';
import { getGrove, getSshConfig, stopGrove } from '@/lib/api/groves';
import { useGroveEvents } from '@/lib/events/useGroveEvents';
import type { GroveResponse, GroveState, ApiError } from '@/types/orchard';

export default function GroveDetailPage() {
  const params = useParams();
  const groveId = params.id as string;

  const [grove, setGrove] = useState<GroveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<GroveState>('PREPARING');
  const [sshConfig, setSshConfig] = useState<string | null>(null);
  const [sshError, setSshError] = useState<string | null>(null);
  const [sshFetched, setSshFetched] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { event: sseEvent, error: sseError, connecting } = useGroveEvents(groveId);

  useEffect(() => {
    getGrove(groveId)
      .then((data) => {
        setGrove(data);
        setCurrentState(data.state);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [groveId]);

  useEffect(() => {
    if (sseEvent) {
      setCurrentState(sseEvent.newState);
    }
  }, [sseEvent]);

  useEffect(() => {
    const ipAddress = grove?.seedling?.ipAddress;
    if (ipAddress && !sshFetched) {
      setSshFetched(true);
      getSshConfig(groveId)
        .then(setSshConfig)
        .catch((e: ApiError) => setSshError(e.message));
    }
  }, [grove?.seedling?.ipAddress, groveId, sshFetched]);

  const handleStop = async () => {
    setActionLoading(true);
    try {
      const updated = await stopGrove(groveId);
      setCurrentState(updated.state);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!grove) return null;

  const seedling = grove.seedling;
  const isFlourishing = currentState === 'FLOURISHING';

  return (
    <Box maxWidth={720}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Typography variant="h4">{grove.name}</Typography>
        <StatusChip state={currentState} />
      </Box>

      {sseError && <ErrorAlert message={sseError} />}

      <GroveStateStepper currentState={currentState} connecting={connecting} />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>Repository</Typography>
      <Typography variant="body2" gutterBottom>
        {grove.repositoryUrl}
        {grove.branch ? ` @ ${grove.branch}` : ''}
      </Typography>

      {seedling && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Resources</Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={`${seedling.cpuCores} CPU`} variant="outlined" />
            <Chip label={`${Math.round(seedling.memoryMb / 1024)} GB RAM`} variant="outlined" />
            <Chip label={`${seedling.diskGb} GB disk`} variant="outlined" />
          </Stack>
        </>
      )}

      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" gutterBottom>SSH Access</Typography>
      {sshError && <ErrorAlert message={sshError} />}
      {sshConfig ? (
        <SshConfigBlock config={sshConfig} />
      ) : (
        !sshError && (
          <Typography variant="body2" color="text.secondary">
            Not ready yet — waiting for the seedling to provision.
          </Typography>
        )
      )}

      {isFlourishing && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Actions</Typography>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleStop}
            disabled={actionLoading}
          >
            {actionLoading ? 'Stopping…' : 'Stop Grove'}
          </Button>
        </>
      )}
    </Box>
  );
}
