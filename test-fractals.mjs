#!/usr/bin/env node
import { fractal } from './packages/core/fractals.mjs';

console.log('Testing fractal functions...');

// Test Perlin noise
const p1 = fractal.perlin(0.5, 0.5, 0.2);
console.log('Perlin noise at (0.5, 0.5, 0.2):', p1);
if (isNaN(p1) || p1 < -1 || p1 > 1) {
  console.error('❌ Perlin noise failed - value out of range:', p1);
  process.exit(1);
}

// Test Mandelbrot
const m1 = fractal.mandelbrot(0, 0, 50);
console.log('Mandelbrot at (0, 0):', m1);
if (isNaN(m1) || m1 < 0 || m1 > 1) {
  console.error('❌ Mandelbrot failed - value out of range:', m1);
  process.exit(1);
}

// Test Julia
const j1 = fractal.julia(0.5, 0.5, -0.7, 0.27);
console.log('Julia at (0.5, 0.5):', j1);
if (isNaN(j1) || j1 < 0 || j1 > 1) {
  console.error('❌ Julia failed - value out of range:', j1);
  process.exit(1);
}

// Test Sierpinski
const s1 = fractal.sierpinski(0.3, 0.2, 4);
console.log('Sierpinski at (0.3, 0.2):', s1);
if (isNaN(s1) || s1 < 0 || s1 > 1) {
  console.error('❌ Sierpinski failed - value out of range:', s1);
  process.exit(1);
}

// Test Dragon curve
const d1 = fractal.dragonCurve(0.5, 0.3, 5);
console.log('Dragon curve at t=0.5:', d1);
if (isNaN(d1) || d1 < 0 || d1 > 1) {
  console.error('❌ Dragon curve failed - value out of range:', d1);
  process.exit(1);
}

// Test fractal noise
const fn1 = fractal.fractalNoise(0.5, 0, 4, 0.5);
console.log('Fractal noise at 0.5:', fn1);
if (isNaN(fn1) || fn1 < -1 || fn1 > 1) {
  console.error('❌ Fractal noise failed - value out of range:', fn1);
  process.exit(1);
}

console.log('✅ All fractal functions working correctly!');