# MCP Bridge Integration - Minimal Impact

## How to integrate with minimal changes:

### In useReplContext.jsx:
```javascript
// Add at top
import { useMCPBridge } from './hooks/useMCPBridge';

// In component, add one line:
const { mcpConnected, sendCurrentPattern } = useMCPBridge();

// Add to returned context:
return {
  ...existingProps,
  mcpConnected,  // For UI indicator
  sendCurrentPattern  // Optional: for sending patterns back
};

// Add pattern execution helper (one time):
useEffect(() => {
  window.replExecutePattern = (code) => {
    if (editorRef.current) {
      editorRef.current.setValue(code);
      handleEvaluate(code);
    }
  };
}, [handleEvaluate]);
```

### In Header.jsx (optional):
```javascript
// Show indicator
{mcpConnected && <span className="mcp-indicator">🎵 MCP</span>}
```

## Benefits of this approach:

1. **Single import** - All MCP logic in one hook
2. **Zero impact when disabled** - Returns false/noop on non-localhost
3. **Clean separation** - Can remove by deleting one file and one import
4. **No core changes** - Just adds optional properties to context
5. **Backward compatible** - Works with or without MCP

## To completely remove MCP:
1. Delete `packages/mcp-server/` directory
2. Delete `website/src/repl/hooks/useMCPBridge.js`
3. Remove the import and hook call from useReplContext.jsx
4. Remove indicator from Header.jsx

That's it - 4 simple deletions to completely remove the feature.