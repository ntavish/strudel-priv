import { afterEach } from 'vitest';
import { useOldRandom } from './packages/core/signal.mjs';

afterEach(() => {
  // Avoid bleed between tests
  useOldRandom(false);
});
