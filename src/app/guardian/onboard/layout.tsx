import type { Metadata } from 'next';
import type { ReactNode } from 'react';
export const metadata: Metadata = { title: 'Guardian onboarding | SoroWill', description: 'Learn your responsibilities as a SoroWill guardian.' };
export default function GuardianOnboardLayout({ children }: { children: ReactNode }) { return children; }
