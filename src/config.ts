import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const DOCS_DIR = fileURLToPath(new URL(/* @vite-ignore */ '../docs', import.meta.url));
export const COLLECTION_NAME = 'alpine';
export const LEGACY_CATEGORIES = ['directives', 'magics', 'globals', 'plugins'] as const;

export type LegacyCategory = typeof LEGACY_CATEGORIES[number];

export interface RuntimeMetadata {
  packageVersion: string;
  sourceCommit: string;
}

export async function loadRuntimeMetadata(): Promise<RuntimeMetadata> {
  const [source, packageJson] = await Promise.all([
    readFile(new URL(/* @vite-ignore */ '../docs/.source.json', import.meta.url), 'utf8'),
    readFile(new URL(/* @vite-ignore */ '../package.json', import.meta.url), 'utf8'),
  ]);

  return {
    sourceCommit: (JSON.parse(source) as { commit: string }).commit,
    packageVersion: (JSON.parse(packageJson) as { version: string }).version,
  };
}
