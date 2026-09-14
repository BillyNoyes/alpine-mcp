import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import semver from 'semver';

const verifier = join(process.cwd(), 'scripts', 'verify-release.mjs');
const packageVersion = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')).version as string;
const releaseTag = `v${packageVersion}`;

function verify(tag: string, prerelease: boolean, latest = '') {
  return spawnSync(process.execPath, [verifier, tag, String(prerelease), latest], {
    encoding: 'utf8',
  });
}

test('accepts matching release metadata', () => {
  assert.equal(verify(releaseTag, semver.prerelease(packageVersion) !== null).status, 0);
});

test('rejects mismatched release metadata', () => {
  assert.notEqual(verify(releaseTag, semver.prerelease(packageVersion) === null).status, 0);
  assert.notEqual(verify('v0.0.0', false).status, 0);
});

test('rejects a stable release that would move latest backwards', () => {
  const newerVersion = `${semver.major(packageVersion) + 1}.0.0`;
  assert.notEqual(verify(releaseTag, false, newerVersion).status, 0);
});
