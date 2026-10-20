import { readFileSync, writeFileSync } from 'node:fs';
const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) throw new Error('Usage: node scripts/bump-release.mjs 1.2.3');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
packageJson.version = version;
writeFileSync('package.json', `${JSON.stringify(packageJson, null, 2)}\n`);
const changelog = readFileSync('CHANGELOG.md', 'utf8');
if (!changelog.includes(`## v${version}`)) writeFileSync('CHANGELOG.md', `# Changelog\n\n## v${version} - ${new Date().toISOString().slice(0, 10)}\n\n- Release notes pending.\n\n${changelog.replace(/^# Changelog\s*/, '')}`);
