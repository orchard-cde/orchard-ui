'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ErrorAlert from '@/components/common/ErrorAlert';
import { plantGrove } from '@/lib/api/groves';
import type { ApiError } from '@/types/orchard';

export default function PlantGrovePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const grove = await plantGrove({
        name,
        repositoryUrl,
        ...(branch ? { branch } : {}),
      });
      router.push(`/groves/${grove.id}`);
    } catch (e) {
      setError((e as ApiError).message);
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth={560}>
      <Typography variant="h4" gutterBottom>
        Plant a Grove
      </Typography>
      {error && <ErrorAlert message={error} />}
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            disabled={submitting}
          />
          <TextField
            label="Repository URL"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            required
            fullWidth
            disabled={submitting}
            placeholder="https://github.com/org/repo"
          />
          <TextField
            label="Branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            fullWidth
            disabled={submitting}
            placeholder="main (leave blank for repo default)"
          />
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !name || !repositoryUrl}
            size="large"
          >
            {submitting ? 'Planting…' : 'Plant Grove'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
