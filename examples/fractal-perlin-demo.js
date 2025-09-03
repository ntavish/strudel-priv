// Fractal Patterns with Perlin Noise Modulation
// This demo showcases the new fractal pattern generation functions
// combined with Perlin noise for organic variation

// Import the functions (in Strudel REPL these are available globally)
// const { Pattern, perlinNoise, fbm, turbulence, ridge } = await import('@strudel/core');

// ============================================
// EXAMPLE 1: Cantor Set Rhythm with Perlin Modulation
// ============================================
await samples('github:tidalcycles/dirt-samples')

// Generate Cantor set fractal rhythm (depth 3)
$: Pattern.cantor(3)
  .s("bd")
  // Modulate speed with Perlin noise
  .speed(perlinNoise.range(0.8, 1.5).slow(4))
  // Add panning movement
  .pan(perlinBipolar.slow(7))
  .gain(0.8)

// ============================================
// EXAMPLE 2: Sierpinski Triangle Melody
// ============================================

$: stack(
  // Sierpinski triangle pattern for notes
  Pattern.sierpinski(4)
    .scale("minor pentatonic")
    .note()
    // Add Perlin drift to pitch
    .add(perlinBipolar.range(-2, 2).slow(16))
    .s("piano")
    .room(0.3)
    .gain(0.6),
  
  // Dragon curve for bass line
  Pattern.dragon(5)
    .slow(4)
    .note()
    .add(n => n - 24) // Drop 2 octaves
    .s("sawtooth")
    // Ridge noise for harsh filter sweeps
    .cutoff(ridge(4).range(100, 2000).slow(8))
    .resonance(10)
    .gain(0.4)
)

// ============================================
// EXAMPLE 3: L-System Pattern with FBM Modulation
// ============================================

// Define L-System rules for a musical fractal
const musicalRules = {
  'A': 'AB',
  'B': 'A'
};

$: stack(
  // L-System generated rhythm
  Pattern.lsystem('A', musicalRules, 5)
    .s("hh")
    // Use turbulence for dynamic variation
    .gain(turbulence(3).range(0.2, 0.7).slow(4)),
  
  // Complementary kick pattern
  Pattern.cantor(2)
    .s("bd")
    .speed(0.9)
)

// ============================================
// EXAMPLE 4: Barnsley Fern with Organic Modulation
// ============================================

$: stack(
  // Barnsley Fern for ethereal lead
  Pattern.barnsleyFern(50)
    .scale("lydian")
    .note()
    // Multi-octave FBM for complex pitch movement
    .add(fbm(5, 2.0, 0.5).range(-5, 5).slow(32))
    .s("sine")
    .attack(0.1)
    .decay(0.2)
    .sustain(0.5)
    .release(1)
    // Perlin-modulated filter
    .cutoff(perlinNoise.range(500, 4000).slow(11))
    .room(0.5)
    .gain(0.4),
  
  // IFS fractal for percussive elements
  Pattern.ifs([
    { a: 0.5, b: 0, c: 0, d: 0.5, e: 0, f: 0, p: 0.33 },
    { a: 0.5, b: 0, c: 0, d: 0.5, e: 0.5, f: 0, p: 0.33 },
    { a: 0.5, b: 0, c: 0, d: 0.5, e: 0.25, f: 0.5, p: 0.34 }
  ], 30)
    .s("click")
    .speed(perlinNoise.range(0.5, 2).slow(3))
    .pan(perlinBipolar.slow(5))
    .gain(0.3)
)

// ============================================
// EXAMPLE 5: Cellular Automaton with Ridge Noise
// ============================================

$: stack(
  // Rule 30 cellular automaton (chaotic)
  Pattern.cellularAutomaton(30, 16)
    .s("808sd")
    // Ridge noise for aggressive filter sweeps
    .cutoff(ridge(3).range(200, 5000).slow(4))
    .resonance(15)
    .gain(0.5),
  
  // Rule 90 (Sierpinski-like) for hi-hats
  Pattern.cellularAutomaton(90, 8)
    .fast(2)
    .s("808oh")
    .gain(turbulence(2).range(0.1, 0.4).slow(6))
    .pan(perlinBipolar.slow(3))
)

// ============================================
// EXAMPLE 6: Chaos Patterns - Logistic & Henon Maps
// ============================================

$: stack(
  // Logistic map at edge of chaos (r=3.8)
  Pattern.logisticMap(3.8, 20)
    .scale("harmonic minor")
    .note()
    // Smooth the chaotic values with slow Perlin
    .add(perlinNoise.range(-1, 1).slow(20))
    .s("triangle")
    .attack(0.01)
    .release(0.2)
    .cutoff(fbm(3).range(400, 3000).slow(7))
    .gain(0.5),
  
  // Henon map for rhythmic chaos
  Pattern.henonMap(1.4, 0.3, 15)
    .struct()
    .s("808bd")
    .speed(perlinNoise.range(0.8, 1.2).slow(2))
    .gain(0.7)
)

