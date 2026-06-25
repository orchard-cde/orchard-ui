'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/common/Button';
import GroveCard from '@/components/groves/GroveCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorAlert from '@/components/common/ErrorAlert';
import { listGroves, clearGrove } from '@/lib/api/groves';
import type { GroveResponse, ApiError } from '@/types/orchard';

export default function GrovesPage() {
  const [groves, setGroves] = useState<GroveResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroves = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listGroves();
      setGroves(data);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroves();
  }, []);

  const handleDelete = async (id: string) => {
    await clearGrove(id);
    await fetchGroves();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Groves</Typography>
        <Button
          variant="primary"
          startIcon={<Plus size={18} />}
          component={Link}
          href="/groves/new"
        >
          Plant Grove
        </Button>
      </Box>

      {error && <ErrorAlert message={error} />}
      {loading && <LoadingSpinner />}

      {!loading && !error && groves.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No groves yet — plant your first grove
          </Typography>
          <Button variant="primary" component={Link} href="/groves/new">
            Plant Grove
          </Button>
        </Box>
      )}

      {!loading && groves.length > 0 && (
        <Grid container spacing={2}>
          {groves.map((grove) => (
            <Grid key={grove.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <GroveCard grove={grove} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
