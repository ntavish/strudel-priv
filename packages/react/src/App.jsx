import React from 'react';
import { MiniRepl } from './components/MiniRepl';
import 'tailwindcss/tailwind.css';
import { controls, evalScope } from '@strudel.cycles/core';

evalScope(
  controls,
  import('@strudel.cycles/core'),
  import('@strudel.cycles/tonal'),
  import('@strudel.cycles/mini'),
  import('@strudel.cycles/midi'),
  import('@strudel.cycles/xen'),
  import('@strudel.cycles/webaudio'),
);

function App() {
  return (
    <div>
      <MiniRepl tune={`note("c3")`} />
    </div>
  );
}

export default App;
