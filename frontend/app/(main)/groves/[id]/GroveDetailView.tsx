'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { listBees } from '@/lib/api/bees';
import { useGroveEvents, type BeeEvent } from '@/lib/events/useGroveEvents';
import type { GroveResponse, GroveState, ApiError, BeeResponse, BeeState } from '@/types/orchard';

const BEE_STATE_ORDER: BeeState[] = ['HATCHING', 'HIBERNATING', 'BUZZING', 'POLLINATING', 'SMOKED'];

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
  const [beeLoading, setBeeLoading] = useState(true);
  const [beeError, setBeeError] = useState<string | null>(null);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);

  // fetchGenerationRef ensures only the most recently issued fetchBees()
  // commits. pendingPatchesRef holds SSE patches recorded since the last
  // committed fetch, so a fetch that lands after a patch (even for a bee
  // not yet in its own snapshot) can overlay it instead of discarding it.
  const fetchGenerationRef = useRef(0);
  const pendingPatchesRef = useRef<Map<string, BeeState>>(new Map());

  const handleBeeEvent = useCallback((e: BeeEvent) => {
    pendingPatchesRef.current.set(e.beeId, e.newState);
    setBees((prev) =>
      prev.map((b) => (b.id === e.beeId ? { ...b, state: e.newState } : b)),
    );
  }, []);

  const { event: sseEvent, error: sseError, connecting } = useGroveEvents(groveId, {
    onBeeEvent: handleBeeEvent,
  });
  const isFlourishing = currentState === 'FLOURISHING';

  const swarmSummary = useMemo(() => {
    const byState = bees.reduce<Record<string, number>>((acc, b) => {
      acc[b.state] = (acc[b.state] ?? 0) + 1;
      return acc;
    }, {});
    const sortedByState = BEE_STATE_ORDER
      .filter((state) => byState[state] !== undefined)
      .map((state) => [state, byState[state]] as const);
    return { totalBees: bees.length, byState, sortedByState };
  }, [bees]);

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
    const requestId = ++fetchGenerationRef.current;
    setBeeLoading(true);
    setBeeError(null);
    listBees(groveId)
      .then((data) => {
        if (fetchGenerationRef.current !== requestId) return;
        const patches = pendingPatchesRef.current;
        const merged = patches.size === 0
          ? data
          : data.map((b) => (patches.has(b.id) ? { ...b, state: patches.get(b.id)! } : b));
        patches.clear();
        setBees(merged);
      })
      .catch((e: ApiError) => {
        if (fetchGenerationRef.current !== requestId) return;
        setBeeError(e.message);
      })
      .finally(() => {
        if (fetchGenerationRef.current !== requestId) return;
        setBeeLoading(false);
      });
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

      {isFlourishing && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Swarm</Typography>
          {beeError && <ErrorAlert message={beeError} />}
          {beeLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {swarmSummary.totalBees > 0 && (
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip label={`${swarmSummary.totalBees} total`} variant="outlined" />
                  {swarmSummary.sortedByState.map(([state, count]) => (
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
        </>
      )}
    </Box>
  );
}
