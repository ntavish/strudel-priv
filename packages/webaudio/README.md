# @strudel.cycles/webaudio

This package contains helpers to make music with strudel and the Web Audio API.

## Install

```sh
npm i @strudel.cycles/webaudio --save
```

## Example

```js
import { repl, controls } from "@strudel.cycles/core";
import { initAudioOnFirstClick, getAudioContext, webaudioOutput } from "@strudel.cycles/webaudio";
const { note } = controls;

initAudioOnFirstClick();
const ctx = getAudioContext();

const { scheduler } = repl({
  defaultOutput: webaudioOutput,
  getTime: () => ctx.currentTime
});

const pattern = note("c3", ["eb3", "g3"]).s("sawtooth");

scheduler.setPattern(pattern);
document.getElementById("start").addEventListener("click", () => scheduler.start());
document.getElementById("stop").addEventListener("click", () => scheduler.stop());
```

[Play with the example codesandbox](https://codesandbox.io/s/amazing-dawn-gclfwg?file=/src/index.js).

Read more in the docs about [samples](https://strudel.tidalcycles.org/learn/samples/), [synths](https://strudel.tidalcycles.org/learn/synths/) and [effects](https://strudel.tidalcycles.org/learn/effects/).
