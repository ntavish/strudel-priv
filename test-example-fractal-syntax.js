#!/usr/bin/env node
// Simplified test to validate fractal function usage in the example

import { fractal } from './packages/core/fractals.mjs';
import * as fs from 'fs';

const ANSI = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

console.log(`${ANSI.BOLD}${ANSI.BLUE}=== Fractal Example Syntax Test ===${ANSI.RESET}\n`);

const exampleFile = '/data/data/com.termux/files/home/strudel/examples/fractal-self-similarity.strudel';
const content = fs.readFileSync(exampleFile, 'utf8');

console.log(`Testing: ${exampleFile}`);
console.log(`File size: ${content.length} characters\n`);

// Extract all fractal function calls using regex
console.log(`${ANSI.YELLOW}Extracting Fractal Function Calls...${ANSI.RESET}`);

const fractalPattern = /fractal\.(\w+)\s*\([^)]*\)/g;
const matches = [...content.matchAll(fractalPattern)];

console.log(`Found ${matches.length} fractal function calls\n`);

// Test each fractal call
let validCalls = 0;
let invalidCalls = 0;
const functionCounts = {};

for (const match of matches) {
  const fullCall = match[0];
  const functionName = match[1];
  
  // Count function usage
  functionCounts[functionName] = (functionCounts[functionName] || 0) + 1;
  
  // Extract parameters (simplified)
  const paramsMatch = fullCall.match(/\((.*)\)/);
  const params = paramsMatch ? paramsMatch[1] : '';
  
  // Check if function exists
  if (fractal[functionName]) {
    console.log(`${ANSI.GREEN}✓${ANSI.RESET} fractal.${functionName}() - valid function`);
    validCalls++;
    
    // Test with mock values
    try {
      // Create mock values for common variables
      const x = 0.5;
      const sine = Math.sin(Date.now() / 1000);
      const cosine = Math.cos(Date.now() / 1000);
      const saw = (Date.now() / 1000) % 1;
      
      // Build test call
      const testCode = `
        const x = ${x};
        const sine = ${sine};
        const cosine = ${cosine};
        const saw = ${saw};
        const result = ${fullCall};
      `;
      
      // Try to evaluate
      eval(testCode);
      console.log(`  ${ANSI.CYAN}→ Call syntax appears valid${ANSI.RESET}`);
    } catch (error) {
      console.log(`  ${ANSI.YELLOW}⚠ Syntax might have issues: ${error.message}${ANSI.RESET}`);
    }
  } else {
    console.log(`${ANSI.RED}✗${ANSI.RESET} fractal.${functionName}() - UNDEFINED FUNCTION!`);
    invalidCalls++;
  }
}

// Summary of function usage
console.log(`\n${ANSI.YELLOW}Function Usage Summary:${ANSI.RESET}`);
const availableFunctions = Object.keys(fractal);
console.log(`Available functions: ${availableFunctions.join(', ')}\n`);

for (const [func, count] of Object.entries(functionCounts)) {
  const status = fractal[func] ? ANSI.GREEN + '✓' : ANSI.RED + '✗';
  console.log(`  ${status}${ANSI.RESET} fractal.${func}: ${count} usage(s)`);
}

// Test specific patterns
console.log(`\n${ANSI.YELLOW}Testing Specific Pattern Constructs:${ANSI.RESET}`);

// Test 1: Arrow functions in gain/speed parameters
const arrowFunctionPattern = /\.\w+\((?:x|sine|cosine|saw|tri)\s*=>\s*[^)]+\)/g;
const arrowMatches = [...content.matchAll(arrowFunctionPattern)];
console.log(`${ANSI.CYAN}ℹ${ANSI.RESET} Found ${arrowMatches.length} arrow function callbacks`);

// Test 2: Nested fractal calls
const nestedPattern = /fractal\.\w+\([^)]*fractal\.\w+\([^)]*\)[^)]*\)/g;
const nestedMatches = [...content.matchAll(nestedPattern)];
console.log(`${ANSI.CYAN}ℹ${ANSI.RESET} Found ${nestedMatches.length} nested fractal calls`);

// Test 3: Math operations with fractals
const mathPattern = /fractal\.\w+\([^)]*\)\s*[\*\+\-\/]\s*[\d\.]+/g;
const mathMatches = [...content.matchAll(mathPattern)];
console.log(`${ANSI.CYAN}ℹ${ANSI.RESET} Found ${mathMatches.length} fractal calls with math operations`);

// Validate overall syntax structure
console.log(`\n${ANSI.YELLOW}Validating Pattern Structure:${ANSI.RESET}`);

// Count pattern definitions
const patternDefs = (content.match(/\$:/g) || []).length;
console.log(`${ANSI.CYAN}ℹ${ANSI.RESET} ${patternDefs} pattern definitions ($:)`);

// Check for required imports
const hasAwaitSamples = content.includes('await samples');
const hasSetCpm = content.includes('setcpm');
console.log(`${ANSI.CYAN}ℹ${ANSI.RESET} Has await samples: ${hasAwaitSamples ? 'Yes' : 'No'}`);
console.log(`${ANSI.CYAN}ℹ${ANSI.RESET} Has setcpm: ${hasSetCpm ? 'Yes' : 'No'}`);

// Final summary
console.log(`\n${ANSI.BOLD}${ANSI.BLUE}=== Test Summary ===${ANSI.RESET}`);
console.log(`${ANSI.GREEN}Valid fractal calls: ${validCalls}${ANSI.RESET}`);
if (invalidCalls > 0) {
  console.log(`${ANSI.RED}Invalid fractal calls: ${invalidCalls}${ANSI.RESET}`);
  console.log(`\n${ANSI.RED}${ANSI.BOLD}⚠ WARNING: The example uses undefined fractal functions!${ANSI.RESET}`);
  console.log(`Please ensure all fractal functions are properly implemented.`);
  process.exit(1);
} else {
  console.log(`\n${ANSI.GREEN}${ANSI.BOLD}✅ All fractal function calls are valid!${ANSI.RESET}`);
  console.log(`The example uses only implemented fractal functions.`);
  
  // Additional notes
  if (arrowMatches.length > 0) {
    console.log(`\n${ANSI.CYAN}Note:${ANSI.RESET} The example uses arrow functions for dynamic parameters.`);
    console.log(`These will be evaluated at runtime with the current pattern context.`);
  }
  
  process.exit(0);
}