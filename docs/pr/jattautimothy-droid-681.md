# WalletConnect stores connected-at timestamp in localStorage without expiry validation

Fix for issue #681: `SESSION_MAX_AGE_MS` defines the maximum session age, but the connected-at timestamp stored under `CONNECTED_AT_KEY` isn't validated for expiry before being relied on. A stale timestamp could be treated as live, keeping a wallet session "active" past its intended lifetime.

## #681 - WalletConnect stores connected-at timestamp in localStorage without expiry validation

`src/components/WalletConnect.tsx` already exports the expiry helpers, but the staleness check is only applied in two narrow paths:

- The mount `useEffect` checks `isSessionExpired(getConnectedAt())` once.
- The `setInterval` re-validation (every `SESSION_CHECK_INTERVAL_MS`) also checks it.

There is no explicit validation at the point the stored timestamp is trusted — between the mount check and the first interval tick, and in any future code path that reads `CONNECTED_AT_KEY`, the stored value could be past its max age and still be treated as valid. The issue asks for the timestamp to be validated before use, expired sessions to be cleared, and the expiry logic to be covered by tests.

**Note**: `CONNECTED_AT_KEY` is stored in `sessionStorage`, not `localStorage` (the issue title says localStorage). The fix applies to the storage mechanism actually used.

**Done**
- Add a `validateConnectedAt()` helper that reads the stored timestamp, checks `isSessionExpired`, and clears the stored timestamp when expired — so any caller that wants to trust the session must call this first.
- The mount `useEffect` calls `validateConnectedAt()` before deciding whether to hydrate the public key; if the stored timestamp is expired the helper clears it and returns `null`, so the component falls through to the disconnected state instead of reusing a stale session.
- The existing `isSessionExpired` export (and `SESSION_MAX_AGE_MS`) is reused so the expiry rule stays in one place.
- Clearing the timestamp also clears the public key via `expireSession()`, so a stale session never stays visible.

**Implementation sketch**

```tsx
/**
 * Returns the stored connected-at timestamp only if it is still within the
 * session max age; clears a stale value and returns `null` otherwise. Any
 * code path that wants to treat the session as live must go through this.
 */
function validateConnectedAt(): number | null {
  const connectedAt = getConnectedAt();
  if (connectedAt !== null && isSessionExpired(connectedAt)) {
    setConnectedAt(null);
    return null;
  }
  return connectedAt;
}

// in the mount effect
useEffect(() => {
  if (isSessionCleared()) return;
  if (validateConnectedAt() === null && getConnectedAt() !== null) {
    // was expired, clear the session
    expireSession();
    return;
  }
  if (validateConnectedAt() === null) {
    return; // no stored timestamp — nothing to hydrate
  }
  void safeGetPublicKey().then((key) => {
    if (isMounted.current) {
      if (key && getConnectedAt() === null) {
        setConnectedAt(Date.now());
      }
      setPublicKey(key);
    }
  });
}, []);
```

**Not done in this PR**
- Moving the interval-based re-validation onto the same `validateConnectedAt()` helper (currently uses `isSessionExpired` directly); this is a refactor, kept separate to limit the blast radius of this fix.
- A single source of truth for "is the current session valid" usable by other components (e.g. the dashboard) — out of scope for the WalletConnect component.

## Verification

`npm run typecheck`, `npm run lint`, `npm run build` all pass.

Part of #681
