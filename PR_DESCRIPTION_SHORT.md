# Add MCP protocol support for AI pattern generation

Enables AI assistants to generate Strudel patterns via Model Context Protocol.

## Changes
- Add `packages/mcp-server/` with MCP server implementation
- Modify REPL to auto-detect and poll pattern bridge
- Add documentation and setup scripts

## Testing
```bash
cd packages/mcp-server
npm install
npm test
```

## Usage
For Claude CLI: `./install-mcp.sh`
For Claude Desktop: Add to config per SETUP_GUIDE.md

The integration is optional and doesn't affect normal Strudel usage.