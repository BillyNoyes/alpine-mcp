import { readFile } from 'node:fs/promises';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { QMDStore } from '@tobilu/qmd';
import { COLLECTION_NAME } from '../config.js';
import type { DocumentCatalog } from '../documents/catalog.js';
import { extractSnippet } from '../search/snippet.js';

const tools = [
  {
    name: 'search_alpine_docs',
    description: 'Search the latest bundled official Alpine.js documentation using qmd BM25 search.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Alpine.js concept, API, directive, or question to search for.' },
        limit: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'read_alpine_doc',
    description: 'Read one complete Alpine.js documentation page returned by search_alpine_docs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Document path such as directives/transition.md.' },
      },
      required: ['path'],
      additionalProperties: false,
    },
  },
];

function parseSearchArguments(args: Record<string, unknown>): { query: string; limit: number } {
  const query = typeof args.query === 'string' ? args.query.trim() : '';
  if (!query) throw new Error('query must be a non-empty string');

  const requestedLimit = typeof args.limit === 'number' ? args.limit : 5;
  return {
    query,
    limit: Math.max(1, Math.min(10, Math.trunc(requestedLimit))),
  };
}

async function searchDocuments(store: QMDStore, query: string, limit: number) {
  const results = await store.searchLex(query, { collection: COLLECTION_NAME, limit });
  return Promise.all(results.map(async (result) => {
    const body = await store.getDocumentBody(result.filepath);
    return {
      path: result.displayPath.replace(`${COLLECTION_NAME}/`, ''),
      title: result.title,
      score: result.score,
      snippet: extractSnippet(body ?? '', query),
    };
  }));
}

export function registerToolHandlers(
  server: Server,
  catalog: DocumentCatalog,
  store: QMDStore,
  sourceCommit: string,
): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const args = request.params.arguments ?? {};

    if (request.params.name === 'search_alpine_docs') {
      const { query, limit } = parseSearchArguments(args);
      const matches = await searchDocuments(store, query, limit);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ sourceCommit, matches }, null, 2),
        }],
      };
    }

    if (request.params.name === 'read_alpine_doc') {
      const documentPath = typeof args.path === 'string' ? args.path : '';
      const document = catalog.findByPath(documentPath);
      if (!document) throw new Error(`Alpine.js document not found: ${documentPath}`);
      return { content: [{ type: 'text', text: await readFile(document.path, 'utf8') }] };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });
}
