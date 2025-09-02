# External Pattern Bridge

Enable external tools to send patterns to Strudel REPL via a simple HTTP interface.

## Overview

The External Pattern Bridge allows any external tool to send patterns to Strudel for immediate execution. This enables integration with:

- OSC controllers
- MIDI devices
- WebSocket connections
- Mobile apps
- Hardware controllers
- Custom tools and scripts
- Any HTTP-capable device or software

## How It Works

1. External tool sends patterns to a local HTTP bridge (default: `http://localhost:3457`)
2. Strudel REPL polls the bridge for new patterns
3. When a pattern is received, it's automatically executed
4. Current pattern can be sent back to the bridge for bidirectional communication

## Bridge Protocol

The bridge uses a simple HTTP protocol:

### POST /pattern
Send a new pattern to be executed:
```json
{
  "code": "s(\"bd sd bd sd\")"
}
```

### GET /next
Retrieve the next pattern to execute:
```json
{
  "id": 1234567890,
  "code": "s(\"bd sd bd sd\")"
}
```

### POST /current
Update the current pattern (sent from REPL):
```json
{
  "code": "s(\"bd sd bd sd\")"
}
```

## Implementation Example

Here's a minimal Node.js bridge server:

```javascript
const http = require('http');

class PatternBridge {
  constructor(port = 3457) {
    this.port = port;
    this.patternQueue = [];
    this.currentPattern = null;
  }

  start() {
    const server = http.createServer((req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const { pathname } = require('url').parse(req.url);
      
      switch (pathname) {
        case '/pattern':
          // Queue a new pattern
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            const { code } = JSON.parse(body);
            this.patternQueue.push({
              id: Date.now(),
              code
            });
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
          });
          break;
          
        case '/next':
          // Get next pattern
          const pattern = this.patternQueue.shift();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(pattern || null));
          break;
          
        case '/current':
          // Update current pattern from REPL
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              const { code } = JSON.parse(body);
              this.currentPattern = code;
              res.writeHead(200);
              res.end(JSON.stringify({ success: true }));
            });
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ code: this.currentPattern }));
          }
          break;
          
        default:
          res.writeHead(200);
          res.end('Pattern Bridge Active');
      }
    });
    
    server.listen(this.port, () => {
      console.log(`Pattern Bridge running on port ${this.port}`);
    });
  }
}

// Start the bridge
new PatternBridge().start();
```

## Use Cases

### OSC Controller
```python
# Python example with python-osc
from pythonosc import udp_client
import requests

def osc_to_strudel(address, *args):
    pattern = f's("{args[0]}")' 
    requests.post('http://localhost:3457/pattern', 
                  json={'code': pattern})
```

### MIDI Device
```javascript
// WebMIDI example
navigator.requestMIDIAccess().then(access => {
  access.inputs.forEach(input => {
    input.onmidimessage = (msg) => {
      const note = msg.data[1];
      const velocity = msg.data[2];
      const pattern = `note(${note}).gain(${velocity/127})`;
      fetch('http://localhost:3457/pattern', {
        method: 'POST',
        body: JSON.stringify({ code: pattern })
      });
    };
  });
});
```

### Mobile App
Build a mobile controller that sends patterns via HTTP to your computer running Strudel.

### Hardware Integration
Connect Arduino, Raspberry Pi, or other hardware to generate patterns based on sensors.

## Configuration

The bridge can be configured in useReplContext:

```javascript
const { bridgeConnected } = useExternalBridge(editorRef, logger, {
  bridgeUrl: 'http://localhost:3457',  // Bridge URL
  pollInterval: 500,                    // Poll rate in ms
  enabled: true                         // Enable/disable
});
```

## Security Note

The bridge only works on localhost by default for security. Never expose the bridge to the internet without proper authentication.

## Contributing

The External Pattern Bridge is designed to be simple and extensible. Contributions welcome for:
- Additional bridge implementations
- Security enhancements
- Protocol extensions
- Integration examples