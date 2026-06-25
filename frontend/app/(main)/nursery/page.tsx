'use client';

import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Sprout } from 'lucide-react';
import Box from '@mui/material/Box';

export default function NurseryPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Nursery
      </Typography>
      <Card variant="outlined" sx={{ maxWidth: 480 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ color: 'text.secondary', mb: 2 }}>
            <Sprout size={64} />
          </Box>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The Nursery manages VM providers — where seedlings are grown. This
            section will be available once the nursery API is implemented.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
