#!/usr/bin/env node
// Test the full fractal-self-similarity.strudel example file for syntax validity

import { fractal } from './packages/core/fractals.mjs';
import * as fs from 'fs';
import * as vm from 'vm';

const ANSI = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

// Create a mock Strudel environment with all required functions
function createStrudelContext() {
  // Mock pattern functions that return chainable objects
  const createChainable = () => {
    const chain = {};
    const methods = [
      'gain', 'speed', 'fast', 'slow', 'sometimes', 'sometimesBy', 'every',
      'ply', 'struct', 'scale', 's', 'n', 'note', 'cutoff', 'resonance',
      'delay', 'delaytime', 'delayfeedback', 'room', 'size', 'attack',
      'decay', 'sustain', 'release', 'pan', 'phaser', 'phaserrate',
      'crush', 'lpf', 'lpq', 'compressor', 'euclidLegato', 'add', 'mul',
      'mod', 'loopAt', 'chop', 'voicing', 'floor', 'range'
    ];
    
    methods.forEach(method => {
      chain[method] = () => chain;
    });
    
    return chain;
  };
  
  // Mock time-varying parameters
  const time = Date.now() / 1000;
  
  const context = {
    // Fractal namespace
    fractal,
    
    // Time-based oscillators
    sine: Math.sin(time),
    cosine: Math.cos(time),
    saw: time % 1,
    tri: Math.abs(((time / 2) % 2) - 1),
    
    // Core Strudel functions
    s: (pattern) => createChainable(),
    n: (func) => createChainable(),
    note: (func) => createChainable(),
    chord: (pattern) => createChainable(),
    stack: (...args) => createChainable(),
    
    // Utility functions
    run: (n) => ({
      mul: (m) => ({ mod: (o) => createChainable() }),
      mod: (m) => createChainable(),
      add: (m) => createChainable()
    }),
    
    // Pattern markers
    '$': null,
    
    // Async functions (mocked)
    samples: async (url) => {
      console.log(`  ${ANSI.CYAN}Mock: Loading samples from ${url}${ANSI.RESET}`);
    },
    
    setcpm: (bpm) => {
      console.log(`  ${ANSI.CYAN}Mock: Setting BPM to ${bpm}${ANSI.RESET}`);
    },
    
    // Math functions (already in global)
    Math: Math,
    
    // Console for debugging
    console: console
  };
  
  // Add Pattern namespace for cantor, sierpinski, etc.
  context.Pattern = {
    cantor: () => createChainable(),
    sierpinski: () => createChainable(),
    dragon: () => createChainable(),
    koch: () => createChainable(),
    barnsleyFern: () => createChainable(),
    cellularAutomaton: () => createChainable()
  };
  
  // Add perlin noise variants
  context.perlinNoise = { range: () => ({ slow: () => createChainable() }) };
  context.perlinBipolar = { slow: () => createChainable(), range: () => ({ slow: () => createChainable() }) };
  context.fbm = { range: () => ({ slow: () => createChainable() }) };
  context.turbulence = { range: () => ({ slow: () => createChainable() }) };
  context.ridge = { range: () => ({ slow: () => createChainable() }) };
  
  return context;
}

