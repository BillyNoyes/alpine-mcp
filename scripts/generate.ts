#!/usr/bin/env node
/**
 * Fetches a coherent snapshot of the official Alpine.js documentation and
 * writes one Markdown file per upstream page into docs/.
 *
 * Run: npm run generate
 * Pin a version: ALPINE_REF=v3.14.0 npm run generate
 */

import { createReadStream } from 'node:fs';
import {
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { extract } from 'tar';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_DIR = join(ROOT, 'docs');
const REF = process.env.ALPINE_REF ?? 'main';
const REPOSITORY = 'alpinejs/alpine';
const DOCS_PREFIX = 'packages/docs/src/en/';
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 30_000;
const REQUIRED_PAGES = [
  'start-here.md',
  'directives/data.md',
  'magics/el.md',
  'globals/alpine-data.md',
  'plugins/focus.md',
];

async function fetchWithRetry(url: string, accept: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: accept,
          'User-Agent': 'alpine-mcp-docs-generator',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) {
        throw new Error(`Request failed: ${response.status} ${response.statusText} (${url})`);
      }
      lastError = new Error(`Request failed: ${response.status} ${response.statusText} (${url})`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }

  throw lastError;
}

async function resolveCommit(ref: string): Promise<string> {
  const response = await fetchWithRetry(
    `https://api.github.com/repos/${REPOSITORY}/commits/${encodeURIComponent(ref)}`,
    'application/vnd.github+json',
  );
  const payload = await response.json() as { sha?: unknown };

  if (typeof payload.sha !== 'string' || !/^[0-9a-f]{40}$/.test(payload.sha)) {
    throw new Error(`GitHub returned an invalid commit SHA for Alpine ref "${ref}"`);
  }

  return payload.sha;
}

export function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/^---\n[\s\S]*?\n---\n*/m, '')
    .replace(/<!-- START_VERBATIM -->[\s\S]*?<!-- END_VERBATIM -->\n*/g, '')
    .replace(/<a name="[^"]*"><\/a>\n*/g, '')
    .trim()
    .concat('\n');
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(path);
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  }));

  return files.flat().sort();
}

export function validateCorpus(documentPaths: string[]): void {
  const available = new Set(documentPaths);
  const missing = REQUIRED_PAGES.filter((path) => !available.has(path));
  if (documentPaths.length < 40 || missing.length > 0) {
    throw new Error(
      `Incomplete Alpine documentation snapshot: ${documentPaths.length} pages; missing ${missing.join(', ') || 'required page count'}`,
    );
  }
}

async function extractArchive(commit: string, directory: string): Promise<void> {
  const response = await fetchWithRetry(
    `https://codeload.github.com/${REPOSITORY}/tar.gz/${commit}`,
    'application/octet-stream',
  );
  if (!response.body) throw new Error('Alpine archive response did not include a body');

  const archivePath = join(directory, 'alpine.tar.gz');
  await writeFile(archivePath, Buffer.from(await response.arrayBuffer()));
  await pipeline(createReadStream(archivePath), extract({ cwd: directory }));
  await rm(archivePath);
}

async function replaceDocs(stagedDocs: string): Promise<void> {
  const backup = `${DOCS_DIR}.backup`;
  await rm(backup, { recursive: true, force: true });

  let hadExistingDocs = false;
  try {
    await rename(DOCS_DIR, backup);
    hadExistingDocs = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  try {
    await rename(stagedDocs, DOCS_DIR);
  } catch (error) {
    if (hadExistingDocs) await rename(backup, DOCS_DIR);
    throw error;
  }

  await rm(backup, { recursive: true, force: true });
}

async function generate(): Promise<void> {
  console.log(`Resolving Alpine.js docs ref ${REF}...`);
  const commit = await resolveCommit(REF);
  const workingDirectory = await mkdtemp(join(tmpdir(), 'alpine-mcp-docs-'));
  const stagedDocs = join(workingDirectory, `alpine-${commit}`, DOCS_PREFIX);

  try {
    await extractArchive(commit, workingDirectory);

    const files = await listMarkdownFiles(stagedDocs);
    if (files.length === 0) {
      throw new Error(`No Markdown files found at ${DOCS_PREFIX} in Alpine commit ${commit}`);
    }

    const pages: string[] = [];
    for (const file of files) {
      const cleaned = cleanMarkdown(await readFile(file, 'utf8'));
      if (!cleaned.trim()) {
        await unlink(file);
        continue;
      }
      await writeFile(file, cleaned);
      pages.push(file);
    }

    validateCorpus(pages.map((file) => relative(stagedDocs, file).split('\\').join('/')));

    const license = await fetchWithRetry(
      `https://raw.githubusercontent.com/${REPOSITORY}/${commit}/LICENSE.md`,
      'text/plain',
    );
    await writeFile(join(stagedDocs, 'ALPINE-LICENSE.txt'), await license.text());
    await writeFile(join(stagedDocs, '.source.json'), `${JSON.stringify({
      repository: `https://github.com/${REPOSITORY}`,
      requestedRef: REF,
      commit,
      path: DOCS_PREFIX.slice(0, -1),
    }, null, 2)}\n`);

    await replaceDocs(stagedDocs);
    console.log(`Wrote ${pages.length} pages from Alpine commit ${commit}`);
    for (const file of pages) console.log(`  ✓ docs/${relative(stagedDocs, file)}`);
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}

const invokedPath = process.argv[1] ? basename(process.argv[1]) : '';
if (invokedPath === basename(fileURLToPath(import.meta.url))) {
  generate().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
