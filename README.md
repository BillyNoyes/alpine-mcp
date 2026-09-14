# alpine-mcp

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for the complete Alpine.js v3 documentation. It ships a commit-pinned snapshot of the official Markdown and uses [Tobi Lütke's qmd](https://github.com/tobi/qmd) for local full-text search.

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

### VS Code

Add to your user or workspace settings:

```json
{
  "mcp": {
    "servers": {
      "alpine": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "alpine-mcp"]
      }
    }
  }
}
```

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

A weekly GitHub Actions workflow runs the same generator. Published builds use the committed snapshot rather than making network requests during packaging.

## Publishing

Publishing a GitHub Release automatically validates, builds, and publishes the matching version to npm with provenance. The release tag must match the version in `package.json`, including the `v` prefix—for example, package version `2.0.0` must use tag `v2.0.0`. Pre-releases are published under npm's `next` dist-tag; regular releases use `latest`.

Merge the publishing workflow into the default branch before creating the tag and GitHub Release. npm trusted publishing must authorize `BillyNoyes/alpine-mcp`, the `publish.yml` workflow, and the `npm` GitHub environment. The workflow uses GitHub OIDC to obtain a short-lived publishing credential, so it does not require an npm access-token secret.

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
