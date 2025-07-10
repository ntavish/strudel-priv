import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { colorMap } from '@strudel/draw/color.mjs';
import { aliasColors, resolveColor } from '../index.mjs';

describe('aliasColors', () => {
  let originalColorMap;

  beforeEach(() => {
    // Save original colorMap and create a copy for testing
    originalColorMap = { ...colorMap };
  });

  afterEach(() => {
    // Restore original colorMap
    Object.keys(colorMap).forEach(key => {
      if (!(key in originalColorMap)) {
        delete colorMap[key];
      }
    });
  });

  it('should create a single alias for a color', () => {
    aliasColors('red', 'rouge');
    expect(colorMap.rouge).toBe(colorMap.red);
    expect(colorMap.rouge).toBe('#ff0000');
  });

  it('should create multiple aliases for a single color', () => {
    aliasColors('blue', ['bleu', 'azul']);
    expect(colorMap.bleu).toBe(colorMap.blue);
    expect(colorMap.azul).toBe(colorMap.blue);
    expect(colorMap.bleu).toBe('#0000ff');
    expect(colorMap.azul).toBe('#0000ff');
  });

  it('should create aliases for multiple colors with array syntax', () => {
    aliasColors(['red', 'green'], ['rouge', 'vert']);
    expect(colorMap.rouge).toBe(colorMap.red);
    expect(colorMap.vert).toBe(colorMap.green);
    expect(colorMap.rouge).toBe('#ff0000');
    expect(colorMap.vert).toBe('#008000');
  });

  it('should create aliases with object syntax', () => {
    aliasColors({ red: 'rouge', blue: 'bleu', green: 'vert' });
    expect(colorMap.rouge).toBe(colorMap.red);
    expect(colorMap.bleu).toBe(colorMap.blue);
    expect(colorMap.vert).toBe(colorMap.green);
  });

  it('should ignore empty string targets', () => {
    const initialKeys = Object.keys(colorMap).length;
    aliasColors('red', '');
    expect(Object.keys(colorMap).length).toBe(initialKeys);
  });

  it('should filter out empty strings from target arrays', () => {
    aliasColors('red', ['rouge', '', 'rojo']);
    expect(colorMap.rouge).toBe(colorMap.red);
    expect(colorMap.rojo).toBe(colorMap.red);
    expect(colorMap['']).toBeUndefined();
  });

  it('should throw error for non-existent source color', () => {
    expect(() => {
      aliasColors('nonexistentcolor', 'alias');
    }).toThrow(/source color 'nonexistentcolor' does not exist in colorMap/);
  });

  it('should throw error for mismatched array lengths', () => {
    expect(() => {
      aliasColors(['red', 'blue'], ['rouge']);
    }).toThrow(/source and target arrays must have the same length/);
  });

  it('should handle single source with multiple targets', () => {
    aliasColors('yellow', ['jaune', 'amarillo', 'gelb']);
    expect(colorMap.jaune).toBe(colorMap.yellow);
    expect(colorMap.amarillo).toBe(colorMap.yellow);
    expect(colorMap.gelb).toBe(colorMap.yellow);
  });

  it('should handle multiple sources with single target', () => {
    aliasColors(['red', 'blue'], 'color');
    expect(colorMap.color).toBe(colorMap.blue); // Last one wins
  });

  it('should resolve color aliases correctly with resolveColor function', () => {
    // Create an alias
    aliasColors('red', 'rouge');
    
    // Test that resolveColor resolves the alias
    expect(resolveColor('rouge')).toBe('#ff0000');
    expect(resolveColor('red')).toBe('#ff0000');
    
    // Test that existing colors work
    expect(resolveColor('blue')).toBe('#0000ff');
    
    // Test that hex colors pass through unchanged
    expect(resolveColor('#123456')).toBe('#123456');
    
    // Test that CSS functions pass through unchanged
    expect(resolveColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
    
    // Test that unknown colors pass through unchanged
    expect(resolveColor('nonexistentcolor')).toBe('nonexistentcolor');
    
    // Test case insensitivity
    expect(resolveColor('ROUGE')).toBe('#ff0000');
    expect(resolveColor('Red')).toBe('#ff0000');
    
    // Test null/undefined handling
    expect(resolveColor(null)).toBe(null);
    expect(resolveColor(undefined)).toBe(undefined);
    expect(resolveColor('')).toBe('');
  });
}); 