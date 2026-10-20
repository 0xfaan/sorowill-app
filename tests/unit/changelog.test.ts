import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('release metadata', () => { it('keeps a changelog file with a version heading', () => { const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }; const changelog = readFileSync('CHANGELOG.md', 'utf8'); expect(changelog).toContain(`## v${pkg.version}`); }); });
