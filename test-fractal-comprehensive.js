#!/usr/bin/env node
// Comprehensive test suite for fractal functions and Strudel pattern validation

import { fractal } from './packages/core/fractals.mjs';
import { evaluate } from './packages/core/evaluate.mjs';
import * as fs from 'fs';

const ANSI = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${ANSI.GREEN}✓${ANSI.RESET} ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`${ANSI.RED}✗${ANSI.RESET} ${name}`);
    console.log(`  ${ANSI.RED}${error.message}${ANSI.RESET}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertInRange(value, min, max, name) {
  assert(
    value >= min && value <= max,
    `${name} = ${value} is not in range [${min}, ${max}]`
  );
}

function assertApprox(value, expected, tolerance = 0.0001) {
  assert(
    Math.abs(value - expected) < tolerance,
    `Expected ${expected}, got ${value}`
  );
}

console.log(`${ANSI.BOLD}${ANSI.BLUE}=== Fractal Functions Test Suite ===${ANSI.RESET}\n`);

// Test Perlin Noise
console.log(`${ANSI.YELLOW}Testing Perlin Noise...${ANSI.RESET}`);

test('perlin returns values in [0,1] range', () => {
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 10;
    const y = Math.random() * 10;
    const result = fractal.perlin(x, y);
    assertInRange(result, 0, 1, `perlin(${x}, ${y})`);
  }
});

test('perlin with same input gives same output', () => {
  const r1 = fractal.perlin(0.5, 0.5);
  const r2 = fractal.perlin(0.5, 0.5);
  assert(r1 === r2, 'Perlin should be deterministic');
});

test('perlin handles 3D coordinates', () => {
  const result = fractal.perlin(0.5, 0.5, 0.5);
  assertInRange(result, 0, 1, 'perlin 3D');
});

// Test Fractal Noise
console.log(`\n${ANSI.YELLOW}Testing Fractal Noise...${ANSI.RESET}`);

test('fractalNoise returns values in [0,1] range', () => {
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 10;
    const y = Math.random() * 10;
    const result = fractal.fractalNoise(x, y, 4, 0.5);
    assertInRange(result, 0, 1, `fractalNoise(${x}, ${y})`);
  }
});

test('fractalNoise with different octaves', () => {
  const r1 = fractal.fractalNoise(0.5, 0.5, 1, 0.5);
  const r2 = fractal.fractalNoise(0.5, 0.5, 4, 0.5);
  const r3 = fractal.fractalNoise(0.5, 0.5, 8, 0.5);
  assertInRange(r1, 0, 1, 'octaves=1');
  assertInRange(r2, 0, 1, 'octaves=4');
  assertInRange(r3, 0, 1, 'octaves=8');
});

test('fractalNoise with different persistence', () => {
  const r1 = fractal.fractalNoise(0.5, 0.5, 4, 0.1);
  const r2 = fractal.fractalNoise(0.5, 0.5, 4, 0.5);
  const r3 = fractal.fractalNoise(0.5, 0.5, 4, 0.9);
  assertInRange(r1, 0, 1, 'persistence=0.1');
  assertInRange(r2, 0, 1, 'persistence=0.5');
  assertInRange(r3, 0, 1, 'persistence=0.9');
});

// Test Mandelbrot
console.log(`\n${ANSI.YELLOW}Testing Mandelbrot...${ANSI.RESET}`);

test('mandelbrot returns values in [0,1] range', () => {
  for (let i = 0; i < 50; i++) {
    const x = Math.random();
    const y = Math.random();
    const result = fractal.mandelbrot(x, y, 100);
    assertInRange(result, 0, 1, `mandelbrot(${x}, ${y})`);
  }
});

test('mandelbrot at known points', () => {
  // Point inside the set should return 1
  const inside = fractal.mandelbrot(0, 0, 100);
  assert(inside === 1, 'Origin should be inside Mandelbrot set');
  
  // Point far outside should return small value
  const outside = fractal.mandelbrot(2, 2, 100);
  assert(outside < 0.1, 'Point (2,2) should be outside Mandelbrot set');
});

// Test Julia Set
console.log(`\n${ANSI.YELLOW}Testing Julia Set...${ANSI.RESET}`);

test('julia returns values in [0,1] range', () => {
  for (let i = 0; i < 50; i++) {
    const x = Math.random();
    const y = Math.random();
    const result = fractal.julia(x, y, -0.7, 0.27, 100);
    assertInRange(result, 0, 1, `julia(${x}, ${y})`);
  }
});

test('julia with different constants', () => {
  const r1 = fractal.julia(0.5, 0.5, -0.7, 0.27);
  const r2 = fractal.julia(0.5, 0.5, -0.4, 0.6);
  const r3 = fractal.julia(0.5, 0.5, 0.285, 0.01);
  assertInRange(r1, 0, 1, 'julia c1');
  assertInRange(r2, 0, 1, 'julia c2');
  assertInRange(r3, 0, 1, 'julia c3');
});

// Test Sierpinski
console.log(`\n${ANSI.YELLOW}Testing Sierpinski...${ANSI.RESET}`);

test('sierpinski returns values in [0,1] range', () => {
  for (let i = 0; i < 50; i++) {
    const x = Math.random();
    const y = Math.random();
    const result = fractal.sierpinski(x, y, 5);
    assertInRange(result, 0, 1, `sierpinski(${x}, ${y})`);
  }
});

test('sierpinski with different depths', () => {
  const r1 = fractal.sierpinski(0.5, 0.5, 1);
  const r2 = fractal.sierpinski(0.5, 0.5, 3);
  const r3 = fractal.sierpinski(0.5, 0.5, 8);
  assertInRange(r1, 0, 1, 'depth=1');
  assertInRange(r2, 0, 1, 'depth=3');
  assertInRange(r3, 0, 1, 'depth=8');
});

// Test Dragon Curve
console.log(`\n${ANSI.YELLOW}Testing Dragon Curve...${ANSI.RESET}`);

test('dragonCurve returns positive values', () => {
  for (let i = 0; i < 50; i++) {
    const t = Math.random();
    const result = fractal.dragonCurve(t, 1, 5);
    assert(result >= 0, `dragonCurve(${t}) should be positive`);
  }
});

test('dragonCurve at start and end', () => {
  const start = fractal.dragonCurve(0, 1, 5);
  const middle = fractal.dragonCurve(0.5, 1, 5);
  const end = fractal.dragonCurve(1, 1, 5);
  assert(start > 0, 'start should be positive');
  assert(middle > 0, 'middle should be positive');
  assert(end > 0, 'end should be positive');
});

// Edge Cases
console.log(`\n${ANSI.YELLOW}Testing Edge Cases...${ANSI.RESET}`);

test('functions handle zero input', () => {
  const p1 = fractal.perlin(0, 0);
  const f1 = fractal.fractalNoise(0, 0);
  const m1 = fractal.mandelbrot(0, 0);
  const j1 = fractal.julia(0, 0);
  const s1 = fractal.sierpinski(0, 0);
  const d1 = fractal.dragonCurve(0);
  
  assertInRange(p1, 0, 1, 'perlin(0,0)');
  assertInRange(f1, 0, 1, 'fractalNoise(0,0)');
  assertInRange(m1, 0, 1, 'mandelbrot(0,0)');
  assertInRange(j1, 0, 1, 'julia(0,0)');
  assertInRange(s1, 0, 1, 'sierpinski(0,0)');
  assert(d1 >= 0, 'dragonCurve(0)');
});

test('functions handle negative input', () => {
  const p1 = fractal.perlin(-1, -1);
  const f1 = fractal.fractalNoise(-1, -1);
  const m1 = fractal.mandelbrot(-0.5, -0.5);
  const j1 = fractal.julia(-0.5, -0.5);
  
  assertInRange(p1, 0, 1, 'perlin(-1,-1)');
  assertInRange(f1, 0, 1, 'fractalNoise(-1,-1)');
  assertInRange(m1, 0, 1, 'mandelbrot(-0.5,-0.5)');
  assertInRange(j1, 0, 1, 'julia(-0.5,-0.5)');
});

test('functions handle large input', () => {
  const p1 = fractal.perlin(1000, 1000);
  const f1 = fractal.fractalNoise(100, 100);
  const m1 = fractal.mandelbrot(10, 10);
  
  assertInRange(p1, 0, 1, 'perlin(1000,1000)');
  assertInRange(f1, 0, 1, 'fractalNoise(100,100)');
  assertInRange(m1, 0, 1, 'mandelbrot(10,10)');
});

// Performance test
console.log(`\n${ANSI.YELLOW}Testing Performance...${ANSI.RESET}`);

test('fractal functions are performant', () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    fractal.perlin(Math.random() * 10, Math.random() * 10);
  }
  const elapsed = Date.now() - start;
  assert(elapsed < 100, `1000 perlin calls took ${elapsed}ms (should be < 100ms)`);
});

// Test Summary
console.log(`\n${ANSI.BOLD}${ANSI.BLUE}=== Test Summary ===${ANSI.RESET}`);
console.log(`${ANSI.GREEN}Passed: ${testsPassed}${ANSI.RESET}`);
if (testsFailed > 0) {
  console.log(`${ANSI.RED}Failed: ${testsFailed}${ANSI.RESET}`);
  process.exit(1);
} else {
  console.log(`${ANSI.GREEN}${ANSI.BOLD}All tests passed!${ANSI.RESET}`);
}