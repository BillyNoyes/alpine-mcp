import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore, type QMDStore } from '@tobilu/qmd';
import { COLLECTION_NAME } from '../config.js';

export interface SearchIndex {
  store: QMDStore;
  close(): Promise<void>;
}

export async function createSearchIndex(docsDirectory: string): Promise<SearchIndex> {
  const indexDirectory = await mkdtemp(join(tmpdir(), 'alpine-mcp-qmd-'));
  let store: QMDStore | undefined;

  try {
    const createdStore = await createStore({
      dbPath: join(indexDirectory, 'index.sqlite'),
      config: {
        collections: {
          [COLLECTION_NAME]: {
            path: docsDirectory,
            pattern: '**/*.md',
          },
        },
      },
    });
    store = createdStore;
    await createdStore.update({ collections: [COLLECTION_NAME] });

    return {
      store: createdStore,
      async close() {
        await createdStore.close();
        await rm(indexDirectory, { recursive: true, force: true });
      },
    };
  } catch (error) {
    await store?.close();
    await rm(indexDirectory, { recursive: true, force: true });
    throw error;
  }
}
