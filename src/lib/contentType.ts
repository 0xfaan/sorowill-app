import { NextResponse } from 'next/server';

/**
 * Rejects requests whose Content-Type is not one of `allowed` with
 * 415 Unsupported Media Type. Returns `null` when the request may proceed.
 *
 * Requiring `application/json` forces browsers to send a CORS preflight for
 * cross-origin requests, so a page on another origin cannot smuggle a JSON
 * body through as a "simple" `text/plain` request (CSRF). (#398)
 */
export function rejectUnsupportedContentType(
  request: Request,
  allowed: readonly string[] = ['application/json'],
): NextResponse | null {
  const mediaType = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (allowed.includes(mediaType)) return null;

  return NextResponse.json(
    { ok: false, error: `Unsupported Content-Type; expected ${allowed.join(' or ')}` },
    { status: 415, headers: { 'Accept-Post': allowed.join(', ') } },
  );
}
