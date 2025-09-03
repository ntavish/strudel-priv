/*
noise.mjs - Perlin and Simplex noise generators for organic patterns
Copyright (C) 2025 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
*/

import { signal } from './signal.mjs';

// Permutation table for Perlin noise
const p = new Uint8Array(512);
const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,
  68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,
  143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,
  3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,
  213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,
  104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,
  106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,
  156,180];

// Initialize permutation table
for(let i = 0; i < 256; i++) {
  p[i] = permutation[i];
  p[256 + i] = permutation[i];
}

// Fade function for smooth interpolation
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);

// Linear interpolation
const lerp = (t, a, b) => a + t * (b - a);

// Gradient function
const grad = (hash, x, y, z) => {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
};

/**
 * 3D Perlin noise generator
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate  
 * @param {number} z - Z coordinate
 * @returns {number} Noise value between -1 and 1
 */
export const perlin3d = (x, y, z) => {
  // Find unit cube that contains point
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  
  // Find relative x,y,z of point in cube
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  
  // Compute fade curves for each of x,y,z
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  
  // Hash coordinates of the 8 cube corners
  const A = p[X] + Y;
  const AA = p[A] + Z;
  const AB = p[A + 1] + Z;
  const B = p[X + 1] + Y;
  const BA = p[B] + Z;
  const BB = p[B + 1] + Z;
  
  // And add blended results from 8 corners of cube
  return lerp(w,
    lerp(v,
      lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
      lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))
    ),
    lerp(v,
      lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))
    )
  );
};

/**
 * 2D Perlin noise generator
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} Noise value between -1 and 1
 */
export const perlin2d = (x, y) => perlin3d(x, y, 0);

/**
 * 1D Perlin noise generator
 * @param {number} x - X coordinate
 * @returns {number} Noise value between -1 and 1
 */
export const perlin1d = (x) => perlin3d(x, 0, 0);

/**
 * Fractal Brownian Motion (fBm) - layered Perlin noise
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} octaves - Number of noise layers
 * @param {number} persistence - Amplitude multiplier per octave
 * @param {number} lacunarity - Frequency multiplier per octave
 * @returns {number} Noise value
 */
export const fbm = (x, y, octaves = 4, persistence = 0.5, lacunarity = 2) => {
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

/**
 * Turbulence - absolute value of noise for sharp features
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} octaves - Number of noise layers
 * @returns {number} Turbulence value
 */
export const turbulence = (x, y, octaves = 4) => {
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

/**
 * Ridge noise - inverted absolute value for ridge-like features
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} offset - Ridge offset
 * @returns {number} Ridge value
 */
export const ridge = (x, y, offset = 1) => {
  return offset - Math.abs(perlin2d(x, y));
};

// Create Strudel signals for Perlin noise
export const perlinNoise = signal((t) => (perlin1d(t * 4) + 1) / 2);
export const perlinBipolar = signal((t) => perlin1d(t * 4)); // Bipolar version

// Fractal Brownian Motion signal
export const fbmSignal = signal((t) => (fbm(t * 2, 0, 4, 0.5, 2) + 1) / 2);

// Turbulence signal
export const turbulenceSignal = signal((t) => turbulence(t * 2, 0, 4));

// Ridge signal
export const ridgeSignal = signal((t) => (ridge(t * 4, 0) + 1) / 2);

// Export all functions
export default {
  perlin1d,
  perlin2d,
  perlin3d,
  fbm,
  turbulence,
  ridge,
  perlinNoise,
  perlinBipolar,
  fbmSignal,
  turbulenceSignal,
  ridgeSignal
};