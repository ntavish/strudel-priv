# Strudel Fractal Patterns

Fractal pattern generation for algorithmic music composition in Strudel.

## Overview

This module provides various fractal and mathematical pattern generators that create self-similar, recursive, and complex patterns for use in music composition. These patterns can control rhythm, melody, harmony, and other musical parameters.

## Installation

The fractal functions are included in `@strudel/core` and are automatically available in the Strudel REPL.

## Fractal Functions

### Rhythmic Fractals

These functions generate binary (0/1) patterns ideal for rhythmic structures. Use with `.struct()`:

#### `cantor(depth)`
Generates a Cantor set pattern with recursive gaps.
- **Parameters**: `depth` (1-5 recommended)
- **Returns**: Binary pattern with fractal gaps
- **Example**:
```javascript
s("bd").struct(cantor(3))
```

#### `sierpinski(depth)`
Creates a Sierpinski triangle pattern using Pascal's triangle modulo 2.
- **Parameters**: `depth` (1-5 recommended)
- **Returns**: Self-similar binary pattern
- **Example**:
```javascript
s("hh").struct(sierpinski(4)).fast(2)
```

#### `dragon(iterations)`
Generates a Dragon curve rhythm pattern.
- **Parameters**: `iterations` (1-8 recommended)
- **Returns**: Binary pattern following dragon curve folding
- **Example**:
```javascript
s("sd").struct(dragon(5)).fast(4)
```

#### `koch(depth)`
Creates a Koch snowflake pattern.
- **Parameters**: `depth` (1-4 recommended)
- **Returns**: Recursive subdivision pattern
- **Example**:
```javascript
s("cp").struct(koch(3))
```

#### `cellularAutomaton(rule, size)`
Generates patterns using elementary cellular automata.
- **Parameters**: 
  - `rule`: Rule number (0-255)
  - `size`: Pattern size
- **Returns**: Binary pattern from cellular evolution
- **Example**:
```javascript
s("click").struct(cellularAutomaton(30, 16))
```

### Melodic Fractals

These functions generate numeric patterns (0-7) for melodies. **Important**: Wrap with `n()` to use with `.scale()`:

#### `barnsleyFern(points)`
Generates patterns based on the Barnsley Fern fractal.
- **Parameters**: `points` (number of points to generate)
- **Returns**: Pattern of values 0-7
- **Usage**: Must wrap with `n()` to use `.scale()`
- **Example**:
```javascript
n(barnsleyFern(32))
  .scale("C:minor:pentatonic")
  .note()
  .s("piano")
```

#### `lsystem(axiom, rules, iterations)`
Creates patterns using Lindenmayer systems (L-systems).
- **Parameters**:
  - `axiom`: Starting string
  - `rules`: Object with replacement rules
  - `iterations`: Number of iterations
- **Returns**: Pattern based on L-system growth
- **Example**:
```javascript
n(lsystem("A", {A: "AB", B: "A"}, 4))
  .scale("C:major")
  .note()
  .s("marimba")
```

### Continuous Fractal Functions

The `fractal` namespace provides continuous functions for parameter modulation:

#### `fractal.perlin(x, y?, z?)`
Perlin noise for smooth, natural variations.
- **Parameters**: x, y, z coordinates
- **Returns**: Value between 0 and 1
- **Example**:
```javascript
s("sawtooth")
  .cutoff(sine.segment(16).range(200, 2000))
  .resonance(fractal.perlin.range(2, 20))
```

#### `fractal.mandelbrot(x, y, maxIterations?)`
Samples from interesting regions of the Mandelbrot set.
- **Parameters**: x, y coordinates, optional max iterations
- **Returns**: Normalized iteration count (0-1)

#### `fractal.julia(x, y, cx?, cy?, maxIterations?)`
Samples from Julia set fractals.
- **Parameters**: coordinates and optional constants
- **Returns**: Normalized iteration count (0-1)

## Usage Patterns

### 1. Rhythmic Patterns
Use fractal functions with `.struct()` for rhythmic patterns:
```javascript
stack(
  s("bd").struct(cantor(3)),
  s("hh").struct(sierpinski(4)).fast(2),
  s("sd").struct(dragon(5)).fast(4)
).cpm(120)
```

