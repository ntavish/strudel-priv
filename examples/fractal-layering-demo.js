// Fractal Layering with Parameter-Driven Recursion
// Each layer's tempo, pitch, and dynamics determine fractal scale/depth

// ============================================
// TEMPO-DRIVEN FRACTAL LAYERING
// Faster tempo = deeper fractal recursion
// ============================================

$: stack(
  // Layer 1: Slow = shallow fractal (depth 2)
  Pattern.cantor(2)
    .s("bd")
    .slow(4)  // Slow tempo
    .gain(0.9),
  
  // Layer 2: Medium = medium fractal (depth 3)
  Pattern.cantor(3)
    .s("sd")
    .slow(2)  // Medium tempo
    .gain(0.7),
  
  // Layer 3: Fast = deep fractal (depth 4)
  Pattern.cantor(4)
    .s("hh")
    .slow(1)  // Fast tempo
    .gain(0.5),
  
  // Layer 4: Very fast = deepest fractal (depth 5)
  Pattern.cantor(5)
    .s("click")
    .slow(0.5)  // Very fast tempo
    .gain(0.3)
    .pan(perlinBipolar.slow(3))
)

// ============================================
// PITCH-DRIVEN FRACTAL COMPLEXITY
// Higher pitch = more complex fractal pattern
// ============================================

$: stack(
  // Bass (low pitch) = simple Sierpinski (depth 2)
  Pattern.sierpinski(2)
    .scale("minor")
    .note()
    .sub(24)  // Low pitch
    .s("bassWarsaw")
    .cutoff(500)
    .gain(0.6),
  
  // Mid (medium pitch) = medium Sierpinski (depth 3)
  Pattern.sierpinski(3)
    .scale("minor")
    .note()
    .sub(12)  // Medium pitch
    .s("sawtooth")
    .cutoff(1500)
    .gain(0.5),
  
  // High (high pitch) = complex Sierpinski (depth 4)
  Pattern.sierpinski(4)
    .scale("minor")
    .note()
    .add(12)  // High pitch
    .s("sine")
    .cutoff(3000)
    .gain(0.4),
  
  // Very high = most complex (depth 5)
  Pattern.sierpinski(5)
    .scale("minor")
    .note()
    .add(24)  // Very high pitch
    .s("triangle")
    .cutoff(5000)
    .gain(0.3)
)

// ============================================
// DYNAMIC FRACTAL SCALING
// Volume/gain determines fractal iterations
// ============================================

const dynamicFractal = (gain, baseDepth = 2) => {
  // Map gain (0-1) to fractal depth (baseDepth to baseDepth+3)
  const depth = Math.floor(baseDepth + gain * 3);
  return Pattern.dragon(depth);
};

$: stack(
  // Quiet = simple fractal
  dynamicFractal(0.3, 2)
    .s("rim")
    .gain(0.3),
  
  // Medium = medium fractal
  dynamicFractal(0.6, 2)
    .s("clap")
    .gain(0.6),
  
  // Loud = complex fractal
  dynamicFractal(0.9, 2)
    .s("cr")
    .gain(0.9)
)

// ============================================
// PERLIN-CONTROLLED FRACTAL MORPHING
// Noise values determine fractal depth in real-time
// ============================================

// Function to create depth-variable fractals
const adaptiveFractal = (noiseValue) => {
  const depth = Math.floor(2 + noiseValue * 4); // Map 0-1 to depth 2-5
  return Pattern.cantor(depth);
};

$: stack(
  // Perlin noise controls Cantor set depth
  perlinNoise.slow(8)
    .fmap(noise => adaptiveFractal(noise))
    .s("bd")
    .gain(0.8),
  
  // Turbulence controls Sierpinski depth
  turbulence(3).slow(6)
    .fmap(turb => {
      const depth = Math.floor(2 + turb * 3);
      return Pattern.sierpinski(depth);
    })
    .s("sd")
    .gain(0.6),
  
  // FBM controls Dragon curve depth
  fbm(4).slow(10)
    .fmap(fbmValue => {
      const depth = Math.floor(3 + Math.abs(fbmValue) * 3);
      return Pattern.dragon(depth);
    })
    .s("hh")
    .gain(0.4)
)

