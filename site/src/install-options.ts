const stdioServer = {command: 'npx', args: ['-y', 'alpine-mcp']};
const mcpConfig = JSON.stringify({mcpServers: {alpine: stdioServer}}, null, 2);

export const installOptions = [
  {
    id: 'codex',
    label: 'Codex',
    location: 'Terminal',
    instructions: 'Run this command to register alpine-mcp with Codex.',
    code: 'codex mcp add alpine -- npx -y alpine-mcp',
  },
  {
    id: 'claude',
    label: 'Claude Code',
    location: 'Terminal',
    instructions: 'Run this command to register alpine-mcp with Claude Code.',
    code: 'claude mcp add alpine -- npx -y alpine-mcp',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    location: '.cursor/mcp.json',
    instructions: 'Add this configuration to your project. If the file already exists, merge the alpine entry into mcpServers.',
    code: mcpConfig,
  },
  {
    id: 'vscode',
    label: 'VS Code',
    location: '.vscode/mcp.json',
    instructions: 'Add this configuration to your workspace for GitHub Copilot. If the file already exists, merge the alpine entry into servers.',
    code: JSON.stringify({servers: {alpine: {type: 'stdio', ...stdioServer}}}, null, 2),
  },
  {
    id: 'desktop',
    label: 'Claude Desktop',
    location: 'claude_desktop_config.json',
    instructions: 'Open Settings → Developer → Edit Config. Merge the alpine entry into mcpServers, save, and restart Claude Desktop.',
    code: mcpConfig,
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    location: '~/.codeium/windsurf/mcp_config.json',
    instructions: 'Add this configuration to Windsurf’s MCP config. If the file already exists, merge the alpine entry into mcpServers.',
    code: mcpConfig,
  },
  {
    id: 'direct',
    label: 'Direct',
    location: 'Terminal',
    instructions: 'Launch the stdio server directly, or configure another MCP client to run npx with arguments -y and alpine-mcp. This command does not register a client.',
    code: 'npx -y alpine-mcp',
  },
] as const;

export type ClientName = typeof installOptions[number]['id'];
