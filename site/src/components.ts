interface SearchDocument {
  path: string;
  title: string;
  excerpt: string;
  terms: string;
}

const documents: SearchDocument[] = [
  {
    path: 'plugins/persist.md',
    title: 'Persist plugin',
    excerpt: 'Keep Alpine state across page loads with the $persist magic property.',
    terms: 'persist state local storage reload plugin',
  },
  {
    path: 'directives/transition.md',
    title: 'x-transition',
    excerpt: 'Apply smooth enter and leave transitions to elements controlled by Alpine.',
    terms: 'transition animation enter leave duration opacity scale',
  },
  {
    path: 'directives/model.md',
    title: 'x-model',
    excerpt: 'Bind input values to Alpine data with modifiers for common form behavior.',
    terms: 'model input form bind debounce number boolean',
  },
  {
    path: 'magics/watch.md',
    title: '$watch',
    excerpt: 'Run a callback when a component property changes.',
    terms: 'watch state callback change reactive',
  },
  {
    path: 'directives/on.md',
    title: 'x-on',
    excerpt: 'Listen for browser events and run Alpine expressions.',
    terms: 'on event click keyboard modifier debounce throttle',
  },
  {
    path: 'globals/alpine-store.md',
    title: 'Alpine.store()',
    excerpt: 'Share reactive state between components on the page.',
    terms: 'store global state reactive components',
  },
];

function rankDocument(document: SearchDocument, terms: string[]): number {
  const searchable = `${document.title} ${document.excerpt} ${document.terms}`.toLowerCase();
  return terms.reduce((score, term) => score + (searchable.includes(term) ? 1 : 0), 0);
}

export function createSearchDemo() {
  return {
    query: 'persist state',
    results: documents.slice(0, 3),
    search() {
      const terms = this.query.toLowerCase().match(/[\w$-]{2,}/g) ?? [];
      if (terms.length === 0) {
        this.results = documents.slice(0, 3);
        return;
      }

      const ranked = documents
        .map((document) => ({document, score: rankDocument(document, terms)}))
        .filter(({score}) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({document}) => document);
      this.results = ranked;
    },
  };
}

const installCommands = {
  codex: 'codex mcp add alpine -- npx -y alpine-mcp',
  claude: 'claude mcp add alpine -- npx -y alpine-mcp',
  direct: 'npx -y alpine-mcp',
} as const;

type ClientName = keyof typeof installCommands;

export function createInstallTabs() {
  return {
    active: 'codex' as ClientName,
    copyState: 'idle' as 'idle' | 'copied' | 'unavailable' | 'error',
    get command() {
      return installCommands[this.active];
    },
    get copyLabel() {
      if (this.copyState === 'copied') return 'Copied';
      if (this.copyState === 'unavailable') return 'Unavailable';
      if (this.copyState === 'error') return 'Try again';
      return 'Copy';
    },
    select(client: ClientName) {
      this.active = client;
      this.copyState = 'idle';
    },
    async copy() {
      if (!navigator.clipboard?.writeText) {
        this.copyState = 'unavailable';
        return;
      }

      try {
        await navigator.clipboard.writeText(this.command);
        this.copyState = 'copied';
        window.setTimeout(() => {
          this.copyState = 'idle';
        }, 2_000);
      } catch {
        this.copyState = 'error';
      }
    },
  };
}
