'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import EcoIcon from '@mui/icons-material/Eco';

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
        <EcoIcon />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Canopy
        </Typography>
        <Typography variant="body2">{cultivatorName}</Typography>
      </Toolbar>
    </AppBar>
  );
}