// ============================================
// MULTI-PARAMETER FRACTAL CONTROL
// Tempo + Pitch + Filter = Fractal dimensions
// ============================================

const multiFractal = (tempo, pitch, filter) => {
  // Each parameter influences different fractal aspects
  const cantorDepth = Math.floor(2 + tempo * 2);     // Tempo → rhythm complexity
  const sierpDepth = Math.floor(2 + pitch / 24);     // Pitch → note complexity
  const dragonDepth = Math.floor(2 + filter / 2000); // Filter → timbral complexity
  
  return stack(
    Pattern.cantor(cantorDepth),
    Pattern.sierpinski(sierpDepth),
    Pattern.dragon(dragonDepth)
  );
};

$: stack(
  // Low parameters = simple fractals
  multiFractal(0.5, 0, 500)
    .s("bd")
    .note()
    .gain(0.7),
  
  // Medium parameters = medium fractals
  multiFractal(1, 12, 1500)
    .s("sd")
    .note()
    .add(12)
    .cutoff(1500)
    .gain(0.6),
  
  // High parameters = complex fractals
  multiFractal(2, 24, 3000)
    .s("hh")
    .note()
    .add(24)
    .cutoff(3000)
    .gain(0.5)
)

// ============================================
// RECURSIVE FRACTAL LAYERS
// Each layer spawns child layers with related parameters
// ============================================

const recursiveLayers = (depth, tempo = 1, pitch = 0) => {
  if (depth <= 0) return silence;
  
  return stack(
    // Current layer
    Pattern.cantor(depth)
      .s("bd")
      .slow(tempo)
      .note()
      .add(pitch)
      .gain(1 / depth), // Quieter as we go deeper
    
    // Recursive child layers
    recursiveLayers(depth - 1, tempo * 2, pitch + 7)  // Faster, higher
      .late(0.125),  // Slight delay for each layer
    
    recursiveLayers(depth - 1, tempo * 1.5, pitch - 5) // Different branch
      .late(0.25)
  );
};

$: recursiveLayers(4, 2, 0)
  .s("marimba")
  .scale("pentatonic")
  .room(0.5)

// ============================================
// CELLULAR AUTOMATON RULE BY PARAMETER
// Different parameters trigger different CA rules
// ============================================

const paramToRule = (param) => {
  // Map parameter to interesting CA rules
  const rules = [30, 45, 90, 110, 150, 182];
  const index = Math.floor(param * rules.length);
  return rules[Math.min(index, rules.length - 1)];
};

$: stack(
  // Low frequency = Rule 30 (chaotic)
  Pattern.cellularAutomaton(paramToRule(0.2), 8)
    .s("808bd")
    .speed(0.8)
    .gain(0.8),
  
  // Mid frequency = Rule 90 (Sierpinski-like)
  Pattern.cellularAutomaton(paramToRule(0.5), 12)
    .s("808sd")
    .speed(1.0)
    .gain(0.6),
  
  // High frequency = Rule 110 (complex)
  Pattern.cellularAutomaton(paramToRule(0.8), 16)
    .s("808oh")
    .speed(1.2)
    .gain(0.4)
)

// ============================================
// L-SYSTEM GROWTH BY ENVELOPE
// ADSR envelope stages determine L-system iterations
// ============================================

const envelopeFractal = (attack, decay, sustain, release) => {
  // Map ADSR to L-system iterations
  const iterations = Math.floor(
    attack * 2 +      // Attack contributes to growth
    decay * 1.5 +     // Decay adds complexity
    sustain * 1 +     // Sustain maintains
    release * 2       // Release adds flourish
  );
  
  const rules = {
    'A': 'AB',
    'B': 'BA'
  };
  
  return Pattern.lsystem('A', rules, Math.max(2, iterations));
};

