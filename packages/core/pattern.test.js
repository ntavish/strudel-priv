import { describe, it, expect } from 'vitest';
import { Pattern, sequence, stack, pure, tensionCurves } from './pattern.mjs';

describe('Fractal Pattern Generation', () => {
  describe('Tension Curves', () => {
    it('should apply arc tension curve', () => {
      const curve = tensionCurves.arc;
      expect(curve(0)).toBe(0);
      expect(curve(0.5)).toBeCloseTo(1);
      expect(curve(1)).toBeCloseTo(0);
    });

    it('should apply cliff tension curve', () => {
      const curve = tensionCurves.cliff;
      expect(curve(0)).toBe(0);
      expect(curve(0.4)).toBeLessThan(0.5);
      expect(curve(0.8)).toBe(1);
      expect(curve(1)).toBe(0);
    });

    it('should apply wave tension curve', () => {
      const curve = tensionCurves.wave;
      expect(curve(0)).toBeCloseTo(0.5);
      expect(curve(0.125)).toBeCloseTo(1);
      expect(curve(0.25)).toBeCloseTo(0.5);
      expect(curve(0.375)).toBeCloseTo(0);
    });

    it('should apply golden ratio tension curve', () => {
      const curve = tensionCurves.golden;
      const phi = (1 + Math.sqrt(5)) / 2;
      expect(curve(0)).toBe(0);
      expect(curve(1)).toBe(1);
      expect(curve(0.5)).toBeCloseTo(Math.pow(0.5, 1/phi));
    });

    it('should apply pulse tension curve', () => {
      const curve = tensionCurves.pulse;
      expect(curve(0)).toBe(0);
      expect(curve(0.1)).toBeCloseTo(0.5);
      expect(curve(0.5)).toBe(0);
      expect(curve(1)).toBe(0);
    });

    it('should apply lorenz tension curve', () => {
      const curve = tensionCurves.lorenz;
      // Lorenz attractor produces chaotic values
      expect(curve(0)).toBeGreaterThanOrEqual(0);
      expect(curve(0)).toBeLessThanOrEqual(1);
      expect(curve(0.5)).toBeGreaterThanOrEqual(0);
      expect(curve(0.5)).toBeLessThanOrEqual(1);
    });
  });

  describe('Pattern Morphing', () => {
    it('should morph between two patterns', () => {
      const pat1 = sequence('c3', 'e3', 'g3');
      const pat2 = sequence('d3', 'f3', 'a3');
      
      const morphed = pat1.morphTo(pat2, 0.5);
      expect(morphed).toBeDefined();
      expect(morphed instanceof Pattern).toBe(true);
    });

    it('should apply tension curve to morphing', () => {
      const pat1 = pure(1);
      const pat2 = pure(10);
      
      const morphedLinear = pat1.morphTo(pat2, 0.5);
      const morphedArc = pat1.morphTo(pat2, 0.5, 'arc');
      
      // Arc should peak at 0.5
      expect(morphedLinear).toBeDefined();
      expect(morphedArc).toBeDefined();
    });

    it('should handle density morphing', () => {
      const pat1 = sequence('c3', 'e3');
      const pat2 = sequence('d3', 'f3', 'a3', 'c4');
      
      const morphed = pat1.densityMorph(pat2, 0.5);
      expect(morphed).toBeDefined();
    });

    it('should handle spectral morphing', () => {
      const pat1 = pure({ freq: 440 });
      const pat2 = pure({ freq: 880 });
      
      const morphed = pat1.spectralMorph(pat2, 0.5);
      expect(morphed).toBeDefined();
    });
  });

  describe('Fractal Rhythm Generation', () => {
    it('should generate Cantor set rhythm', () => {
      const cantor = Pattern.cantor(3);
      expect(cantor).toBeDefined();
      expect(cantor instanceof Pattern).toBe(true);
    });

    it('should generate Sierpinski triangle pattern', () => {
      const sierpinski = Pattern.sierpinski(4);
      expect(sierpinski).toBeDefined();
      expect(sierpinski instanceof Pattern).toBe(true);
    });

    it('should generate Dragon curve', () => {
      const dragon = Pattern.dragon(5);
      expect(dragon).toBeDefined();
      expect(dragon instanceof Pattern).toBe(true);
    });

    it('should generate Koch curve', () => {
      const koch = Pattern.koch(3);
      expect(koch).toBeDefined();
      expect(koch instanceof Pattern).toBe(true);
    });
  });

  describe('L-System Pattern Generation', () => {
    it('should generate L-system patterns', () => {
      const rules = {
        'F': 'F+F-F-F+F'
      };
      const lsystem = Pattern.lsystem('F', rules, 2);
      expect(lsystem).toBeDefined();
      expect(lsystem instanceof Pattern).toBe(true);
    });

    it('should handle complex L-system rules', () => {
      const rules = {
        'X': 'XY',
        'Y': 'X'
      };
      const lsystem = Pattern.lsystem('X', rules, 3);
      expect(lsystem).toBeDefined();
    });
  });

  describe('IFS Fractal Generation', () => {
    it('should generate Barnsley Fern', () => {
      const fern = Pattern.barnsleyFern(10);
      expect(fern).toBeDefined();
      expect(fern instanceof Pattern).toBe(true);
    });

    it('should generate IFS with custom transforms', () => {
      const transforms = [
        { a: 0.5, b: 0, c: 0, d: 0.5, e: 0, f: 0, p: 0.5 },
        { a: 0.5, b: 0, c: 0, d: 0.5, e: 0.5, f: 0, p: 0.5 }
      ];
      const ifs = Pattern.ifs(transforms, 10);
      expect(ifs).toBeDefined();
    });
  });

  describe('Cellular Automata', () => {
    it('should generate elementary cellular automaton', () => {
      const ca = Pattern.cellularAutomaton(30, 8);
      expect(ca).toBeDefined();
      expect(ca instanceof Pattern).toBe(true);
    });

    it('should handle different CA rules', () => {
      const rule90 = Pattern.cellularAutomaton(90, 8);
      const rule110 = Pattern.cellularAutomaton(110, 8);
      
      expect(rule90).toBeDefined();
      expect(rule110).toBeDefined();
    });
  });

  describe('Chaos Patterns', () => {
    it('should generate Logistic map patterns', () => {
      const logistic = Pattern.logisticMap(3.8, 10);
      expect(logistic).toBeDefined();
      expect(logistic instanceof Pattern).toBe(true);
    });

    it('should generate Henon map patterns', () => {
      const henon = Pattern.henonMap(1.4, 0.3, 10);
      expect(henon).toBeDefined();
      expect(henon instanceof Pattern).toBe(true);
    });
  });

  describe('Integration with Pattern Methods', () => {
    it('should chain fractal patterns with regular pattern methods', () => {
      const pattern = Pattern.cantor(3)
        .fast(2)
        .add(12)
        .scale('minor');
      
      expect(pattern).toBeDefined();
      expect(pattern instanceof Pattern).toBe(true);
    });

    it('should stack fractal patterns', () => {
      const stacked = stack(
        Pattern.sierpinski(3),
        Pattern.cantor(2),
        Pattern.dragon(4)
      );
      
      expect(stacked).toBeDefined();
      expect(stacked instanceof Pattern).toBe(true);
    });
  });

  describe('Pattern Method Extensions', () => {
    it('should support brownian motion', () => {
      const pat = pure(60);
      const brownian = pat.brownian(5);
      expect(brownian).toBeDefined();
    });

    it('should support Julia set mapping', () => {
      const pat = sequence(0, 1, 2, 3);
      const julia = pat.julia(-0.7, 0.27);
      expect(julia).toBeDefined();
    });

    it('should support Mandelbrot set mapping', () => {
      const pat = sequence(0, 1, 2, 3);
      const mandelbrot = pat.mandelbrot(10);
      expect(mandelbrot).toBeDefined();
    });
  });
});