// Test a Strudel pattern file
async function testPatternFile(filepath) {
  console.log(`${ANSI.BOLD}${ANSI.BLUE}=== Testing Full Example File ===${ANSI.RESET}`);
  console.log(`File: ${filepath}\n`);
  
  try {
    // Read the file
    const content = fs.readFileSync(filepath, 'utf8');
    console.log(`${ANSI.GREEN}✓${ANSI.RESET} File loaded successfully (${content.length} characters)`);
    
    // Count patterns
    const patternCount = (content.match(/\$:/g) || []).length;
    console.log(`${ANSI.CYAN}ℹ${ANSI.RESET} Found ${patternCount} pattern definitions\n`);
    
    // Parse and validate each pattern section
    console.log(`${ANSI.YELLOW}Validating Pattern Sections...${ANSI.RESET}`);
    
    const lines = content.split('\n');
    let currentPattern = [];
    let patternNumber = 0;
    let inPattern = false;
    let errors = [];
    let warnings = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Skip comments and empty lines
      if (line.trim().startsWith('//') || line.trim() === '') {
        continue;
      }
      
      // Check for pattern start
      if (line.includes('$:')) {
        if (inPattern && currentPattern.length > 0) {
          // Test the previous pattern
          await testPatternSection(currentPattern.join('\n'), patternNumber);
          patternNumber++;
        }
        inPattern = true;
        currentPattern = [line];
      } else if (inPattern) {
        // Check if this line ends the pattern (starts with . for chaining or is a new statement)
        if (line.trim().startsWith('.') || 
            (line.trim() && !line.trim().startsWith('.') && !line.trim().startsWith('//'))) {
          if (!line.trim().startsWith('.')) {
            // End of pattern
            await testPatternSection(currentPattern.join('\n'), patternNumber);
            patternNumber++;
            inPattern = false;
            currentPattern = [];
            
            // Process this line separately if it's not a comment
            if (!line.trim().startsWith('//')) {
              await testStatement(line, lineNum);
            }
          } else {
            currentPattern.push(line);
          }
        } else {
          currentPattern.push(line);
        }
      } else {
        // Standalone statement
        if (line.trim()) {
          await testStatement(line, lineNum);
        }
      }
    }
    
    // Test any remaining pattern
    if (inPattern && currentPattern.length > 0) {
      await testPatternSection(currentPattern.join('\n'), patternNumber);
    }
    
    // Test the entire file as a complete script
    console.log(`\n${ANSI.YELLOW}Testing Complete File Syntax...${ANSI.RESET}`);
    
    try {
      const context = createStrudelContext();
      
      // Wrap in async function to handle await
      const asyncWrapper = `(async function() {
        ${content}
      })()`;
      
      const script = new vm.Script(asyncWrapper, { filename: filepath });
      
      // Run in isolated context
      const sandbox = vm.createContext(context);
      await script.runInContext(sandbox, { timeout: 5000 });
      
      console.log(`${ANSI.GREEN}✓${ANSI.RESET} Full file syntax is valid!`);
      
      // Check fractal usage
      console.log(`\n${ANSI.YELLOW}Fractal Function Usage:${ANSI.RESET}`);
      const fractalFunctions = ['perlin', 'fractalNoise', 'mandelbrot', 'julia', 'sierpinski', 'dragonCurve'];
      fractalFunctions.forEach(fn => {
        const regex = new RegExp(`fractal\\.${fn}`, 'g');
        const matches = content.match(regex);
        if (matches) {
          console.log(`  ${ANSI.GREEN}✓${ANSI.RESET} fractal.${fn}: ${matches.length} usage(s)`);
        }
      });
      
      return true;
      
    } catch (error) {
      console.log(`${ANSI.RED}✗${ANSI.RESET} Syntax error in full file:`);
      console.log(`  ${ANSI.RED}${error.message}${ANSI.RESET}`);
      
      // Try to extract line number from error
      const lineMatch = error.stack.match(/:(\d+):(\d+)/);
      if (lineMatch) {
        const errorLine = parseInt(lineMatch[1]);
        console.log(`  ${ANSI.RED}Error at line ${errorLine}:${ANSI.RESET}`);
        const errorContext = lines.slice(Math.max(0, errorLine - 2), errorLine + 1);
        errorContext.forEach((line, i) => {
          const lineNum = errorLine - 2 + i;
          const marker = lineNum === errorLine - 1 ? '>' : ' ';
          console.log(`    ${marker} ${lineNum}: ${line}`);
        });
      }
      
      return false;
    }
    
  } catch (error) {
    console.log(`${ANSI.RED}✗${ANSI.RESET} Failed to read file: ${error.message}`);
    return false;
  }
}

// Test a single pattern section
async function testPatternSection(patternCode, patternNumber) {
  try {
    const context = createStrudelContext();
    
    // Replace $: with a variable assignment for testing
    let testCode = patternCode.replace(/\$:/g, 'const testPattern = ');
    
    // Handle arrow functions in patterns - they're callbacks, not syntax errors
    // Wrap in an IIFE that provides the callback parameter
    if (testCode.includes('=>')) {
      // This is a pattern with functions, wrap it properly
      testCode = `
        const x = 0.5; // Mock value for x parameter in callbacks
        ${testCode}
      `;
    }
    
    // Wrap pattern in a function to test syntax
    const wrappedCode = `(function() { 
      ${testCode} 
    })`;
    const script = new vm.Script(wrappedCode);
    
    console.log(`  ${ANSI.GREEN}✓${ANSI.RESET} Pattern ${patternNumber + 1} syntax valid`);
    return true;
  } catch (error) {
    console.log(`  ${ANSI.RED}✗${ANSI.RESET} Pattern ${patternNumber + 1} has syntax error: ${error.message}`);
    return false;
  }
}

// Test a standalone statement
async function testStatement(statement, lineNum) {
  // Skip certain statements that need special handling
  if (statement.includes('await samples') || statement.includes('setcpm')) {
    console.log(`  ${ANSI.CYAN}ℹ${ANSI.RESET} Line ${lineNum}: Special statement (${statement.trim().substring(0, 30)}...)`);
    return true;
  }
  
  try {
    const context = createStrudelContext();
    const script = new vm.Script(statement);
    console.log(`  ${ANSI.GREEN}✓${ANSI.RESET} Line ${lineNum}: ${statement.trim().substring(0, 50)}${statement.length > 50 ? '...' : ''}`);
    return true;
  } catch (error) {
    console.log(`  ${ANSI.RED}✗${ANSI.RESET} Line ${lineNum}: Syntax error - ${error.message}`);
    return false;
  }
}

// Main test execution
async function main() {
  const exampleFile = '/data/data/com.termux/files/home/strudel/examples/fractal-self-similarity.strudel';
  
  if (!fs.existsSync(exampleFile)) {
    console.log(`${ANSI.RED}✗${ANSI.RESET} Example file not found: ${exampleFile}`);
    process.exit(1);
  }
  
  const success = await testPatternFile(exampleFile);
  
  console.log(`\n${ANSI.BOLD}${ANSI.BLUE}=== Test Summary ===${ANSI.RESET}`);
  if (success) {
    console.log(`${ANSI.GREEN}${ANSI.BOLD}✅ All syntax tests passed!${ANSI.RESET}`);
    console.log(`The fractal example file is syntactically valid and ready to use.`);
    process.exit(0);
  } else {
    console.log(`${ANSI.RED}${ANSI.BOLD}❌ Some syntax tests failed${ANSI.RESET}`);
    console.log(`Please fix the syntax errors before using the example.`);
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error(`${ANSI.RED}Fatal error: ${error}${ANSI.RESET}`);
  process.exit(1);
});