import { describe, it, expect } from 'vitest';
import { aliasFuncs } from '../index.mjs';
import * as pattern from '../index.mjs';
import { fast, pure } from '@strudel/core';

// Helper copied from pattern.test.mjs
const sameFirst = (a, b) => {
  return expect(a.sortHapsByPart().firstCycle()).toStrictEqual(b.sortHapsByPart().firstCycle());
};

describe('alias (string input)', () => {
  it('should alias a method on Pattern.prototype', () => {
    aliasFuncs('fast', 'schnell');
    const p = pure('a').fast(2);
    const q = pure('a').schnell(2);
    expect(sameFirst(q, p)).toBeTruthy();
  });

  it('should alias a standalone function', () => {
    aliasFuncs('fast', 'schnell');
    const p = fast(2, pure('a'));
    const q = pattern.schnell(2, pure('a'));
    expect(sameFirst(q, p)).toBeTruthy();
  });

  it('should overwrite an existing alias', () => {
    aliasFuncs('fast', 'schnell');
    aliasFuncs('slow', 'schnell');
    const p = pure('a').slow(2);
    const q = pure('a').schnell(2);
    expect(sameFirst(q, p)).toBeTruthy();
  });

  it('should throw if source does not exist', () => {
    expect(() => aliasFuncs('notamethod', 'aliasname')).to.throw();
  });

  it('should throw if method does not exist', () => {
    expect(() => aliasFuncs('notamethod', 'aliasname')).to.throw();
  });
});

describe('alias (array input)', () => {
  it('should support batch aliasing', () => {
    aliasFuncs(['fast', 'slow'], ['vite', 'lent']);
    const p = pure('a').fast(2);
    const q = pure('a').vite(2);
    expect(sameFirst(q, p)).toBeTruthy();
    const r = pure('a').slow(2);
    const s = pure('a').lent(2);
    expect(sameFirst(s, r)).toBeTruthy();
  });

  it('should throw if batch aliasing with arrays of different lengths', () => {
    expect(() => aliasFuncs(['fast', 'slow'], ['vite'])).to.throw();
  });

  it('should alias to multiple targets', () => {
    aliasFuncs('fast', ['vite', 'rapide']);
    const p = pure('a').fast(2);
    const q = pure('a').vite(2);
    const r = pure('a').rapide(2);
    expect(sameFirst(q, p)).toBeTruthy();
    expect(sameFirst(r, p)).toBeTruthy();
  });

  it('should alias multiple sources to one target (last wins)', () => {
    aliasFuncs(['fast', 'slow'], 'tempo');
    const p = pure('a').slow(2);
    const q = pure('a').tempo(2);
    expect(sameFirst(q, p)).toBeTruthy();
  });
});

describe('alias (dictionary input)', () => {
  it('should alias a single entry from a dictionary', () => {
    aliasFuncs({ fast: 'veloz' });
    const p = pure('a').fast(2);
    const q = pure('a').veloz(2);
    expect(sameFirst(q, p)).toBeTruthy();
  });

  it('should alias multiple entries from a dictionary', () => {
    aliasFuncs({ fast: 'vite', slow: 'lent' });
    const p = pure('a').fast(2);
    const q = pure('a').vite(2);
    expect(sameFirst(q, p)).toBeTruthy();
    const r = pure('a').slow(2);
    const s = pure('a').lent(2);
    expect(sameFirst(s, r)).toBeTruthy();
  });

  it('should alias with arrays as values in a dictionary', () => {
    aliasFuncs({ fast: ['rapide', 'schnell'] });
    const p = pure('a').fast(2);
    const q = pure('a').rapide(2);
    const r = pure('a').schnell(2);
    expect(sameFirst(q, p)).toBeTruthy();
    expect(sameFirst(r, p)).toBeTruthy();
  });

  it('should throw if a source in the dictionary does not exist', () => {
    expect(() => aliasFuncs({ notamethod: 'aliasname' })).to.throw();
  });
});

describe('alias (empty string handling)', () => {
  it('should ignore empty string targets', () => {
    // This should not throw and should not create any aliases
    expect(() => aliasFuncs('fast', '')).not.to.throw();
    // Verify that no empty string method was added
    expect(pure('a')['']).toBeUndefined();
  });

  it('should filter out empty strings from target arrays', () => {
    aliasFuncs('fast', ['schnell', '', 'rapide']);
    const p = pure('a').fast(2);
    const q = pure('a').schnell(2);
    const r = pure('a').rapide(2);
    expect(sameFirst(q, p)).toBeTruthy();
    expect(sameFirst(r, p)).toBeTruthy();
    // Verify that no empty string method was added
    expect(pure('a')['']).toBeUndefined();
  });

  it('should ignore empty strings in dictionary values', () => {
    aliasFuncs({ fast: '', slow: 'lent' });
    const p = pure('a').slow(2);
    const q = pure('a').lent(2);
    expect(sameFirst(q, p)).toBeTruthy();
    // Verify that no empty string method was added for 'fast'
    expect(pure('a')['']).toBeUndefined();
  });

  it('should filter empty strings from array values in dictionary', () => {
    aliasFuncs({ fast: ['schnell', '', 'rapide'] });
    const p = pure('a').fast(2);
    const q = pure('a').schnell(2);
    const r = pure('a').rapide(2);
    expect(sameFirst(q, p)).toBeTruthy();
    expect(sameFirst(r, p)).toBeTruthy();
    // Verify that no empty string method was added
    expect(pure('a')['']).toBeUndefined();
  });
}); 