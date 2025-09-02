# Strudel MCP Pattern Examples

## Glitchy Drums with Flanged Drone Pattern

This pattern demonstrates advanced Strudel live coding techniques including sample chopping, modulation, and layered synthesis.

### Pattern Summary in Plain English

**Overall Structure:**
The pattern plays 4 independent layers simultaneously using `stack()`.

**Layer 1 - Main Drums:**
- Plays kick drum 4 times, snare 2 times, and hi-hats 8 times per cycle
- Occasionally doubles the speed randomly
- Sometimes reverses the pattern (30% chance)

**Layer 2 - Glitchy Percussion:**
- Takes a clap sound and cycles through 4 variations
- Plays twice as fast as normal
- Chops the sample into quarters (0-25%, 25-50%, 50-75%, 75-100%)
- Creates a stuttering effect by rapidly jumping between these segments

**Layer 3 - Melodic Arpeggio:**
- Plays notes going up and down a C minor scale (C, Eb, G, Bb, up then back down)
- Uses a sawtooth synthesizer at half speed
- Filter sweeps from low (400Hz) to high (2000Hz) frequencies
- Heavy delay creates echoes that overlap (flanging effect)
- Reverb adds space

**Layer 4 - Bass Drone:**
- Alternates between low C and G notes very slowly (8x slower)
- Square wave synthesizer with long attack/release for smooth fades
- Filter modulation creates a "wah" effect
- Bit-crushing adds digital distortion that varies over time
- Pans left and right slowly for movement

The combination creates a complex rhythmic piece with glitchy drums, swirling melodic elements, and a gritty bass foundation.

### Key Techniques Used

1. **Sample Scrubbing**: Using `begin()` and `end()` to jump through sample positions
2. **Pattern Transformation**: `sometimes()`, `sometimesBy()`, `rev()`, `fast()`
3. **Filter Modulation**: Using sine/cosine LFOs to sweep cutoff frequencies
4. **Delay Effects**: Creating flanging through feedback delays
5. **Bit Crushing**: Adding digital distortion that changes over time
6. **Layering**: Combining multiple independent patterns with `stack()`

### Original Inspiration

This pattern was inspired by a Strudel live coding video demonstrating "scrubbing" techniques - jumping to different positions in audio samples to create glitchy, stuttering effects common in breakcore/IDM music. The original used a custom `rScrub` function to manually control sample playback positions.

### Usage with MCP

This pattern was developed using the Strudel MCP (Model Context Protocol) integration, allowing AI-assisted pattern generation and modification through natural language commands.