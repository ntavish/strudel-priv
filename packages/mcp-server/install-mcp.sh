#!/bin/bash

# Strudel MCP Installation Script
# Properly configures the Strudel MCP server for Claude

set -e  # Exit on error

echo "🎵 Strudel MCP Installation"
echo "==========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get the absolute path to this directory
MCP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MCP_SERVER="$MCP_DIR/index.js"

echo -e "${YELLOW}MCP Server location:${NC} $MCP_SERVER"
echo ""

# Step 1: Check if Node.js is installed
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Step 2: Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
cd "$MCP_DIR"
if [ -f "package.json" ]; then
    npm install @modelcontextprotocol/sdk@0.5.0
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi

# Step 3: Check if Claude CLI is installed
echo ""
echo -e "${YELLOW}Checking Claude CLI...${NC}"
if ! command -v claude &> /dev/null; then
    echo -e "${RED}✗ Claude CLI not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Claude CLI found${NC}"

# Step 4: Remove old configuration if exists
echo ""
echo -e "${YELLOW}Configuring MCP server...${NC}"
if claude mcp list 2>/dev/null | grep -q "strudel"; then
    echo "Removing old configuration..."
    claude mcp remove strudel 2>/dev/null || true
fi

# Step 5: Add MCP server to Claude
echo "Adding Strudel MCP server..."
claude mcp add strudel "node" "$MCP_SERVER"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MCP server added to Claude${NC}"
else
    echo -e "${RED}✗ Failed to add MCP server${NC}"
    exit 1
fi

# Step 6: Verify installation
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"
if claude mcp list | grep -q "strudel"; then
    echo -e "${GREEN}✓ Strudel MCP is configured${NC}"
else
    echo -e "${RED}✗ Configuration verification failed${NC}"
    exit 1
fi

# Step 7: Create uninstall script
cat > "$MCP_DIR/uninstall-mcp.sh" << 'EOF'
#!/bin/bash
echo "Removing Strudel MCP..."
claude mcp remove strudel
echo "✓ Strudel MCP removed"
echo "Note: The files in $(dirname "$0") were not deleted"
EOF
chmod +x "$MCP_DIR/uninstall-mcp.sh"

# Success message
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "What happens now:"
echo ""
echo "1. ${GREEN}Restart Claude${NC} to load the MCP server"
echo "   The MCP will automatically start Strudel"
echo ""
echo "2. ${GREEN}Open your browser${NC} to http://localhost:4321"
echo "   You'll see a green '🎵 MCP' indicator"
echo ""
echo "3. ${GREEN}Make music!${NC} Try these in Claude:"
echo "   • 'Create a drum pattern'"
echo "   • 'Make a euclidean rhythm'"
echo "   • 'Generate a bass line'"
echo ""
echo "Files created:"
echo "  • MCP Server: $MCP_SERVER"
echo "  • Uninstaller: $MCP_DIR/uninstall-mcp.sh"
echo ""
echo -e "${YELLOW}Tip:${NC} If you need to uninstall later, run:"
echo "  $MCP_DIR/uninstall-mcp.sh"
echo ""