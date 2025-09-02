# Pattern Morphing

Advanced pattern morphing with musical tension curves for organic transitions and transformations.

## Overview

Pattern morphing enables smooth, musically-aware transitions between patterns using various tension curves inspired by mathematical and natural phenomena. This creates more organic and interesting transitions than simple linear fades.

## Available Tension Curves

### `arc`
Classic sine-based build-up and release curve. Creates smooth, natural transitions.
```javascript
s("bd sd").morphTo("cp hh", "arc", 4)
```

### `cliff`
Builds up gradually then drops suddenly at 80%. Perfect for creating dramatic drops.
```javascript
s("bd*2").morphTo("bd*16", "cliff", 8)
```

### `wave`
Multiple peaks creating wave-like oscillations. Good for rhythmic morphing.
```javascript
note("c3 e3").morphTo("g3 b3", "wave", 4)
```

### `golden`
Based on the golden ratio (φ), creates aesthetically pleasing transitions.
```javascript
s("hh").morphTo("hh*8", "golden", 4)
```

### `pulse`
Rhythmic pulsing between high and low values. Creates staccato transitions.
```javascript
s("bd").morphTo("cp", "pulse", 2)
```

### `lorenz`
Chaotic but deterministic curve inspired by the Lorenz attractor.
```javascript
s("bd sd").morphTo("mt ht", "lorenz", 8)
```

## Morphing Methods

### `morphTo(targetPattern, curve, cycles)`

Morphs between two patterns over a specified number of cycles.

**Parameters:**
- `targetPattern`: The pattern to morph to
- `curve`: Tension curve name (string) or custom function
- `cycles`: Number of cycles for the transition (default: 4)

**Example:**
```javascript
// Simple morphing
s("bd sd").morphTo("bd*4 cp*2", "arc", 4)

// With custom curve
s("bd sd").morphTo("bd*4 cp*2", t => Math.pow(t, 3), 2)
```

### `densityMorph(targetDensity, curve, cycles)`

Morphs the rhythmic density of a pattern.

**Parameters:**
- `targetDensity`: Target density multiplier
- `curve`: Tension curve name or function
- `cycles`: Number of cycles for the transition

**Example:**
```javascript
// Gradually increase from 1 to 16 hits per cycle
s("bd").densityMorph(16, "cliff", 8)
```

### `spectralMorph(targetPattern, curve, cycles)`

Creates frequency-based crossfading between patterns using high-pass and low-pass filters.

**Parameters:**
- `targetPattern`: The pattern to morph to
- `curve`: Tension curve name or function
- `cycles`: Number of cycles for the transition

**Example:**
```javascript
// Spectral crossfade
s("bd sd hh*8").spectralMorph("bd*4 cp*2", "wave", 4)
```

## Custom Tension Curves

You can create custom tension curves by passing a function instead of a curve name:

```javascript
// Linear fade
s("bd").morphTo("cp", t => t, 4)

// Exponential curve
s("bd").morphTo("cp", t => Math.pow(t, 2), 4)

// Step function
s("bd").morphTo("cp", t => t < 0.5 ? 0 : 1, 4)
```

The function receives a value `t` from 0 to 1 representing progress through the morph.

## Practical Examples

### Building a Drop
```javascript
// Build tension then drop
stack(
  s("bd sd").morphTo("bd*4 cp*2", "cliff", 8),
  s("hh*8").gain(sine.range(0.2, 0.8).slow(8))
).bank("tr909")
```

### Rhythmic Evolution
```javascript
// Evolve from simple to complex rhythm
s("bd").densityMorph(16, "golden", 16)
  .sometimes(x => x.speed(2))
```

### Frequency Sweep Transition
```javascript
// Sweep frequencies during transition
stack(
  s("bd sd, hh*8").spectralMorph("bd*4, cp*2", "arc", 4),
  note("c2").s("bass").sustain(1)
).room(0.3)
```

### Chaotic Morphing
```javascript
// Use Lorenz attractor for unpredictable transitions
s("bd cp").morphTo("mt ht lt", "lorenz", 16)
  .jux(rev)
```

## Technical Details

The morphing functions work by:
1. Evaluating the tension curve at each cycle
2. Applying the resulting value to blend parameters
3. Using `slowcat` to sequence the morphed patterns
4. Leveraging existing Strudel functions like `gain`, `hpf`, `lpf`

This approach ensures compatibility with the existing Strudel ecosystem while adding powerful new capabilities for pattern transformation.

## Contributing

The pattern morphing system is designed to be extensible. To add new tension curves, simply add them to the `tensionCurves` object in `pattern.mjs`:

```javascript
tensionCurves.myCustomCurve = (t) => {
  // Your curve logic here
  return value; // Should return 0-1
}
```

## Performance Considerations

- Morphing creates multiple pattern instances internally
- Use reasonable cycle counts (4-16 typical)
- Complex curves like `lorenz` have more computational overhead
- Spectral morphing adds filter processing