import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { locale } from '../index.mjs';
import { pure } from '@strudel/core';

// Helper to check if alias works
const sameFirst = (a, b) => {
  return expect(a.sortHapsByPart().firstCycle()).toStrictEqual(b.sortHapsByPart().firstCycle());
};

// Mock locale data for testing
const testLocaleData = {
  fast: 'speedy',
  slow: ['sluggish', 'tardy']
};

describe('locale', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore fetch
    vi.restoreAllMocks();
  });

  it('registers aliases from a URL (async)', async () => {
    // Mock successful fetch response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => testLocaleData
    });

    await locale('https://example.com/test.json');
    
    const p = pure('a').fast(2);
    const q = pure('a').speedy(2);
    sameFirst(q, p);
    
    const r = pure('a').slow(2);
    const s = pure('a').sluggish(2);
    const t = pure('a').tardy(2);
    sameFirst(s, r);
    sameFirst(t, r);
  });

  it('throws if the URL returns a 404', async () => {
    // Mock failed fetch response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(locale('https://example.com/nonexistent.json')).rejects.toThrow(/Failed to load locale file from 'https:\/\/example\.com\/nonexistent\.json': HTTP 404: Not Found/);
  });

  it('throws if fetch fails due to network error', async () => {
    // Mock network error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(locale('https://example.com/test.json')).rejects.toThrow(/Failed to load locale file from 'https:\/\/example\.com\/test\.json': Network error/);
  });

  it('throws if the response is not valid JSON', async () => {
    // Mock response with invalid JSON
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Unexpected token in JSON');
      }
    });

    await expect(locale('https://example.com/invalid.json')).rejects.toThrow(/Failed to load locale file from 'https:\/\/example\.com\/invalid\.json': Unexpected token in JSON/);
  });
});
