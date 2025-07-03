import { Pattern, register } from './pattern.mjs';
import { Hap } from './hap.mjs';
import TimeSpan from './timespan.mjs';
import { Fraction, signal } from './index.mjs';

// come constants for the easing functions
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;
const n1 = 7.5625;
const d1 = 2.75;

/* derived from [https://github.com/ai/easings.net/blob/master/src/easings.yml]
 * the curves are visualized at [https://easings.net/]
 *
 * Avalable easing functions are:
 * Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce
 * each with prefix ( easIn | easeOut | easeInOut )
 */
export const easing = {
  linear: x => x,

  easeInSine: x => 1 - Math.cos((x * Math.PI) / 2),

  easeOutSine: x => Math.sin((x * Math.PI) / 2),

  easeInOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,

  easeInQuad: x => x * x,

  easeOutQuad: x => 1 - (1 - x) * (1 - x),

  easeInOutQuad: x => x < 0.5
    ? 2 * x * x
    : 1 - Math.pow(-2 * x + 2, 2) / 2,

  easeInCubic: x => x * x * x,

  easeOutCubic: x => 1 - Math.pow(1 - x, 3),

  easeInOutCubic: x => x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2,

  easeInQuart: x => x * x * x * x,

  easeOutQuart: x => 1 - Math.pow(1 - x, 4),

  easeInOutQuart: x => x < 0.5
    ? 8 * x * x * x * x
    : 1 - Math.pow(-2 * x + 2, 4) / 2,

  easeInQuint: x => x * x * x * x * x,

  easeOutQuint: x => 1 - Math.pow(1 - x, 5),

  easeInOutQuint: x => x < 0.5
    ? 16 * x * x * x * x * x
    : 1 - Math.pow(-2 * x + 2, 5) / 2,

  easeInExpo: x => x === 0
    ? 0
    : Math.pow(2, 10 * x - 10),

  easeOutExpo: x => x === 1
    ? 1
    : 1 - Math.pow(2, -10 * x),

  easeInOutExpo: x => x === 0
    ? 0
    : x === 1
      ? 1
      : x < 0.5
        ? Math.pow(2, 20 * x - 10) / 2
        : (2 - Math.pow(2, -20 * x + 10)) / 2,

  easeInCirc: x => 1 - Math.sqrt(1 - Math.pow(x, 2)),

  easeOutCirc: x => Math.sqrt(1 - Math.pow(x - 1, 2)),

  easeInOutCirc: x => x < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,

  easeInBack: x => c3 * x * x * x - c1 * x * x,

  easeOutBack: x => 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2),

  easeInOutBack: x => x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2,

  easeInElastic: x => x === 0
    ? 0
    : x === 1
      ? 1
      : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4),

  easeOutElastic: x => x === 0
    ? 0
    : x === 1
      ? 1
      : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1,

  easeInOutElastic: x => x === 0
    ? 0
    : x === 1
      ? 1
      : x < 0.5
        ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1,

  easeInBounce: x => 1 - easing.easeOutBounce(1 - x),

  easeOutBounce: x => x < 1 / d1
    ? n1 * x * x
    : x < 2 / d1
      ? n1 * (x -= 1.5 / d1) * x + 0.75
      : x < 2.5 / d1
        ? n1 * (x -= 2.25 / d1) * x + 0.9375
        : n1 * (x -= 2.625 / d1) * x + 0.984375,

  easeInOutBounce: x => x < 0.5
      ? (1 - easing.easeOutBounce(1 - 2 * x)) / 2
      : (1 + easing.easeOutBounce(2 * x - 1)) / 2,
}

/* unused utility function 
 * does the same as Signal(func).segment(steps)
 */
const discreteSignal = (func, steps = 128) => {
  const query = (state) => {
    //if (steps instanceof Pattern) {
    //  steps = +steps.query(state).at(0)?.value ?? 0;
    //}
    if (!steps || state.span.end.equals(state.span.begin)) {
      return [new Hap(state.span, state.span, func(state.span.begin))];
    }
    let haps = [];
    const tDiff = state.span.end.sub(state.span.begin);
    const begin = state.span.begin;
    const diff = state.span.duration.div(tDiff.mul(steps));

    for (let i = 0; i < steps*tDiff-1; i++){
      const span = new TimeSpan(begin.add(diff.mul(Fraction(i))), begin.add(diff.mul(Fraction(i+1))))
      haps.push(new Hap(span, span, func(span.begin)));
    }
    return haps
  };
  return new Pattern(query);
};

/* sampling function
 *
 * @callback dT
 * @param {Fraction} t cycle time
 * @return {number}
 */

/**
 * creates a sampling function that interpolates over a pattern, array or string of numbers
 *
 * Available easing functions (second optional param):
 * Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce
 * each with prefix [ easIn | easeOut | easeInOut ]
 * or just linear, the default
 *
 * @param {(Pattern|number[]|string)} pat input pattern to interpolate
 * @param {string} [ease=linear] Name of easing function (case sensitive)
 * @return {dT} a sampling function
 */
