import { describe, it, expect } from 'vitest';
import { formatCheckinLabel, formatCheckinCountdown } from '@/lib/deadlines';

describe('formatCheckinLabel', () => {
  it('returns "Check-in overdue" for zero or negative seconds', () => {
    expect(formatCheckinLabel(0)).toBe('Check-in overdue');
    expect(formatCheckinLabel(-10)).toBe('Check-in overdue');
  });

  it('returns "Check-in due in under 1m" for sub-minute positive seconds', () => {
    expect(formatCheckinLabel(1)).toBe('Check-in due in under 1m');
    expect(formatCheckinLabel(59)).toBe('Check-in due in under 1m');
  });

  it('formats minutes when under an hour (>= 60s)', () => {
    expect(formatCheckinLabel(60)).toBe('Check-in due in 1m');
    expect(formatCheckinLabel(3599)).toBe('Check-in due in 59m');
  });

  it('formats hours and minutes when under a day (>= 3600s)', () => {
    expect(formatCheckinLabel(3600)).toBe('Check-in due in 1h 0m');
    expect(formatCheckinLabel(86399)).toBe('Check-in due in 23h 59m');
  });

  it('uses floor rounding for days matching countdown logic', () => {
    expect(formatCheckinLabel(86400)).toBe('Check-in due in 1 day');
    expect(formatCheckinLabel(86401)).toBe('Check-in due in 1 day');
    expect(formatCheckinLabel(172799)).toBe('Check-in due in 1 day');
    expect(formatCheckinLabel(172800)).toBe('Check-in due in 2 days');
  });
});

describe('formatCheckinCountdown', () => {
  it('formats seconds into DD:HH:MM:SS format', () => {
    expect(formatCheckinCountdown(90061)).toBe('01:01:01:01');
  });

  it('handles overdue label when overdueLabel is true and seconds <= 0', () => {
    expect(formatCheckinCountdown(0, true)).toBe('Overdue — 00:00:00:00');
  });
});
