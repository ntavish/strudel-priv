// MCP Bridge Hook - Isolated integration for Strudel REPL
// All MCP-related logic extracted to this single file for easy removal
import { useState, useEffect, useRef, useCallback } from 'react';

export function useMCPBridge(editorRef, logger) {
  const [mcpConnected, setMcpConnected] = useState(false);
  const lastPatternId = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Only run on localhost
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Send current pattern to MCP bridge
  const sendCurrentPattern = useCallback(async (code) => {
    if (!mcpConnected) return;
    try {
      await fetch('http://localhost:3457/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
    } catch (e) {
      // Silently fail
    }
  }, [mcpConnected]);

  // MCP Bridge Integration
  useEffect(() => {
    if (!isLocalhost) return;
    
    let intervalId;
    let localRetryCount = 0;
    
    const checkMcpBridge = async () => {
      try {
        // Create timeout with fallback for older browsers
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch('http://localhost:3457/next', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`MCP Bridge responded with status ${response.status}`);
        }
        
        const pattern = await response.json();
        
        // Reset retry count on successful connection
        if (localRetryCount > 0) {
          localRetryCount = 0;
        }
        
        if (!mcpConnected) {
          setMcpConnected(true);
          if (logger) {
            logger('🎵 MCP Bridge connected! Patterns will auto-execute.', 'highlight');
          }
        }
        
        if (pattern && pattern.id !== lastPatternId.current && editorRef.current) {
          lastPatternId.current = pattern.id;
          if (logger) {
            logger(`🎵 Executing MCP pattern: ${pattern.id}`, 'highlight');
          }
          
          try {
            // Always set the code first
            editorRef.current.setCode(pattern.code);
            
            // Send the new pattern to MCP bridge
            sendCurrentPattern(pattern.code);
            
            // Then handle playback with a slight delay
            setTimeout(() => {
              // Use toggle() to evaluate and auto-start
              // This mimics clicking the play button
              if (!editorRef.current.repl.started) {
                editorRef.current.toggle();
              } else {
                // If already playing, just evaluate the new pattern
                editorRef.current.evaluate();
              }
            }, 200);
          } catch (execError) {
            if (logger) {
              logger(`🎵 Failed to execute pattern: ${execError.message}`, 'error');
            }
          }
        }
      } catch (e) {
        localRetryCount++;
        
        if (mcpConnected) {
          setMcpConnected(false);
          if (logger) {
            if (localRetryCount >= maxRetries) {
              logger('MCP Bridge disconnected after multiple retries', 'dim');
            } else {
              logger(`MCP Bridge connection lost, retrying... (${localRetryCount}/${maxRetries})`, 'dim');
            }
          }
        }
        
        // Back off on retries
        if (localRetryCount >= maxRetries && intervalId) {
          clearInterval(intervalId);
          // Try reconnecting after 5 seconds
          setTimeout(() => {
            localRetryCount = 0;
            intervalId = setInterval(checkMcpBridge, 500);
          }, 5000);
        }
      }
    };
    
    intervalId = setInterval(checkMcpBridge, 500);
    checkMcpBridge();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [mcpConnected, sendCurrentPattern, editorRef, logger, isLocalhost]);

  return {
    mcpConnected,
    sendCurrentPattern
  };
}