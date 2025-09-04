/*
fractals.mjs - Fractal pattern generation for Strudel
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
*/

import { Pattern, sequence, silence, stack, pure, cat, fastcat } from './pattern.mjs';

/**
 * Generate a Cantor set rhythm pattern
 * Creates recursive gaps by repeatedly removing middle thirds
 * @param {number} depth - Recursion depth (1-5 recommended)
 * @returns {Pattern} Binary rhythm pattern (0s and 1s)
 * @example
 * // Simple kick drum pattern with fractal gaps
 * s("bd").struct(cantor(3))
 * 
 * @example  
 * // Layered rhythm
 * stack(
 *   s("bd").struct(cantor(3)),
 *   s("hh").struct(cantor(4)).fast(2)
 * )
 */
export function cantor(depth = 3) {
  const generateCantor = (n) => {
    if (n === 0) return [1];
    const prev = generateCantor(n - 1);
    const result = [];
    for (let i = 0; i < prev.length; i++) {
      result.push(prev[i]);
      result.push(0);
      result.push(prev[i]);
    }
    return result;
  };
  
  const pattern = generateCantor(depth);
  const values = pattern.map(v => v ? 1 : 0);
  return fastcat(...values);
}

/**
 * Generate a Sierpinski triangle pattern
 * Uses Pascal's triangle modulo 2 to create self-similar patterns
 * @param {number} depth - Recursion depth (1-5 recommended)
 * @returns {Pattern} Binary pattern based on Sierpinski triangle
 * @example
 * // Hi-hat pattern with self-similar structure
 * s("hh").struct(sierpinski(4)).fast(2)
 * 
 * @example
 * // Polyrhythmic percussion
 * stack(
 *   s("bd").struct(sierpinski(3)),
 *   s("sd").struct(sierpinski(4)).fast(2),
 *   s("hh").struct(sierpinski(5)).fast(4)
 * )
 */
export function sierpinski(depth = 3) {
  const size = Math.pow(2, depth);
  const pattern = [];
  
  for (let i = 0; i < size; i++) {
    // Use Pascal's triangle mod 2 to generate Sierpinski
    let value = 1;
    for (let j = 1; j <= i; j++) {
      if ((i & j) === j) {
        value = 1;
      } else {
        value = 0;
        break;
      }
    }
    pattern.push(value);
  }
  
  return fastcat(...pattern);
}

/**
 * Generate a Dragon curve rhythm pattern
 * Creates complex folding patterns through iterative transformation
 * @param {number} iterations - Number of iterations (1-8 recommended)
 * @returns {Pattern} Binary rhythm following dragon curve
 * @example
 * // Snare pattern with dragon curve rhythm
 * s("sd").struct(dragon(5)).fast(4)
 * 
 * @example
 * // Complex drum pattern
 * s("bd sd hh cp").struct(dragon(6))
 */
export function dragon(iterations = 4) {
  let sequence = [1];
  
  for (let i = 0; i < iterations; i++) {
    const reversed = [...sequence].reverse();
    const flipped = reversed.map(v => 1 - v);
    sequence = [...sequence, 1, ...flipped];
  }
  
  return fastcat(...sequence);
}

/**
 * Internal L-system implementation
 */
function _lsystem(axiom, rules, iterations = 3) {
  let result = axiom;
  
  for (let i = 0; i < iterations; i++) {
    result = result.split('').map(char => rules[char] || char).join('');
  }
  
  // Convert to numeric pattern
  const values = result.split('').map(char => {
    const code = char.charCodeAt(0);
    return pure((code % 8) / 8); // Map to 0-1 range with 8 divisions
  });
  
  return fastcat(...values);
}

/**
 * Generate an L-system pattern
 * @param {string} axiom - Starting string
 * @param {Object} rules - Replacement rules
 * @param {number} iterations - Number of iterations
 * @returns {Pattern} Pattern based on L-system
 * @example
 * lsystem("A", {A: "AB", B: "A"}, 4).s("bd sd")
 */
export function lsystem(axiom, rules, iterations = 3) {
  // If axiom is a Pattern, extract its value
  if (axiom && typeof axiom === 'object' && axiom.firstCycle) {
    // Get the first value from the pattern
    const haps = axiom.firstCycle();
    if (haps.length > 0) {
      axiom = haps[0].value;
    }
  }
  
  return _lsystem(axiom, rules, iterations);
}

/**
 * Generate a cellular automaton pattern
 * @param {number} rule - Rule number (0-255)
 * @param {number} size - Size of the pattern
 * @returns {Pattern} Binary pattern from cellular automaton
 * @example
 * s("click").struct(cellularAutomaton(30, 16))
 */
