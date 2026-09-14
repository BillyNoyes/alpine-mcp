import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import {
  LEGACY_CATEGORIES,
  type LegacyCategory,
} from '../config.js';

export interface AlpineDocument {
  path: string;
  documentPath: string;
  uri: string;
}

export interface ResourceDescription {
  uri: string;
  name: string;
  description: string;
  mimeType: 'text/markdown';
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(path);
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  }));

  return files.flat().sort();
}

function categoryTitle(category: LegacyCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export class DocumentCatalog {
  readonly documents: AlpineDocument[];
  readonly #byUri: Map<string, AlpineDocument>;

  private constructor(documents: AlpineDocument[]) {
    this.documents = documents;
    this.#byUri = new Map(documents.map((document) => [document.uri, document]));
  }

  static async create(docsDirectory: string): Promise<DocumentCatalog> {
    const files = await listMarkdownFiles(docsDirectory);
    const documents = files.map((path) => {
      const documentPath = relative(docsDirectory, path).split(sep).join('/');
      return { path, documentPath, uri: `alpine://docs/${documentPath}` };
    });
    return new DocumentCatalog(documents);
  }

  listResources(): ResourceDescription[] {
    const legacyResources = LEGACY_CATEGORIES.map((category) => ({
      uri: `alpine://${category}`,
      name: `Alpine.js ${categoryTitle(category)}`,
      description: `Combined Alpine.js ${category} documentation`,
      mimeType: 'text/markdown' as const,
    }));
    const documentResources = this.documents.map(({ uri, documentPath }) => ({
      uri,
      name: documentPath.replace(/\.md$/, ''),
      description: `Official Alpine.js documentation page: ${documentPath}`,
      mimeType: 'text/markdown' as const,
    }));

    return [...legacyResources, ...documentResources];
  }

  findByPath(documentPath: string): AlpineDocument | undefined {
    return this.#byUri.get(`alpine://docs/${documentPath}`);
  }

  async readResource(uri: string): Promise<string> {
    const legacyCategory = LEGACY_CATEGORIES.find((category) => uri === `alpine://${category}`);
    if (legacyCategory) return this.#readLegacyResource(legacyCategory);

    const document = this.#byUri.get(uri);
    if (!document) throw new Error(`Resource not found: ${uri}`);
    return readFile(document.path, 'utf8');
  }

  async #readLegacyResource(category: LegacyCategory): Promise<string> {
    const categoryPrefix = `${category}/`;
    const files = this.documents.filter(({ documentPath }) => documentPath.startsWith(categoryPrefix));
    const pages = await Promise.all(files.map(({ path }) => readFile(path, 'utf8')));
    return `# Alpine.js ${categoryTitle(category)}\n\n${pages.join('\n\n---\n\n')}`;
  }
}
