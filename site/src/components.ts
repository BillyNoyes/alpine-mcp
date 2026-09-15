import {installOptions, type ClientName} from './install-options';

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

export function createInstallTabs() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let request = 0;

  return {
    clients: installOptions,
    active: 'codex' as ClientName,
    copyState: 'idle' as 'idle' | 'copied' | 'unavailable' | 'error',
    get selected() {
      return installOptions.find(({id}) => id === this.active) ?? installOptions[0];
    },
    get command() {
      return this.selected.code;
    },
    get copyLabel() {
      if (this.copyState === 'copied') return 'Copied';
      if (this.copyState === 'unavailable') return 'Unavailable';
      if (this.copyState === 'error') return 'Try again';
      return 'Copy';
    },
    select(client: ClientName) {
      request += 1;
      clearTimeout(timer);
      this.active = client;
      this.copyState = 'idle';
    },
    async copy() {
      const currentRequest = ++request;
      clearTimeout(timer);
      if (!navigator.clipboard?.writeText) {
        this.copyState = 'unavailable';
        return;
      }

      try {
        await navigator.clipboard.writeText(this.command);
        if (currentRequest !== request) return;
        this.copyState = 'copied';
        timer = setTimeout(() => {
          this.copyState = 'idle';
        }, 2_000);
      } catch {
        if (currentRequest === request) this.copyState = 'error';
      }
    },
    destroy() {
      request += 1;
      clearTimeout(timer);
    },
  };
}
