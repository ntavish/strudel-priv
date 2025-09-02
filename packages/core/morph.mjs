/*
morph.mjs - Pattern morphing with musical tension curves
Copyright (C) 2025 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
*/

import { Pattern, reify, silence } from './index.mjs';
import Fraction from './fraction.mjs';

// Musical tension curve functions
const tensionCurves = {
  // Classic build-up and release
  arc: (t) => Math.sin(t * Math.PI),
  
  // Sudden drop after buildup
  cliff: (t) => t < 0.8 ? Math.pow(t / 0.8, 2) : 1 - ((t - 0.8) / 0.2),
  
  // Multiple peaks like a wave
  wave: (t) => (Math.sin(t * Math.PI * 4) + 1) / 2,
  
  // Fibonacci spiral approach
  golden: (t) => {
    const phi = (1 + Math.sqrt(5)) / 2;
    return Math.pow(t, 1/phi);
  },
  
  // Rhythmic pulsing
  pulse: (t) => {
    const phase = (t * 8) % 1;
    return phase < 0.2 ? 1 : 0.3;
  },
  
  // Chaotic attractor-inspired
  lorenz: (t) => {
    let x = 0.1, y = 0, z = 0;
    const dt = 0.01;
    const sigma = 10, rho = 28, beta = 8/3;
    const steps = Math.floor(t * 100);
    
    for (let i = 0; i < steps; i++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;
      x += dx * dt;
      y += dy * dt;
      z += dz * dt;
    }
    return (Math.tanh(x / 10) + 1) / 2;
  }
};

// Morph between two patterns using a tension curve
Pattern.prototype.morph = function(targetPattern, curve = 'arc', cycles = 4) {
  const target = reify(targetPattern);
  const curveFunc = typeof curve === 'function' ? curve : tensionCurves[curve] || tensionCurves.arc;
  
  return this.superimpose(
    target,
    new Pattern((state) => {
      const cyclePos = state.span.begin.mod(Fraction(cycles)) / cycles;
      const tension = curveFunc(cyclePos);
      
      // Query both patterns
      const sourceHaps = this.query(state);
      const targetHaps = target.query(state);
      
      // Blend based on tension
      return sourceHaps.map(hap => 
        hap.withValue(v => ({
          ...v,
          gain: (v.gain || 1) * (1 - tension)
        }))
      ).concat(
        targetHaps.map(hap => 
          hap.withValue(v => ({
            ...v,
            gain: (v.gain || 1) * tension
          }))
        )
      );
    })
  );
};

// Rhythmic density morphing
Pattern.prototype.densityMorph = function(targetDensity, curve = 'arc', cycles = 4) {
  const curveFunc = typeof curve === 'function' ? curve : tensionCurves[curve] || tensionCurves.arc;
  
  return new Pattern((state) => {
    const cyclePos = state.span.begin.mod(Fraction(cycles)) / cycles;
    const tension = curveFunc(cyclePos);
    const currentDensity = this._steps || 1;
    const morphedDensity = currentDensity + (targetDensity - currentDensity) * tension;
    
    // Adjust pattern speed based on morphed density
    return this.fast(morphedDensity / currentDensity).query(state);
  });
};

// Spectral morphing (frequency-based blending)
Pattern.prototype.spectralMorph = function(targetPattern, curve = 'arc', cycles = 4) {
  const target = reify(targetPattern);
  const curveFunc = typeof curve === 'function' ? curve : tensionCurves[curve] || tensionCurves.arc;
  
  return new Pattern((state) => {
    const cyclePos = state.span.begin.mod(Fraction(cycles)) / cycles;
    const tension = curveFunc(cyclePos);
    
    const sourceHaps = this.query(state);
    const targetHaps = target.query(state);
    
    // Frequency-based crossfade
    return sourceHaps.map(hap => 
      hap.withValue(v => ({
        ...v,
        // High-pass the source as tension increases
        hpf: 20 + (20000 - 20) * tension,
        hpq: 0.5 + tension * 2,
        gain: (v.gain || 1) * Math.sqrt(1 - tension)
      }))
    ).concat(
      targetHaps.map(hap => 
        hap.withValue(v => ({
          ...v,
          // Low-pass the target as tension decreases
          lpf: 20000 - (20000 - 20) * (1 - tension),
          lpq: 0.5 + (1 - tension) * 2,
          gain: (v.gain || 1) * Math.sqrt(tension)
        }))
      )
    );
  });
};

// Cellular automaton pattern evolution
Pattern.prototype.evolve = function(rule = 30, generations = 8) {
  return new Pattern((state) => {
    const cycleNum = Math.floor(state.span.begin);
    const gen = cycleNum % generations;
    
    // Get initial pattern as binary cells
    const initialHaps = this.query(state);
    let cells = new Array(16).fill(0);
    
    initialHaps.forEach(hap => {
      const pos = Math.floor(hap.whole.begin * cells.length) % cells.length;
      cells[pos] = 1;
    });
    
    // Evolve using cellular automaton rule
    for (let g = 0; g < gen; g++) {
      const newCells = new Array(cells.length).fill(0);
      for (let i = 0; i < cells.length; i++) {
        const left = cells[(i - 1 + cells.length) % cells.length];
        const center = cells[i];
        const right = cells[(i + 1) % cells.length];
        const index = (left << 2) | (center << 1) | right;
        newCells[i] = (rule >> index) & 1;
      }
      cells = newCells;
    }
    
    // Convert cells back to haps
    return cells.map((cell, i) => {
      if (cell === 0) return null;
      const begin = Fraction(i).div(cells.length).add(state.span.begin.floor());
      const end = begin.add(Fraction(1).div(cells.length));
      return new Hap(
        new TimeSpan(begin, end),
        new TimeSpan(begin, end),
        { note: 60 + i, s: 'piano', gain: 0.5 }
      );
    }).filter(h => h !== null);
  });
};

export { tensionCurves };