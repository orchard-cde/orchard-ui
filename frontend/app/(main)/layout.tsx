'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import TopBar, { DRAWER_WIDTH } from '@/components/layout/TopBar';
import NavSidebar from '@/components/layout/NavSidebar';
import { getCurrentCultivator } from '@/lib/api/cultivator';
import { getSession, type SessionStatus } from '@/lib/api/session';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [sessionFailed, setSessionFailed] = useState(false);
  const [cultivatorName, setCultivatorName] = useState('Cultivator');

  const redirectToSignin = session?.enabled && !session.authenticated;
  const allowed = session !== null && !redirectToSignin;

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSessionFailed(true));
  }, []);

  useEffect(() => {
    if (redirectToSignin) {
      router.replace('/signin');
    }
  }, [redirectToSignin, router]);

  useEffect(() => {
    if (!allowed) return;
    getCurrentCultivator()
      .then((c) => setCultivatorName(c.displayName || c.username))
      .catch(() => {
        // Fallback to "Cultivator" — do NOT redirect on layout /api/me failure
      });
  }, [allowed]);

  if (sessionFailed) {
    return <Alert severity="error">Unable to reach the orchard-ui backend.</Alert>;
  }

  if (!allowed) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <TopBar
        cultivatorName={cultivatorName}
        authenticated={session.authenticated}
      />
      <NavSidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, ml: `${DRAWER_WIDTH}px` }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
