import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { DocumentCatalog } from '../documents/catalog.js';

export function registerResourceHandlers(server: Server, catalog: DocumentCatalog): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: catalog.listResources(),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => ({
    contents: [{
      uri: request.params.uri,
      mimeType: 'text/markdown',
      text: await catalog.readResource(request.params.uri),
    }],
  }));
}
