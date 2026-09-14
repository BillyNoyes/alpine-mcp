#!/usr/bin/env node
/**
 * Fetches a coherent snapshot of the official Alpine.js documentation and
 * writes one Markdown file per upstream page into docs/.
 *
 * Run: npm run generate
 * Pin a version: ALPINE_REF=v3.14.0 npm run generate
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDocs } from './docs/generate.js';

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const ref = process.env.ALPINE_REF ?? 'main';
  generateDocs(ref).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
