# alpine-mcp

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that provides the complete Alpine.js documentation as resources. Gives AI assistants accurate, up-to-date reference when building with Alpine.js.

## Resources

| URI | Contents |
|-----|----------|
| `alpine://directives` | All directives — x-data, x-show, x-bind, x-on, x-model, x-for, x-transition, x-effect, x-ref, x-cloak, x-teleport, x-id, and more |
| `alpine://magics` | All magic properties — $el, $refs, $store, $watch, $dispatch, $nextTick, $root, $data, $id |
| `alpine://globals` | Global API — Alpine.data(), Alpine.store(), Alpine.bind() |
| `alpine://plugins` | Official plugins — Mask, Intersect, Persist, Focus, Collapse, Anchor, Morph, Sort |

## Installation

### Claude Desktop (recommended)

Add the following to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

Restart Claude Desktop. The Alpine.js docs will be available as resources in every conversation.

### Other MCP clients

Any client that supports the Model Context Protocol stdio transport can use this server. Run it directly:

```sh
npx alpine-mcp
```

Or install globally:

```sh
npm install -g alpine-mcp
alpine-mcp
```

## Usage

Once registered, ask your AI assistant about Alpine.js and it will automatically reference the accurate documentation. For example:

- *"How do I use x-transition with custom CSS classes?"*
- *"What modifiers does x-on support?"*
- *"How do I persist state across page loads with Alpine?"*
- *"Show me how to use the Focus plugin for a modal."*

## Development

```sh
git clone https://github.com/BillyNoyes/alpine-mcp.git
cd alpine-mcp
npm install
npm run build
```

### Local Claude Desktop config

```json
{
  "mcpServers": {
    "alpine": {
      "command": "node",
      "args": ["/path/to/alpine-mcp/build/index.js"]
    }
  }
}
```

## Content

Documentation content is sourced directly from the [official Alpine.js repository](https://github.com/alpinejs/alpine/tree/main/packages/docs/src/en) and covers Alpine.js v3.

## License

MIT
