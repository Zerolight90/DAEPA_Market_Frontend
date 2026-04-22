"use client";

import { Suspense } from 'react';
import LoginPageContent from './LoginPageContent';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}