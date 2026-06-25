'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { TreePine } from 'lucide-react';

export const DRAWER_WIDTH = 240;

interface TopBarProps {
  cultivatorName: string;
}

export default function TopBar({ cultivatorName }: TopBarProps) {
  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <TreePine />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Canopy
        </Typography>
        <Typography variant="body2">{cultivatorName}</Typography>
      </Toolbar>
    </AppBar>
  );
}
