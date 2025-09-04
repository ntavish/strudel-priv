// Test if fractal namespace is available in REPL
const testCode = `
// Test fractal namespace availability
const hasFractal = typeof fractal !== 'undefined';
const msg = hasFractal ? 'fractal available' : 'fractal NOT available';
console.log(msg);

// Play different patterns based on availability
if (hasFractal) {
  // Use fractal to modulate gain
  s("bd*4").gain(x => 0.3 + fractal.perlin(x * 0.1, 0.5, 0.2) * 0.5)
} else {
  // Fallback pattern
  s("hh*8").gain(0.2)
}
`;

fetch('http://localhost:3457/pattern', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: testCode })
}).then(r => r.json()).then(console.log).catch(console.error);