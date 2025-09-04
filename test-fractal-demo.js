// Test script to verify fractal functions are available
import { fractal } from './packages/core/fractals.mjs';

console.log('Testing fractal namespace...');

// Test each function exists and returns valid values
try {
  // Test Perlin noise
  const perlinResult = fractal.perlin(0.5, 0.5);
  console.log(`✓ fractal.perlin(0.5, 0.5) = ${perlinResult}`);
  if (perlinResult < 0 || perlinResult > 1) throw new Error('Perlin out of range');

  // Test fractal noise
  const fractalNoiseResult = fractal.fractalNoise(0.5, 0.5, 4, 0.5);
  console.log(`✓ fractal.fractalNoise(0.5, 0.5, 4, 0.5) = ${fractalNoiseResult}`);
  if (fractalNoiseResult < 0 || fractalNoiseResult > 1) throw new Error('FractalNoise out of range');

  // Test Mandelbrot
  const mandelbrotResult = fractal.mandelbrot(0.5, 0.5, 30);
  console.log(`✓ fractal.mandelbrot(0.5, 0.5, 30) = ${mandelbrotResult}`);
  if (mandelbrotResult < 0 || mandelbrotResult > 1) throw new Error('Mandelbrot out of range');

  // Test Julia
  const juliaResult = fractal.julia(0.5, 0.5, -0.7, 0.27, 30);
  console.log(`✓ fractal.julia(0.5, 0.5, -0.7, 0.27, 30) = ${juliaResult}`);
  if (juliaResult < 0 || juliaResult > 1) throw new Error('Julia out of range');

  // Test Sierpinski
  const sierpinskiResult = fractal.sierpinski(0.5, 0.5, 4);
  console.log(`✓ fractal.sierpinski(0.5, 0.5, 4) = ${sierpinskiResult}`);
  if (sierpinskiResult < 0 || sierpinskiResult > 1) throw new Error('Sierpinski out of range');

  // Test Dragon Curve
  const dragonResult = fractal.dragonCurve(0.5, 0.5, 5);
  console.log(`✓ fractal.dragonCurve(0.5, 0.5, 5) = ${dragonResult}`);
  if (dragonResult < 0) throw new Error('DragonCurve out of range');

  console.log('\n✅ All fractal functions working correctly!');

  // Test with variables like in the demo
  const x = 0.5;
  const sine = Math.sin(Date.now() / 1000);
  const cosine = Math.cos(Date.now() / 1000);
  const saw = (Date.now() / 1000) % 1;

  console.log('\nTesting with time-based inputs like the demo:');
  console.log(`fractal.sierpinski(${x*0.5}, ${saw*0.3}, 4) = ${fractal.sierpinski(x*0.5, saw*0.3, 4)}`);
  console.log(`fractal.julia(${x*0.1}, ${sine*0.2}, -0.7, 0.27) = ${fractal.julia(x*0.1, sine*0.2, -0.7, 0.27)}`);
  console.log(`fractal.perlin(${x*0.2}, ${saw*0.5}) = ${fractal.perlin(x*0.2, saw*0.5)}`);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}