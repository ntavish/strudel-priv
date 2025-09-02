/*
fractals.mjs - Fractal and IFS-based pattern generation for Strudel
Copyright (C) 2025 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
*/

import { Pattern, register, reify } from './pattern.mjs';

/**
 * L-System (Lindenmayer System) pattern generator
 * Creates self-similar recursive patterns like plant growth
 * @param {string} axiom - Starting string
 * @param {object} rules - Replacement rules
 * @param {number} iterations - Number of iterations
 * @returns {string} Generated L-system string
 * @example
 * s(lsystem("A", {A: "AB", B: "A"}, 5).replaceAll("A", "bd").replaceAll("B", "sd"))
 */
export const lsystem = (axiom, rules, iterations = 3) => {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (let char of current) {
      next += rules[char] || char;
    }
    current = next;
  }
  return current;
};

/**
 * Cantor Set rhythm generator
 * Creates fractal rhythms through recursive subdivision
 * @param {number} level - Recursion depth
 * @param {number} length - Pattern length
 * @returns {Array} Binary pattern array
 * @example
 * s("bd").struct(cantorSet(3, 27).join(" "))
 */
export const cantorSet = (level = 3, length = 27) => {
  if (level === 0) return Array(length).fill(1);
  
  const third = Math.floor(length / 3);
  const left = cantorSet(level - 1, third);
  const middle = Array(third).fill(0);
  const right = cantorSet(level - 1, third);
  
  return [...left, ...middle, ...right];
};

/**
 * Sierpinski Triangle pattern using chaos game
 * Generates self-similar triangular patterns
 * @param {number} iterations - Number of iterations
 * @param {array} sounds - Three sounds for vertices
 * @returns {array} Pattern of sounds
 * @example
 * s(sierpinski(32, ["bd", "sd", "hh"]).join(" "))
 */
export const sierpinski = (iterations = 32, sounds = ["bd", "sd", "hh"]) => {
  const vertices = [
    {x: 0, y: 0, sound: sounds[0]},
    {x: 1, y: 0, sound: sounds[1]},
    {x: 0.5, y: 0.866, sound: sounds[2]}
  ];
  
  let x = Math.random(), y = Math.random();
  const pattern = [];
  
  for (let i = 0; i < iterations; i++) {
    const vertex = vertices[Math.floor(Math.random() * 3)];
    x = (x + vertex.x) / 2;
    y = (y + vertex.y) / 2;
    pattern.push(vertex.sound);
  }
  
  return pattern;
};

/**
 * Dragon Curve melody generator
 * Creates the famous dragon curve fractal as a melodic line
 * @param {number} iterations - Number of iterations
 * @param {number} startPitch - Starting MIDI pitch
 * @param {number} interval - Interval for turns
 * @returns {array} Array of MIDI note numbers
 * @example
 * note(dragonCurve(5, 60, 2).join(" ")).s("piano")
 */
export const dragonCurve = (iterations = 5, startPitch = 60, interval = 2) => {
  let current = 'FX';
  const rules = {
    'X': 'X+YF+',
    'Y': '-FX-Y'
  };
  
  // Generate L-system string
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (let char of current) {
      next += rules[char] || char;
    }
    current = next;
  }
  
  // Convert to melody
  let pitch = startPitch;
  const notes = [];
  
  for (let char of current) {
    if (char === 'F') {
      notes.push(pitch);
    } else if (char === '+') {
      pitch += interval;
    } else if (char === '-') {
      pitch -= interval;
    }
  }
  
  return notes;
};

/**
 * Barnsley Fern pattern generator
 * Maps the famous fern fractal to musical parameters
 * @param {number} points - Number of points to generate
 * @param {string} mapping - How to map coordinates ('pitch', 'rhythm', 'both')
 * @returns {array} Array of values based on mapping type
 * @example
 * note(barnsleyFern(100, 'pitch').join(" ")).s("piano")
 */
export const barnsleyFern = (points = 100, mapping = 'pitch') => {
  const notes = [];
  let x = 0, y = 0;
  
  for (let i = 0; i < points; i++) {
    const r = Math.random();
    let newX, newY;
    
    if (r < 0.01) {
      // Stem (1%)
      newX = 0;
      newY = 0.16 * y;
    } else if (r < 0.86) {
      // Main frond (85%)
      newX = 0.85 * x + 0.04 * y;
      newY = -0.04 * x + 0.85 * y + 1.6;
    } else if (r < 0.93) {
      // Left frond (7%)
      newX = 0.2 * x - 0.26 * y;
      newY = 0.23 * x + 0.22 * y + 1.6;
    } else {
      // Right frond (7%)
      newX = -0.15 * x + 0.28 * y;
      newY = 0.26 * x + 0.24 * y + 0.44;
    }
    
    x = newX;
    y = newY;
    
    if (mapping === 'pitch') {
      notes.push(Math.floor(48 + y * 3.6));
    } else if (mapping === 'rhythm') {
      notes.push(Math.abs(x) > 0.5 ? 1 : 0);
    } else {
      notes.push({
        note: Math.floor(48 + y * 3.6),
        time: Math.abs(x) / 4,
        gain: 0.3 + Math.abs(y) / 10
      });
    }
  }
  
  return notes;
};

