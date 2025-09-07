/*
hilbert.mjs - Hilbert Scope Visualization for Strudel
Copyright (C) 2025 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy  * @example

---
Best used for visualizing audio signals and their harmonic content. notes than drums.

 * // Basic usage with automatic chromatic coloring
 * note("c a f e").s("sawtooth").hilbertscope()
 * @example
 * // With custom styling
 * note("c a f e").s("sawtooth").hilbertscope({
 *   color: "cyan", 
 *   thickness: 3,
 *   sizeRatio: 0.5,
 *   history: 0.9
 * })
 * @example
 * // Providing a custom color automatically overrides chromatic coloring
 * note("c a f e").s("sawtooth").hilbertscope({
 *   color: "red" // This will override chromatic colors
 * })
 * @example  
 * // Multiple scopes with different colors
 * stack(
 *   note("c e g").s("sawtooth").hilbertscope({id: 1, color: "red"}),
 *   note("f a c").s("sine").hilbertscope({id: 2, color: "blue"})
 * ) General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * 
 * 
*/

import { Pattern } from '@strudel/core';
import { getDrawContext, getTheme } from '@strudel/draw';
import { analysers, getAudioContext } from 'superdough';

/**
 * Maps a value from one range to another range
 * @private
 * @param {number} value - The input value
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} The mapped value
 */
const mathScale = (value, inMin, inMax, outMin, outMax) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Clamps a value between minimum and maximum bounds
 * @private
 * @param {number} value - The input value
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} The clamped value
 */
const mathClamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Creates a sigmoid function for smooth value mapping
 * @private
 * @param {number} k - The steepness parameter
 * @returns {function} A sigmoid function
 */
const sigmoidFactory = (k) => {
  const base = (t) => 1 / (1 + Math.exp(-k * t)) - 0.5;
  const correction = 0.5 / base(1);

  return (t) => {
    t = mathClamp(t, 0, 1);
    return correction * base(2 * t - 1) + 0.5;
  };
};

/**
 * Chromatic note names in order for hue mapping
 * @private
 */
const CHROMATIC_NOTES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];

/**
 * Maps a note name to a hue value (0-360)
 * @private
 * @param {string} noteName - The note name (e.g., 'c', 'f#', 'bb')
 * @returns {number} Hue value in degrees (0-360)
 */
const noteToHue = (noteName) => {
  if (!noteName || typeof noteName !== 'string') return 0;

  // Normalize note name - remove octave numbers and convert to lowercase
  let normalizedNote = noteName.toLowerCase().replace(/[0-9]/g, '');

  // Handle flat notation (convert to sharp)
  if (normalizedNote.includes('b')) {
    const flatToSharp = {
      db: 'c#',
      eb: 'd#',
      gb: 'f#',
      ab: 'g#',
      bb: 'a#',
    };
    normalizedNote = flatToSharp[normalizedNote] || normalizedNote.replace('b', '');
  }

  const noteIndex = CHROMATIC_NOTES.indexOf(normalizedNote);
  if (noteIndex === -1) return 0; // Default to C if note not found

  return (noteIndex * 30) % 360; // 360/12 = 30 degrees per semitone
};

/**
 * Creates an HSL color string from hue, saturation, and lightness
 * @private
 * @param {number} hue - Hue (0-360)
 * @param {number} saturation - Saturation (0-100)
 * @param {number} lightness - Lightness (0-100)
 * @returns {string} HSL color string
 */
