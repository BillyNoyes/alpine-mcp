import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createStore } from '@tobilu/qmd';
import { cleanMarkdown, validateCorpus } from './generate.js';

test('cleanMarkdown removes site-only content without changing documentation', () => {
  const input = `---
title: x-data
---

# x-data

<a name="example"></a>
Useful content.

<!-- START_VERBATIM -->
<div>interactive demo</div>
<!-- END_VERBATIM -->
`;

  assert.equal(cleanMarkdown(input), '# x-data\n\nUseful content.\n');
});

test('validateCorpus rejects an incomplete snapshot', () => {
  assert.throws(() => validateCorpus(['directives/data.md']), /Incomplete Alpine documentation snapshot/);
});

test('qmd indexes and searches split Markdown pages', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'alpine-mcp-qmd-test-'));
  const docsDirectory = join(directory, 'docs');
  await mkdir(docsDirectory);
  await writeFile(join(docsDirectory, 'transition.md'), '# x-transition\n\nApply smooth transitions to an element.\n');

  const store = await createStore({
    dbPath: join(directory, 'index.sqlite'),
    config: {
      collections: {
        alpine: { path: docsDirectory, pattern: '**/*.md' },
      },
    },
  });

  try {
    const update = await store.update();
    const results = await store.searchLex('smooth transitions', { collection: 'alpine' });
    assert.equal(update.indexed, 1);
    assert.equal(results[0]?.title, 'x-transition');
  } finally {
    await store.close();
    await rm(directory, { recursive: true, force: true });
  }
});
