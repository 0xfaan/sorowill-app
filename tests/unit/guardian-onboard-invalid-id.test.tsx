import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GuardianOnboardingPage from '@/app/guardian/onboard/page';
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('willId=abc') }));
vi.mock('@/lib/sorowill', () => ({ getSoroWillClient: () => ({ getWill: vi.fn() }) }));
vi.mock('@/lib/freighter', () => ({ safeGetPublicKey: vi.fn().mockResolvedValue(null), truncateAddress: (value: string) => value }));
describe('guardian onboarding validation', () => { it('shows a friendly invalid ID error without fetching', async () => { render(<GuardianOnboardingPage />); expect(await screen.findByText(/invalid will id/i)).toBeInTheDocument(); }); });
