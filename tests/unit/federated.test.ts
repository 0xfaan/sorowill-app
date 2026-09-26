/**
 * Tests for issues #339 and #340:
 *
 * #339 — resolveFederatedAddress does not validate the domain, allowing URL
 *         userinfo/path/port tricks in the stellar.toml fetch.
 *
 * #340 — Federation server lookup mis-parses stellar.toml and breaks on valid
 *         FEDERATION_SERVER lines (indented keys, `=` inside URL, key prefix
 *         false-positive matches, non-https URLs).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveFederatedAddress } from '@/lib/federated';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A valid 56-character Stellar public key (G + 55 uppercase base32 chars).
 * Used as the mock federation server response.
 */
const VALID_ACCOUNT_ID = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW';

/** Build a minimal stellar.toml text with the given FEDERATION_SERVER line. */
function makeStellarToml(federationLine: string): string {
  return `NETWORK_PASSPHRASE="Test SDF Network ; September 2015"\n${federationLine}\n`;
}

/**
 * Build a pair of mock Response objects for a successful two-step resolution:
 *   1. stellar.toml fetch → toml text
 *   2. federation server query → JSON with account_id
 */
function makeMockResponses(tomlLine: string, accountId: string = VALID_ACCOUNT_ID) {
  const tomlResponse = new Response(makeStellarToml(tomlLine), {
    status: 200,
    headers: { 'content-type': 'text/plain' },
  });
  const fedResponse = new Response(JSON.stringify({ account_id: accountId }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  return [tomlResponse, fedResponse] as const;
}

// ---------------------------------------------------------------------------
// Module-level fetch mock
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  // Clear in-module TOML cache between tests so each test starts fresh.
  // The cache is module-private; resetting fetch is sufficient because
  // every test uses a unique domain (or the cache TTL has not elapsed).
});

// ---------------------------------------------------------------------------
// #339 — Domain validation
// ---------------------------------------------------------------------------

