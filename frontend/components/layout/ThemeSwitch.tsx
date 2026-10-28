'use client';

import { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Check, Monitor, Moon, Sun, SunMoon, type LucideIcon } from 'lucide-react';
import {
  getPreference,
  set,
  type ThemePreference,
} from '@orchard-cde/design/theme';

const OPTIONS: { value: ThemePreference; label: string; Icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export default function ThemeSwitch() {
  const [preference, setPreference] = useState<ThemePreference | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  // Read after mount: the static export has no stored preference, so the
  // server-rendered button must not depend on one.
  useEffect(() => setPreference(getPreference()), []);

  const current = OPTIONS.find((option) => option.value === preference);
  const ButtonIcon = current?.Icon ?? SunMoon;

  const choose = (value: ThemePreference) => {
    set(value);
    setPreference(value);
    setAnchor(null);
  };

  return (
    <>
      <IconButton
        color="inherit"
        aria-label={current ? `Theme: ${current.label}` : 'Theme'}
        aria-haspopup="menu"
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <ButtonIcon size={20} />
      </IconButton>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {OPTIONS.map(({ value, label }) => (
          <MenuItem
            key={value}
            role="menuitemradio"
            aria-checked={value === preference}
            onClick={() => choose(value)}
          >
            <ListItemIcon>{value === preference && <Check size={18} />}</ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
