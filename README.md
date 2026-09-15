# alpine-mcp

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for the complete Alpine.js v3 documentation. It ships a commit-pinned snapshot of the official Markdown and uses [Tobi Lütke's qmd](https://github.com/tobi/qmd) for local full-text search.

[Website](https://alpine-mcp.billynoyes.co.uk/) · [npm](https://www.npmjs.com/package/alpine-mcp)

## Tools

| Tool | Purpose |
|------|---------|
| `search_alpine_docs` | Search individual documentation pages with qmd's BM25 index |
| `read_alpine_doc` | Read a complete page returned by search |

The server also exposes each page as an `alpine://docs/<path>.md` resource. The original combined `alpine://directives`, `alpine://magics`, `alpine://globals`, and `alpine://plugins` resources remain available for compatibility.

## Installation

alpine-mcp requires Node.js 22 or newer.

### Claude Desktop

Add to your `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "alpine": {
      "command": "npx",
      "args": ["-y", "alpine-mcp"]
    }
  }
}
```

Restart Claude Desktop.

### Claude Code

```sh
claude mcp add alpine -- npx -y alpine-mcp
```

### OpenAI Codex

```sh
codex mcp add alpine -- npx -y alpine-mcp
```

Or add it directly to `~/.codex/config.toml`:

```toml
[mcp_servers.alpine]
command = "npx"
args = ["-y", "alpine-mcp"]
```

### Cursor

Add to `~/.cursor/mcp.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "alpine": {
      "command": "npx",
      "args": ["-y", "alpine-mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "alpine": {
      "command": "npx",
      "args": ["-y", "alpine-mcp"]
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json` in your workspace for GitHub Copilot. If the file already exists, merge the `alpine` entry into its top-level `servers` object:

```json
{
  "servers": {
    "alpine": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "alpine-mcp"]
    }
  }
}
```

### Cline and Roo Code

Add a local stdio server through the extension's MCP settings using `npx` as the command and `-y alpine-mcp` as the arguments.

### Any MCP client

```sh
npx -y alpine-mcp
```

Each server process builds a small temporary qmd index at startup. Search is lexical and does not download qmd's optional embedding or reranking models.

## Usage

Once registered, ask your AI assistant questions such as:

- *"How do I use x-transition with custom CSS classes?"*
- *"What modifiers does x-on support?"*
- *"How do I persist state across page loads with Alpine?"*
- *"Show me how to use the Focus plugin for a modal."*

## Documentation updates

The generator resolves an Alpine branch, tag, or SHA to one immutable commit, downloads that commit's GitHub archive, and atomically replaces `docs/` only after every page has been extracted and validated. One upstream Markdown page becomes one local file, so new and removed Alpine pages are discovered without a hand-maintained manifest. `docs/.source.json` records the exact source commit.

Refresh from Alpine's current `main`:

```sh
npm run generate
```

Refresh from a specific release or commit:

```sh
ALPINE_REF=v3.14.9 npm run generate
```

A weekly GitHub Actions workflow runs the same generator and opens or updates a documentation-only pull request on `automation/update-alpine-docs`. It explicitly dispatches the required CI check for that branch, because pull requests created with `GITHUB_TOKEN` do not trigger PR workflows automatically. It never pushes directly to protected `main` or creates version tags.

The repository must enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests**. The updater only creates and updates PRs; it does not approve or merge them. No additional access-token secret is needed.

After reviewing and merging a docs update, bump and commit the package version and publish a matching GitHub Release to ship it to npm. Installed packages use their bundled snapshot; they do not fetch upstream docs at startup. Published builds use committed Markdown rather than making network requests during packaging.

## Publishing

Publishing a GitHub Release automatically validates, builds, and publishes the matching version to npm with provenance. The release tag must match the version in `package.json`, including the `v` prefix—for example, package version `2.0.0` must use tag `v2.0.0`. Pre-releases are published under npm's `next` dist-tag; regular releases use `latest`.

Merge the publishing workflow into the default branch before creating the tag and GitHub Release. npm trusted publishing must authorize `BillyNoyes/alpine-mcp`, the `publish.yml` workflow, and the `npm` GitHub environment. The workflow uses GitHub OIDC to obtain a short-lived publishing credential, so it does not require an npm access-token secret.

## Project structure

- `src/index.ts` initializes the catalog, qmd index, and MCP transport.
- `src/server/` defines the MCP server and registers resource and tool handlers.
- `src/documents/` owns documentation discovery and resource retrieval.
- `src/search/` owns qmd lifecycle and search-result snippets.
- `scripts/docs/` contains the fetch, archive, corpus, and generation pipeline.
- `site/` contains the Vite, Alpine.js, and Tailwind GitHub Pages site.

## Development

```sh
git clone https://github.com/BillyNoyes/alpine-mcp.git
cd alpine-mcp
npm install
npm test
npm run typecheck
npm run build
```

For local MCP configuration, run `node /path/to/alpine-mcp/build/index.js`.

Documentation is sourced from the [official Alpine.js repository](https://github.com/alpinejs/alpine/tree/main/packages/docs/src/en) and redistributed under Alpine's MIT license, included at `docs/ALPINE-LICENSE.txt`.

## License

MIT
