'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { getSession, type SessionStatus } from '@/lib/api/session';

const NO_AUTH: SessionStatus = { enabled: false, authenticated: false };

export default function SignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionStatus | null>(null);

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession(NO_AUTH));
  }, []);

  useEffect(() => {
    if (session?.authenticated) {
      router.replace('/');
    }
  }, [session, router]);

  if (session === null || session.authenticated) {
    return null;
  }

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
      <Typography variant="h4">
        {session.enabled ? 'Sign in' : 'Not Authenticated'}
      </Typography>
      {session.enabled ? (
        <>
          {searchParams.has('error') && (
            <Alert severity="error" sx={{ maxWidth: 480 }}>
              Sign-in failed. Please try again.
            </Alert>
          )}
          <Button variant="contained" component="a" href="/oauth2/authorization/fence">
            Sign in
          </Button>
        </>
      ) : (
        <Alert severity="info" sx={{ maxWidth: 480 }}>
          <Typography variant="body2">
            Browser sign-in is not available yet. For local development, start
            the dev server with <code>trowel dev-server start --no-auth</code>.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
