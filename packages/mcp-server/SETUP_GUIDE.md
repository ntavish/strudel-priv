# Strudel MCP Universal Setup Guide

Complete guide for setting up Strudel MCP on any Claude platform.

## Platform-Specific Setup

### 🖥️ Claude Desktop App

#### Mac
1. Open Finder and press `Cmd+Shift+G`
2. Go to: `~/Library/Application Support/Claude/`
3. Edit or create `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "strudel": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/strudel/packages/mcp-server/index.js"]
    }
  }
}
```

#### Windows
1. Press `Win+R` and type: `%APPDATA%\Claude`
2. Edit or create `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "strudel": {
      "command": "node",
      "args": ["C:\\Users\\YOUR_USERNAME\\strudel\\packages\\mcp-server\\index.js"]
    }
  }
}
```

#### Linux
1. Open terminal and navigate to: `~/.config/Claude/`
2. Edit or create `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "strudel": {
      "command": "node",
      "args": ["/home/YOUR_USERNAME/strudel/packages/mcp-server/index.js"]
    }
  }
}
```

### 💻 Claude Code (CLI)

#### Automatic Setup
```bash
cd ~/strudel/packages/mcp-server
./install-mcp.sh
```

#### Manual Setup
```bash
# Install dependencies
cd ~/strudel/packages/mcp-server
npm install @modelcontextprotocol/sdk

# Add to Claude Code
claude mcp add strudel "node" "$(pwd)/index.js"

# Verify
claude mcp list
```

### 🌐 Claude.ai (Web)

MCP is not directly available in the web version, but you can:
1. Use Claude Code or Desktop as a bridge
2. Run the pattern bridge separately and manually copy patterns

## Quick Start Package

For easy distribution, create a standalone package:

```bash
# Create standalone directory
mkdir strudel-mcp-standalone
cd strudel-mcp-standalone

# Copy essential files
cp -r ~/strudel/packages/mcp-server/* .

# Create package.json with all dependencies
cat > package.json << 'EOF'
{
  "name": "strudel-mcp",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "scripts": {
    "start": "node index.js",
    "setup": "./install-mcp.sh"
  }
}
EOF

# Create universal installer
cat > setup.sh << 'EOF'
#!/bin/bash
echo "🎵 Strudel MCP Universal Setup"
echo "=============================="

# Detect platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
else
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
fi

# Install dependencies
npm install

# Get absolute path
MCP_PATH="$(pwd)/index.js"

echo ""
echo "Add this to your Claude config at:"
echo "$CONFIG_PATH"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "strudel": {'
echo '      "command": "node",'
echo "      \"args\": [\"$MCP_PATH\"]"
echo '    }'
echo '  }'
echo '}'
echo ""
echo "Then restart Claude!"
EOF

chmod +x setup.sh
```

## Minimal Requirements

The absolute minimum files needed:

1. **index.js** - The MCP server (already exists)
2. **package.json** - With MCP SDK dependency
3. **A running Strudel instance** (can be separate)

## Environment Variables

Customize ports if needed:

```json
{
  "mcpServers": {
    "strudel": {
      "command": "node",
      "args": ["/path/to/index.js"],
      "env": {
        "STRUDEL_PORT": "5000",
        "BRIDGE_PORT": "3458"
      }
    }
  }
}
```

## Testing Your Setup

1. **Check MCP connection:**
   - Claude Desktop: Look for "strudel" in Tools menu
   - Claude Code: Run `claude mcp list`

2. **Test pattern generation:**
   ```
   Ask: "Create a simple drum pattern with Strudel"
   ```

3. **Verify browser:**
   - Open http://localhost:4321
   - Look for green "🎵 MCP" indicator

## Troubleshooting by Platform

### All Platforms
- Ensure Node.js 16+ is installed
- Use absolute paths in configuration
- Restart Claude after config changes

### Claude Desktop
- Check logs: Help → Toggle Developer Tools → Console
- Verify config file location is correct
- Ensure JSON syntax is valid

### Claude Code
- Run `claude mcp list` to check status
- Use `claude mcp logs strudel` for debugging
- Try `claude mcp restart strudel`

## Distribution Package

Create a zip file for easy sharing:

```bash
# Create distribution
cd ~/strudel
zip -r strudel-mcp.zip \
  packages/mcp-server/index.js \
  packages/mcp-server/package.json \
  packages/mcp-server/install-mcp.sh \
  packages/mcp-server/SETUP_GUIDE.md \
  packages/mcp-server/README.md

echo "Share strudel-mcp.zip with others!"
```

## Support

- Issues: https://github.com/tidalcycles/strudel/issues
- Discord: Strudel/TidalCycles community
- Docs: https://strudel.cc