import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('MCP server searches and reads split Alpine documentation', async () => {
  const client = new Client({ name: 'alpine-mcp-test', version: '1.0.0' }, { capabilities: {} });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--import', 'tsx/esm', 'src/index.ts'],
  });

  await client.connect(transport);
  try {
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map(({ name }) => name), ['search_alpine_docs', 'read_alpine_doc']);

    const resources = await client.listResources();
    assert.ok(resources.resources.some(({ uri }) => uri === 'alpine://directives'));
    assert.ok(resources.resources.some(({ uri }) => uri === 'alpine://docs/directives/transition.md'));

    const search = await client.callTool({
      name: 'search_alpine_docs',
      arguments: { query: 'smooth transitions', limit: 3 },
    });
    const searchContent = search.content as Array<{ type: string; text?: string }>;
    const searchText = searchContent.find((item) => item.type === 'text');
    assert.ok(searchText?.text);
    const payload = JSON.parse(searchText.text) as {
      matches: Array<{ path: string }>;
    };
    assert.ok(payload.matches.length > 0);

    const document = await client.callTool({
      name: 'read_alpine_doc',
      arguments: { path: payload.matches[0].path },
    });
    const documentContent = document.content as Array<{ type: string; text?: string }>;
    const documentText = documentContent.find((item) => item.type === 'text');
    assert.ok(documentText?.text && documentText.text.length > 0);
  } finally {
    await client.close();
  }
});
