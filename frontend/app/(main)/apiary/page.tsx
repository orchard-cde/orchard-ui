'use client';

import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Hexagon } from 'lucide-react';
import Box from '@mui/material/Box';

export default function ApiaryPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Apiary
      </Typography>
      <Card variant="outlined" sx={{ maxWidth: 480 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ color: 'text.secondary', mb: 2 }}>
            <Hexagon size={64} />
          </Box>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The Apiary manages bee adapters and their configuration. This
            section will be available once the apiary API is implemented.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
