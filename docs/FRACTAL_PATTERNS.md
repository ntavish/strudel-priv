# Fractal Patterns

Mathematical fractals and Iterated Function Systems (IFS) for algorithmic music generation in Strudel.

## Overview

Fractal patterns bring the beauty of mathematical self-similarity to music, creating organic, complex structures from simple rules. These patterns share properties with natural phenomena and have been used in algorithmic composition since the 1980s.

## Available Fractal Generators

### Perlin Noise & Variants

Smooth, continuous noise functions creating organic variations.

```javascript
// Basic Perlin noise signal (0-1 range)
note(60).add(perlin.range(-12, 12).slow(4)).s("piano")

// Fractal Brownian Motion - layered Perlin
note(48).add(fbmSignal.range(0, 24).slow(8)).s("sawtooth")

// Turbulence - sharp, cloud-like features
s("bd").gain(turbulenceSignal.range(0.1, 0.8).fast(2))

// Ridge noise - mountain ridge patterns
s("hh").struct(ridgeSignal.range(0, 1).segment(16).scale("0 1"))
```

Perlin noise properties:
- **Continuous** - Smooth transitions between values
- **Multi-octave** - FBM layers multiple frequencies
- **Organic** - Natural-looking randomness
- **Deterministic** - Same input always gives same output

### L-Systems (Lindenmayer Systems)

String rewriting systems that model plant growth and create self-similar patterns.

```javascript
// Fibonacci word generation (A→AB, B→A)
s(lsystem("A", {A: "AB", B: "A"}, 5)
  .replaceAll("A", "bd")
  .replaceAll("B", "sd"))

// Dragon curve melody
note(dragonCurve(5, 60, 2).join(" ")).s("piano")
```

### Cantor Set

Creates fractal rhythms through recursive subdivision with gaps.

```javascript
// Cantor set rhythm with recursive gaps
s("bd").struct(cantorSet(3, 27).join(" "))

// As a pattern method
s("bd").struct(pure(1).cantor(3, 27))
```

### Sierpinski Triangle

Uses the chaos game to generate probabilistic patterns based on triangle vertices.

```javascript
// Generate Sierpinski rhythm pattern
s(sierpinski(32, ["bd", "sd", "hh"]).join(" ")).bank("tr909")

// Using pattern method
s("bd sd hh").sierpinski(64)
```

### Barnsley Fern

Maps the famous fern fractal to musical parameters using IFS transformations.

```javascript
// Map fern Y-coordinates to pitch
note(barnsleyFern(100, 'pitch').join(" ")).s("kalimba")

// Map to rhythm (X-coordinate threshold)
s("bd").struct(barnsleyFern(100, 'rhythm').join(" "))

// Complex mapping (pitch, time, velocity)
const fern = barnsleyFern(50, 'both');
// Returns objects with {note, time, gain}
```

### Dragon Curve

Creates wandering melodic lines following the dragon curve fractal.

```javascript
// Generate dragon curve melody
note(dragonCurve(5, 60, 2).join(" "))
  .scale("C:minor")
  .s("piano")

// Parameters: iterations, startPitch, interval
note().dragon(4, 48, 3).s("triangle")
```

### Cellular Automata

One-dimensional cellular automata creating evolving patterns from simple rules.

```javascript
// Rule 30 - chaotic behavior
s("bd").struct(cellularAutomaton(30, 16, 16).flat().join(" "))

// Rule 90 - Sierpinski triangle
s("hh").struct(cellularAutomaton(90, 16, 16).flat().join(" "))

// Using pattern method
s("bd").cellular(30, 16, 8)
```

### Julia Set

Maps complex dynamics to harmonic progressions based on escape times.

```javascript
// Generate chord progression from Julia set
note(juliaSet(-0.7, 0.27, 8).flat().join(" "))
  .s("sawtooth")
  .cutoff(800)

// Different Julia parameters create different harmonies
note().julia(-0.4, 0.6, 12).s("piano")
```

