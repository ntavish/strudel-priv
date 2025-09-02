# Strudel MCP Pattern Examples

Collection of patterns you can ask Claude to create with the Strudel MCP.

## Basic Patterns

### Simple Drum Beat
**Ask:** "Create a basic drum pattern"
```javascript
s("bd sd bd sd")
```

### Four-on-the-floor
**Ask:** "Make a house music beat"
```javascript
s("bd*4, hh*8, ~ cp ~ cp")
```

### Breakbeat
**Ask:** "Create a breakbeat pattern"
```javascript
s("bd ~ bd [~ bd], sd ~ ~ sd, hh*8")
```

## Melodic Patterns

### Simple Melody
**Ask:** "Create a melody in C major"
```javascript
note("c4 e4 g4 c5").s("piano")
```

### Arpeggiated Chords
**Ask:** "Make an arpeggio pattern"
```javascript
note("c3 e3 g3 b3".fast(2))
  .s("sawtooth")
  .cutoff(1000)
```

### Bass Line
**Ask:** "Generate a funk bass line"
```javascript
note("c2 c2 ~ e2 ~ g2 a2 ~".slow(2))
  .s("bass")
  .gain(0.8)
```

## Advanced Techniques

### Euclidean Rhythms
**Ask:** "Create a euclidean rhythm with 5 hits in 8 steps"
```javascript
// Using the euclidean tool
euclid(5, 8, "bd")
```

### Polyrhythm
**Ask:** "Make a polyrhythmic pattern"
```javascript
stack(
  s("bd*3"),
  s("sd*4"),
  s("hh*5")
)
```

### Generative Pattern
**Ask:** "Create a generative pattern with randomness"
```javascript
s("bd sd").sometimes(x => x.fast(2))
  .note(rand.range(0, 12).round())
  .s("piano")
```

## Genre-Specific Examples

### Techno
**Ask:** "Make a techno pattern"
```javascript
stack(
  s("bd*4").gain(0.9),
  s("~ ~ cp ~").room(0.5),
  s("[~ hh]*4").gain(0.4),
  note("c2 c2 c2 [c2 g2]").s("bass").lpf(800)
)
```

### Ambient
**Ask:** "Create an ambient soundscape"
```javascript
note("c4 e4 g4 a4".slow(8))
  .s("pad")
  .attack(2)
  .release(4)
  .room(0.9)
  .delay(0.5)
```

### Jungle/Breakcore
**Ask:** "Generate a jungle pattern"
```javascript
s("amen").chop(16)
  .splice(16, "0..15".scramble())
  .sometimes(ply(2))
  .lpf("400 800 1600".fast(3))
```

### Trap
**Ask:** "Make a trap beat"
```javascript
stack(
  s("bd ~ bd ~, ~ ~ ~ bd").gain(0.9),
  s("~ sd ~ sd ~ ~ sd ~").room(0.3),
  s("hh*16").gain("0.4 0.6".fast(8)),
  s("808").note("c1").slow(4).gain(0.7)
)
```

## Effect Demonstrations

### Filter Sweep
**Ask:** "Show me a filter sweep effect"
```javascript
s("bd*4, hh*8")
  .lpf(sine.range(200, 2000).slow(4))
```

### Delay Effect
**Ask:** "Create a pattern with delay"
```javascript
s("cp").fast(2)
  .delay(0.5)
  .delaytime(0.125)
  .delayfeedback(0.7)
```

### Distortion
**Ask:** "Add distortion to a pattern"
```javascript
s("bd sd bd sd")
  .distort(0.8)
  .crush(4)
```

## Interactive Patterns

### Build-up
**Ask:** "Create a build-up pattern"
```javascript
s("bd").fast("1 2 4 8".slow(4))
  .lpf(saw.range(200, 4000).slow(4))
```

### Drop
**Ask:** "Make a drop pattern"
```javascript
stack(
  s("bd*4").gain(1),
  s("bass").note("c1").slow(2).gain(0.9),
  s("~ ~ ~ impact").slow(4)
)
```

## Complex Examples

### Full Song Structure
**Ask:** "Create a complete song structure"
```javascript
// Intro -> Verse -> Chorus -> Outro
cat(
  // Intro (minimal)
  s("hh*4").slow(4),
  
  // Verse
  stack(
    s("bd ~ bd ~, ~ sd ~ sd"),
    s("hh*8").gain(0.4)
  ).slow(8),
  
  // Chorus
  stack(
    s("bd*4, ~ cp ~ cp"),
    note("c3 e3 g3 c4").s("bass"),
    s("hh*16").gain(0.3)
  ).slow(8),
  
  // Outro
  s("bd ~ ~ ~").slow(4)
)
```

### Live Coding Performance
**Ask:** "Create a pattern for live coding"
```javascript
let pattern = stack(
  // Drums
  s("bd*4, sd(3,8), hh*8")
    .sometimes(x => x.fast(2)),
  
  // Bass
  note("c2 [e2 g2] ~ a2".slow(2))
    .s("bass")
    .lpf(sine.range(400, 1200).slow(3)),
    
  // Lead
  note("0 3 5 7".scale("C:minor").fast(2))
    .s("lead")
    .sometimes(x => x.add(12))
    .delay(0.25)
)._scope()
```

## Tips for Claude Requests

1. **Be specific:** "Create a 140 BPM dubstep pattern"
2. **Mention effects:** "Add reverb and delay"
3. **Specify instruments:** "Use piano and strings"
4. **Request variations:** "Make it evolve over time"
5. **Ask for explanations:** "Explain how the pattern works"

## Combining Tools

You can ask Claude to combine multiple MCP tools:

**Example:** "Create a drum pattern, add a euclidean hihat, then get the current pattern"

This will:
1. Use `drum` tool for basic beat
2. Use `euclidean` tool for hihat rhythm
3. Use `getCurrentPattern` to show the result

## Custom Functions

You can ask Claude to create custom functions:

**Ask:** "Create a custom stutter effect"
```javascript
register('stutter', (n, pat) => 
  pat.ply(n).fast(n)
)

s("bd sd").stutter(4)
```

## Learning Resources

Ask Claude:
- "Explain how Strudel patterns work"
- "Show me different ways to create rhythms"
- "What effects are available in Strudel?"
- "How do I make my patterns more interesting?"