export function cellularAutomaton(rule = 30, size = 16) {
  const ruleSet = [];
  for (let i = 0; i < 8; i++) {
    ruleSet[i] = (rule >> i) & 1;
  }
  
  let cells = new Array(size).fill(0);
  cells[Math.floor(size / 2)] = 1; // Start with single cell in middle
  const pattern = [cells[Math.floor(size / 2)]];
  
  for (let generation = 1; generation < size; generation++) {
    const newCells = new Array(size).fill(0);
    
    for (let i = 0; i < size; i++) {
      const left = cells[(i - 1 + size) % size];
      const center = cells[i];
      const right = cells[(i + 1) % size];
      const index = (left << 2) | (center << 1) | right;
      newCells[i] = ruleSet[index];
    }
    
    cells = newCells;
    pattern.push(cells[generation % size]);
  }
  
  return fastcat(...pattern);
}

/**
 * Generate a Koch curve pattern
 * @param {number} depth - Recursion depth
 * @returns {Pattern} Pattern following Koch curve
 * @example
 * s("hh").struct(koch(3))
 */
export function koch(depth = 3) {
  const angles = [0, 60, -120, 60];
  let sequence = [0];
  
  for (let i = 0; i < depth; i++) {
    const newSequence = [];
    for (let j = 0; j < sequence.length; j++) {
      newSequence.push(sequence[j]);
      if (j < sequence.length - 1) {
        for (let angle of angles) {
          newSequence.push((sequence[j] + angle + 360) % 360);
        }
      }
    }
    sequence = newSequence;
  }
  
  // Convert angles to rhythm (quantize to 8 divisions)
  const pattern = sequence.map(angle => Math.floor(angle / 45) % 2);
  return fastcat(...pattern);
}

/**
 * Generate Barnsley Fern pattern for melodies
 * Creates organic, fern-like patterns using iterated function systems
 * NOTE: Returns values 0-7, must wrap with n() to use .scale()
 * @param {number} points - Number of points to generate (16-64 typical)
 * @returns {Pattern} Pattern of values 0-7
 * @example
 * // CORRECT: Melodic pattern with scale
 * n(barnsleyFern(32))
 *   .scale("C:minor:pentatonic")
 *   .note()
 *   .s("piano")
 * 
 * @example
 * // Ambient melody
 * n(barnsleyFern(64))
 *   .scale("D:dorian")
 *   .note()
 *   .s("vibraphone")
 *   .room(0.5)
 *   .slow(2)
 */
export function barnsleyFern(points = 30) {
  const pattern = [];
  let x = 0, y = 0;
  
  for (let i = 0; i < points; i++) {
    const r = Math.random();
    let nextX, nextY;
    
    if (r < 0.01) {
      // Stem
      nextX = 0;
      nextY = 0.16 * y;
    } else if (r < 0.86) {
      // Successively smaller leaflets
      nextX = 0.85 * x + 0.04 * y;
      nextY = -0.04 * x + 0.85 * y + 1.6;
    } else if (r < 0.93) {
      // Largest left-hand leaflet
      nextX = 0.2 * x - 0.26 * y;
      nextY = 0.23 * x + 0.22 * y + 1.6;
    } else {
      // Largest right-hand leaflet
      nextX = -0.15 * x + 0.28 * y;
      nextY = 0.26 * x + 0.24 * y + 0.44;
    }
    
    x = nextX;
    y = nextY;
    
    // Map to musical values (0-7 for scale degrees)
    const value = Math.abs(Math.floor(y * 2)) % 8;
    pattern.push(value);
  }
  
  return fastcat(...pattern);
}

/**
 * Perlin noise implementation
 */
class PerlinNoise {
  constructor() {
    this.p = new Uint8Array(512);
    this.permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
      190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
      74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,
      161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,
      123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,
      221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,
      210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,
      254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    
    for(let i = 0; i < 256; i++) {
      this.p[i] = this.p[i + 256] = this.permutation[i];
    }
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t, a, b) {
    return a + t * (b - a);
  }

  grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x, y = 0, z = 0) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
      ),
      this.lerp(v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }
}

const perlinGenerator = new PerlinNoise();

/**
 * Perlin noise function for fractal namespace
 */
function perlinNoise(x, y = 0, z = 0) {
  return (perlinGenerator.noise(x, y, z) + 1) / 2;
}

/**
 * Fractal noise (fractional Brownian motion)
 */
function fractalNoise(x, y = 0, octaves = 4, persistence = 0.5) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  
  for(let i = 0; i < octaves; i++) {
    total += perlinGenerator.noise(x * frequency, y * frequency, 0) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  
  return (total / maxValue + 1) / 2;
}

/**
 * Mandelbrot set calculation
 * Maps input to interesting regions of the fractal
 */