## Pattern Methods

All fractal generators are available as Pattern prototype methods:

```javascript
// L-System transformation
pure("A").lsystem({A: "AB", B: "A"}, 5)

// Cantor set rhythm
pure(1).cantor(3, 27)

// Sierpinski pattern
s("bd sd hh").sierpinski(32)

// Dragon curve melody
note(60).dragon(5, 60, 2)

// Barnsley fern
note(48).barnsley(100, 'pitch')

// Cellular automaton
s("bd").cellular(30, 16, 16)

// Julia set harmonies
note(60).julia(-0.7, 0.27, 8)
```

## Musical Mappings

Fractals map to musical parameters in various ways:

### Spatial Mappings
- **X-coordinate** → Pan position / Time offset
- **Y-coordinate** → Pitch / Frequency
- **Point density** → Velocity / Dynamics
- **Distance from origin** → Filter cutoff

### Temporal Mappings
- **Iteration count** → Note duration
- **Escape time** → Chord quality
- **Generation number** → Rhythmic subdivision
- **Branch depth** → Octave

### Structural Mappings
- **Self-similarity** → Motivic development
- **Recursion depth** → Harmonic complexity
- **Transformation probability** → Musical emphasis
- **Fractal dimension** → Textural density

## Examples

### Evolving Drum Pattern
```javascript
// Cellular automaton creating evolving rhythm
const ca = cellularAutomaton(30, 16, 32);
stack(
  s("bd").struct(ca.map(row => row.join("")).join(" ")),
  s("hh").struct(ca.map(row => 
    row.reverse().join("")).join(" ")).gain(0.3)
).bank("tr909")
```

### Organic Melody
```javascript
// Barnsley fern creating natural melodic movement
const fernPitches = barnsleyFern(64, 'pitch');
note(fernPitches.join(" "))
  .scale("C:major")
  .s("kalimba")
  .release(0.3)
  .room(0.4)
```

### Fractal Chord Progression
```javascript
// Julia set generating complex harmony
const chords = juliaSet(-0.7, 0.27, 16);
stack(
  ...chords.map((chord, i) => 
    note(chord.join(" "))
      .s("sawtooth")
      .cutoff(400 + i * 50)
      .late(i * 0.25)
  )
).slow(8)
```

### L-System Composition
```javascript
// Koch snowflake rhythm
const koch = lsystem("F", {F: "F+F--F+F"}, 3);
s("hh").struct(koch.split("").map(c => 
  c === 'F' ? '1' : '0').join(" "))
```

## Mathematical Properties

These patterns exhibit key fractal properties:

1. **Self-similarity** - Patterns repeat at different scales
2. **Recursive structure** - Simple rules generate complexity
3. **Non-integer dimension** - Between discrete and continuous
4. **Sensitive dependence** - Small changes create large effects
5. **Strange attractors** - Patterns converge to complex shapes

## Performance Considerations

- L-Systems grow exponentially with iterations
- Cellular automata are linear in width × generations
- IFS points converge quickly (100-1000 iterations typical)
- Julia/Mandelbrot sets are computationally intensive
- Cache generated patterns when possible

## Musical Applications

Fractal patterns are particularly effective for:

- **Ambient music** - Organic, evolving textures
- **Rhythmic complexity** - Non-repeating but coherent patterns
- **Melodic development** - Natural-sounding phrase evolution
- **Harmonic progressions** - Non-traditional chord sequences
- **Spatial audio** - Using fractals to control panning/position
- **Generative compositions** - Infinite variations from simple rules

## References

- Prusinkiewicz & Lindenmayer (1990) - "The Algorithmic Beauty of Plants"
- Barnsley (1988) - "Fractals Everywhere"
- Wolfram (2002) - "A New Kind of Science"
- Dodge & Jerse (1997) - "Computer Music" (Chapter on Algorithmic Composition)
- Roads (1996) - "The Computer Music Tutorial" (Fractal Music section)