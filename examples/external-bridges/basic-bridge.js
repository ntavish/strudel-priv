#!/usr/bin/env node

/**
 * Basic External Pattern Bridge for Strudel
 * A minimal HTTP server that allows external tools to send patterns to Strudel
 */

const http = require('http');
const url = require('url');

class PatternBridge {
  constructor(port = 3457) {
    this.port = port;
    this.patternQueue = [];
    this.currentPattern = null;
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      const { pathname } = url.parse(req.url);
      
      // Enable CORS for browser-based tools
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      switch (pathname) {
        case '/pattern':
          this.handlePattern(req, res);
          break;
        case '/next':
          this.handleNext(req, res);
          break;
        case '/current':
          this.handleCurrent(req, res);
          break;
        default:
          res.writeHead(200);
          res.end('Pattern Bridge Active');
      }
    });

    this.server.listen(this.port, () => {
      console.log(`✨ Pattern Bridge started on port ${this.port}`);
      console.log(`📝 Send patterns to: http://localhost:${this.port}/pattern`);
      console.log(`🎵 Open Strudel at: http://localhost:4321`);
    });
  }

  handlePattern(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { code } = JSON.parse(body);
        const pattern = {
          id: Date.now(),
          code,
          timestamp: Date.now()
        };
        this.patternQueue.push(pattern);
        console.log(`📨 Pattern queued: ${code.substring(0, 50)}...`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id: pattern.id }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }

  handleNext(req, res) {
    const pattern = this.patternQueue.shift();
    if (pattern) {
      console.log(`🎵 Pattern sent to Strudel: ${pattern.id}`);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(pattern || null));
  }

  handleCurrent(req, res) {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { code } = JSON.parse(body);
          this.currentPattern = code;
          console.log(`📝 Current pattern updated`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: this.currentPattern || '' }));
    }
  }

  // Example: Send a test pattern
  sendTestPattern() {
    const patterns = [
      's("bd sd bd sd")',
      's("hh*8").gain(0.4)',
      'note("c3 e3 g3 c4").s("piano")',
      's("bd").euclidean(5,8)'
    ];
    const code = patterns[Math.floor(Math.random() * patterns.length)];
    
    this.patternQueue.push({
      id: Date.now(),
      code,
      timestamp: Date.now()
    });
    console.log(`🎲 Test pattern added: ${code}`);
  }
}

// Start the bridge
const bridge = new PatternBridge();
bridge.start();

// Send a test pattern every 10 seconds (optional)
if (process.argv.includes('--demo')) {
  setInterval(() => bridge.sendTestPattern(), 10000);
  console.log('📍 Demo mode: Sending test patterns every 10 seconds');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bridge...');
  process.exit(0);
});