import { NextResponse } from 'next/server';

import { dispatchReminderEmails } from '@/lib/reminders';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  // Fail closed: if CRON_SECRET is not configured, reject the request rather
  // than skipping the auth check and exposing the endpoint publicly.
  if (!expectedToken) {
    return NextResponse.json(
      { sent: 0, skipped: 0, errors: ['Server misconfigured: CRON_SECRET is not set'] },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
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
