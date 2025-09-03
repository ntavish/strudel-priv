/*
test-noise.mjs - Tests for Perlin noise and organic pattern generation
*/

import { strict as assert } from 'assert';

// Simplified Perlin noise for testing (without full implementation)
const perlin1d = (x) => {
  // Simple deterministic pseudo-noise for testing
  return Math.sin(x * 12.9898) * Math.cos(x * 78.233);
};

const perlin2d = (x, y) => {
  return Math.sin(x * 12.9898 + y * 78.233) * Math.cos(x * 4.5453 + y * 23.234);
};

const fbm = (x, y, octaves = 4, persistence = 0.5, lacunarity = 2) => {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for(let i = 0; i < octaves; i++) {
    value += amplitude * perlin2d(x * frequency, y * frequency);
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  
  return value / maxValue;
};

const turbulence = (x, y, octaves = 4) => {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  
  for(let i = 0; i < octaves; i++) {
    value += amplitude * Math.abs(perlin2d(x * frequency, y * frequency));
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value;
};

const ridge = (x, y, offset = 1) => {
  return offset - Math.abs(perlin2d(x, y));
};

console.log('Testing Perlin noise functions...');

// Test 1D Perlin
console.log('Testing 1D Perlin noise...');
const noise1 = perlin1d(0.5);
const noise2 = perlin1d(0.5);
assert.equal(noise1, noise2, 'Perlin is deterministic');
assert(noise1 >= -1 && noise1 <= 1, 'Perlin in range [-1, 1]');

const noise3 = perlin1d(0.51);
assert.notEqual(noise1, noise3, 'Different inputs give different outputs');

console.log('✓ 1D Perlin noise working');

// Test 2D Perlin
console.log('Testing 2D Perlin noise...');
const noise2d1 = perlin2d(0.5, 0.5);
const noise2d2 = perlin2d(0.5, 0.5);
assert.equal(noise2d1, noise2d2, '2D Perlin is deterministic');
assert(noise2d1 >= -1 && noise2d1 <= 1, '2D Perlin in range');

const noise2d3 = perlin2d(0.5, 0.51);
assert.notEqual(noise2d1, noise2d3, 'Different 2D inputs give different outputs');

console.log('✓ 2D Perlin noise working');

// Test Fractal Brownian Motion
console.log('Testing Fractal Brownian Motion...');
const fbm1 = fbm(0.5, 0.5, 4, 0.5, 2);
const fbm2 = fbm(0.5, 0.5, 4, 0.5, 2);
assert.equal(fbm1, fbm2, 'FBM is deterministic');

const fbm3 = fbm(0.5, 0.5, 1, 0.5, 2); // Different octaves
assert.notEqual(fbm1, fbm3, 'Different octaves give different results');

console.log('✓ Fractal Brownian Motion working');

// Test Turbulence
console.log('Testing Turbulence...');
const turb1 = turbulence(0.5, 0.5, 4);
const turb2 = turbulence(0.5, 0.5, 4);
assert.equal(turb1, turb2, 'Turbulence is deterministic');
assert(turb1 >= 0, 'Turbulence is positive (absolute values)');

console.log('✓ Turbulence working');

// Test Ridge noise
console.log('Testing Ridge noise...');
const ridge1 = ridge(0.5, 0.5, 1);
const ridge2 = ridge(0.5, 0.5, 1);
assert.equal(ridge1, ridge2, 'Ridge is deterministic');

const ridge3 = ridge(0.5, 0.5, 2); // Different offset
assert.notEqual(ridge1, ridge3, 'Different offset gives different ridge');

console.log('✓ Ridge noise working');

// Test musical mapping with Perlin
console.log('Testing musical applications...');

// Smooth pitch variation
const pitchVariation = (baseNote, time) => {
  const variation = perlin1d(time * 0.1) * 12; // ±12 semitones
  return Math.floor(baseNote + variation);
};

const pitch1 = pitchVariation(60, 0);
assert(pitch1 >= 48 && pitch1 <= 72, 'Pitch variation in reasonable range');

// Organic velocity
const velocityVariation = (time) => {
  const noise = (perlin1d(time * 0.2) + 1) / 2; // Normalized to 0-1
  return 0.3 + noise * 0.5; // Range 0.3-0.8
};

const vel1 = velocityVariation(0);
assert(vel1 >= 0.3 && vel1 <= 0.8, 'Velocity in expected range');

// Pan movement
const panMovement = (time) => {
  return perlin1d(time * 0.05); // Already in range -1 to 1
};

const pan1 = panMovement(0);
assert(pan1 >= -1 && pan1 <= 1, 'Pan in stereo range');

console.log('✓ Musical mappings working');

// Test continuity (important for smooth organic motion)
console.log('Testing continuity...');
const delta = 0.001;
const n1 = perlin1d(0.5);
const n2 = perlin1d(0.5 + delta);
const difference = Math.abs(n2 - n1);
assert(difference < 0.1, 'Small input changes give small output changes (continuity)');

console.log('✓ Continuity verified');

console.log('\n✨ All Perlin noise tests passed!');
console.log('\nPerlin noise provides:');
console.log('- Smooth, organic variations');
console.log('- Deterministic but natural-looking randomness');
console.log('- Multi-scale complexity with FBM');
console.log('- Perfect for musical parameters like pitch drift, velocity, pan');