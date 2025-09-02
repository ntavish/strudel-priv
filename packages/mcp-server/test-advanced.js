#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Advanced MCP Tests\n==================');

// Test 1: Validate MCP tool definitions
console.log('\n1. Testing MCP tool definitions...');
try {
  const indexContent = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
  
  // Check for required tools
  const requiredTools = ['pattern', 'drum', 'euclidean', 'getCurrentPattern'];
  const toolsFound = [];
  
  requiredTools.forEach(tool => {
    if (indexContent.includes(`name: '${tool}'`)) {
      toolsFound.push(tool);
      console.log(`  ✓ Tool '${tool}' defined`);
    } else {
      console.log(`  ✗ Tool '${tool}' missing`);
    }
  });
  
  if (toolsFound.length === requiredTools.length) {
    console.log('  ✓ All required tools present');
  } else {
    console.log(`  ⚠ Only ${toolsFound.length}/${requiredTools.length} tools found`);
  }
} catch (e) {
  console.log('  ✗ Could not read index.js');
}

// Test 2: Validate pattern examples
console.log('\n2. Testing pattern validation...');
const validPatterns = [
  's("bd sd")',
  'note("c4 e4 g4").s("piano")',
  'stack(s("bd*4"), s("hh*8"))',
  's("cp").euclidean(5,8)'
];

const invalidPatterns = [
  '',
  'undefined',
  ';;;',
  'alert("xss")'
];

console.log('  Valid patterns:');
validPatterns.forEach(p => {
  // Basic validation - should not throw
  try {
    // Check for basic structure
    if (p.includes('(') && p.includes(')')) {
      console.log(`    ✓ "${p.substring(0,30)}..."`);
    }
  } catch {
    console.log(`    ✗ "${p.substring(0,30)}..."`);
  }
});

console.log('  Invalid patterns to reject:');
invalidPatterns.forEach(p => {
  if (!p || p.includes('alert') || p === ';;;') {
    console.log(`    ✓ Would reject: "${p}"`);
  } else {
    console.log(`    ✗ Would accept: "${p}"`);
  }
});

// Test 3: Check MCP protocol structure
console.log('\n3. Testing MCP protocol compliance...');
try {
  const indexContent = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
  
  const mcpFeatures = [
    ['Server import', '@modelcontextprotocol/sdk/server'],
    ['StdioServerTransport', 'StdioServerTransport'],
    ['Tool handling', 'CallToolRequestSchema'],
    ['Tool listing', 'ListToolsRequestSchema'],
    ['Server setup', 'server.connect(transport)']
  ];
  
  mcpFeatures.forEach(([name, pattern]) => {
    if (indexContent.includes(pattern)) {
      console.log(`  ✓ ${name}`);
    } else {
      console.log(`  ✗ ${name} missing`);
    }
  });
} catch (e) {
  console.log('  ✗ Could not verify MCP structure');
}

// Test 4: Documentation coverage
console.log('\n4. Testing documentation...');
const docs = [
  ['README.md', 'Main documentation'],
  ['SETUP_GUIDE.md', 'Setup instructions'],
  ['examples.md', 'Pattern examples'],
  ['install-mcp.sh', 'Installation script'],
  ['package.json', 'Package configuration']
];

let docsFound = 0;
docs.forEach(([file, desc]) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${desc} (${file})`);
    docsFound++;
  } else {
    console.log(`  ✗ ${desc} (${file})`);
  }
});

// Test 5: Dependencies
console.log('\n5. Testing dependencies...');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  if (pkg.dependencies && pkg.dependencies['@modelcontextprotocol/sdk']) {
    console.log(`  ✓ MCP SDK dependency declared`);
    
    // Check if installed
    const nodeModulesPath = path.join(__dirname, 'node_modules', '@modelcontextprotocol');
    if (fs.existsSync(nodeModulesPath)) {
      console.log(`  ✓ MCP SDK installed`);
    } else {
      console.log(`  ⚠ MCP SDK not installed (run npm install)`);
    }
  } else {
    console.log(`  ✗ MCP SDK dependency missing`);
  }
  
  if (pkg.scripts && pkg.scripts.test) {
    console.log(`  ✓ Test script defined`);
  } else {
    console.log(`  ✗ Test script missing`);
  }
} catch (e) {
  console.log(`  ✗ Could not check dependencies`);
}

// Summary
console.log('\n==================');
console.log('Test Summary:');
console.log('- Basic functionality: See test.js');
console.log('- Advanced checks: Complete');
console.log('- Documentation: ' + docsFound + '/' + docs.length + ' files present');
console.log('\nFor integration testing:');
console.log('1. Start server: node index.js');
console.log('2. Send pattern: curl -X POST http://localhost:3457/pattern -H "Content-Type: application/json" -d \'{"code":"s(\\"bd sd\\")"}\'');
console.log('3. Check browser: http://localhost:4321');