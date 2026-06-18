'use client';

import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import YardIcon from '@mui/icons-material/Yard';
import Box from '@mui/material/Box';

export default function NurseryPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Nursery
      </Typography>
      <Card variant="outlined" sx={{ maxWidth: 480 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <YardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
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
