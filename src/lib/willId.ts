/**
 * Will IDs are assigned by the SoroWill contract as a sequential u64 counter,
 * so on-chain IDs can never collide and are never generated client-side.
 * `isValidWillId` only checks that a string has that numeric shape.
 */
export function isValidWillId(id: string): boolean {
  return /^\d+$/.test(id);
}

/**
 * Generates a random identifier for client-side-only entities (toasts, form
 * rows, etc.) — never for wills. Uses `crypto.randomUUID` (122 random bits),
 * falling back to `crypto.getRandomValues` where `randomUUID` is unavailable
 * (non-secure contexts). Collision probability is ~n²/2¹²³ for n IDs, i.e.
 * negligible; `Math.random` is avoided because it is not cryptographically
 * random and its output can repeat across seeded engines.
 */
export function generateClientId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // RFC 4122 version 4 / variant bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
