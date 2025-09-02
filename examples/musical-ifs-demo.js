// Musical IFS (Iterated Function Systems) Demo
// Fractal pattern generation for music

// L-System Musical Generator
// Rules: A -> AB, B -> A
// Creates Fibonacci-like rhythmic patterns
function lsystem(axiom, rules, iterations) {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (let char of current) {
      next += rules[char] || char;
    }
    current = next;
  }
  return current;
}

// Example 1: Fibonacci Rhythm L-System
// Generates the Fibonacci word: ABAABABA...
const fibRhythm = lsystem('A', {
  'A': 'AB',
  'B': 'A'
}, 5);
// Convert to pattern: A=kick, B=snare
$: s(fibRhythm.split('').map(c => c === 'A' ? 'bd' : 'sd').join(' '))
  .bank("tr909")

// Example 2: Dragon Curve Melody
// L-System that creates dragon curve fractal
const dragonCurve = lsystem('FX', {
  'X': 'X+YF+',
  'Y': '-FX-Y'
}, 4);
// Convert to notes: F=forward=note, +=up, -=down
let pitch = 60;
const dragonNotes = [];
for (let char of dragonCurve) {
  if (char === 'F') dragonNotes.push(pitch);
  else if (char === '+') pitch += 2;
  else if (char === '-') pitch -= 2;
}
$: note(dragonNotes.join(' ')).s("piano")

// Example 3: Barnsley Fern for Music
// Using affine transformations on pitch/time space
function barnsleyFern(iterations = 1000) {
  const notes = [];
  let x = 0, y = 0;
  
  for (let i = 0; i < iterations; i++) {
    const r = Math.random();
    let newX, newY;
    
    if (r < 0.01) {
      // Stem (1%)
      newX = 0;
      newY = 0.16 * y;
    } else if (r < 0.86) {
      // Main frond (85%)
      newX = 0.85 * x + 0.04 * y;
      newY = -0.04 * x + 0.85 * y + 1.6;
    } else if (r < 0.93) {
      // Left frond (7%)
      newX = 0.2 * x - 0.26 * y;
      newY = 0.23 * x + 0.22 * y + 1.6;
    } else {
      // Right frond (7%)
      newX = -0.15 * x + 0.28 * y;
      newY = 0.26 * x + 0.24 * y + 0.44;
    }
    
    x = newX;
    y = newY;
    
    // Map to musical parameters
    const pitch = Math.floor(48 + y * 4); // Map Y to pitch
    const time = Math.abs(x) / 4; // Map X to time position
    const velocity = 0.3 + Math.abs(y) / 10; // Map Y to velocity
    
    notes.push({ pitch, time, velocity });
  }
  
  return notes;
}

// Play Barnsley Fern as music
const fernNotes = barnsleyFern(100);
$: stack(
  ...fernNotes.map(n => 
    note(n.pitch)
      .s("triangle")
      .gain(n.velocity)
      .late(n.time % 1)
  )
).slow(4)

// Example 4: Sierpinski Triangle Rhythm
// Using chaos game to generate rhythms
function sierpinskiRhythm(iterations = 100) {
  const vertices = [
    {x: 0, y: 0, sound: 'bd'},
    {x: 1, y: 0, sound: 'sd'},
    {x: 0.5, y: 0.866, sound: 'hh'}
  ];
  
  let x = Math.random(), y = Math.random();
  const pattern = [];
  
  for (let i = 0; i < iterations; i++) {
    const vertex = vertices[Math.floor(Math.random() * 3)];
    x = (x + vertex.x) / 2;
    y = (y + vertex.y) / 2;
    pattern.push(vertex.sound);
  }
  
  return pattern;
}

$: s(sierpinskiRhythm(16).join(' ')).bank("tr909")

// Example 5: Musical Cantor Set
// Recursive subdivision creating fractal rhythms
function cantorRhythm(level = 4, length = 16) {
  if (level === 0) return Array(length).fill(1);
  
  const third = Math.floor(length / 3);
  const left = cantorRhythm(level - 1, third);
  const middle = Array(third).fill(0);
  const right = cantorRhythm(level - 1, third);
  
  return [...left, ...middle, ...right];
}

$: s("bd").struct(cantorRhythm(3, 27).join(' '))

// Example 6: Julia Set Harmony
// Using complex dynamics for chord progressions
function juliaSet(c_real, c_imag, iterations = 10) {
  const chords = [];
  
  for (let i = 0; i < 8; i++) {
    let z_real = (i - 4) / 4;
    let z_imag = 0;
    let escaped = false;
    
    for (let j = 0; j < iterations; j++) {
      const temp = z_real * z_real - z_imag * z_imag + c_real;
      z_imag = 2 * z_real * z_imag + c_imag;
      z_real = temp;
      
      if (z_real * z_real + z_imag * z_imag > 4) {
        escaped = true;
        // Map escape time to chord type
        const chordType = j % 4;
        const root = 60 + (j % 12);
        chords.push([root, root + [4,3,5,7][chordType], root + 7]);
        break;
      }
    }
    
    if (!escaped) {
      chords.push([60, 64, 67]); // Default to C major
    }
  }
  
  return chords;
}

const juliaChords = juliaSet(-0.7, 0.27);
$: stack(
  ...juliaChords.map((chord, i) => 
    note(chord.join(' '))
      .s("sawtooth")
      .cutoff(500 + i * 100)
      .late(i / 8)
  )
).slow(8)