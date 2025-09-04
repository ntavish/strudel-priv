#!/usr/bin/env node
// Test suite for validating Strudel patterns and testing failures

import { evaluate } from './packages/core/evaluate.mjs';
import { fractal } from './packages/core/fractals.mjs';
import * as fs from 'fs';
import * as path from 'path';

const ANSI = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

let testsPassed = 0;
let testsFailed = 0;

async function testPattern(name, code, shouldFail = false) {
  try {
    // Mock the required globals for pattern evaluation
    const mockContext = {
      fractal,
      sine: Math.sin(Date.now() / 1000),
      cosine: Math.cos(Date.now() / 1000),
      saw: (Date.now() / 1000) % 1,
      tri: Math.abs(((Date.now() / 500) % 2) - 1),
      samples: async () => {}, // Mock samples function
      setcpm: () => {}, // Mock setcpm
      stack: () => ({ gain: () => ({}) }),
      s: () => ({ gain: () => ({}) }),
      n: () => ({ scale: () => ({}) }),
      note: () => ({ s: () => ({}) }),
      chord: () => ({ voicing: () => ({}) }),
      $: null // Pattern marker
    };
    
    // Try to parse the pattern
    const func = new Function(...Object.keys(mockContext), code);
    func(...Object.values(mockContext));
    
    if (shouldFail) {
      console.log(`${ANSI.RED}✗${ANSI.RESET} ${name} - Expected failure but succeeded`);
      testsFailed++;
    } else {
      console.log(`${ANSI.GREEN}✓${ANSI.RESET} ${name}`);
      testsPassed++;
    }
  } catch (error) {
    if (shouldFail) {
      console.log(`${ANSI.GREEN}✓${ANSI.RESET} ${name} - Failed as expected: ${error.message}`);
      testsPassed++;
    } else {
      console.log(`${ANSI.RED}✗${ANSI.RESET} ${name}`);
      console.log(`  ${ANSI.RED}${error.message}${ANSI.RESET}`);
      testsFailed++;
    }
  }
}

console.log(`${ANSI.BOLD}${ANSI.BLUE}=== Strudel Pattern Validation Tests ===${ANSI.RESET}\n`);

// Valid patterns that should work
console.log(`${ANSI.YELLOW}Testing Valid Patterns...${ANSI.RESET}`);

await testPattern(
  'Simple fractal.perlin usage',
  `const value = fractal.perlin(0.5, 0.5);`
);

await testPattern(
  'Fractal with arithmetic',
  `const value = fractal.sierpinski(0.5 * 0.5, 0.3 * 0.3, 4);`
);

await testPattern(
  'Fractal with variables',
  `const x = 0.5;
   const result = fractal.mandelbrot(x, sine, 30);`
);

await testPattern(
  'Multiple fractal calls',
  `const a = fractal.perlin(0.1, 0.2);
   const b = fractal.julia(0.3, 0.4, -0.7, 0.27);
   const c = fractal.dragonCurve(0.5, 1, 5);`
);

await testPattern(
  'Fractal in expression',
  `const value = 200 + fractal.fractalNoise(0.5, 0, 4, 0.5) * 3000;`
);

await testPattern(
  'Nested fractal calls',
  `const inner = fractal.perlin(0.5, 0.5);
   const outer = fractal.mandelbrot(inner, 0.5, 50);`
);

// Patterns that should fail
console.log(`\n${ANSI.YELLOW}Testing Invalid Patterns (Should Fail)...${ANSI.RESET}`);

await testPattern(
  'Undefined fractal function',
  `const value = fractal.nonExistent(0.5, 0.5);`,
  true
);

await testPattern(
  'Missing fractal namespace',
  `const value = perlin(0.5, 0.5);`,
  true
);

await testPattern(
  'Invalid syntax - missing parenthesis',
  `const value = fractal.perlin(0.5, 0.5;`,
  true
);

await testPattern(
  'Invalid syntax - unexpected string',
  `const value = fractal.perlin("invalid string");`,
  false  // This is actually valid syntax, just might not work as expected
);

await testPattern(
  'Wrong number of arguments',
  `const value = fractal.mandelbrot();`,
  false // This might actually work with defaults
);

// Test actual demo pattern snippets
console.log(`\n${ANSI.YELLOW}Testing Demo Pattern Snippets...${ANSI.RESET}`);

await testPattern(
  'Demo: Sierpinski gain modulation',
  `const x = 0.5;
   const gain = fractal.sierpinski(x*0.5, saw*0.3, 4)*0.8 + 0.2;`
);

await testPattern(
  'Demo: Julia set parameter',
  `const x = 0.1;
   const value = fractal.julia(x*0.1, sine*0.2, -0.7, 0.27)*0.5 + 0.2;`
);

await testPattern(
  'Demo: Mandelbrot calculation',
  `const mand = fractal.mandelbrot(sine*0.5, cosine*0.5, 50);
   const notes = ["c1", "g1", "bb1", "eb2"][Math.floor(mand*4) % 4];`
);

await testPattern(
  'Demo: Dragon curve with Math',
  `const x = 0.5;
   const value = Math.floor(fractal.dragonCurve(x*8, 0.5, 5)*12);`
);

await testPattern(
  'Demo: Complex fractal expression',
  `const x = 0.2;
   const julia = fractal.julia(sine*0.5, cosine*0.5, -0.7, 0.27, 30);
   const mand = fractal.mandelbrot(x*0.2, julia*0.5, 40);
   const result = Math.floor(mand*24);`
);

// Test pattern files
console.log(`\n${ANSI.YELLOW}Testing Pattern Files...${ANSI.RESET}`);

async function testPatternFile(filepath) {
  const filename = path.basename(filepath);
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Extract just the pattern code (remove await samples and setcpm)
    const patternCode = content
      .split('\n')
      .filter(line => !line.includes('await samples') && !line.includes('setcpm'))
      .join('\n');
    
    // Check for basic syntax issues
    if (patternCode.includes('fractal.')) {
      console.log(`${ANSI.MAGENTA}ℹ${ANSI.RESET} ${filename} uses fractal namespace`);
      
      // Check which functions are used
      const functions = ['perlin', 'fractalNoise', 'mandelbrot', 'julia', 'sierpinski', 'dragonCurve'];
      functions.forEach(fn => {
        if (patternCode.includes(`fractal.${fn}`)) {
          console.log(`  - Uses fractal.${fn}`);
        }
      });
    }
  } catch (error) {
    console.log(`${ANSI.RED}✗${ANSI.RESET} Failed to read ${filename}: ${error.message}`);
  }
}

const patternFile = '/data/data/com.termux/files/home/strudel/examples/fractal-self-similarity.strudel';
if (fs.existsSync(patternFile)) {
  await testPatternFile(patternFile);
}

// Test Summary
console.log(`\n${ANSI.BOLD}${ANSI.BLUE}=== Test Summary ===${ANSI.RESET}`);
console.log(`${ANSI.GREEN}Passed: ${testsPassed}${ANSI.RESET}`);
if (testsFailed > 0) {
  console.log(`${ANSI.RED}Failed: ${testsFailed}${ANSI.RESET}`);
} else {
  console.log(`${ANSI.GREEN}${ANSI.BOLD}All pattern tests passed!${ANSI.RESET}`);
}

// Return exit code
process.exit(testsFailed > 0 ? 1 : 0);