/**
 * Cellular Automaton pattern generator
 * Creates evolving patterns based on simple rules
 * @param {number} rule - Rule number (0-255)
 * @param {number} width - Width of the automaton
 * @param {number} generations - Number of generations
 * @returns {array} 2D array of binary values
 * @example
 * s("bd").struct(cellularAutomaton(30, 16, 16).flat().join(" "))
 */
export const cellularAutomaton = (rule = 30, width = 16, generations = 16) => {
  let current = new Array(width).fill(0);
  current[Math.floor(width/2)] = 1; // Single cell seed
  const pattern = [];
  
  for (let g = 0; g < generations; g++) {
    pattern.push(current.slice());
    const next = new Array(width).fill(0);
    
    for (let i = 0; i < width; i++) {
      // Get neighborhood (wrap edges)
      const left = current[(i - 1 + width) % width];
      const center = current[i];
      const right = current[(i + 1) % width];
      
      // Apply rule
      const config = (left << 2) | (center << 1) | right;
      next[i] = (rule >> config) & 1;
    }
    current = next;
  }
  
  return pattern;
};

/**
 * Julia Set harmonic generator
 * Maps the Julia set to chord progressions
 * @param {number} c_real - Real part of complex constant
 * @param {number} c_imag - Imaginary part of complex constant
 * @param {number} samples - Number of samples
 * @param {number} maxIter - Maximum iterations
 * @returns {array} Array of chord arrays
 * @example
 * note(juliaSet(-0.7, 0.27, 8).flat().join(" ")).s("sawtooth")
 */
export const juliaSet = (c_real = -0.7, c_imag = 0.27, samples = 8, maxIter = 20) => {
  const chords = [];
  
  for (let i = 0; i < samples; i++) {
    let z_real = (i - samples/2) / (samples/2);
    let z_imag = 0;
    let iter = 0;
    
    while (iter < maxIter && z_real * z_real + z_imag * z_imag < 4) {
      const temp = z_real * z_real - z_imag * z_imag + c_real;
      z_imag = 2 * z_real * z_imag + c_imag;
      z_real = temp;
      iter++;
    }
    
    // Map iteration count to musical intervals
    const root = 48 + (iter % 24);
    const third = root + (iter < maxIter / 2 ? 4 : 3); // Major or minor
    const fifth = root + 7;
    
    chords.push([root, third, fifth]);
  }
  
  return chords;
};

// Register Pattern methods
Pattern.prototype.lsystem = function(rules, iterations = 3) {
  return this.fmap(axiom => lsystem(String(axiom), rules, iterations));
};

Pattern.prototype.cantor = function(level = 3, length = 27) {
  return reify(cantorSet(level, length).join(' '));
};

Pattern.prototype.sierpinski = function(iterations = 32) {
  return reify(sierpinski(iterations).join(' '));
};

Pattern.prototype.dragon = function(iterations = 5, startPitch = 60, interval = 2) {
  return reify(dragonCurve(iterations, startPitch, interval).join(' '));
};

Pattern.prototype.barnsley = function(points = 100, mapping = 'pitch') {
  const data = barnsleyFern(points, mapping);
  if (mapping === 'pitch') {
    return reify(data.join(' '));
  } else if (mapping === 'rhythm') {
    return reify(data.join(' '));
  } else {
    // Complex mapping - return as pattern
    return reify(data.map(d => d.note).join(' '));
  }
};

Pattern.prototype.cellular = function(rule = 30, width = 16, generations = 16) {
  const pattern = cellularAutomaton(rule, width, generations);
  return reify(pattern.flat().join(' '));
};

Pattern.prototype.julia = function(c_real = -0.7, c_imag = 0.27, samples = 8) {
  const chords = juliaSet(c_real, c_imag, samples);
  return reify(chords.flat().join(' '));
};

// Export all functions
export default {
  lsystem,
  cantorSet,
  sierpinski,
  dragonCurve,
  barnsleyFern,
  cellularAutomaton,
  juliaSet
};