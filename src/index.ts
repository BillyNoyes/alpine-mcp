#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DOCS_DIR, loadRuntimeMetadata } from './config.js';
import { DocumentCatalog } from './documents/catalog.js';
import { createSearchIndex } from './search/index.js';
import { createServer } from './server/create-server.js';

const [metadata, catalog] = await Promise.all([
  loadRuntimeMetadata(),
  DocumentCatalog.create(DOCS_DIR),
]);
const searchIndex = await createSearchIndex(DOCS_DIR);
const server = createServer({
  catalog,
  packageVersion: metadata.packageVersion,
  sourceCommit: metadata.sourceCommit,
  store: searchIndex.store,
});

let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  await searchIndex.close();
}

process.once('SIGINT', () => void shutdown().finally(() => process.exit(0)));
process.once('SIGTERM', () => void shutdown().finally(() => process.exit(0)));
process.stdin.once('end', () => void shutdown());

await server.connect(new StdioServerTransport());
