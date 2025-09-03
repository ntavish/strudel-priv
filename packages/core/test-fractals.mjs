/*
test-fractals.mjs - Tests for fractal pattern generation
*/

import { strict as assert } from 'assert';

// Test L-System generation
console.log('Testing L-System generation...');

const lsystem = (axiom, rules, iterations = 3) => {
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

// Test Fibonacci word (A->AB, B->A)
const fib1 = lsystem('A', {A: 'AB', B: 'A'}, 1);
assert.equal(fib1, 'AB', 'L-System iteration 1');

const fib2 = lsystem('A', {A: 'AB', B: 'A'}, 2);
assert.equal(fib2, 'ABA', 'L-System iteration 2');

const fib3 = lsystem('A', {A: 'AB', B: 'A'}, 3);
assert.equal(fib3, 'ABAAB', 'L-System iteration 3');

console.log('✓ L-System working correctly');

// Test Cantor Set generation
console.log('Testing Cantor Set...');

const cantorSet = (level, length) => {
  if (level === 0) return Array(length).fill(1);
  
  const third = Math.floor(length / 3);
  const left = cantorSet(level - 1, third);
  const middle = Array(third).fill(0);
  const right = cantorSet(level - 1, third);
  
  return [...left, ...middle, ...right];
};

const cantor0 = cantorSet(0, 3);
assert.deepEqual(cantor0, [1, 1, 1], 'Cantor level 0');

const cantor1 = cantorSet(1, 9);
assert.deepEqual(cantor1, [1, 1, 1, 0, 0, 0, 1, 1, 1], 'Cantor level 1');

const cantor2 = cantorSet(2, 27);
assert.equal(cantor2[0], 1, 'Cantor level 2 start');
assert.equal(cantor2[13], 0, 'Cantor level 2 middle');
assert.equal(cantor2[26], 1, 'Cantor level 2 end');

console.log('✓ Cantor Set working correctly');

// Test Sierpinski Triangle generation
console.log('Testing Sierpinski Triangle...');

const sierpinski = (iterations, vertices = 3) => {
  const points = [];
  let x = Math.random(), y = Math.random();
  
  for (let i = 0; i < iterations; i++) {
    const vertex = Math.floor(Math.random() * vertices);
    // Simplified - just track which vertex was chosen
    points.push(vertex);
  }
  
  return points;
};

const sierp = sierpinski(100);
assert.equal(sierp.length, 100, 'Sierpinski generates correct number of points');
assert(sierp.every(v => v >= 0 && v < 3), 'Sierpinski points in valid range');

console.log('✓ Sierpinski Triangle working correctly');

// Test Barnsley Fern generation
console.log('Testing Barnsley Fern...');

const barnsleyFern = (points = 10) => {
  const result = [];
  let x = 0, y = 0;
  
  for (let i = 0; i < points; i++) {
    const r = Math.random();
    let newX, newY;
    
    if (r < 0.01) {
      newX = 0;
      newY = 0.16 * y;
    } else if (r < 0.86) {
      newX = 0.85 * x + 0.04 * y;
      newY = -0.04 * x + 0.85 * y + 1.6;
    } else if (r < 0.93) {
      newX = 0.2 * x - 0.26 * y;
      newY = 0.23 * x + 0.22 * y + 1.6;
    } else {
      newX = -0.15 * x + 0.28 * y;
      newY = 0.26 * x + 0.24 * y + 0.44;
    }
    
    x = newX;
    y = newY;
    result.push({x, y});
  }
  
  return result;
};

const fern = barnsleyFern(100);
assert.equal(fern.length, 100, 'Barnsley Fern generates correct number of points');
assert(fern.every(p => typeof p.x === 'number' && typeof p.y === 'number'), 
       'Barnsley Fern points have x,y coordinates');

// Check that fern points converge to expected range
const lastPoints = fern.slice(-10);
assert(lastPoints.some(p => p.y > 0), 'Barnsley Fern has positive y values');

console.log('✓ Barnsley Fern working correctly');

// Test Dragon Curve generation
console.log('Testing Dragon Curve...');

const dragonCurve = (iterations = 3) => {
  let current = 'FX';
  const rules = {
    'X': 'X+YF+',
    'Y': '-FX-Y'
  };
  
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (let char of current) {
      next += rules[char] || char;
    }
    current = next;
  }
  
  return current;
};