$: stack(
  // Short envelope = simple L-system
  envelopeFractal(0.01, 0.1, 0.3, 0.1)
    .s("piano")
    .attack(0.01).decay(0.1).sustain(0.3).release(0.1)
    .note().scale("major")
    .gain(0.6),
  
  // Long envelope = complex L-system
  envelopeFractal(0.5, 0.3, 0.7, 2.0)
    .s("pad")
    .attack(0.5).decay(0.3).sustain(0.7).release(2.0)
    .note().scale("lydian")
    .add(12)
    .gain(0.4)
)

// ============================================
// SPECTRAL FRACTAL LAYERING
// Frequency content determines fractal type and depth
// ============================================

const spectralFractal = (frequency) => {
  if (frequency < 200) {
    // Bass frequencies = Cantor (rhythmic)
    return Pattern.cantor(Math.floor(frequency / 50));
  } else if (frequency < 1000) {
    // Mid frequencies = Sierpinski (melodic)
    return Pattern.sierpinski(Math.floor(frequency / 200));
  } else {
    // High frequencies = Dragon (complex)
    return Pattern.dragon(Math.floor(frequency / 500));
  }
};

$: stack(
  spectralFractal(100).s("bass").gain(0.8),     // Bass → Cantor depth 2
  spectralFractal(500).s("keys").gain(0.6),     // Mid → Sierpinski depth 2-3
  spectralFractal(2000).s("bell").gain(0.4),    // High → Dragon depth 4
  spectralFractal(4000).s("metal").gain(0.3)    // VHigh → Dragon depth 8
).scale("harmonic minor").note()

// ============================================
// THE ULTIMATE ADAPTIVE FRACTAL COMPOSITION
// All parameters influence fractal generation
// ============================================

$: stack(
  // === Rhythm Section ===
  // Tempo-driven Cantor set drums
  perlinNoise.range(0.5, 2).slow(16)
    .fmap(tempo => {
      const depth = Math.floor(2 + tempo * 2);
      return Pattern.cantor(depth).slow(1/tempo);
    })
    .s("bd")
    .gain(0.9),
  
  // Velocity-driven Sierpinski snare
  turbulence(3).range(0.3, 1).slow(8)
    .fmap(velocity => {
      const depth = Math.floor(2 + velocity * 3);
      return Pattern.sierpinski(depth).gain(velocity);
    })
    .s("sd")
    .fast(2),
  
  // === Harmonic Section ===
  // Pitch-driven Dragon curve bass
  fbm(4).range(-24, -12).slow(20)
    .fmap(pitch => {
      const depth = Math.floor(3 + Math.abs(pitch) / 6);
      return Pattern.dragon(depth)
        .note()
        .add(pitch)
        .scale("phrygian");
    })
    .s("bassWarsaw")
    .cutoff(ridge(2).range(200, 1500).slow(7))
    .resonance(10)
    .gain(0.6),
  
  // Filter-driven L-system melody
  perlinNoise.range(500, 4000).slow(12)
    .fmap(cutoff => {
      const iterations = Math.floor(2 + cutoff / 1000);
      const rules = { 'X': 'XY+', 'Y': '-YX' };
      return Pattern.lsystem('X', rules, iterations)
        .cutoff(cutoff);
    })
    .scale("lydian")
    .note()
    .s("lead")
    .room(0.4)
    .gain(0.5),
  
  // === Texture Section ===
  // Pan-driven cellular automaton
  perlinBipolar.slow(10)
    .fmap(pan => {
      const rule = paramToRule((pan + 1) / 2);
      const depth = Math.floor(8 + Math.abs(pan) * 8);
      return Pattern.cellularAutomaton(rule, depth)
        .pan(pan);
    })
    .s("click")
    .gain(0.3),
  
  // Resonance-driven IFS fractal
  ridge(3).range(1, 20).slow(15)
    .fmap(res => {
      const points = Math.floor(10 + res * 2);
      return Pattern.barnsleyFern(points)
        .resonance(res);
    })
    .scale("whole tone")
    .note()
    .s("sine")
    .cutoff(2000)
    .gain(0.4)
).slow(2)