const sampleFactory = (pat, ease = 'linear') => (t) => {
  const fracT = t%1;
  let steps = [];
  let begin, end, fraction;

  if (pat instanceof Pattern) {
    steps = pat.queryArc(t.sub(1), t.add(1))
    .map(step => ({ time: +(step.part.begin) - t.sam(), value: +step.value}))
    .sort((a,b) => a.time - b.time);
  } else {
    if (typeof pat === 'string') {
      steps = pat.split(' ');
    } else {
      if (pat.constructor.name !== 'Array') return 0;
      steps = pat;
    }

    const numSteps = Math.max(1, steps.length - 1);
    steps = steps.map((value, i) => ({ time: (1 / numSteps) * i, value: +value}));
  }

  for (let i = 0; i < steps.length-1; i++) {
    if (steps[i+1] && steps[i].time <= fracT && fracT <= steps[i+1].time) {
      [begin, end] = steps.slice(i, i + 2);
      break;
    }
  }

  if (!(begin && end)) return 0;

  fraction = 1 / (end.time - begin.time) * (t % 1 - begin.time);
  if (ease && typeof easing[ease] === 'function'){
    fraction = easing[ease](fraction);
  }

  return begin.value + (end.value - begin.value) * fraction;
};

/**
 * creates a signal by interpolating over a pattern, array or string of numbers
 * $: n("[13]*32").s("pink").bpf(smooth("[25000 2000]").slow(4))
 * $: n("[13]*32").s("pink").bpf(smooth([25000 2000]).slow(4))
 * $: n("[13]*32").s("pink").bpf(smooth('25000 2000').slow(4))
 *
 * Available easing functions (second optional param):
 * Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce
 * each with prefix [ easIn | easeOut | easeInOut ]
 * or just linear, the default
 *
 * $: n("[13]*32").s("pink").bpf(smooth("[25000 2000]", "linear").slow(4))
 * $: n("[13]*32").s("pink").bpf(smooth("[25000 2000]", "easeInCubic").slow(4))
 *
 * @param {(Pattern|number[]|string)} pat input pattern to interpolate
 * @param {string} [ease=linear] Name of easing function (case sensitive)
 * @return {Pattern} a signal pattern
 */
export const smooth = (pat, ease = 'linear') => signal(sampleFactory(pat, ease));

/**
 * creates a signal that interpolates linear over the pattern
 * $: n("[13]*32").s("pink").bpf("[25000 2000]".linear().slow(4))
 * 
 * @param {Pattern} pat input pattern
 * @return {Pattern} a signal pattern
 */
export const { linear } = register(
  ['linear'],
  (pat) => signal(sampleFactory(pat, 'linear')),
);

/**
 * turns any string's first letter uppcase and the rest lowercase
 *
 * @param {string} str input string
 * @return {string} 
 */
const camelize = (str) => `${str.at(0).toUpperCase()}${str.slice(1).toLowerCase()}`;

/**
 * creates a signal that interpolates easing in and out over the pattern
 * $: n("[13]*32").s("pink").bpf("[25000 2000]".ease("quart").slow(4))
 * $: n("[13]*32").s("pink").bpf("[25000 2000]".easeInOut("quart").slow(4))
 * 
 * Available easing functions:
 * Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce
 *
 * @param {string} ease easing function (case insensitive)
 * @param {Pattern} pat input pattern
 * @return {Pattern} a signal pattern
 */
export const { ease, easeinout, easeInOut } = register(
  ['ease', 'easeinout', 'easeInOut'],
  (ease, pat) => signal(sampleFactory(pat, `easeInOut${camelize(ease)}`)),
);

/* creates a signal that interpolates easing in over the pattern
 * $: n("[13]*32").s("pink").bpf("[25000 2000]".easeIn("back").slow(4))
 * 
 * Available easing functions:
 * Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce
 *
 * @param {string} ease easing function (case insensitive)
 * @param {Pattern} pat input pattern
 * @return {Pattern} a signal pattern
 */
export const { easeIn, easein } = register(
  ['easeIn', 'easein'],
  (ease, pat) => signal(sampleFactory(pat, `easeIn${camelize(ease)}`)),
);

/* creates a signal that interpolates easing out over the pattern
 * $: n("[13]*32").s("pink").bpf("[25000 2000]".easeOut("bounce").slow(4))
 * 
 * Available easing functions:
 * Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic, Bounce
 *
 * @param {string} ease easing function (case insensitive)
 * @param {Pattern} pat input pattern
 * @return {Pattern} a signal pattern
 */
export const { easeOut, easeout } = register(
  ['easeOut', 'easeout'],
  (ease, pat) => signal(sampleFactory(pat, `easeOut${camelize(ease)}`)),
);

