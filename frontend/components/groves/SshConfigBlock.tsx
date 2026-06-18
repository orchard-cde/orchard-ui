'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

interface SshConfigBlockProps {
  config: string;
}

export default function SshConfigBlock({ config }: SshConfigBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2">SSH Config</Typography>
        <Button
          size="small"
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={handleCopy}
          color={copied ? 'success' : 'primary'}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </Box>
      <Paper
        variant="outlined"
        component="pre"
        sx={{
          p: 2,
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          overflow: 'auto',
          whiteSpace: 'pre',
          m: 0,
        }}
      >
        {config}
      </Paper>
    </Box>
  );
}
