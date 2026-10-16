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
          Browser sign-in is not available yet. For local development, start
          the dev server with <code>trowel dev-server start --no-auth</code>.
        </Typography>
      </Alert>
    </Box>
  );
}
