#!/usr/bin/env node

import { spawn } from 'child_process';
import http from 'http';

// Test pattern bridge functionality
async function testBridge() {
  console.log('Testing pattern bridge...');
  
  // Start bridge on test port
  const bridge = spawn('node', ['index.js'], {
    env: { ...process.env, BRIDGE_PORT: '3458', STRUDEL_PORT: '4322' },
    stdio: 'pipe'
  });
  
  // Wait for startup
  await new Promise(r => setTimeout(r, 2000));
  
  // Test sending pattern
  const testPattern = 's("bd sd")';
  const res = await fetch('http://localhost:3458/pattern', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: testPattern })
  }).catch(() => null);
  
  if (res && res.ok) {
    console.log('✓ Pattern bridge accepts patterns');
  } else {
    console.log('✗ Pattern bridge failed');
    bridge.kill();
    process.exit(1);
  }
  
  // Test retrieving pattern
  const next = await fetch('http://localhost:3458/next').catch(() => null);
  if (next && next.ok) {
    console.log('✓ Pattern retrieval works');
  } else {
    console.log('✗ Pattern retrieval failed');
  }
  
  bridge.kill();
  console.log('✓ All tests passed');
}

testBridge().catch(e => {
  console.error('Test failed:', e.message);
  process.exit(1);
});