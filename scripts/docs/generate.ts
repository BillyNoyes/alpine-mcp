import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractArchive, replaceDirectory } from './archive.js';
import { DOCS_DIR, DOCS_PREFIX, REPOSITORY } from './config.js';
import { prepareCorpus } from './corpus.js';
import { downloadArchive, fetchLicense, resolveCommit } from './github.js';

async function writeSourceFiles(directory: string, ref: string, commit: string): Promise<void> {
  const license = await fetchLicense(commit);
  await writeFile(join(directory, 'ALPINE-LICENSE.txt'), license);
  await writeFile(join(directory, '.source.json'), `${JSON.stringify({
    repository: `https://github.com/${REPOSITORY}`,
    requestedRef: ref,
    commit,
    path: DOCS_PREFIX.slice(0, -1),
  }, null, 2)}\n`);
}

export async function generateDocs(ref: string): Promise<void> {
  console.log(`Resolving Alpine.js docs ref ${ref}...`);
  const commit = await resolveCommit(ref);
  const workingDirectory = await mkdtemp(join(tmpdir(), 'alpine-mcp-docs-'));
  const archivePath = join(workingDirectory, 'alpine.tar.gz');
  const stagedDocs = join(workingDirectory, `alpine-${commit}`, DOCS_PREFIX);

  try {
    await downloadArchive(commit, archivePath);
    await extractArchive(archivePath, workingDirectory);
    const pages = await prepareCorpus(stagedDocs);
    await writeSourceFiles(stagedDocs, ref, commit);
    await replaceDirectory(stagedDocs, DOCS_DIR);

    console.log(`Wrote ${pages.length} pages from Alpine commit ${commit}`);
    for (const page of pages) console.log(`  ✓ docs/${page}`);
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}
