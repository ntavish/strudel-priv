import { controls, repl, evalScope } from '@strudel.cycles/core';
import { getAudioContext, webaudioOutput, initAudioOnFirstClick } from '@strudel.cycles/webaudio';
import { transpiler } from '@strudel.cycles/transpiler';
import tune from './tune.mjs';

const ctx = getAudioContext();
const input = document.getElementById('text');
input.innerHTML = tune;
initAudioOnFirstClick();

evalScope(
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/webaudio'),
  import('@strudel.cycles/tonal'),
);

const { evaluate } = repl({
  defaultOutput: webaudioOutput,
  getTime: () => ctx.currentTime,
  transpiler,
});
document.getElementById('start').addEventListener('click', () => {
  ctx.resume();
  console.log('eval', input.value);
  evaluate(input.value);
});
