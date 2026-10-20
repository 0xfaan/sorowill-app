#!/usr/bin/env node
/**
 * scripts/bump-version.mjs
 *
 * Release helper for SoroWill App.
 *
 * Usage:
 *   node scripts/bump-version.mjs <major|minor|patch> [--dry-run]
 *   node scripts/bump-version.mjs 1.2.3            [--dry-run]
 *
 * What it does:
 *   1. Reads the current version from package.json.
 *   2. Computes the next version (semver bump or exact version).
 *   3. Updates the `version` field in package.json.
 *   4. Prepends a new `## [X.Y.Z] - YYYY-MM-DD` stub to CHANGELOG.md
 *      (below `## [Unreleased]` if present, otherwise at the top of the
 *      version list) with placeholder sections ready to be filled in.
 *   5. Prints what changed.  With --dry-run, nothing is written.
 *
 * The stub sections are intentionally minimal.  Fill them in and commit
 * both package.json and CHANGELOG.md together as part of the release PR.
 *
 * Validation:
 *   After writing, the script runs validate-changelog (same checks as CI)
 *   to confirm the resulting state is clean.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { validateChangelog } from './validate-changelog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Semver helpers
// ---------------------------------------------------------------------------

/**
 * @param {string} version - e.g. "1.2.3"
 * @returns {{ major: number, minor: number, patch: number }}
 */
function parseSemver(version) {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver: "${version}"`);
  }
  const [major, minor, patch] = parts;
  return { major, minor, patch };
}

/**
 * @param {string} current - current version string
 * @param {'major'|'minor'|'patch'|string} bump - bump type or exact version
 * @returns {string} new version string
 */
function nextVersion(current, bump) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) {
    return bump; // exact version provided
  }
  const { major, minor, patch } = parseSemver(current);
  switch (bump) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(
        `Unknown bump type "${bump}". Use major, minor, patch, or an exact version like 1.2.3.`,
      );
  }
}

/**
 * ISO date string for today (YYYY-MM-DD in UTC).
 * @returns {string}
 */
function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// CHANGELOG manipulation
// ---------------------------------------------------------------------------

const CHANGELOG_STUB = (version, date) => `\
## [${version}] - ${date}

### Added
- <!-- describe new features -->

### Fixed
- <!-- describe bug fixes -->

### Changed
- <!-- describe breaking changes or other updates -->

`;

/**
 * Prepend a new version entry to CHANGELOG.md content.
 *
 * Strategy:
 *   - If an [Unreleased] section exists, insert after it.
 *   - Otherwise, insert before the first ## [X.Y.Z] heading.
 *   - If neither is found, append at the end.
 *
 * @param {string} content - current CHANGELOG.md text
 * @param {string} version - new version string
 * @param {string} date    - ISO date string
 * @returns {string} updated content
 */
export function prependChangelogEntry(content, version, date) {
  const stub = CHANGELOG_STUB(version, date);

  // Try to insert after the [Unreleased] block
  const unreleasedMatch = content.match(/^##\s+\[Unreleased\][^\n]*\n/im);
  if (unreleasedMatch) {
    const insertAt = unreleasedMatch.index + unreleasedMatch[0].length;
    return content.slice(0, insertAt) + '\n' + stub + content.slice(insertAt);
  }

  // Fall back to before the first released version heading
  const firstVersionMatch = content.match(/^##\s+\[\d/m);
  if (firstVersionMatch) {
    return (
      content.slice(0, firstVersionMatch.index) +
      stub +
      content.slice(firstVersionMatch.index)
    );
  }

  // Append at end
  return content.trimEnd() + '\n\n' + stub;
}

// ---------------------------------------------------------------------------
// Main — only executes when the file is run directly
// ---------------------------------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2).filter((a) => a !== '--dry-run');
  const dryRun = process.argv.includes('--dry-run');
  const bumpArg = args[0];

  if (!bumpArg) {
    process.stderr.write(
      'Usage: node scripts/bump-version.mjs <major|minor|patch|X.Y.Z> [--dry-run]\n',
    );
    process.exit(1);
  }

  // Read current state
  const pkgPath = resolve(root, 'package.json');
  const changelogPath = resolve(root, 'CHANGELOG.md');

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const currentVersion = pkg.version;

  let changelogContent;
  try {
    changelogContent = readFileSync(changelogPath, 'utf-8');
  } catch {
    process.stderr.write('ERROR: CHANGELOG.md not found. Create it first.\n');
    process.exit(1);
  }

  // Compute next version
  let newVersion;
  try {
    newVersion = nextVersion(currentVersion, bumpArg);
  } catch (err) {
    process.stderr.write(`ERROR: ${err.message}\n`);
    process.exit(1);
  }

  process.stdout.write(`\nBumping version: ${currentVersion} → ${newVersion}\n`);

  // Build updated content
  const newPkg = { ...pkg, version: newVersion };
  const newPkgJson = JSON.stringify(newPkg, null, 2) + '\n';
  const newChangelog = prependChangelogEntry(changelogContent, newVersion, today());

  if (dryRun) {
    process.stdout.write('\n--- DRY RUN — nothing written ---\n\n');
    process.stdout.write('package.json version field:\n');
    process.stdout.write(`  ${currentVersion} → ${newVersion}\n\n`);
    process.stdout.write('CHANGELOG.md would gain:\n');
    process.stdout.write(CHANGELOG_STUB(newVersion, today()));
    process.exit(0);
  }

  // Write
  writeFileSync(pkgPath, newPkgJson, 'utf-8');
  writeFileSync(changelogPath, newChangelog, 'utf-8');

  process.stdout.write(`\nUpdated package.json → ${newVersion}\n`);
  process.stdout.write(`Prepended CHANGELOG.md entry for [${newVersion}]\n`);

  // Validate — note: the stub has placeholder text, so versionHasEntries will
  // pass because the placeholder lines are non-blank.
  const result = validateChangelog(newChangelog, newVersion);
  if (!result.ok) {
    process.stderr.write(`\nWarning: post-bump validation issue:\n  ${result.error}\n`);
    process.stdout.write('Fill in the CHANGELOG.md stub before committing.\n');
  } else {
    process.stdout.write(`\nChangelog validation OK (${newVersion})\n`);
  }

  process.stdout.write(
    '\nNext steps:\n' +
      `  1. Edit CHANGELOG.md — replace placeholder comments with real entries for [${newVersion}]\n` +
      '  2. Commit package.json and CHANGELOG.md together\n' +
      `  3. Tag the release: git tag v${newVersion}\n\n`,
  );
}
