'use client';

import { type FormEvent } from 'react';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { TreePine } from 'lucide-react';
import { readCookie } from '@/lib/csrf';
import ThemeSwitch from './ThemeSwitch';

export const DRAWER_WIDTH = 240;

interface TopBarProps {
  cultivatorName: string;
  authenticated: boolean;
}

export default function TopBar({ cultivatorName, authenticated }: TopBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const input = event.currentTarget.elements.namedItem(
      '_csrf',
    ) as HTMLInputElement;
    input.value = readCookie('XSRF-TOKEN') ?? '';
  };

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
        <ThemeSwitch />
        <Typography variant="body2">{cultivatorName}</Typography>
        {authenticated && (
          <form method="post" action="/logout" onSubmit={handleSubmit}>
            <input type="hidden" name="_csrf" />
            <Button type="submit" color="inherit" size="small">
              Sign out
            </Button>
          </form>
        )}
      </Toolbar>
    </AppBar>
  );
}
