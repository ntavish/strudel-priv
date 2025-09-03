#!/usr/bin/env node

/**
 * Strudel MCP Server - Integrated Edition
 * Automatically starts pattern bridge and Strudel web server
 * Zero configuration required!
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { parse } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';
import { transpiler } from '@strudel/transpiler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pattern Bridge embedded
class PatternBridge {
  constructor(port = 3457) {
    this.port = port;
    this.patternQueue = [];
    this.currentPattern = null;
    this.server = null;
  }

  start() {
    return new Promise((resolve) => {
      this.server = createServer((req, res) => {
        const { pathname } = parse(req.url);
        
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
          case '/inject':
            this.handleInject(req, res);
            break;
          case '/error':
            this.handleError(req, res);
            break;
          case '/status':
            this.handleStatus(req, res);
            break;
          default:
            res.writeHead(200);
            res.end('Pattern Bridge Active');
        }
      });

      this.server.listen(this.port, () => {
        console.error(`✨ Pattern Bridge started on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${this.port} already in use, bridge might be running`);
          resolve(); // Continue anyway
        }
      });
    });
  }

  handlePattern(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { code } = JSON.parse(body);
        
        // Validate pattern syntax
        try {
          transpiler(code);
        } catch (syntaxError) {
          // Report syntax error
          this.lastError = {
            error: syntaxError.message,
            pattern: code,
            timestamp: Date.now()
          };
          console.error(`❌ Pattern syntax error: ${syntaxError.message}`);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: syntaxError.message 
          }));
          return;
        }
        
        this.patternQueue.push({
          id: Date.now(),
          code,
          timestamp: Date.now()
        });
        console.error(`📨 Pattern queued: ${code.substring(0, 50)}...`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }


  handleNext(req, res) {
    // Peek at the first pattern without removing it
    const pattern = this.patternQueue[0];
    if (pattern) {
      // Only remove if it's been sitting for more than 10 seconds (assume executed)
      if (Date.now() - pattern.timestamp > 10000) {
        this.patternQueue.shift();
        console.error(`🎵 Pattern cleared after execution`);
      } else {
        console.error(`🎵 Pattern available for execution`);
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(pattern || null));
  }

  handleCurrent(req, res) {
    if (req.method === 'POST') {
      // Update current pattern from REPL
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { code } = JSON.parse(body);
          this.currentPattern = code;
          console.error(`📝 Current pattern updated`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    } else {
      // GET current pattern for MCP
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: this.currentPattern || '' }));
    }
  }

  handleError(req, res) {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { error, pattern, timestamp } = JSON.parse(body);
          console.error(`❌ Pattern error received:`);
          console.error(`   Error: ${error}`);
          console.error(`   Pattern: ${pattern?.substring(0, 50)}...`);
          this.lastError = { error, pattern, timestamp: timestamp || Date.now() };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    } else {
      // GET last error for debugging
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ lastError: this.lastError || null }));
    }
  }

  handleStatus(req, res) {
    // GET status including last error if any
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connected: true,
      queueLength: this.patternQueue.length,
      currentPattern: this.currentPattern ? this.currentPattern.substring(0, 100) + '...' : null,
      lastError: this.lastError || null,
      uptime: process.uptime()
    }));
  }


  handleInject(req, res) {
    const script = `
(function() {
  console.log('🎵 Strudel Auto-Execute Active');
  let lastId = null;
  
  async function poll() {
    try {
      const r = await fetch('http://localhost:${this.port}/next');
      const p = await r.json();
      if (p && p.id !== lastId) {
        lastId = p.id;
        const e = document.querySelector('strudel-editor')?.editor;
        if (e) {
          e.setCode(p.code);
          e.evaluate();
          document.body.style.animation = 'flash 0.5s';
        }
      }
    } catch (e) {}
  }
  
  setInterval(poll, 500);
  poll();
  
  // Add indicator
  const i = document.createElement('div');
  i.innerHTML = '🎵 Auto';
  i.style.cssText = 'position:fixed;top:10px;right:10px;background:#0f0;color:#000;padding:5px;border-radius:5px;z-index:9999;';
  document.body.appendChild(i);
  
  // Add flash animation
  const s = document.createElement('style');
  s.textContent = '@keyframes flash { 0% { box-shadow: 0 0 20px #0f0; } 100% { box-shadow: none; } }';
  document.head.appendChild(s);
})();
    `.trim();
    
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(script);
  }
}

// Start Strudel Web Server
async function startStrudel() {
  try {
    // Check if already running
    const response = await fetch('http://localhost:4321');
    if (response.ok) {
      console.error('✅ Strudel already running at http://localhost:4321');
      return;
    }
  } catch (e) {
    // Not running, start it
    console.error('🚀 Starting Strudel web server...');
    const strudelPath = path.join(process.env.HOME, 'strudel');
    const websitePath = path.join(strudelPath, 'website');
    
    // Generate doc.json first (required for Strudel to work)
    console.error('📝 Generating documentation...');
    spawn('pnpm', ['run', 'jsdoc-json'], {
      cwd: strudelPath,
      stdio: 'ignore'
    });
    
    // Start the dev server
    const child = spawn('npx', ['astro', 'dev', '--host', '0.0.0.0'], {
      cwd: websitePath,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    
    // Wait for it to start
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        const res = await fetch('http://localhost:4321');
        if (res.ok) {
          console.error('✅ Strudel started at http://localhost:4321');
          return;
        }
      } catch (e) {}
    }
    console.error('⚠️ Strudel start timeout - please start manually');
  }
}

// Send pattern to bridge
async function sendToBridge(code) {
  try {
    const response = await fetch('http://localhost:3457/pattern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (response.ok) {
      return { success: true, message: '🎵 Pattern sent!' };
    }
  } catch (e) {}
  return { success: false, message: 'Copy pattern to Strudel' };
}

// Initialize services
const bridge = new PatternBridge();
let servicesStarted = false;

async function ensureServices() {
  if (!servicesStarted) {
    console.error('🎭 Initializing Strudel services...');
    await bridge.start();
    await startStrudel();
    servicesStarted = true;
    console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Strudel MCP Ready!

🎵 Strudel will open at: http://localhost:4321
🤖 Pattern Bridge running on port 3457
✨ Patterns will auto-execute!

Just open your browser and start making music!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }
}

// MCP Server
const server = new Server({
  name: 'strudel-mcp',
  version: '0.2.0',
}, {
  capabilities: {
    tools: {},
  },
});

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  await ensureServices(); // Start services on first request
  
  return {
    tools: [
      {
        name: 'pattern',
        description: 'Create any Strudel pattern',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'Pattern code' },
          },
          required: ['code'],
        },
      },
      {
        name: 'getCurrentPattern',
        description: 'Get the current pattern from the Strudel REPL',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'drum',
        description: 'Create a drum pattern',
        inputSchema: {
          type: 'object',
          properties: {
            kick: { type: 'string', description: 'Kick pattern', default: 'x ~ ~ ~' },
            snare: { type: 'string', description: 'Snare', default: '~ ~ x ~' },
            hihat: { type: 'string', description: 'Hihat', default: 'x x x x' },
          },
        },
      },
      {
        name: 'euclidean',
        description: 'Euclidean rhythm',
        inputSchema: {
          type: 'object',
          properties: {
            pulses: { type: 'number' },
            steps: { type: 'number' },
            sound: { type: 'string', default: 'bd' },
          },
          required: ['pulses', 'steps'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await ensureServices();
  const { name, arguments: args } = request.params;
  
  let code;
  switch (name) {
    case 'getCurrentPattern': {
      try {
        const response = await fetch('http://localhost:3457/current');
        const data = await response.json();
        return {
          content: [{
            type: 'text',
            text: data.code ? `Current pattern:\n\`\`\`javascript\n${data.code}\n\`\`\`` : 'No pattern currently in the REPL'
          }]
        };
      } catch (e) {
        return {
          content: [{
            type: 'text',
            text: 'Failed to get current pattern. Make sure Strudel REPL is open.'
          }]
        };
      }
    }
    
    case 'pattern':
      code = args.code;
      break;
      
    case 'drum': {
      const { kick = 'x ~ ~ ~', snare = '~ ~ x ~', hihat = 'x x x x' } = args;
      const patterns = [];
      if (kick) patterns.push(`s("${kick.replace(/x/g, 'bd')}")`);
      if (snare) patterns.push(`s("${snare.replace(/x/g, 'sd')}")`);
      if (hihat) patterns.push(`s("${hihat.replace(/x/g, 'hh')}")`);
      code = patterns.length > 1 ? `stack(\n  ${patterns.join(',\n  ')}\n)` : patterns[0];
      break;
    }
    
    case 'euclidean': {
      const { pulses, steps, sound = 'bd' } = args;
      code = `s("${sound}").euclid(${pulses}, ${steps})`;
      break;
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
  
  const bridge = await sendToBridge(code);
  let message = `\`\`\`javascript\n${code}\n\`\`\``;
  
  if (bridge.success) {
    message += `\n✅ ${bridge.message}`;
  } else {
    message += `\n📋 ${bridge.message}`;
  }
  
  return {
    content: [{ type: 'text', text: message }],
  };
});

// Start MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🎵 Strudel MCP Server (Integrated) started');
  
  // Start services immediately
  setTimeout(async () => {
    await ensureServices();
  }, 1000);
}

main().catch(console.error);