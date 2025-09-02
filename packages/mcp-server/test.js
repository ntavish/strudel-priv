#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Simple test that MCP server can load
console.log('Testing MCP server...');

try {
  // Check if we can import the SDK
  await import('@modelcontextprotocol/sdk/server/index.js');
  console.log('✓ MCP SDK available');
  
  // Check if index.js exists and is valid
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const indexPath = path.join(__dirname, 'index.js');
  if (fs.existsSync(indexPath)) {
    console.log('✓ index.js exists');
  } else {
    console.log('✗ index.js not found');
    process.exit(1);
  }
  
  console.log('✓ All basic checks passed');
  console.log('\nTo test full functionality:');
  console.log('1. Run: node index.js');
  console.log('2. In another terminal: curl http://localhost:3457');
  
} catch (e) {
  console.error('✗ Test failed:', e.message);
  process.exit(1);
}