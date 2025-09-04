// Simple fractal test pattern
const code = `// Simple fractal test
note("36 40 43 48")
  .s("sawtooth")
  .gain(0.5)
  .cutoff(800)`;

fetch('http://localhost:3457/pattern', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
}).then(r => r.json()).then(data => {
  console.log('Response:', data);
  if (data.success) {
    console.log('Pattern sent successfully. Check browser for sound.');
  }
}).catch(console.error);