const hslToString = (hue, saturation, lightness) => {
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Hilbert transform processor using Web Audio API
 * Creates complex audio analysis by generating quadrature signals
 * @private
 */
class HilbertProcessor {
  constructor() {
    this.audioContext = null;
    this.analyserTime = null;
    this.analyserQuad = null;
    this.timeData = null;
    this.quadData = null;
    this.connected = false;
    this.bufferLength = 1024;
    this.delay = null;
    this.hilbert = null;
  }

  /**
   * Connect the processor to an audio source
   * @param {AudioContext} audioContext - The Web Audio context
   * @param {AudioNode} sourceNode - The audio source to connect to
   * @returns {Promise<void>}
   */
  async connect(audioContext, sourceNode) {
    if (this.connected) return;

    this.audioContext = audioContext;

    // Create analysers for time and quadrature data
    this.analyserTime = audioContext.createAnalyser();
    this.analyserQuad = audioContext.createAnalyser();

    this.analyserTime.fftSize = this.bufferLength * 2;
    this.analyserQuad.fftSize = this.bufferLength * 2;

    this.timeData = new Float32Array(this.analyserTime.frequencyBinCount);
    this.quadData = new Float32Array(this.analyserQuad.frequencyBinCount);

    // Create Hilbert transform filter
    const [delay, hilbert] = this.createFilters(audioContext);
    this.delay = delay;
    this.hilbert = hilbert;

    // Connect the audio graph
    sourceNode.connect(hilbert);
    sourceNode.connect(delay);

    hilbert.connect(this.analyserTime);
    delay.connect(this.analyserQuad);

    this.connected = true;
  }

  /**
   * Creates the Hilbert transform filters
   * @private
   * @param {AudioContext} audioContext - The Web Audio context
   * @returns {Array<AudioNode>} Array containing [delay, hilbert] nodes
   */
  createFilters(audioContext) {
    let filterLength = 768;
    if (filterLength % 2 === 0) {
      filterLength -= 1;
    }

    const impulse = new Float32Array(filterLength);
    const mid = ((filterLength - 1) / 2) | 0;

    for (let i = 0; i <= mid; i++) {
      // Hamming window
      const k = 0.53836 + 0.46164 * Math.cos((i * Math.PI) / (mid + 1));
      if (i % 2 === 1) {
        const im = 2 / Math.PI / i;
        impulse[mid + i] = k * im;
        impulse[mid - i] = k * -im;
      }
    }

    // Create convolver for Hilbert transform
    const impulseBuffer = audioContext.createBuffer(1, filterLength, audioContext.sampleRate);
    impulseBuffer.copyToChannel(impulse, 0);
    const hilbert = audioContext.createConvolver();
    hilbert.normalize = false;
    hilbert.buffer = impulseBuffer;

    // Create delay to compensate for Hilbert transform delay
    const delayTime = mid / audioContext.sampleRate;
    const delay = audioContext.createDelay(delayTime);
    delay.delayTime.value = delayTime;

    return [delay, hilbert];
  }

  /**
   * Get the time domain and quadrature data
   * @returns {Array<Float32Array>} Array containing [timeData, quadData]
   */

  getValues() {
    if (this.analyserTime && this.analyserQuad && this.timeData && this.quadData) {
      this.analyserTime.getFloatTimeDomainData(this.timeData);
      this.analyserQuad.getFloatTimeDomainData(this.quadData);
      return [this.timeData, this.quadData];
    }
    return [new Float32Array(this.bufferLength), new Float32Array(this.bufferLength)];
  }

  /**
   * Disconnect and cleanup the processor
   */
  disconnect() {
    if (this.analyserTime) {
      this.analyserTime.disconnect();
      this.analyserTime = null;
    }
    if (this.analyserQuad) {
      this.analyserQuad.disconnect();
      this.analyserQuad = null;
    }
    if (this.hilbert) {
      this.hilbert.disconnect();
      this.hilbert = null;
    }
    if (this.delay) {
      this.delay.disconnect();
      this.delay = null;
    }
    this.connected = false;
  }
}

/**
 * Amplitude analyzer for overall volume tracking
 * @private
 */
class AmplitudeAnalyzer {
  constructor() {
    this.analyser = null;
    this.dataArray = new Uint8Array(128);
    this.connected = false;
  }

  /**
   * Connect the analyzer to an audio source
   * @param {AudioContext} audioContext - The Web Audio context
   * @param {AudioNode} sourceNode - The audio source to connect to
   */
  connect(audioContext, sourceNode) {
    if (this.connected) return;

    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    sourceNode.connect(this.analyser);
    this.connected = true;
  }

  /**
   * Get the current amplitude level
   * @returns {number} Amplitude value between 0 and 1
   */
  getAmplitude() {
    if (!this.analyser) return 0;

    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length;
    return Math.pow(average / 255, 0.8);
  }

  /**
   * Disconnect and cleanup the analyzer
   */
  disconnect() {
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    this.connected = false;
  }
}

/**
 * State management for the Hilbert Scope
 * @private
 */
class HilbertScopeState {
  constructor() {
    this.isInitialized = false;
    this.swapCanvas = null;
    this.swapContext = null;
    this.x = 0;
    this.y = 0;
    this.currentRadius = 0;
    this.targetRadius = 0;
    this.fadeInProgress = 0;
    this.fadeOutProgress = 0;
    this.isActive = false;
  }

  /**
   * Reset the state to initial values
   */
  reset() {
    this.isInitialized = false;
    this.swapCanvas = null;
    this.swapContext = null;
    this.x = 0;
    this.y = 0;
    this.currentRadius = 0;
    this.targetRadius = 0;
    this.fadeInProgress = 0;
    this.fadeOutProgress = 0;
    this.isActive = false;
  }
}

// Global state and processors
const hilbertProcessors = {};
const amplitudeAnalyzers = {};
const hilbertStates = {};
const sigmoid = sigmoidFactory(7);

/**
 * Initialize hilbert scope for a given ID
 * @private
 * @param {number} id - The analyzer ID
 * @param {Object} config - Configuration object
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
function initializeHilbertScope(id, config, canvasWidth, canvasHeight) {
  if (hilbertStates[id]?.isInitialized) return;

  const audioContext = getAudioContext();
  if (!audioContext) {
    console.error('No audio context available for Hilbert Scope');
    return;
  }

  // Initialize processors
  hilbertProcessors[id] = new HilbertProcessor();
  amplitudeAnalyzers[id] = new AmplitudeAnalyzer();
  hilbertStates[id] = new HilbertScopeState();

  const state = hilbertStates[id];

  // Try to connect to existing analyser, but don't fail if it doesn't exist yet
  const analyser = analysers[id];
  if (analyser) {
    try {
      hilbertProcessors[id].connect(audioContext, analyser);
      amplitudeAnalyzers[id].connect(audioContext, analyser);
    } catch (e) {
      console.warn('Could not connect to analyser on first try, will retry:', e);
    }
  }

  // Initialize position (center of canvas)
  state.x = canvasWidth / 2;
  state.y = canvasHeight / 2; // Center vertically

  // Create swap canvas for trail effect
  state.swapCanvas = document.createElement('canvas');
  state.swapCanvas.width = canvasWidth;
  state.swapCanvas.height = canvasHeight;
  state.swapContext = state.swapCanvas.getContext('2d');

  // Calculate initial radius
  const screenBasedSize = Math.min(canvasWidth, canvasHeight) * config.sizeRatio;
  state.targetRadius = mathClamp(screenBasedSize, config.minSize, config.maxSize) / 2;

  state.isInitialized = true;
  state.isActive = true;
}

/**
 * Scale value using sigmoid for smooth transitions
 * @private
 * @param {number} val - Input value
 * @returns {number} Scaled value between -1 and 1
 */
function scaleValue(val) {
  const scaledVal = mathScale(val, -3, 3, 0, 1);
  return mathScale(sigmoid(scaledVal), 0, 1, -1, 1);
}

/**
 * Clear screen with optional smear effect
 * @private
 * @param {number} smear - Smear amount (0-1)
 * @param {string} smearRGB - RGB color string for smear
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
function clearScreen(smear = 0, smearRGB = '0,0,0', ctx) {
  if (!smear) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  } else {
    ctx.fillStyle = `rgba(${smearRGB},${1 - smear})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

/**
 * Main rendering function for Hilbert Scope
 * Creates an organic, circular visualization using Hilbert transform analysis
 * @param {AnalyserNode} analyser - Web Audio analyser node
 * @param {Object} options - Configuration options
 * @param {string} [options.color=getTheme().foreground] - Line color (default: theme foreground)
 * @param {number} [options.thickness=2] - Line thickness
 * @param {number} [options.sizeRatio=0.75] - Size relative to screen
 * @param {number} [options.minSize=200] - Minimum size in pixels
 * @param {number} [options.maxSize=800] - Maximum size in pixels
 * @param {number} [options.opacity=0.8] - Overall opacity
 * @param {number} [options.history=0.25] - Trail persistence (0-1)
 * @param {number} [options.driftSpeed=0.5] - Movement speed
 * @param {boolean} [options.glowEnabled=true] - Enable glow effect
 * @param {number} [options.glowIntensity=1] - Glow intensity
 * @param {boolean} [options.chromaticColoring=true] - Enable chromatic note-based coloring
 * @param {number} [options.scaleInDuration=30] - Fade in duration in frames
 * @param {number} [options.scaleOutDuration=30] - Fade out duration in frames
 * @param {number} [options.smear=0] - Screen smear amount
 * @param {CanvasRenderingContext2D} [options.ctx] - Canvas context
 * @param {number} [options.id=1] - Analyzer ID
 * @param {Array} [options.haps] - Current haps for note extraction
 */
export function drawHilbertScope(
  analyser,
  {
    color = getTheme().foreground,
    thickness = 2,
    sizeRatio = 0.75,
    minSize = 200,
    maxSize = 800,
    opacity = 0.8,
    history = 0.25,
    driftSpeed = 0.5,
    glowEnabled = true,
    glowIntensity = 1,
    chromaticColoring = true,
    scaleInDuration = 30,
    scaleOutDuration = 30,
    smear = 0,
    ctx = getDrawContext(),
    id = 1,
    haps = [],
  } = {},
) {
  const canvas = ctx.canvas;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Initialize if needed
  const config = {
    sizeRatio,
    minSize,
    maxSize,
    opacity,
    history,
    driftSpeed,
    glowEnabled,
    glowIntensity,
    scaleInDuration,
    scaleOutDuration,
    lineWidth: thickness,
  };

  if (!hilbertStates[id]?.isInitialized) {
    initializeHilbertScope(id, config, canvasWidth, canvasHeight);
  }

  const state = hilbertStates[id];
  const hilbertProcessor = hilbertProcessors[id];
  const amplitudeAnalyzer = amplitudeAnalyzers[id];

  if (!state?.isInitialized || !state.isActive) return;
  if (!state.swapContext) return;

  // Ensure connection to analyser (in case it wasn't available during init)
  if (analyser && hilbertProcessor && amplitudeAnalyzer && !hilbertProcessor.connected) {
    const audioContext = getAudioContext();
    if (audioContext) {
      try {
        hilbertProcessor.connect(audioContext, analyser);
        amplitudeAnalyzer.connect(audioContext, analyser);
      } catch (e) {
        console.warn('Could not connect to analyser:', e);
      }
    }
  }

  // Get audio data
  const [xVals, yVals] = hilbertProcessor.getValues();
  const amplitude = amplitudeAnalyzer.getAmplitude();

  // Handle fade animations
  if (state.fadeInProgress < 1) {
    state.fadeInProgress = Math.min(1, state.fadeInProgress + 1 / config.scaleInDuration / 60);
  }

  // Update position with drift
  const driftAmount = (config.driftSpeed / 60) * 0.1; // Convert to pixels per frame
  state.x += (Math.random() - 0.5) * driftAmount;
  state.y += (Math.random() - 0.5) * driftAmount; // Balanced drift

  // Keep within bounds (centered)
  const margin = 50;
  state.x = mathClamp(state.x, margin, canvasWidth - margin);
  state.y = mathClamp(state.y, margin, canvasHeight - margin);

  // Smooth radius transitions
  state.currentRadius += (state.targetRadius - state.currentRadius) * 0.1;

  // Apply trail effect
  if (config.history > 0 && state.swapCanvas) {
    // Clear swap canvas
    state.swapContext.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw previous frame with reduced opacity
    state.swapContext.globalAlpha = config.history;
    state.swapContext.drawImage(ctx.canvas, 0, 0);
    state.swapContext.globalAlpha = 1;

    // Copy swap canvas back to main canvas
    ctx.save();
    ctx.globalAlpha = 1;
    clearScreen(smear, '0,0,0', ctx);
    ctx.drawImage(state.swapCanvas, 0, 0);
    ctx.restore();
  } else {
    clearScreen(smear, '0,0,0', ctx);
  }

  // Determine color based on chromatic coloring setting
  let finalColor = color;

  // Only use chromatic coloring if the provided color is the default theme color
  const isUsingDefaultColor = color === getTheme().foreground;
  if (chromaticColoring && isUsingDefaultColor && haps && haps.length > 0) {
    // Look for note values in current haps
    const noteHap = haps.find((hap) => hap?.value?.note);
    if (noteHap && noteHap.value.note) {
      const hue = noteToHue(noteHap.value.note);
      const saturation = 70; // Vibrant but not overwhelming
      const lightness = 60; // Good visibility
      finalColor = hslToString(hue, saturation, lightness);
    }
  }

  // Set up drawing style
  ctx.save();
  ctx.globalAlpha = config.opacity * state.fadeInProgress * (1 - state.fadeOutProgress);

  // Apply glow effect if enabled
  if (config.glowEnabled) {
    ctx.shadowBlur = config.glowIntensity;
    ctx.shadowColor = finalColor;
  }

  // Draw Hilbert curve
  ctx.beginPath();
  ctx.lineWidth = mathScale(amplitude, 0, 1, config.lineWidth * 0.5, config.lineWidth * 2);

  const scalar = state.currentRadius;

  for (let i = 0; i < xVals.length; i++) {
    const xVal = scaleValue(xVals[i]) * scalar + state.x;
    const yVal = scaleValue(yVals[i]) * scalar + state.y;

    if (i === 0) {
      ctx.moveTo(xVal, yVal);
    } else {
      ctx.lineTo(xVal, yVal);
    }
  }

  ctx.strokeStyle = finalColor;
  ctx.stroke();
  ctx.restore();
}

/**
 * Cleanup function for hilbert scope resources
 * @param {number} id - The analyzer ID to cleanup
 */
export function cleanupHilbertScope(id) {
  if (hilbertProcessors[id]) {
    hilbertProcessors[id].disconnect();
    delete hilbertProcessors[id];
  }
  if (amplitudeAnalyzers[id]) {
    amplitudeAnalyzers[id].disconnect();
    delete amplitudeAnalyzers[id];
  }
  if (hilbertStates[id]) {
    hilbertStates[id].reset();
    delete hilbertStates[id];
  }
}

/**
 * Renders a Hilbert scope visualization - a psychedelic, organic circular pattern that responds to audio amplitude and timbre.
 * Uses Hilbert transform analysis to create fluid, dynamic visualizations that dance with the music.
 *
 * @name hilbertscope
 * @memberof Pattern
 * @param {Object} [config={}] - Configuration options
 * @param {string} [config.color=getTheme().foreground] - Line color (default: theme foreground color or pattern color)
 * @param {number} [config.thickness=2] - Line thickness
 * @param {number} [config.sizeRatio=0.75] - Size relative to screen (0-1)
 * @param {number} [config.minSize=200] - Minimum scope size in pixels
 * @param {number} [config.maxSize=800] - Maximum scope size in pixels
 * @param {number} [config.opacity=0.8] - Overall opacity (0-1)
 * @param {number} [config.history=0.25] - Trail persistence, higher = longer trails (0-1)
 * @param {number} [config.driftSpeed=0.5] - Movement/drift speed multiplier
 * @param {boolean} [config.glowEnabled=true] - Enable glow effect
 * @param {number} [config.glowIntensity=1] - Glow intensity
 * @param {boolean} [config.chromaticColoring=true] - Enable note-based chromatic coloring
 * @param {number} [config.smear=0] - Screen smear amount for custom trail effects (0-1)
 * @param {number} [config.id=1] - Analyzer ID for multiple simultaneous scopes
 * @returns {Pattern} The pattern with hilbert scope visualization
 * @example
 * // Basic usage
 * note("c a f e").s("sawtooth").hilbertscope()
 * @example
 * // With custom styling
 * note("c a f e").s("sawtooth").hilbertscope({
 *   color: "cyan",
 *   thickness: 3,
 *   sizeRatio: 0.5,
 *   history: 0.9
 * })
 * @example
 * // Multiple scopes with different colors
 * stack(
 *   note("c e g").s("sawtooth").hilbertscope({id: 1, color: "red"}),
 *   note("f a c").s("sine").hilbertscope({id: 2, color: "blue"})
 * )
 */
Pattern.prototype.hilbertscope = function (config = {}) {
  let id = config.id ?? 1;

  return this.analyze(id).draw(
    (haps) => {
      // Only set color from haps if no explicit color provided
      if (!('color' in config)) {
        config.color = haps[0]?.value?.color || getTheme().foreground;
      }
      config.haps = haps; // Pass haps for note extraction
      drawHilbertScope(analysers[id], config);
    },
    { id },
  );
};
