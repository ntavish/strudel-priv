import { describe, it, expect } from 'vitest';
import { setLocale } from '../index.mjs';
import { pure } from '@strudel/core';

// Helper to check if alias works
const sameFirst = (a, b) => {
  return expect(a.sortHapsByPart().firstCycle()).toStrictEqual(b.sortHapsByPart().firstCycle());
};

describe('setLocale', () => {
  it('registers aliases from the test locale file (async)', async () => {
    await setLocale('test');
    const p = pure('a').fast(2);
    const q = pure('a').speedy(2);
    sameFirst(q, p);
    const r = pure('a').slow(2);
    const s = pure('a').sluggish(2);
    const t = pure('a').tardy(2);
    sameFirst(s, r);
    sameFirst(t, r);
  });

  it('throws if the locale file does not exist', async () => {
    await expect(setLocale('nope')).rejects.toThrow(/Locale file for 'nope' not found/);
  });
});