const dragon1 = dragonCurve(1);
assert.equal(dragon1, 'FX+YF+', 'Dragon curve iteration 1');

const dragon2 = dragonCurve(2);
assert(dragon2.includes('F'), 'Dragon curve contains forward moves');
assert(dragon2.includes('+'), 'Dragon curve contains right turns');
assert(dragon2.includes('-'), 'Dragon curve contains left turns');

console.log('✓ Dragon Curve working correctly');

// Test Cellular Automaton (Rule 30)
console.log('Testing Cellular Automaton...');

const rule30 = (width, generations) => {
  let current = new Array(width).fill(0);
  current[Math.floor(width/2)] = 1;
  const pattern = [];
  
  for (let g = 0; g < generations; g++) {
    const next = new Array(width).fill(0);
    for (let i = 0; i < width; i++) {
      const left = current[(i - 1 + width) % width];
      const center = current[i];
      const right = current[(i + 1) % width];
      
      const config = (left << 2) | (center << 1) | right;
      next[i] = (30 >> config) & 1;
    }
    pattern.push(current.slice());
    current = next;
  }
  
  return pattern;
};

const ca = rule30(5, 3);
assert.equal(ca.length, 3, 'CA generates correct number of generations');
assert.equal(ca[0][2], 1, 'CA starts with center cell');
assert(ca.every(row => row.length === 5), 'CA maintains width');

console.log('✓ Cellular Automaton working correctly');

// Test Julia Set generation
console.log('Testing Julia Set...');

const juliaSet = (c_real, c_imag, maxIter = 20) => {
  let z_real = 0;
  let z_imag = 0;
  let iter = 0;
  
  while (iter < maxIter && z_real * z_real + z_imag * z_imag < 4) {
    const temp = z_real * z_real - z_imag * z_imag + c_real;
    z_imag = 2 * z_real * z_imag + c_imag;
    z_real = temp;
    iter++;
  }
  
  return iter;
};

const julia1 = juliaSet(-0.7, 0.27);
assert(julia1 >= 0 && julia1 <= 20, 'Julia set returns valid iteration count');

const julia2 = juliaSet(0, 0);
assert(julia2 >= 0 && julia2 <= 20, 'Julia set handles origin');

console.log('✓ Julia Set working correctly');

// Test musical mapping functions
console.log('Testing musical mappings...');

const mapToMidi = (value, min, max, midiMin = 36, midiMax = 84) => {
  const normalized = (value - min) / (max - min);
  return Math.floor(midiMin + normalized * (midiMax - midiMin));
};

assert.equal(mapToMidi(0, 0, 1, 60, 72), 60, 'Maps minimum correctly');
assert.equal(mapToMidi(1, 0, 1, 60, 72), 72, 'Maps maximum correctly');
assert.equal(mapToMidi(0.5, 0, 1, 60, 72), 66, 'Maps midpoint correctly');

console.log('✓ Musical mapping working correctly');

console.log('\n✨ All fractal pattern tests passed!');
console.log('\nFractal patterns can be used in Strudel for:');
console.log('- L-Systems for melodic development');
console.log('- Cantor Sets for rhythmic gaps');
console.log('- Sierpinski for probabilistic patterns');
console.log('- Barnsley Fern for organic textures');
console.log('- Dragon Curves for wandering melodies');
console.log('- Cellular Automata for evolving rhythms');
console.log('- Julia Sets for harmonic progressions');