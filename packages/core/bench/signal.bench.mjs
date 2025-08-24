import { describe, bench } from 'vitest';

import { calculateSteps, rand, useOldRandom } from '../index.mjs';

const testingResolution = 1024;

const _generateRandomPattern = () => rand.iter(testingResolution).fast(testingResolution).firstCycle();

describe('random', () => {
  calculateSteps(true);
  bench(
    '+tactus',
    _generateRandomPattern,
    { time: 1000 },
  );

  calculateSteps(false);
  bench(
    '-tactus',
    _generateRandomPattern,
    { time: 1000 },
  );
});

describe('old random', () => {
  calculateSteps(true);
  bench(
    '+tactus',
    () => {
        useOldRandom();
        _generateRandomPattern();
    },
    { time: 1000 },
  );

  calculateSteps(false);
  bench(
    '-tactus',
    () => {
        useOldRandom();
        _generateRandomPattern();
    },
    { time: 1000 },
  );
});
calculateSteps(true);
