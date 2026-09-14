import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { QMDStore } from '@tobilu/qmd';
import type { DocumentCatalog } from '../documents/catalog.js';
import { registerResourceHandlers } from './resources.js';
import { registerToolHandlers } from './tools.js';

export interface CreateServerOptions {
  catalog: DocumentCatalog;
  packageVersion: string;
  sourceCommit: string;
  store: QMDStore;
}

export function createServer(options: CreateServerOptions): Server {
  const server = new Server(
    { name: 'alpine-mcp', version: options.packageVersion },
    { capabilities: { resources: {}, tools: {} } },
  );

  registerResourceHandlers(server, options.catalog);
  registerToolHandlers(server, options.catalog, options.store, options.sourceCommit);
  return server;
}