describe('#339 — resolveFederatedAddress domain validation', () => {
  it('rejects an address with more than one "*"', async () => {
    await expect(resolveFederatedAddress('a*b*c')).rejects.toThrow(
      'must contain exactly one "*" separator',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects an address with an empty name before "*"', async () => {
    await expect(resolveFederatedAddress('*example.com')).rejects.toThrow(
      'the name portion before "*" must not be empty',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects an address with an empty domain after "*"', async () => {
    await expect(resolveFederatedAddress('user*')).rejects.toThrow(
      'the domain portion after "*" must not be empty',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects a domain containing "@" (userinfo injection)', async () => {
    await expect(resolveFederatedAddress('user*evil.com@internal-host')).rejects.toThrow(
      'is not a valid hostname',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects a domain containing "/" (path injection)', async () => {
    await expect(resolveFederatedAddress('user*host/path?x=')).rejects.toThrow(
      'is not a valid hostname',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects a domain containing "?" (query injection)', async () => {
    await expect(resolveFederatedAddress('user*example.com?evil=1')).rejects.toThrow(
      'is not a valid hostname',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects a domain containing "#" (fragment injection)', async () => {
    await expect(resolveFederatedAddress('user*example.com#fragment')).rejects.toThrow(
      'is not a valid hostname',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects a domain containing whitespace', async () => {
    await expect(resolveFederatedAddress('user*exam ple.com')).rejects.toThrow(
      'is not a valid hostname',
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('accepts a valid simple domain and resolves correctly', async () => {
    const [tomlRes, fedRes] = makeMockResponses(
      'FEDERATION_SERVER = "https://fed.domain339a.com/fed"',
    );
    mockFetch.mockResolvedValueOnce(tomlRes).mockResolvedValueOnce(fedRes);

    const result = await resolveFederatedAddress('user*domain339a.com');
    expect(result).toBe(VALID_ACCOUNT_ID);
  });

  it('accepts a domain with a port suffix', async () => {
    const [tomlRes, fedRes] = makeMockResponses(
      'FEDERATION_SERVER = "https://fed.domain339b.com:8443/fed"',
    );
    mockFetch.mockResolvedValueOnce(tomlRes).mockResolvedValueOnce(fedRes);

    const result = await resolveFederatedAddress('user*domain339b.com:8443');
    expect(result).toBe(VALID_ACCOUNT_ID);
  });
});

// ---------------------------------------------------------------------------
// #340 — TOML parsing and https enforcement
// ---------------------------------------------------------------------------

describe('#340 — stellar.toml FEDERATION_SERVER parsing', () => {
  it('parses a FEDERATION_SERVER line with leading whitespace (indented key)', async () => {
    const [tomlRes, fedRes] = makeMockResponses(
      '  FEDERATION_SERVER = "https://fed.domain340a.com/fed"',
    );
    mockFetch.mockResolvedValueOnce(tomlRes).mockResolvedValueOnce(fedRes);

    await expect(resolveFederatedAddress('user*domain340a.com')).resolves.toBe(VALID_ACCOUNT_ID);
  });

  it('preserves "=" characters inside the federation URL (query string)', async () => {
    const fedUrl = 'https://fed.domain340b.com/fed?key=abc==&other=1';
    const [tomlRes, fedRes] = makeMockResponses(`FEDERATION_SERVER = "${fedUrl}"`);
    mockFetch.mockResolvedValueOnce(tomlRes).mockResolvedValueOnce(fedRes);

    await resolveFederatedAddress('user*domain340b.com');

    // The second fetch must use the full URL including the embedded `=` characters.
    const [secondFetchUrl] = mockFetch.mock.calls[1] as [string];
    expect(secondFetchUrl).toContain('key=abc==');
  });

  it('does not match a similarly-prefixed key like FEDERATION_SERVER_URL', async () => {
    const tomlRes = new Response(
      makeStellarToml('FEDERATION_SERVER_URL = "https://fed.domain340c.com/fed"'),
      { status: 200 },
    );
    mockFetch.mockResolvedValueOnce(tomlRes);

    await expect(resolveFederatedAddress('user*domain340c.com')).rejects.toThrow(
      'No FEDERATION_SERVER found',
    );
  });

  it('strips only the surrounding single quotes, not internal quote characters', async () => {
    const fedUrl = 'https://fed.domain340d.com/fed';
    const [tomlRes, fedRes] = makeMockResponses(`FEDERATION_SERVER = '${fedUrl}'`);
    mockFetch.mockResolvedValueOnce(tomlRes).mockResolvedValueOnce(fedRes);

    await resolveFederatedAddress('user*domain340d.com');
    const [secondFetchUrl] = mockFetch.mock.calls[1] as [string];
    expect(secondFetchUrl).toContain(fedUrl);
  });

  it('rejects a non-https FEDERATION_SERVER URL', async () => {
    const tomlRes = new Response(
      makeStellarToml('FEDERATION_SERVER = "http://fed.domain340e.com/fed"'),
      { status: 200 },
    );
    mockFetch.mockResolvedValueOnce(tomlRes);

    await expect(resolveFederatedAddress('user*domain340e.com')).rejects.toThrow(
      'must use HTTPS',
    );
    // Only one fetch call — the federation server was never queried.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects when FEDERATION_SERVER is absent from the TOML', async () => {
    const tomlRes = new Response('NETWORK_PASSPHRASE="Test"\n', { status: 200 });
    mockFetch.mockResolvedValueOnce(tomlRes);

    await expect(resolveFederatedAddress('user*domain340f.com')).rejects.toThrow(
      'No FEDERATION_SERVER found',
    );
  });
});

// ---------------------------------------------------------------------------
// Non-federated passthrough
// ---------------------------------------------------------------------------

describe('resolveFederatedAddress — non-federated passthrough', () => {
  it('returns a public key unchanged without making any network requests', async () => {
    const result = await resolveFederatedAddress(VALID_ACCOUNT_ID);
    expect(result).toBe(VALID_ACCOUNT_ID);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
