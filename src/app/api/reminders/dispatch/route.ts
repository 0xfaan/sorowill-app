import { NextResponse } from 'next/server';

import { dispatchReminderEmails } from '@/lib/reminders';

// #336 — Set an explicit Vercel function timeout so large subscription stores
// are not cut off mid-run by the platform default (10 s on Hobby, 60 s on Pro).
// 300 s is the maximum allowed on Vercel Pro / Enterprise.  Adjust downward if
// your plan limit is lower, but keep it well above the expected worst-case
// dispatch wall-clock time (num_subscriptions / BATCH_SIZE * avg_batch_ms).
export const maxDuration = 300;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
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
