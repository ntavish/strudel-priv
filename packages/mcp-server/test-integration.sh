#!/bin/bash

# Integration test for MCP server
echo "MCP Integration Test"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test if server can start
echo "1. Testing server startup..."
timeout 3 node index.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

# Check if bridge is responding
if curl -s http://localhost:3457 > /dev/null; then
    echo -e "${GREEN}✓ Pattern bridge responding${NC}"
else
    echo -e "${RED}✗ Pattern bridge not responding${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Test sending a pattern
echo ""
echo "2. Testing pattern submission..."
RESPONSE=$(curl -s -X POST http://localhost:3457/pattern \
    -H "Content-Type: application/json" \
    -d '{"code":"s(\"bd sd\")"}')

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Pattern accepted${NC}"
else
    echo -e "${RED}✗ Pattern rejected${NC}"
fi

# Test pattern retrieval
echo ""
echo "3. Testing pattern retrieval..."
NEXT=$(curl -s http://localhost:3457/next)
if echo "$NEXT" | grep -q "bd sd"; then
    echo -e "${GREEN}✓ Pattern retrieved${NC}"
else
    echo -e "${RED}✗ Pattern not found${NC}"
fi

# Clean up
kill $SERVER_PID 2>/dev/null
echo ""
echo "Integration test complete!"