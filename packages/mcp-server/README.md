# Strudel MCP Server

Zero-configuration musical pattern execution for Claude + Strudel.

## What It Does

This MCP server enables Claude to create and automatically execute musical patterns in Strudel, a live coding environment for music. When you ask Claude to create patterns, they instantly play in your browser - no copy-paste required!

## Features

- **Auto-starts everything** - Strudel web server and pattern bridge start automatically
- **Zero copy-paste** - Patterns execute instantly in your browser
- **Visual feedback** - Green "🎵 MCP" indicator shows when connected
- **Built-in polling** - Strudel page automatically detects and executes patterns

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

1. **Restart Claude** - The MCP server loads automatically
2. **Open browser** - Navigate to http://localhost:4321
3. **Look for indicator** - Green "🎵 MCP" badge confirms connection
4. **Create patterns** - Ask Claude to make music!

## Available MCP Tools

### `pattern`
Create any Strudel/TidalCycles pattern:
```javascript
s("bd sd cp sd")
note("c4 e4 g4 c5").s("piano")
```

### `drum`
Create drum patterns with kick, snare, hihat:
- `kick`: "x ~ ~ ~" (x = hit, ~ = rest)
- `snare`: "~ ~ x ~"
- `hihat`: "x x x x"

### `euclidean`
Generate Euclidean rhythms:
- `pulses`: Number of hits
- `steps`: Total steps
- `sound`: Sample to use (default: "bd")

## Architecture

```
Claude (MCP) → Pattern Bridge → Strudel Page → Audio Output
     ↓              ↓               ↓              ↓
  Generate       Queue          Auto-poll      Play music!
  Pattern       Pattern         & Execute
```

## How It Works

1. **MCP Server starts** → Launches pattern bridge (port 3457) and Strudel (port 4321)
2. **Strudel page loads** → Auto-detects bridge, shows indicator
3. **Claude generates pattern** → Sends to bridge via HTTP
4. **Page polls bridge** → Fetches and executes patterns automatically
5. **Music plays** → With visual feedback (green flash)

## Troubleshooting

### No "🎵 MCP" indicator
- Check browser console for errors
- Verify bridge at http://localhost:3457
- Ensure you're on http://localhost:4321 (not 3457)

### Patterns not playing
- Refresh the Strudel page
- Check if bridge is running: `curl http://localhost:3457`
- Restart Claude to reload MCP

### "doc.json not found" error
The server now generates this automatically, but if needed:
```bash
cd ~/strudel && pnpm run jsdoc-json
```

## Files

- `index.js` - Main MCP server with embedded bridge
- `package.json` - Dependencies
- Modified: `~/strudel/website/src/pages/index.astro` - Added auto-polling

## License

AGPL-3.0 (same as Strudel)