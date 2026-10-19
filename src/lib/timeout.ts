const DEFAULT_RPC_TIMEOUT_MS = 15_000;

/**
 * Per-call timeout for dashboard RPC requests. Override with
 * NEXT_PUBLIC_RPC_TIMEOUT_MS; invalid or non-positive values fall back to the default.
 */
export const RPC_TIMEOUT_MS = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_RPC_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RPC_TIMEOUT_MS;
})();

export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Races `promise` against a timer, rejecting with a TimeoutError if it does not
 * settle within `ms`. The timer is always cleared so it never outlives the call.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = RPC_TIMEOUT_MS,
  label = 'Request',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
