'use client';

import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import type { BeeState } from '@/types/orchard';

const STEPS = ['Hatching', 'Hibernating', 'Buzzing', 'Pollinating'];

const STATE_STEP: Partial<Record<BeeState, number>> = {
  HATCHING: 0,
  HIBERNATING: 1,
  BUZZING: 2,
  POLLINATING: 3,
};

interface BeeStateStepperProps {
  currentState: BeeState;
}

export default function BeeStateStepper({ currentState }: BeeStateStepperProps) {
  const isSmoked = currentState === 'SMOKED';
  const activeStep = isSmoked ? 1 : (STATE_STEP[currentState] ?? 0);

  return (
    <Box>
      {isSmoked && (
        <Alert severity="error" sx={{ mb: 2 }}>
          This bee has been smoked. Remove it or wake it to recover.
        </Alert>
      )}
      <Stepper
        activeStep={activeStep}
        sx={isSmoked ? { filter: 'grayscale(0.5)', opacity: 0.7 } : undefined}
      >
        {STEPS.map((label, index) => (
          <Step
            key={label}
            completed={!isSmoked && activeStep > index}
          >
            <StepLabel
              error={isSmoked && index === activeStep}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