function mandelbrot(x, y, maxIterations = 100) {
  // Map inputs to interesting regions of the Mandelbrot set
  // These regions have rich detail at the boundary
  const regions = [
    { cx: -0.7269, cy: 0.1889, scale: 0.01 },    // Spiral detail
    { cx: -0.8, cy: 0.156, scale: 0.1 },          // Mini Mandelbrot
    { cx: -0.7533, cy: 0.1138, scale: 0.01 },     // Spiral arms
    { cx: 0.285, cy: 0.01, scale: 0.1 },          // Eastern bulb
    { cx: -1.25, cy: 0, scale: 0.5 },             // Main cardioid edge
    { cx: -0.11, cy: 0.8557, scale: 0.05 },       // Northern tendril
    { cx: -0.748, cy: 0.1, scale: 0.017 },        // Deep spiral
    { cx: -0.235125, cy: 0.827215, scale: 0.01 }  // Intricate detail
  ];
  
  // Pick a region based on input (use x to select region)
  const regionIndex = Math.floor(Math.abs(x * regions.length)) % regions.length;
  const region = regions[regionIndex];
  
  // Map y to zoom into the region
  const zoom = region.scale * (0.5 + y * 0.5);
  const cx = region.cx + (x - 0.5) * zoom;
  const cy = region.cy + (y - 0.5) * zoom;
  
  let zx = 0;
  let zy = 0;
  let iteration = 0;
  
  while (zx * zx + zy * zy <= 4 && iteration < maxIterations) {
    const xtemp = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = xtemp;
    iteration++;
  }
  
  if (iteration < maxIterations) {
    const zn = Math.sqrt(zx * zx + zy * zy);
    const nu = Math.log(Math.log(zn) / Math.log(2)) / Math.log(2);
    iteration = iteration + 1 - nu;
  }
  
  // Ensure result is in [0, 1] range
  return Math.max(0, Math.min(1, iteration / maxIterations));
}

/**
 * Julia set calculation with interesting default constants
 */
function julia(x, y, cx = -0.7, cy = 0.27, maxIterations = 100) {
  // Collection of interesting Julia set constants
  const interestingConstants = [
    { cx: -0.7, cy: 0.27015 },      // Classic spiral
    { cx: -0.835, cy: -0.2321 },    // Dragon-like
    { cx: -0.8, cy: 0.156 },         // Dendrite
    { cx: -0.4, cy: 0.6 },           // Swirls
    { cx: 0.285, cy: 0.01 },         // Intricate
    { cx: -0.70176, cy: -0.3842 },  // Rabbit-like
    { cx: -0.75, cy: 0.11 },         // Cauliflower
    { cx: -0.1, cy: 0.651 },         // Seahorse valley
    { cx: -0.74543, cy: 0.11301 },  // Spirals within spirals
    { cx: 0.27334, cy: 0.00742 }    // Lightning
  ];
  
  // If cx and cy are defaults, pick from interesting constants based on input
  if (cx === -0.7 && cy === 0.27) {
    const index = Math.floor(Math.abs(x * 10)) % interestingConstants.length;
    const constant = interestingConstants[index];
    cx = constant.cx;
    cy = constant.cy;
  }
  
  // Map input to complex plane
  let zx = x * 3 - 1.5;
  let zy = y * 2 - 1;
  let iteration = 0;
  
  while (zx * zx + zy * zy <= 4 && iteration < maxIterations) {
    const xtemp = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = xtemp;
    iteration++;
  }
  
  if (iteration < maxIterations) {
    const zn = Math.sqrt(zx * zx + zy * zy);
    const nu = Math.log(Math.log(zn) / Math.log(2)) / Math.log(2);
    iteration = iteration + 1 - nu;
  }
  
  return Math.max(0, Math.min(1, iteration / maxIterations));
}

/**
 * Sierpinski triangle continuous calculation
 */
function sierpinskiContinuous(x, y, depth = 5) {
  let level = 0;
  let tx = x;
  let ty = y;
  
  for (let i = 0; i < depth; i++) {
    tx *= 2;
    ty *= 2;
    
    if (tx > 1 && ty > 1) {
      return level / depth;
    }
    
    if (tx > 1) {
      tx -= 1;
    }
    if (ty > 1) {
      ty -= 1;
    }
    
    level++;
  }
  
  return 1;
}

/**
 * Dragon curve continuous function
 */
function dragonCurve(t, scale = 1, iterations = 10) {
  // Normalize t to [0,1] range
  t = t % 1;
  
  let x = 0;
  let y = 0;
  let angle = 0;
  const angleIncrement = Math.PI / 2;
  
  let sequence = [1];
  for (let i = 0; i < iterations; i++) {
    const reversed = [...sequence].reverse();
    const flipped = reversed.map(v => -v);
    sequence = [...sequence, 1, ...flipped];
  }
  
  const steps = Math.min(Math.floor(t * sequence.length), sequence.length - 1);
  for (let i = 0; i < steps; i++) {
    x += Math.cos(angle) * scale;
    y += Math.sin(angle) * scale;
    angle += sequence[i] * angleIncrement;
  }
  
  const distance = Math.sqrt(x * x + y * y);
  const normalized = Math.max(0, Math.min(1, 1 / (1 + distance * 0.1)));
  return normalized;
}

// Create fractal namespace object for pattern use
export const fractal = {
  perlin: perlinNoise,
  fractalNoise,
  mandelbrot,
  julia,
  sierpinski: sierpinskiContinuous,
  dragonCurve
};

// Register all fractal functions for use in Strudel
export const fractalFunctions = {
  cantor,
  sierpinski,
  dragon,
  koch,
  lsystem,
  cellularAutomaton,
  barnsleyFern
};