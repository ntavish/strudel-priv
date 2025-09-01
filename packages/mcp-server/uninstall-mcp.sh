#!/bin/bash
echo "Removing Strudel MCP..."
claude mcp remove strudel
echo "✓ Strudel MCP removed"
echo "Note: The files in $(dirname "$0") were not deleted"
