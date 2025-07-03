import { Pattern, register } from './pattern.mjs';
import { Hap } from './hap.mjs';
import TimeSpan from './timespan.mjs';
import { Fraction, signal } from './index.mjs';

const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;
const n1 = 7.5625;
const d1 = 2.75;

/* derived from https://github.com/ai/easings.net/blob/master/src/easings.yml [GPL-3.0] */
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

const interpolate = (p, ease = 'linear') => (t) => {
  const fracT = t%1;
  let steps = [];
  let begin, end, fraction;

  if (p instanceof Pattern) {
    steps = p.queryArc(t.sub(1), t.add(1))
    .map(step => ({ time: +(step.part.begin) - t.sam(), value: +step.value}))
    .sort((a,b) => a.time - b.time);
  } else {
    if (typeof p === 'string') {
      steps = p.split(' ');
    } else {
      if (p.constructor.name !== 'Array') return 0;
      steps = p;
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

const camelize = (str) => `${str.at(0).toUpperCase()}${str.slice(1).toLowerCase()}`;

//$: n("[13]*32").s("pink").bpf(smooth("[25000*16 2000]").slow(4))
export const smooth = (p, ease = 'linear') => signal(interpolate(p, ease));

//$: n("[13]*32").s("pink").bpf("[25000*16 2000]".linear().slow(4))
export const { linear } = register(
  ['linear'],
  (pat) => signal(interpolate(pat, 'linear')),
);

//$: n("[13]*32").s("pink").bpf("[25000*16 2000]".ease("sine").slow(4))
export const { ease, easeinout, easeInOut } = register(
  ['ease', 'easeinout', 'easeInOut'],
  (ease, pat) => signal(interpolate(pat, `easeInOut${camelize(ease)}`)),
);

//$: n("[13]*32").s("pink").bpf("[25000*16 2000]".easeIn("sine").slow(4))
export const { easeIn, easein } = register(
  ['easeIn', 'easein'],
  (ease, pat) => signal(interpolate(pat, `easeIn${camelize(ease)}`)),
);

//$: n("[13]*32").s("pink").bpf("[25000*16 2000]".easeOut("sine").slow(4))
export const { easeOut, easeout } = register(
  ['easeOut', 'easeout'],
  (ease, pat) => signal(interpolate(pat, `easeOut${camelize(ease)}`)),
);

