# Hilbert Scope Test

This is a simple test to verify the Hilbert Scope visualization works correctly.

## Usage Example

```javascript
// Basic hilbertscope usage (fullscreen visualization with automatic chromatic coloring)
note("c a f e").s("sawtooth").hilbertscope()

// With custom configuration
note("c a f e").s("sawtooth").hilbertscope({
  color: "cyan",
  thickness: 3,
  sizeRatio: 0.2,
  opacity: 0.9,
  history: 0.98,
  driftSpeed: 2.0,
  glowEnabled: true,
  glowIntensity: 15,
  chromaticColoring: true  // Enable note-based coloring (default)
})

// Disable chromatic coloring to use fixed color
note("c a f e").s("sawtooth").hilbertscope({
  chromaticColoring: false,
  color: "purple"
})

// Multiple patterns with different IDs
stack(
  note("c a f e").s("sawtooth").hilbertscope({id: 1, color: "red"}),
  note("g b d f").s("sine").hilbertscope({id: 2, color: "blue"})
)
```

## Configuration Options

- `color`: Line color (default: theme foreground color)
- `thickness`: Line thickness (default: 2)
- `sizeRatio`: Size relative to screen (default: 0.15)
- `minSize`: Minimum scope size in pixels (default: 50)
- `maxSize`: Maximum scope size in pixels (default: 300)
- `opacity`: Overall opacity (default: 0.8)
- `history`: Trail persistence (default: 0.95)
- `driftSpeed`: Movement speed (default: 1.0)
- `glowEnabled`: Enable glow effect (default: true)
- `glowIntensity`: Glow intensity (default: 1)
- `chromaticColoring`: Enable automatic note-based coloring (default: true)
- `smear`: Screen smear amount (default: 0)
- `id`: Analyzer ID for multiple scopes (default: 1)

## Chromatic Coloring

When `chromaticColoring` is enabled (default), the hilbert scope automatically colors itself based on the notes being played:

- **C** = 0° (red)
- **C#/Db** = 30° (red-orange)  
- **D** = 60° (orange)
- **D#/Eb** = 90° (yellow)
- **E** = 120° (yellow-green)
- **F** = 150° (green)
- **F#/Gb** = 180° (cyan)
- **G** = 210° (light blue)
- **G#/Ab** = 240° (blue)
- **A** = 270° (purple)
- **A#/Bb** = 300° (magenta)
- **B** = 330° (pink)

The coloring only activates when pitched notes are detected in the pattern. Set `chromaticColoring: false` to use a fixed color instead.

## How it works

The Hilbert Scope uses a Hilbert transform to create complex audio analysis, generating organic, fluid circular patterns that respond to both amplitude and timbre of the audio signal. 

When chromatic coloring is enabled, it automatically detects the notes being played and maps them to colors using the chromatic circle: each semitone corresponds to 30° on the hue wheel (360°/12 = 30°). This creates beautiful, musically-synchronized color changes that enhance the psychedelic visualizations.
