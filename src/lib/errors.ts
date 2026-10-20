/**
 * Shared check for whether an error message indicates the will does not
 * exist on chain (contract-level "will not found" / "WillNotFound", error
 * code #1). Used by every call site that needs to classify a "will not
 * found" condition so they stay consistent with one another.
 */
export function isWillNotFoundMessage(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes('not found') ||
    msg.includes('willnotfound') ||
    msg.includes('no such will') ||
    msg.includes('does not exist') ||
    msg.includes('error(contract, #1)')
  );
}

export function isWillNotFoundError(error: unknown): boolean {
  return error instanceof Error && isWillNotFoundMessage(error.message);
}

const KNOWN_ERROR_PATTERNS: ReadonlyArray<{
  test: (message: string) => boolean;
  friendly: string;
}> = [
  // More specific patterns must come first so they are not masked by
  // broader patterns (e.g. "contract not found on the network" contains
  // "network", so it must be matched before the generic network pattern).
  {
    test: (message) =>
      message.toLowerCase().includes('contract') &&
      message.toLowerCase().includes('not found'),
    friendly: 'The smart contract could not be found on the network.',
  },
  {
    test: (message) => isWillNotFoundMessage(message),
    friendly: 'This will was not found on the blockchain.',
  },
  {
    test: (message) =>
      message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch'),
    friendly:
      'Unable to reach the blockchain network. Please check your connection and try again.',
  },
  {
    test: (message) => message.toLowerCase().includes('simulation'),
    friendly:
      'The transaction simulation failed. The will may no longer be in a state that allows this action.',
  },
  {
    test: (message) =>
      message.toLowerCase().includes('insufficient') ||
      message.toLowerCase().includes('balance'),
    friendly: 'There are not enough funds to complete this operation.',
  },
  {
    test: (message) => message.toLowerCase().includes('already voted'),
    friendly: "You've already cast a vote on this will.",
  },
  {
    test: (message) =>
      message.toLowerCase().includes('not a guardian') ||
      message.toLowerCase().includes('not guardian'),
    friendly:
      'You are not eligible to perform this action on this will.',
  },
  {
    test: (message) => message.toLowerCase().includes('unauthorized'),
    friendly:
      'You do not have permission to perform this action.',
  },
];

/**
 * Extracts a plain string message from any thrown value.
 *
 * The SDK (and the underlying Stellar RPC layer) does not guarantee that
 * thrown values are `Error` instances — it may throw plain objects
 * (`{ message: '...' }`), strings, or even `null`. This helper normalises
 * all of those shapes so the rest of `formatError` can work against a
 * single string.
 */
function extractMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return '';
}

/**
 * The four distinct failure modes when fetching a will for cloning.
 *
 * - `not_found`  — The will no longer exists on chain (deleted / archived).
 * - `permission` — The caller is not authorised to read this will.
 * - `network`    — RPC / connectivity failure; the caller can retry.
 * - `unknown`    — Any other error.
 */
export type CloneErrorKind = 'not_found' | 'permission' | 'network' | 'unknown';

/**
 * Classifies a thrown value from `getWill()` into one of the four
 * `CloneErrorKind` buckets so the UI can show a targeted message.
 *
 * Resolution order (most-specific first):
 *   1. not_found  — contract reports the will does not exist
 *   2. permission — contract reports the caller is unauthorized
 *   3. network    — RPC or fetch-level connectivity error
 *   4. unknown    — everything else
 */
export function classifyCloneError(error: unknown): CloneErrorKind {
  const message = extractMessage(error).toLowerCase();

  if (
    message.includes('not found') ||
    message.includes('willnotfound') ||
    message.includes('no such will') ||
    message.includes('does not exist') ||
    message.includes('error(contract, #1)')
  ) {
    return 'not_found';
  }

  if (
    message.includes('unauthorized') ||
    message.includes('permission') ||
    message.includes('access denied') ||
    message.includes('forbidden') ||
    message.includes('not allowed')
  ) {
    return 'permission';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'network';
  }

  return 'unknown';
}

export function formatError(error: unknown): string {
  const message = extractMessage(error);

  // Log the full error for debugging — never expose raw objects to the UI.
  if (typeof console !== 'undefined') {
    console.error('[SoroWill] SDK/RPC error:', error);
  }

  for (const pattern of KNOWN_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return pattern.friendly;
    }
  }

  return 'Something went wrong. Please try again later.';
}

/** Safe copy for initial page data loads; never exposes SDK/RPC details. */
export function formatLoadError(error: unknown): string {
  if (error instanceof Error && /permission|unauthoriz|forbidden/i.test(error.message)) return 'You do not have permission to view this will.';
  return 'Could not load will — check your connection.';
}
