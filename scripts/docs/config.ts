import { fileURLToPath } from 'node:url';

export const DOCS_DIR = fileURLToPath(new URL('../../docs', import.meta.url));
export const REPOSITORY = 'alpinejs/alpine';
export const DOCS_PREFIX = 'packages/docs/src/en/';
export const REQUIRED_PAGES = [
  'start-here.md',
  'directives/data.md',
  'magics/el.md',
  'globals/alpine-data.md',
  'plugins/focus.md',
];

export const REQUEST_OPTIONS = {
  attempts: 3,
  timeoutMs: 30_000,
  userAgent: 'alpine-mcp-docs-generator',
};
