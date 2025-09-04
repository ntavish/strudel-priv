const fs = require('fs');

const code = fs.readFileSync('/data/data/com.termux/files/home/strudel/examples/fractal-working.strudel', 'utf8');

console.log('Sending fractal composition to Strudel...');

fetch('http://localhost:3457/pattern', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code })
}).then(r => r.json()).then(data => {
  if (data.success) {
    console.log('✅ Fractal pattern sent successfully!');
    console.log('🎵 Check your browser at http://localhost:4321');
    console.log('📨 The pattern should auto-execute in the REPL');
  } else {
    console.error('❌ Failed:', data.error);
  }
}).catch(console.error);