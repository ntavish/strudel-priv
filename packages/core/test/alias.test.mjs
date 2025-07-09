import { describe, it, expect } from 'vitest';
import { alias } from '../pattern.mjs';
import * as pattern from '../pattern.mjs';
import { fast, pure } from '../index.mjs';

// Helper copied from pattern.test.mjs
const sameFirst = (a, b) => {
  return expect(a.sortHapsByPart().firstCycle()).toStrictEqual(b.sortHapsByPart().firstCycle());
};

describe('alias (string input)', () => {
  it('should alias a method on Pattern.prototype', () => {
    alias('fast', 'schnell');
    const p = pure('a').fast(2);
    const q = pure('a').schnell(2);
    expect(sameFirst(q, p)).toBeTruthy();
  });

  it('should alias a standalone function', () => {
    alias('fast', 'schnell');
    const p = fast(2, pure('a'));
    const q = pattern.schnell(2, pure('a'));
    expect(sameFirst(q, p)).toBeTruthy();
  });

  it('should overwrite an existing alias', () => {
    alias('fast', 'schnell');
    alias('slow', 'schnell');
    const p = pure('a').slow(2);
    const q = pure('a').schnell(2);
    expect(sameFirst(q, p)).toBeTruthy();
  });

  it('should throw if source does not exist', () => {
    expect(() => alias('notamethod', 'aliasname')).to.throw();
  });

  it('should throw if method does not exist', () => {
    expect(() => alias('notamethod', 'aliasname')).to.throw();
  });
});

describe('alias (array input)', () => {
  it('should support batch aliasing', () => {
    alias(['fast', 'slow'], ['vite', 'lent']);
    const p = pure('a').fast(2);
    const q = pure('a').vite(2);
    expect(sameFirst(q, p)).toBeTruthy();
    const r = pure('a').slow(2);
    const s = pure('a').lent(2);
    expect(sameFirst(s, r)).toBeTruthy();
  });

  it('should throw if batch aliasing with arrays of different lengths', () => {
    expect(() => alias(['fast', 'slow'], ['vite'])).to.throw();
  });

  it('should alias to multiple targets', () => {
    alias('fast', ['vite', 'rapide']);
    const p = pure('a').fast(2);
    const q = pure('a').vite(2);
    const r = pure('a').rapide(2);
    expect(sameFirst(q, p)).toBeTruthy();
    expect(sameFirst(r, p)).toBeTruthy();
  });

  it('should alias multiple sources to one target (last wins)', () => {
    alias(['fast', 'slow'], 'tempo');
    const p = pure('a').slow(2);
    const q = pure('a').tempo(2);
    expect(sameFirst(q, p)).toBeTruthy();
  });
});

describe('alias (dictionary input)', () => {
  it('should alias a single entry from a dictionary', () => {
    alias({ fast: 'veloz' });
    const p = pure('a').fast(2);
    const q = pure('a').veloz(2);
    expect(sameFirst(q, p)).toBeTruthy();
  });

  it('should alias multiple entries from a dictionary', () => {
    alias({ fast: 'vite', slow: 'lent' });
    const p = pure('a').fast(2);
    const q = pure('a').vite(2);
    expect(sameFirst(q, p)).toBeTruthy();
    const r = pure('a').slow(2);
    const s = pure('a').lent(2);
    expect(sameFirst(s, r)).toBeTruthy();
  });

  it('should alias with arrays as values in a dictionary', () => {
    alias({ fast: ['rapide', 'schnell'] });
    const p = pure('a').fast(2);
    const q = pure('a').rapide(2);
    const r = pure('a').schnell(2);
    expect(sameFirst(q, p)).toBeTruthy();
    expect(sameFirst(r, p)).toBeTruthy();
  });

  it('should throw if a source in the dictionary does not exist', () => {
    expect(() => alias({ notamethod: 'aliasname' })).to.throw();
  });
}); 