'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

export default function UnauthorizedPage() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
      p={4}
    >
      <Typography variant="h4">Not Authenticated</Typography>
      <Alert severity="info" sx={{ maxWidth: 480 }}>
        <Typography variant="body2">
          You are not authenticated. In dev mode, set your cultivator ID in{' '}
          <code>localStorage</code> under the key{' '}
          <code>orchard_cultivator_id</code>, or set{' '}
          <code>NEXT_PUBLIC_CULTIVATOR_ID</code> in your{' '}
          <code>.env.local</code> file.
        </Typography>
      </Alert>
    </Box>
  );
}
