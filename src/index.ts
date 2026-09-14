#!/usr/bin/env node
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createStore, type QMDStore } from '@tobilu/qmd';

const DOCS_DIR = fileURLToPath(new URL(/* @vite-ignore */ '../docs', import.meta.url));
const COLLECTION = 'alpine';
const LEGACY_CATEGORIES = ['directives', 'magics', 'globals', 'plugins'] as const;
const SOURCE = JSON.parse(await readFile(join(DOCS_DIR, '.source.json'), 'utf8')) as {
  commit: string;
};
const PACKAGE = JSON.parse(
  await readFile(fileURLToPath(new URL(/* @vite-ignore */ '../package.json', import.meta.url)), 'utf8'),
) as { version: string };

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(path);
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  }));
  return files.flat().sort();
}

const markdownFiles = await listMarkdownFiles(DOCS_DIR);
const docsByUri = new Map<string, { path: string; documentPath: string }>(markdownFiles.map((path) => {
  const documentPath = relative(DOCS_DIR, path).split(sep).join('/');
  return [`alpine://docs/${documentPath}`, { path, documentPath }] as const;
}));

const indexDirectory = await mkdtemp(join(tmpdir(), 'alpine-mcp-qmd-'));
const store: QMDStore = await createStore({
  dbPath: join(indexDirectory, 'index.sqlite'),
  config: {
    collections: {
      [COLLECTION]: {
        path: DOCS_DIR,
        pattern: '**/*.md',
      },
    },
  },
});
await store.update({ collections: [COLLECTION] });

async function legacyResource(category: typeof LEGACY_CATEGORIES[number]): Promise<string> {
  const categoryPrefix = `${category}/`;
  const files = markdownFiles.filter((path) => (
    relative(DOCS_DIR, path).split(sep).join('/').startsWith(categoryPrefix)
  ));
  const pages = await Promise.all(files.map((path) => readFile(path, 'utf8')));
  const title = category.charAt(0).toUpperCase() + category.slice(1);
  return `# Alpine.js ${title}\n\n${pages.join('\n\n---\n\n')}`;
}

function extractSnippet(body: string, query: string, maxLength = 1_200): string {
  if (body.length <= maxLength) return body;
  const terms = query.toLowerCase().match(/[\p{L}\p{N}_$-]{2,}/gu) ?? [];
  const lowerBody = body.toLowerCase();
  const firstMatch = terms
    .map((term) => lowerBody.indexOf(term))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, firstMatch - Math.floor(maxLength / 3));
  const end = Math.min(body.length, start + maxLength);
  return `${start > 0 ? '…' : ''}${body.slice(start, end).trim()}${end < body.length ? '…' : ''}`;
}

const server = new Server(
  { name: 'alpine-mcp', version: PACKAGE.version },
  { capabilities: { resources: {}, tools: {} } },
);

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    ...LEGACY_CATEGORIES.map((category) => ({
      uri: `alpine://${category}`,
      name: `Alpine.js ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      description: `Combined Alpine.js ${category} documentation`,
      mimeType: 'text/markdown',
    })),
    ...[...docsByUri.entries()].map(([uri, { documentPath }]) => ({
      uri,
      name: documentPath.replace(/\.md$/, ''),
      description: `Official Alpine.js documentation page: ${documentPath}`,
      mimeType: 'text/markdown',
    })),
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const legacyCategory = LEGACY_CATEGORIES.find((category) => uri === `alpine://${category}`);
  const document = docsByUri.get(uri);

  if (!legacyCategory && !document) throw new Error(`Resource not found: ${uri}`);
  const text = legacyCategory
    ? await legacyResource(legacyCategory)
    : await readFile(document!.path, 'utf8');

  return { contents: [{ uri, mimeType: 'text/markdown', text }] };
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_alpine_docs',
      description: 'Search the latest bundled official Alpine.js documentation using qmd BM25 search.',
      inputSchema: {
        type: 'object',
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
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Document path such as directives/transition.md.' },
        },
        required: ['path'],
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const args = request.params.arguments ?? {};

  if (request.params.name === 'search_alpine_docs') {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    const requestedLimit = typeof args.limit === 'number' ? args.limit : 5;
    const limit = Math.max(1, Math.min(10, Math.trunc(requestedLimit)));
    if (!query) throw new Error('query must be a non-empty string');

    const results = await store.searchLex(query, { collection: COLLECTION, limit });
    const matches = await Promise.all(results.map(async (result) => {
      const body = await store.getDocumentBody(result.filepath);
      return {
        path: result.displayPath.replace(`${COLLECTION}/`, ''),
        title: result.title,
        score: result.score,
        snippet: extractSnippet(body ?? '', query),
      };
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ sourceCommit: SOURCE.commit, matches }, null, 2),
      }],
    };
  }

  if (request.params.name === 'read_alpine_doc') {
    const documentPath = typeof args.path === 'string' ? args.path : '';
    const uri = `alpine://docs/${documentPath}`;
    const document = docsByUri.get(uri);
    if (!document) throw new Error(`Alpine.js document not found: ${documentPath}`);
    return { content: [{ type: 'text', text: await readFile(document.path, 'utf8') }] };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  await store.close();
  await rm(indexDirectory, { recursive: true, force: true });
}

process.once('SIGINT', () => void shutdown().finally(() => process.exit(0)));
process.once('SIGTERM', () => void shutdown().finally(() => process.exit(0)));
process.stdin.once('end', () => void shutdown());

const transport = new StdioServerTransport();
await server.connect(transport);
