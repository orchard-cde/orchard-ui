'use client';

import { Suspense } from 'react';
import SignInView from './SignInView';

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInView />
    </Suspense>
  );
}
