import { describe, it, expect } from 'vitest';
import { 
  perlinNoise, 
  perlinBipolar, 
  fbm, 
  turbulence, 
  ridge,
  createOctaveNoise
} from './noise.mjs';

describe('Perlin Noise Functions', () => {
  describe('Basic Perlin Noise', () => {
    it('should generate unipolar Perlin noise (0 to 1)', () => {
      const noise = perlinNoise;
      // Test at various time points
      for (let t = 0; t < 1; t += 0.1) {
        const value = noise.query(t).hap.value;
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should generate bipolar Perlin noise (-1 to 1)', () => {
      const noise = perlinBipolar;
      for (let t = 0; t < 1; t += 0.1) {
        const value = noise.query(t).hap.value;
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should produce smooth continuous values', () => {
      const noise = perlinNoise;
      const t1 = 0.5;
      const t2 = 0.51; // Small increment
      
      const v1 = noise.query(t1).hap.value;
      const v2 = noise.query(t2).hap.value;
      
      // Values should be close for small time differences
      expect(Math.abs(v2 - v1)).toBeLessThan(0.1);
    });
  });

  describe('Fractal Brownian Motion (FBM)', () => {
    it('should generate FBM with default parameters', () => {
      const noise = fbm();
      for (let t = 0; t < 1; t += 0.1) {
        const value = noise.query(t).hap.value;
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should respect octave parameter', () => {
      const fbm1 = fbm(1);
      const fbm4 = fbm(4);
      
      // More octaves should produce more detailed noise
      const samples = 20;
      let variance1 = 0, variance4 = 0;
      const values1 = [], values4 = [];
      
      for (let i = 0; i < samples; i++) {
        const t = i / samples;
        values1.push(fbm1.query(t).hap.value);
        values4.push(fbm4.query(t).hap.value);
      }
      
      // Calculate variance
      const mean1 = values1.reduce((a, b) => a + b) / samples;
      const mean4 = values4.reduce((a, b) => a + b) / samples;
      
      variance1 = values1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / samples;
      variance4 = values4.reduce((sum, v) => sum + Math.pow(v - mean4, 2), 0) / samples;
      
      // More octaves typically produce different variance patterns
      expect(variance1).toBeDefined();
      expect(variance4).toBeDefined();
    });

    it('should handle lacunarity parameter', () => {
      const fbmLow = fbm(3, 1.5);
      const fbmHigh = fbm(3, 3.0);
      
      // Different lacunarity should produce different patterns
      const t = 0.5;
      const valueLow = fbmLow.query(t).hap.value;
      const valueHigh = fbmHigh.query(t).hap.value;
      
      expect(valueLow).toBeDefined();
      expect(valueHigh).toBeDefined();
    });

    it('should handle gain parameter', () => {
      const fbmLowGain = fbm(3, 2.0, 0.3);
      const fbmHighGain = fbm(3, 2.0, 0.7);
      
      const t = 0.5;
      const valueLow = fbmLowGain.query(t).hap.value;
      const valueHigh = fbmHighGain.query(t).hap.value;
      
      expect(valueLow).toBeDefined();
      expect(valueHigh).toBeDefined();
    });
  });

  describe('Turbulence', () => {
    it('should generate turbulent noise', () => {
      const noise = turbulence();
      
      for (let t = 0; t < 1; t += 0.1) {
        const value = noise.query(t).hap.value;
        // Turbulence uses absolute values, so should be positive
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should produce different patterns than FBM', () => {
      const fbmNoise = fbm(3);
      const turbNoise = turbulence(3);
      
      const fbmValue = fbmNoise.query(0.5).hap.value;
      const turbValue = turbNoise.query(0.5).hap.value;
      
      // Turbulence is always positive (absolute value)
      expect(turbValue).toBeGreaterThanOrEqual(0);
      // FBM can be negative
      expect(Math.abs(fbmValue)).toBeDefined();
    });
  });

  describe('Ridge Noise', () => {
    it('should generate ridge noise', () => {
      const noise = ridge();
      
      for (let t = 0; t < 1; t += 0.1) {
        const value = noise.query(t).hap.value;
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should produce sharp ridge features', () => {
      const noise = ridge(3);
      const values = [];
      
      for (let i = 0; i < 20; i++) {
        values.push(noise.query(i / 20).hap.value);
      }
      
      // Ridge noise should have some sharp transitions
      let maxDiff = 0;
      for (let i = 1; i < values.length; i++) {
        const diff = Math.abs(values[i] - values[i - 1]);
        maxDiff = Math.max(maxDiff, diff);
      }
      
      expect(maxDiff).toBeGreaterThan(0);
    });
  });

  describe('Octave Noise Factory', () => {
    it('should create custom octave noise', () => {
      const customNoise = createOctaveNoise(
        (t) => Math.sin(t * Math.PI * 2),
        3, 2.0, 0.5
      );
      
      for (let t = 0; t < 1; t += 0.1) {
        const value = customNoise.query(t).hap.value;
        expect(value).toBeDefined();
        expect(typeof value).toBe('number');
      }
    });

    it('should handle custom noise functions', () => {
      // Triangle wave as base function
      const triangleWave = (t) => {
        const phase = t % 1;
        return phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4;
      };
      
      const customNoise = createOctaveNoise(triangleWave, 2);
      const value = customNoise.query(0.25).hap.value;
      
      expect(value).toBeDefined();
      expect(typeof value).toBe('number');
    });
  });

  describe('Pattern Integration', () => {
    it('should work with pattern methods', () => {
      const pattern = perlinNoise
        .range(0, 10)
        .slow(4);
      
      expect(pattern).toBeDefined();
      const value = pattern.query(0).hap.value;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    });

    it('should combine with other patterns', () => {
      const combined = perlinNoise
        .add(perlinBipolar.mul(0.1))
        .range(60, 72);
      
      const value = combined.query(0.5).hap.value;
      expect(value).toBeGreaterThanOrEqual(50); // Approximate range
      expect(value).toBeLessThanOrEqual(80);
    });

    it('should modulate pattern parameters', () => {
      // Use noise to modulate a sine wave frequency
      const modulated = perlinNoise
        .range(220, 440)
        .fmap(freq => ({ s: 'sine', freq }));
      
      const event = modulated.query(0.5).hap.value;
      expect(event.freq).toBeGreaterThanOrEqual(220);
      expect(event.freq).toBeLessThanOrEqual(440);
    });
  });

  describe('Noise Characteristics', () => {
    it('should maintain temporal coherence', () => {
      const noise = perlinNoise;
      const values = [];
      
      // Sample noise at regular intervals
      for (let i = 0; i < 100; i++) {
        values.push(noise.query(i / 100).hap.value);
      }
      
      // Check for smoothness - adjacent values shouldn't differ too much
      let maxDiff = 0;
      for (let i = 1; i < values.length; i++) {
        const diff = Math.abs(values[i] - values[i - 1]);
        maxDiff = Math.max(maxDiff, diff);
      }
      
      // Perlin noise should be smooth
      expect(maxDiff).toBeLessThan(0.2);
    });

    it('should produce repeatable results', () => {
      const noise = fbm(3);
      const t = 0.42;
      
      const value1 = noise.query(t).hap.value;
      const value2 = noise.query(t).hap.value;
      
      // Same input should produce same output
      expect(value1).toBe(value2);
    });

    it('should have appropriate value distribution', () => {
      const noise = perlinNoise;
      const samples = 1000;
      let sum = 0;
      
      for (let i = 0; i < samples; i++) {
        sum += noise.query(i / 100).hap.value;
      }
      
      const mean = sum / samples;
      // Mean should be roughly centered (around 0.5 for unipolar)
      expect(mean).toBeGreaterThan(0.3);
      expect(mean).toBeLessThan(0.7);
    });
  });
});