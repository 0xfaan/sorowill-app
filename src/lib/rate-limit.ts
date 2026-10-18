/**
 * Minimal fixed-window, in-memory rate limiter keyed by an arbitrary string
 * (e.g. client IP). State is per server instance; it bounds abuse from a
 * single client but is not a substitute for edge/WAF rate limiting.
 */
interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Builds a collision-safe rate-limit key from multiple parts.
 *
 * Naive concatenation (e.g. `parts.join(':')`) is unsafe: if a part itself
 * contains the separator, distinct inputs can produce the same key. For
 * example, with `':'` as separator, `['reminders', 'register', '127.0.0.1']`
 * and `['reminders', 'register:127.0.0.1']` both yield
 * `'reminders:register:127.0.0.1'`. IPv6 addresses contain colons, so this is
 * a realistic collision.
 *
 * Approach chosen: length-prefixed encoding. Each part is encoded as
 * `<length>:<value>` and the parts are concatenated. Because the length is
 * unambiguous, no part's content can ever be confused with a separator or
 * with another part's boundary, regardless of what characters it contains.
 * This is deterministic, human-debuggable, and avoids the overhead of
 * JSON.stringify while being equally collision-safe.
 *
 * Alternatives considered:
 *  - JSON.stringify(parts): collision-safe and simple, but produces noisier
 *    keys and is slightly slower; length-prefixing is equivalent in safety
 *    with less overhead.
 *  - Validating that a separator is absent from parts and throwing: brittle,
 *    since callers cannot always control part contents (e.g. client IPs), and
 *    would turn a rate-limit check into a runtime error.
 *  - Escaping the separator within parts: requires careful, error-prone
 *    escape/unescape logic; length-prefixing sidesteps it entirely.
 */
export function buildRateLimitKey(...parts: string[]): string {
  return parts.map((part) => `${part.length}:${part}`).join('|');
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  let entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    // Drop expired entries opportunistically so the map cannot grow unbounded.
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    entry = { count: 0, resetAt: now + windowMs };
    windows.set(key, entry);
  }
  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim();
  return ip || 'unknown';
}

export function resetRateLimits(): void {
  windows.clear();
}