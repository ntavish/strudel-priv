/*
fractals.mjs - Fractal pattern generation for Strudel
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
*/

import { Pattern, sequence, silence, stack, pure, cat, fastcat } from './pattern.mjs';

/**
 * Generate a Cantor set rhythm pattern
 * @param {number} depth - Recursion depth (1-5 recommended)
 * @returns {Pattern} Binary rhythm pattern
 * @example
 * s("bd").struct(cantor(3))
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
 * @param {number} depth - Recursion depth (1-5 recommended)
 * @returns {Pattern} Binary pattern based on Sierpinski triangle
 * @example
 * s("hh").struct(sierpinski(4))
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
 * @param {number} iterations - Number of iterations (1-8 recommended)
 * @returns {Pattern} Binary rhythm following dragon curve
 * @example
 * s("sd").struct(dragon(5))
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
 * Generate an L-system pattern
 * @param {string} axiom - Starting string
 * @param {Object} rules - Replacement rules
 * @param {number} iterations - Number of iterations
 * @returns {Pattern} Pattern based on L-system
 * @example
 * lsystem("A", {"A": "AB", "B": "A"}, 4).s("bd sd")
 */
export function lsystem(axiom, rules, iterations = 3) {
  let result = axiom;
  
  for (let i = 0; i < iterations; i++) {
    result = result.split('').map(char => rules[char] || char).join('');
  }
  
  // Convert to numeric pattern
  const values = result.split('').map(char => {
    const code = char.charCodeAt(0);
    return (code % 8) / 8; // Map to 0-1 range with 8 divisions
  });
  
  return fastcat(...values);
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
 * Generate Barnsley Fern pattern
 * @param {number} points - Number of points to generate
 * @returns {Pattern} Pattern based on Barnsley fern
 * @example
 * note(barnsleyFern(50)).scale("minor")
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