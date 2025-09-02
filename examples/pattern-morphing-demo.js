// Pattern Morphing Demo - Musical tension-based transitions
// This demonstrates organic pattern evolution without AI

// Example 1: Basic morphing between two drum patterns
$: stack(
  s("bd bd bd bd").morph("bd cp bd cp", "arc", 4),
  s("hh*8").gain(0.3)
).bank("tr909")

// Example 2: Density morphing - gradually increase rhythmic complexity
$: s("bd").densityMorph(16, "cliff", 8).bank("tr909")

// Example 3: Spectral morphing - frequency-based crossfade
$: note("c3 e3 g3").s("sawtooth")
  .spectralMorph(note("a3 c4 e4").s("square"), "wave", 4)

// Example 4: Cellular automaton evolution (Rule 30)
$: s("bd").evolve(30, 8).bank("tr909")

// Example 5: Combined morphing with custom tension curve
$: stack(
  s("bd sd").morph("bd*4 cp*2", t => Math.pow(t, 3), 2),
  note("c2 c3").s("bass").morph(note("g2 g3").s("bass"), "golden", 4)
).dec(0.2)

// Example 6: Lorenz attractor chaos morphing
$: s("bd hh cp hh").morph("bd*16", "lorenz", 8).bank("tr909")

// Usage in live coding:
// - morph(targetPattern, curve, cycles) - blend between patterns
// - curves: "arc", "cliff", "wave", "golden", "pulse", "lorenz"
// - densityMorph(targetDensity, curve, cycles) - change rhythmic density
// - spectralMorph(targetPattern, curve, cycles) - frequency crossfade
// - evolve(rule, generations) - cellular automaton evolution