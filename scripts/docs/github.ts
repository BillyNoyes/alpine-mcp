import { writeFile } from 'node:fs/promises';
import { REPOSITORY, REQUEST_OPTIONS } from './config.js';

async function fetchWithRetry(url: string, accept: string): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= REQUEST_OPTIONS.attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: accept,
          'User-Agent': REQUEST_OPTIONS.userAgent,
        },
        signal: AbortSignal.timeout(REQUEST_OPTIONS.timeoutMs),
      });

      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) {
        throw new Error(`Request failed: ${response.status} ${response.statusText} (${url})`);
      }
      lastError = new Error(`Request failed: ${response.status} ${response.statusText} (${url})`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < REQUEST_OPTIONS.attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }

  throw lastError;
}

export async function resolveCommit(ref: string): Promise<string> {
  const response = await fetchWithRetry(
    `https://api.github.com/repos/${REPOSITORY}/commits/${encodeURIComponent(ref)}`,
    'application/vnd.github+json',
  );
  const { sha } = await response.json() as { sha?: unknown };

  if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error(`GitHub returned an invalid commit SHA for Alpine ref "${ref}"`);
  }
  return sha;
}

export async function downloadArchive(commit: string, destination: string): Promise<void> {
  const response = await fetchWithRetry(
    `https://codeload.github.com/${REPOSITORY}/tar.gz/${commit}`,
    'application/octet-stream',
  );
  if (!response.body) throw new Error('Alpine archive response did not include a body');
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

export async function fetchLicense(commit: string): Promise<string> {
  const response = await fetchWithRetry(
    `https://raw.githubusercontent.com/${REPOSITORY}/${commit}/LICENSE.md`,
    'text/plain',
  );
  return response.text();
}
