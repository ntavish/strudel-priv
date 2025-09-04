# Strudel Branch Architecture - Separation of Concerns

## Current State Analysis

### ❌ PROBLEM: Violation of Separation of Concerns

The current branches have improper mixing of features:

1. **mcp-integration branch** - Has DIRECT MCP hook (`useMCPBridge`) in the UI
   - This violates community preferences against AI/MCP integration
   - Direct coupling to specific external tool

2. **fractal-features branch** - Currently contaminated with both:
   - External Bridge (good - generic integration point)
   - MCP Bridge (bad - direct AI integration)
   - Both hooks active simultaneously

### ✅ CORRECT Architecture

The proper separation should be:

## 1. plugin-bridge Branch (APPROVED)
**Purpose**: Generic integration point for ANY external tool
- ✅ External Bridge only (`useExternalBridge`)
- ✅ HTTP polling on port 3457
- ✅ No specific tool references
- ✅ Community approved approach
- ✅ Can be used by MCP, OSC, MIDI, or any tool

## 2. fractal-features Branch (SHOULD BE PURE)
**Purpose**: Advanced fractal algorithms for music generation
- ✅ Fractal functions (perlin, mandelbrot, julia, etc.)
- ✅ No integration hooks at all
- ✅ Pure algorithmic features
- ✅ Can be merged to main independently

## 3. mcp-integration Branch (SEPARATE TOOL)
**Purpose**: MCP server as external tool
- ✅ Standalone MCP server in packages/mcp-server
- ✅ Communicates THROUGH External Bridge
- ❌ Should NOT have direct UI hooks
- ❌ Should NOT modify useReplContext.jsx

## Proper Integration Flow

```
Claude/AI Tools
      ↓
MCP Server (packages/mcp-server)
      ↓
Pattern Bridge (port 3457)
      ↓
External Bridge (useExternalBridge)
      ↓
Strudel REPL
```

## Required Fixes

1. **mcp-integration branch**: Remove `useMCPBridge` hook from UI
2. **fractal-features branch**: Remove all bridge code (keep only fractals)
3. Keep MCP server as standalone package that uses External Bridge

## Why This Matters

- **Community Trust**: Direct AI integration was rejected
- **Modularity**: Features should be independent
- **Flexibility**: Any tool can use the External Bridge
- **Clean PRs**: Each feature can be reviewed/merged separately

## Testing Separation

To verify proper separation:
```bash
# Check if branch has direct MCP references in UI
git grep -l "useMCPBridge\|mcpConnected" website/src/repl/

# Should return nothing in clean branches
```

## Conclusion

The External Bridge is the ONLY approved integration point. All external tools (including MCP) must go through it, not directly into Strudel's UI.