// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Next.js inlines every NEXT_PUBLIC_* variable into the client bundle, so a
// secret-looking name with that prefix is almost certainly a leak (#82).
const SENSITIVE_NAME = /(SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|API_KEY|AUTH_KEY|SIGNING_KEY)/;
const PUBLIC_VAR = /\bNEXT_PUBLIC_[A-Z0-9_]+\b/g;

const ROOT = path.resolve(__dirname, '../..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(entry) ? [full] : [];
  });
}

function sensitivePublicVars(text: string): string[] {
  return [...new Set(text.match(PUBLIC_VAR) ?? [])].filter((name) => SENSITIVE_NAME.test(name));
}

describe('NEXT_PUBLIC_ safeguard (#82)', () => {
  it('flags secret-looking NEXT_PUBLIC_ names', () => {
    expect(sensitivePublicVars('process.env.NEXT_PUBLIC_RESEND_API_KEY')).toEqual(['NEXT_PUBLIC_RESEND_API_KEY']);
    expect(sensitivePublicVars('NEXT_PUBLIC_CRON_SECRET=x')).toEqual(['NEXT_PUBLIC_CRON_SECRET']);
    expect(sensitivePublicVars('process.env.NEXT_PUBLIC_RPC_URL')).toEqual([]);
  });

  it('no source file references a secret-looking NEXT_PUBLIC_ variable', () => {
    const offenders = sourceFiles(path.join(ROOT, 'src')).flatMap((file) =>
      sensitivePublicVars(readFileSync(file, 'utf8')).map((name) => `${path.relative(ROOT, file)}: ${name}`),
    );
    expect(offenders).toEqual([]);
  });

  it('.env.example declares no secret-looking NEXT_PUBLIC_ variable', () => {
    expect(sensitivePublicVars(readFileSync(path.join(ROOT, '.env.example'), 'utf8'))).toEqual([]);
  });
});
