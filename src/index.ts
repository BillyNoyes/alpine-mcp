#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { directives } from './resources/directives.js';
import { magics } from './resources/magics.js';
import { globals } from './resources/globals.js';
import { plugins } from './resources/plugins.js';

const resources = [
  {
    uri: 'alpine://directives',
    name: 'Alpine.js Directives',
    description: 'All Alpine directives: x-data, x-show, x-bind, x-on, x-model, x-for, x-if, x-transition, x-effect, x-ref, x-cloak, x-teleport, x-id, x-ignore',
    mimeType: 'text/markdown',
    content: directives,
  },
  {
    uri: 'alpine://magics',
    name: 'Alpine.js Magic Properties',
    description: 'All magic properties: $data, $el, $refs, $store, $watch, $dispatch, $nextTick, $id, $event, $persist',
    mimeType: 'text/markdown',
    content: magics,
  },
  {
    uri: 'alpine://globals',
    name: 'Alpine.js Global API',
    description: 'Global API: Alpine.data(), Alpine.store(), Alpine.plugin(), Alpine.effect(), Alpine.reactive(), Alpine.magic(), Alpine.directive(), Alpine.start()',
    mimeType: 'text/markdown',
    content: globals,
  },
  {
    uri: 'alpine://plugins',
    name: 'Alpine.js Official Plugins',
    description: 'Official plugins: Focus (x-trap), Persist ($persist), Collapse (x-collapse), Intersect (x-intersect), Morph ($morph), Anchor (x-anchor), Sort (x-sort), Mask (x-mask)',
    mimeType: 'text/markdown',
    content: plugins,
  },
];

const server = new Server(
  { name: 'alpine-mcp', version: '1.0.0' },
  { capabilities: { resources: {} } }
);

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: resources.map(({ uri, name, description, mimeType }) => ({
    uri,
    name,
    description,
    mimeType,
  })),
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const resource = resources.find((r) => r.uri === request.params.uri);

  if (!resource) {
    throw new Error(`Resource not found: ${request.params.uri}`);
  }

  return {
    contents: [
      {
        uri: resource.uri,
        mimeType: resource.mimeType,
        text: resource.content,
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
