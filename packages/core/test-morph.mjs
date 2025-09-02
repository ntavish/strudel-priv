/*
test-morph.mjs - Tests for pattern morphing features
*/

import { tensionCurves } from './pattern.mjs';
import { strict as assert } from 'assert';

console.log('Running morphing tests...');

// Test tension curves
console.log('Testing tension curves...');
assert.equal(tensionCurves.arc(0), 0, 'Arc curve start');
assert.equal(tensionCurves.arc(0.5), 1, 'Arc curve peak');
assert(Math.abs(tensionCurves.arc(1)) < 0.0001, 'Arc curve end');
console.log('✓ Arc curve working');

assert.equal(tensionCurves.cliff(0), 0, 'Cliff curve start');
assert(tensionCurves.cliff(0.7) > 0.5, 'Cliff buildup');
assert(tensionCurves.cliff(0.9) < 0.5, 'Cliff drop');
console.log('✓ Cliff curve working');

assert(tensionCurves.wave(0.125) > 0.9, 'Wave peak 1');
assert(tensionCurves.wave(0.625) > 0.9, 'Wave peak 2');
console.log('✓ Wave curve working');

const phi = (1 + Math.sqrt(5)) / 2;
assert.equal(tensionCurves.golden(0), 0, 'Golden start');
assert.equal(tensionCurves.golden(1), 1, 'Golden end');
assert(Math.abs(tensionCurves.golden(0.5) - Math.pow(0.5, 1/phi)) < 0.01, 'Golden midpoint');
console.log('✓ Golden ratio curve working');

assert(tensionCurves.pulse(0) === 1, 'Pulse high');
assert(tensionCurves.pulse(0.03) === 0.3, 'Pulse low');
console.log('✓ Pulse curve working');

// Lorenz is chaotic but deterministic
const l1 = tensionCurves.lorenz(0.5);
const l2 = tensionCurves.lorenz(0.5);
assert.equal(l1, l2, 'Lorenz deterministic');
assert(l1 >= 0 && l1 <= 1, 'Lorenz in range');
console.log('✓ Lorenz attractor curve working');

console.log('\n✨ All tension curve tests passed!');

// Note: Pattern prototype methods need to be tested in browser environment
console.log('\nPattern morphing methods (morphTo, densityMorph, spectralMorph)');
console.log('have been added to Pattern.prototype and can be tested in the REPL.');