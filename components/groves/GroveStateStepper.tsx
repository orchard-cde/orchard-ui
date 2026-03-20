'use client';

import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { GroveState } from '@/types/orchard';

const STEPS = ['Preparing', 'Planting', 'Growing', 'Flourishing'];

const STATE_STEP: Partial<Record<GroveState, number>> = {
  PREPARING: 0,
  PLANTING: 1,
  GROWING: 2,
  FLOURISHING: 3,
  DORMANT: 3,
};

interface GroveStateStepperProps {
  currentState: GroveState;
  connecting: boolean;
}

export default function GroveStateStepper({
  currentState,
  connecting,
}: GroveStateStepperProps) {
  const isBlighted = currentState === 'BLIGHTED';
  const activeStep = isBlighted ? 2 : (STATE_STEP[currentState] ?? 0);

  return (
    <Box>
      {isBlighted && (
        <Alert severity="error" sx={{ mb: 2 }}>
          This grove has been blighted. Delete it and plant a new one to recover.
        </Alert>
      )}
      <Stepper
        activeStep={activeStep}
        sx={isBlighted ? { filter: 'grayscale(0.5)', opacity: 0.7 } : undefined}
      >
        {STEPS.map((label, index) => (
          <Step
            key={label}
            completed={!isBlighted && activeStep > index}
          >
            <StepLabel
              error={isBlighted && index === activeStep}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      {connecting && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Connecting…
        </Typography>
      )}
    </Box>
  );
}
