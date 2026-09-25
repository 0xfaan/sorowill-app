import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

import { dispatchReminderEmails } from '@/lib/reminders';

/**
 * Constant-time comparison of the Authorization header against the expected
 * bearer token, so response timing doesn't reveal how much of CRON_SECRET
 * matched (#281). Fails closed when CRON_SECRET is unset (#177).
 */
function isAuthorized(authHeader: string | null, expectedToken: string | undefined): boolean {
  if (!expectedToken || !authHeader) return false;
  const actual = Buffer.from(authHeader);
  const expected = Buffer.from(`Bearer ${expectedToken}`);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ sent: 0, skipped: 0, errors: ['Unauthorized'] }, { status: 401 });
  }

  try {
    const result = await dispatchReminderEmails();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not dispatch reminders';
    return NextResponse.json({ sent: 0, skipped: 0, errors: [message] }, { status: 500 });
  }
}
