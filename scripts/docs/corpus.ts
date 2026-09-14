import { readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { REQUIRED_PAGES } from './config.js';

export function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/^---\n[\s\S]*?\n---\n*/m, '')
    .replace(/<!-- START_VERBATIM -->[\s\S]*?<!-- END_VERBATIM -->\n*/g, '')
    .replace(/<a name="[^"]*"><\/a>\n*/g, '')
    .trim()
    .concat('\n');
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(path);
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  }));

  return files.flat().sort();
}

export function validateCorpus(documentPaths: string[]): void {
  const available = new Set(documentPaths);
  const missing = REQUIRED_PAGES.filter((path) => !available.has(path));
  if (documentPaths.length < 40 || missing.length > 0) {
    throw new Error(
      `Incomplete Alpine documentation snapshot: ${documentPaths.length} pages; missing ${missing.join(', ') || 'required page count'}`,
    );
  }
}

export async function prepareCorpus(directory: string): Promise<string[]> {
  const files = await listMarkdownFiles(directory);
  if (files.length === 0) throw new Error('The Alpine archive did not contain any Markdown documentation');

  const pages: string[] = [];
  for (const file of files) {
    const cleaned = cleanMarkdown(await readFile(file, 'utf8'));
    if (!cleaned.trim()) {
      await unlink(file);
      continue;
    }
    await writeFile(file, cleaned);
    pages.push(relative(directory, file).split(sep).join('/'));
  }

  validateCorpus(pages);
  return pages;
}
