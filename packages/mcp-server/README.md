# Strudel MCP Server

Enables AI assistants to generate Strudel patterns via Model Context Protocol.

## What It Does

This MCP server allows Claude and other AI assistants to send musical patterns to Strudel through a standalone external server that communicates via the Pattern Bridge.

## Features

- Standalone server that runs separately from Strudel
- Communicates through HTTP Pattern Bridge on port 3457
- Simple interface with just two tools: pattern creation and retrieval
- No direct UI integration - respects separation of concerns

## Installation

### Prerequisites
- Node.js installed
- pnpm (`npm install -g pnpm`)
- Claude CLI (`npm install -g @anthropic-ai/claude-cli`)

### Quick Install (Recommended)
```bash
cd ~/strudel/packages/mcp-server
./install-mcp.sh
```

This script will:
- Install dependencies
- Configure Claude MCP
- Verify the setup
- Create an uninstaller

### Manual Setup
```bash
# Install dependencies
cd ~/strudel/packages/mcp-server
npm install @modelcontextprotocol/sdk@0.5.0

# Add to Claude
claude mcp add strudel "node" "$(pwd)/index.js"

# Verify
claude mcp list
# Should show: strudel ... ✓ Connected
```

## Usage

1. **Start MCP server** - The server will launch the pattern bridge
2. **Open Strudel** - Navigate to http://localhost:4321 
3. **Use Claude** - Ask Claude to create patterns
4. **Patterns execute** - Via the pattern bridge connection

## Available MCP Tools

### `pattern`
Create any Strudel/TidalCycles pattern:
```javascript
s("bd sd cp sd")
note("c4 e4 g4 c5").s("piano")
s("bd").euclid(3, 8)  // Euclidean rhythms
stack(s("bd*4"), s("hh*8"))  // Layered patterns
```

### `getCurrentPattern`
Retrieve the current pattern from the Strudel REPL for analysis or modification.

## Architecture

```
Claude (MCP) → Pattern Bridge → Strudel Page → Audio Output
     ↓              ↓               ↓              ↓
  Generate       Queue          Auto-poll      Play music!
  Pattern       Pattern         & Execute
```

## How It Works

1. **MCP Server starts** → Launches pattern bridge on port 3457
2. **Bridge waits** → Listens for pattern submissions
3. **Claude generates pattern** → Sends to bridge via MCP tools
4. **Strudel polls bridge** → If configured with External Bridge
5. **Pattern executes** → Music plays in browser

## Troubleshooting

### Bridge not connecting
- Verify bridge at http://localhost:3457
- Check if Strudel has External Bridge enabled
- Ensure proper network permissions

### Patterns not playing
- Check if bridge is running: `curl http://localhost:3457`
- Verify Strudel is configured to poll the bridge
- Restart Claude to reload MCP

## Files

- `index.js` - Main MCP server with embedded pattern bridge
- `package.json` - Dependencies
- `README.md` - This documentation

## License

AGPL-3.0 (same as Strudel)