### 2. Melodic Patterns
Wrap fractal outputs with `n()` to enable scale mapping:
```javascript
// CORRECT - with n() wrapper
n(barnsleyFern(32))
  .scale("C:minor:pentatonic")
  .note()
  .s("piano")

// INCORRECT - without n() wrapper (no scale method)
barnsleyFern(32)
  .scale("C:minor")  // Error: scale is not a function
```

### 3. Complex Compositions
Combine multiple fractals for rich musical textures:
```javascript
stack(
  // Rhythmic foundation
  s("bd").struct(sierpinski(3)),
  s("hh").struct(cantor(4)).fast(2).gain(0.6),
  
  // Melodic line
  n(barnsleyFern(32))
    .scale("C:minor:pentatonic")
    .note()
    .s("vibraphone")
    .room(0.4),
  
  // Bass line
  n(dragon(8))
    .scale("C2:minor")
    .note()
    .s("bass")
).cpm(100)
```

### 4. Parameter Modulation
Use continuous fractals for evolving parameters:
```javascript
s("sawtooth")
  .note("c3")
  .cutoff(fractal.perlin.segment(32).range(200, 4000))
  .resonance(10)
```

## Mathematical Background

### Cantor Set
The Cantor set is created by repeatedly removing the middle third of line segments, creating a fractal dust with interesting rhythmic properties.

### Sierpinski Triangle
Generated using Pascal's triangle modulo 2, creating self-similar patterns at different scales.

### Dragon Curve
A fractal curve that can be created by folding a strip of paper repeatedly, producing complex rhythmic patterns.

### L-Systems
Lindenmayer systems model plant growth and other recursive structures through string rewriting rules.

### Barnsley Fern
An iterated function system that produces a fractal resembling a natural fern, useful for organic-feeling melodies.

### Cellular Automata
Simple rules applied to cellular grids produce complex emergent patterns, as explored by Stephen Wolfram.

## Tips and Best Practices

1. **Start with small values**: Begin with low iteration/depth values (2-4) and increase gradually
2. **Use `.fast()` and `.slow()`**: Adjust the speed of fractal patterns to fit your tempo
3. **Layer patterns**: Combine multiple fractals at different speeds for polyrhythmic textures
4. **Modulate parameters**: Use fractals to control filters, effects, and other parameters
5. **Experiment with rules**: Try different cellular automaton rules (0-255) for varied patterns

## Common Issues

### "scale is not a function"
- **Problem**: Trying to use `.scale()` directly on a fractal pattern
- **Solution**: Wrap the fractal with `n()` first: `n(barnsleyFern(32)).scale("C:major")`

### Pattern too fast/slow
- **Problem**: Fractal pattern doesn't fit the desired rhythm
- **Solution**: Use `.fast()` or `.slow()` to adjust: `sierpinski(4).fast(2)`

### No sound from melodic fractals
- **Problem**: Forgetting to convert to MIDI notes
- **Solution**: Add `.note()` after `.scale()`: `n(dragon(8)).scale("C:major").note()`

## Examples

### Fractal Drum Machine
```javascript
stack(
  s("bd").struct(cantor(4)),
  s("sd").struct(sierpinski(3)).fast(2),
  s("hh").struct(dragon(5)).fast(4),
  s("cp").struct(koch(3)).fast(3),
  s("rim").struct(cellularAutomaton(30, 16)).fast(8)
).cpm(120)
```

### Evolving Ambient Piece
```javascript
stack(
  // Slow evolving pad
  n(barnsleyFern(64))
    .scale("C:minor:pentatonic")
    .note()
    .s("pad")
    .slow(4)
    .room(0.8),
    
  // Rhythmic texture
  s("click")
    .struct(cellularAutomaton(110, 32))
    .fast(8)
    .gain(0.3)
    .delay(0.5)
    .delayfeedback(0.7)
).cpm(60)
```

## Contributing

To add new fractal functions:
1. Add the function to `packages/core/fractals.mjs`
2. Export it from the module
3. For rhythmic patterns, return binary values with `fastcat()`
4. For melodic patterns, return numeric values (0-7 recommended)
5. Add documentation and examples

## License

Part of the Strudel project, licensed under AGPL-3.0.