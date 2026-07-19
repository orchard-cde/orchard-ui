'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { Plus } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';
import CommonButton from '@/components/common/Button';
import BeeCard from '@/components/bees/BeeCard';
import AttachBeeDialog from '@/components/bees/AttachBeeDialog';
import GroveStateStepper from '@/components/groves/GroveStateStepper';
import SshConfigBlock from '@/components/groves/SshConfigBlock';
import StatusChip from '@/components/groves/StatusChip';
import { getGrove, getSshConfig, stopGrove } from '@/lib/api/groves';
import { listBees, getSwarmStatus } from '@/lib/api/bees';
import { useGroveEvents } from '@/lib/events/useGroveEvents';
import type { GroveResponse, GroveState, ApiError, BeeResponse, SwarmStatusResponse } from '@/types/orchard';

export default function GroveDetailView() {
  // In a Next.js static export, the [id] dynamic route is emitted only as the
  // "_" placeholder, so useParams().id resolves to "_" rather than the real
  // segment. Read the id from the live pathname instead so deep links and the
  // "Open" navigation resolve the actual grove id.
  const pathname = usePathname();
  const groveId = pathname.split('/').filter(Boolean).pop() ?? '';

  const [grove, setGrove] = useState<GroveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<GroveState>('PREPARING');
  const [sshConfig, setSshConfig] = useState<string | null>(null);
  const [sshError, setSshError] = useState<string | null>(null);
  const [sshFetched, setSshFetched] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [bees, setBees] = useState<BeeResponse[]>([]);
  const [swarmStatus, setSwarmStatus] = useState<SwarmStatusResponse | null>(null);
  const [beeLoading, setBeeLoading] = useState(false);
  const [beeError, setBeeError] = useState<string | null>(null);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);

  const { event: sseEvent, error: sseError, connecting } = useGroveEvents(groveId);
  const isFlourishing = currentState === 'FLOURISHING';

  useEffect(() => {
    getGrove(groveId)
      .then((data) => {
        setGrove(data);
        setCurrentState(data.state);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [groveId]);

  const fetchBees = () => {
    setBeeLoading(true);
    setBeeError(null);
    Promise.all([listBees(groveId), getSwarmStatus(groveId)])
      .then(([beeList, status]) => {
        setBees(beeList);
        setSwarmStatus(status);
      })
      .catch((e: ApiError) => setBeeError(e.message))
      .finally(() => setBeeLoading(false));
  };

  useEffect(() => {
    if (sseEvent) {
      setCurrentState(sseEvent.newState);
      setActionLoading(false);
    }
  }, [sseEvent]);

  useEffect(() => {
    if (isFlourishing) {
      fetchBees();
    }
  }, [groveId, isFlourishing]);

  useEffect(() => {
    if (!actionLoading) return;
    const timer = setTimeout(() => {
      setActionLoading(false);
    }, 30000);
    return () => clearTimeout(timer);
  }, [actionLoading]);

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
    setActionError(null);
    try {
      await stopGrove(groveId);
    } catch (e) {
      setActionError((e as ApiError).message);
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!grove) return null;

  const seedling = grove.seedling;

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
          {actionError && <ErrorAlert message={actionError} />}
          <CommonButton
            variant="danger"
            size="sm"
            onClick={handleStop}
            disabled={actionLoading}
          >
            {actionLoading ? 'Stopping…' : 'Stop Grove'}
          </CommonButton>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Swarm</Typography>
          {beeError && <ErrorAlert message={beeError} />}
          {beeLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {swarmStatus && swarmStatus.totalBees > 0 && (
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip label={`${swarmStatus.totalBees} total`} variant="outlined" />
                  {Object.entries(swarmStatus.byState).map(([state, count]) => (
                    <Chip key={state} label={`${count} ${state.toLowerCase()}`} variant="outlined" />
                  ))}
                </Stack>
              )}
              {bees.length > 0 ? (
                <Grid container spacing={2}>
                  {bees.map((bee) => (
                    <Grid size={{ xs: 12, md: 6 }} key={bee.id}>
                      <BeeCard bee={bee} onAction={fetchBees} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                !beeError && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No bees attached. Click Attach Bee to get started.
                  </Typography>
                )
              )}
              <CommonButton
                variant="primary"
                size="sm"
                startIcon={<Plus size={16} />}
                onClick={() => setAttachDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Attach Bee
              </CommonButton>
            </>
          )}
          <AttachBeeDialog
            open={attachDialogOpen}
            onClose={() => {
              setAttachDialogOpen(false);
              fetchBees();
            }}
            groveId={groveId}
          />
        </>
      )}
    </Box>
  );
}
