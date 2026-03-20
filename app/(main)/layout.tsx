'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import TopBar, { DRAWER_WIDTH } from '@/components/layout/TopBar';
import NavSidebar from '@/components/layout/NavSidebar';
import { getCurrentCultivator } from '@/lib/api/cultivator';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cultivatorName, setCultivatorName] = useState('Cultivator');

  useEffect(() => {
    getCurrentCultivator()
      .then((c) => setCultivatorName(c.name))
      .catch(() => {
        // Fallback to "Cultivator" — do NOT redirect on layout /api/me failure
      });
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <TopBar cultivatorName={cultivatorName} />
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
