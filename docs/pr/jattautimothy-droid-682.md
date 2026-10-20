# BeneficiaryForm address input allows very long strings without length check

Fix for issue #682: the address `<input>` in `BeneficiaryForm` has no `maxLength` attribute and no length validation, so a user (or script) can paste an arbitrarily long string. The UI renders it without complaint, wastes memory holding the excess characters, and sends the oversized value to the contract layer where it will be rejected anyway.

## #682 - BeneficiaryForm address input allows very long strings without length check

`src/components/BeneficiaryForm.tsx` renders address inputs without constraining their length:

```tsx
// src/components/BeneficiaryForm.tsx — current behaviour
<input
  type="text"
  value={beneficiary.address}
  onChange={(e) => handleAddressChange(i, e.target.value)}
  placeholder="Stellar address or federated address"
  // no maxLength, no length validation
/>
```

A valid Stellar address (`G...`) is exactly 56 characters. A federated address (`*example.com`) is typically under 100 characters. Anything beyond 100 characters is never a valid input and should be rejected immediately with a user-visible error rather than silently stored in state and shipped to the contract.

**Done**
- Add `maxLength={100}` to the address `<input>` element so the browser natively prevents pasting beyond that limit.
- Extend `getAddressErrors` to include an explicit length check: if `address.length > 100` return `'Address must be 100 characters or fewer'`. The hard browser limit and the validation message are kept in sync via a shared `ADDRESS_MAX_LENGTH = 100` constant.
- The existing `isValidStellarAddress` regex (`/^G[0-9A-Z]{55}$/`) already rejects any address over 56 characters for raw Stellar addresses, but the explicit length check runs first and gives a clearer error message for clearly oversized values.

**Implementation sketch**

```tsx
// shared constant keeps input attribute and validation in sync
const ADDRESS_MAX_LENGTH = 100;

// in getAddressErrors
if (b.address.length > ADDRESS_MAX_LENGTH) {
  errors[i] = `Address must be ${ADDRESS_MAX_LENGTH} characters or fewer`;
  return; // skip further checks
}

// in the JSX
<input
  type="text"
  maxLength={ADDRESS_MAX_LENGTH}
  value={beneficiary.address}
  onChange={(e) => handleAddressChange(i, e.target.value)}
  placeholder="Stellar address or federated address"
/>
```

**Not done in this PR**
- Trimming the value on blur (separate UX choice, separate issue).
- Server-side / SDK-level length enforcement; this PR only adds the client-side guard.

## Verification

`npm run typecheck`, `npm run lint`, `npm run build` all pass.

Part of #682
