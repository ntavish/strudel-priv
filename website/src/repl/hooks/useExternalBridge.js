// External Pattern Bridge Hook - Enable external pattern sources for Strudel REPL
// This hook provides a generic interface for external tools to send patterns to Strudel
// Examples: OSC controllers, WebSocket connections, MIDI devices, or other integrations
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for connecting external pattern sources to the Strudel REPL
 * @param {Object} editorRef - Reference to the Strudel editor
 * @param {Function} logger - Optional logging function
 * @param {Object} config - Configuration object
 * @param {string} config.bridgeUrl - URL of the external bridge (default: http://localhost:3457)
 * @param {number} config.pollInterval - How often to check for patterns in ms (default: 500)
 * @param {boolean} config.enabled - Whether the bridge is enabled (default: true)
 * @returns {Object} Bridge connection state and methods
 */
export function useExternalBridge(editorRef, logger, config = {}) {
  const {
    bridgeUrl = 'http://localhost:3457',
    pollInterval = 500,
    enabled = true
  } = config;

  const [connected, setConnected] = useState(false);
  const lastPatternId = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Only run on localhost by default for security
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const shouldRun = enabled && isLocalhost;

  // Send current pattern to external bridge
  const sendCurrentPattern = useCallback(async (code) => {
    if (!connected || !shouldRun) return;
    try {
      await fetch(`${bridgeUrl}/current`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
    } catch (e) {
      // Silently fail - external tool might not support this
    }
  }, [connected, bridgeUrl, shouldRun]);

  // External Bridge Polling
  useEffect(() => {
    if (!shouldRun) return;
    
    let intervalId;
    let localRetryCount = 0;
    
    const checkExternalBridge = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`${bridgeUrl}/next`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Bridge responded with status ${response.status}`);
        }
        
        const pattern = await response.json();
        
        // Reset retry count on successful connection
        if (localRetryCount > 0) {
          localRetryCount = 0;
        }
        
        if (!connected) {
          setConnected(true);
          if (logger) {
            logger('🔌 External pattern bridge connected', 'highlight');
          }
        }
        
        // Execute new pattern if available
        if (pattern && pattern.id !== lastPatternId.current && editorRef.current) {
          lastPatternId.current = pattern.id;
          if (logger) {
            logger(`▶️ Executing external pattern: ${pattern.id}`, 'highlight');
          }
          
          try {
            // Set the code in editor
            editorRef.current.setCode(pattern.code);
            
            // Notify bridge of current pattern
            sendCurrentPattern(pattern.code);
            
            // Execute the pattern
            setTimeout(() => {
              if (!editorRef.current.repl.started) {
                editorRef.current.toggle();
              } else {
                editorRef.current.evaluate();
              }
            }, 200);
          } catch (execError) {
            if (logger) {
              logger(`Failed to execute pattern: ${execError.message}`, 'error');
            }
          }
        }
      } catch (e) {
        localRetryCount++;
        
        if (connected) {
          setConnected(false);
          if (logger && localRetryCount >= maxRetries) {
            logger('External bridge disconnected', 'dim');
          }
        }
        
        // Back off on retries
        if (localRetryCount >= maxRetries && intervalId) {
          clearInterval(intervalId);
          // Try reconnecting after 5 seconds
          setTimeout(() => {
            localRetryCount = 0;
            intervalId = setInterval(checkExternalBridge, pollInterval);
          }, 5000);
        }
      }
    };
    
    intervalId = setInterval(checkExternalBridge, pollInterval);
    checkExternalBridge();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [connected, sendCurrentPattern, editorRef, logger, shouldRun, bridgeUrl, pollInterval]);

  return {
    bridgeConnected: connected,
    sendCurrentPattern,
    bridgeUrl
  };
}