// ============================================
// EXAMPLE 7: Pattern Morphing with Tension Curves
// ============================================

// Create two patterns to morph between
const patternA = Pattern.sierpinski(3).scale("major");
const patternB = Pattern.cantor(4).scale("minor");

$: stack(
  // Morph between patterns using golden ratio tension
  patternA.morphTo(patternB, 
    perlinNoise.slow(8), // Use Perlin as morph amount
    'golden' // Golden ratio tension curve
  )
    .note()
    .s("marimba")
    .room(0.4)
    .gain(0.6),
  
  // Density morphing with Lorenz attractor tension
  patternA.densityMorph(patternB,
    fbm(2).slow(10),
    'lorenz'
  )
    .note()
    .add(12) // Up an octave
    .s("glockenspiel")
    .delay(0.125)
    .delayfeedback(0.4)
    .gain(0.4)
)

// ============================================
// EXAMPLE 8: Koch Curve with Spectral Morphing
// ============================================

$: stack(
  // Koch curve fractal
  Pattern.koch(3)
    .scale("whole tone")
    .note()
    // Spectral morph to create harmonic movement
    .spectralMorph(
      Pattern.dragon(4).scale("chromatic"),
      turbulence(3).slow(12)
    )
    .s("prophet")
    .cutoff(perlinNoise.range(300, 3000).slow(9))
    .resonance(ridge(2).range(1, 20).slow(5))
    .room(0.7)
    .gain(0.5),
  
  // Supporting bass using Brownian motion
  note("c2")
    .brownian(3) // Random walk with step size 3
    .s("juno")
    .cutoff(400)
    .gain(0.4)
)

// ============================================
// EXAMPLE 9: Julia Set Mapped Rhythm
// ============================================

$: stack(
  // Use Julia set to map rhythm positions
  sequence(0, 1, 2, 3, 4, 5, 6, 7)
    .julia(-0.7, 0.27) // Julia set parameters
    .struct()
    .s("tabla")
    .speed(perlinNoise.range(0.9, 1.1).slow(3))
    .gain(0.6),
  
  // Mandelbrot set for melody
  sequence(0, 1, 2, 3)
    .mandelbrot(10) // 10 iterations
    .scale("phrygian")
    .note()
    .s("kalimba")
    .room(0.3)
    .gain(fbm(3).range(0.3, 0.7).slow(5))
)

// ============================================
// EXAMPLE 10: Complete Fractal Composition
// ============================================

// A full composition using multiple fractal types
$: stack(
  // === Drums ===
  // Cantor set kick
  Pattern.cantor(3)
    .s("bd")
    .speed(0.9)
    .gain(0.9),
  
  // Sierpinski snare
  Pattern.sierpinski(4)
    .fast(2)
    .whenmod(8, 6, x => x.fast(2))
    .s("sd")
    .speed(perlinNoise.range(0.95, 1.05).slow(4))
    .gain(0.7),
  
  // Cellular automaton hi-hats
  Pattern.cellularAutomaton(110, 8)
    .fast(4)
    .s("hh")
    .gain(turbulence(2).range(0.2, 0.5).slow(3))
    .pan(perlinBipolar.slow(7)),
  
  // === Bass ===
  // Dragon curve bass line
  Pattern.dragon(5)
    .slow(2)
    .scale("minor pentatonic")
    .note()
    .sub(24)
    .s("bassWarsaw")
    .cutoff(ridge(3).range(200, 1500).slow(8))
    .resonance(10)
    .gain(0.5),
  
  // === Lead ===
  // Barnsley Fern lead melody
  Pattern.barnsleyFern(40)
    .scale("dorian")
    .note()
    .add(fbm(4, 2.0, 0.5).range(-3, 3).slow(16))
    .s("lead")
    .attack(0.01)
    .decay(0.1)
    .sustain(0.7)
    .release(0.3)
    .cutoff(perlinNoise.range(800, 4000).slow(11))
    .room(0.4)
    .gain(0.4),
  
  // === Atmosphere ===
  // L-System pad
  Pattern.lsystem('X', { 'X': 'X+Y', 'Y': 'X-Y' }, 4)
    .slow(8)
    .scale("lydian")
    .note()
    .add(note => note + 12)
    .s("pad")
    .attack(2)
    .release(3)
    .cutoff(fbm(3).range(400, 2000).slow(20))
    .pan(perlinBipolar.slow(13))
    .room(0.8)
    .gain(0.3),
  
  // === Effects ===
  // Chaos for glitchy elements
  Pattern.logisticMap(3.9, 30) // Very chaotic
    .whenmod(16, 14, x => x.fast(4))
    .s("glitch")
    .speed(turbulence(4).range(0.5, 2).slow(2))
    .pan(ridge(2).range(-0.8, 0.8).slow(3))
    .gain(0.2)
).slow(2)