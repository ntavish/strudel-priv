/*
superdough.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://codeberg.org/uzu/strudel/src/branch/main/packages/superdough/superdough.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import './feedbackdelay.mjs';
import './reverb.mjs';
import './vowel.mjs';
import { clamp, nanFallback, _mod, cycleToSeconds } from './util.mjs';
import workletsUrl from './worklets.mjs?audioworklet';
import { createFilter, gainNode, getCompressor, getWorklet } from './helpers.mjs';
import { map } from 'nanostores';
import { logger } from './logger.mjs';
import { loadBuffer } from './sampler.mjs';

export const DEFAULT_MAX_POLYPHONY = 128;
const DEFAULT_AUDIO_DEVICE_NAME = 'System Standard';

let maxPolyphony = DEFAULT_MAX_POLYPHONY;

export function setMaxPolyphony(polyphony) {
  maxPolyphony = parseInt(polyphony) ?? DEFAULT_MAX_POLYPHONY;
}

let multiChannelOrbits = false;
export function setMultiChannelOrbits(bool) {
  multiChannelOrbits = bool == true;
}

export const soundMap = map();

export function registerSound(key, onTrigger, data = {}) {
  key = key.toLowerCase().replace(/\s+/g, '_');
  soundMap.setKey(key, { onTrigger, data });
}

let gainCurveFunc = (val) => val;

export function applyGainCurve(val) {
  return gainCurveFunc(val);
}

export function setGainCurve(newGainCurveFunc) {
  gainCurveFunc = newGainCurveFunc;
}

function aliasBankMap(aliasMap) {
  // Make all bank keys lower case for case insensitivity
  for (const key in aliasMap) {
    aliasMap[key.toLowerCase()] = aliasMap[key];
  }

  // Look through every sound...
  const soundDictionary = soundMap.get();
  for (const key in soundDictionary) {
    // Check if the sound is part of a bank...
    const [bank, suffix] = key.split('_');
    if (!suffix) continue;

    // Check if the bank is aliased...
    const aliasValue = aliasMap[bank];
    if (aliasValue) {
      if (typeof aliasValue === 'string') {
        // Alias a single alias
        soundDictionary[`${aliasValue}_${suffix}`.toLowerCase()] = soundDictionary[key];
      } else if (Array.isArray(aliasValue)) {
        // Alias multiple aliases
        for (const alias of aliasValue) {
          soundDictionary[`${alias}_${suffix}`.toLowerCase()] = soundDictionary[key];
        }
      }
    }
  }

  // Update the sound map!
  // We need to destructure here to trigger the update
  soundMap.set({ ...soundDictionary });
}

async function aliasBankPath(path) {
  const response = await fetch(path);
  const aliasMap = await response.json();
  aliasBankMap(aliasMap);
}

/**
 * Register an alias for a bank of sounds.
 * Optionally accepts a single argument map of bank aliases.
 * Optionally accepts a single argument string of a path to a JSON file containing bank aliases.
 * @param {string} bank - The bank to alias
 * @param {string} alias - The alias to use for the bank
 */
export async function aliasBank(...args) {
  switch (args.length) {
    case 1:
      if (typeof args[0] === 'string') {
        return aliasBankPath(args[0]);
      } else {
        return aliasBankMap(args[0]);
      }
    case 2:
      return aliasBankMap({ [args[0]]: args[1] });
    default:
      throw new Error('aliasMap expects 1 or 2 arguments, received ' + args.length);
  }
}

export function getSound(s) {
  if (typeof s !== 'string') {
    console.warn(`getSound: expected string got "${s}". fall back to triangle`);
    return soundMap.get().triangle; // is this good?
  }
  return soundMap.get()[s.toLowerCase()];
}

export const getAudioDevices = async () => {
  await navigator.mediaDevices.getUserMedia({ audio: true });
  let mediaDevices = await navigator.mediaDevices.enumerateDevices();
  mediaDevices = mediaDevices.filter((device) => device.kind === 'audiooutput' && device.deviceId !== 'default');
  const devicesMap = new Map();
  devicesMap.set(DEFAULT_AUDIO_DEVICE_NAME, '');
  mediaDevices.forEach((device) => {
    devicesMap.set(device.label, device.deviceId);
  });
  return devicesMap;
};

const defaultDefaultValues = {
  s: 'triangle',
  gain: 0.8,
  postgain: 1,
  density: '.03',
  ftype: '12db',
  fanchor: 0,
  resonance: 1,
  hresonance: 1,
  bandq: 1,
  channels: [1, 2],
  phaserdepth: 0.75,
  shapevol: 1,
  distortvol: 1,
  delay: 0,
  byteBeatExpression: '0',
  delayfeedback: 0.5,
  delaysync: 3 / 16,
  orbit: 1,
  i: 1,
  velocity: 1,
  fft: 8,
};

let defaultControls = new Map(Object.entries(defaultDefaultValues));

export function setDefaultValue(key, value) {
  defaultControls.set(key, value);
}
export function getDefaultValue(key) {
  return defaultControls.get(key);
}
export function setDefaultValues(defaultsobj) {
  Object.keys(defaultsobj).forEach((key) => {
    setDefaultValue(key, defaultsobj[key]);
  });
}
export function resetDefaultValues() {
  defaultControls = new Map(Object.entries(defaultDefaultValues));
}
export function setVersionDefaults(version) {
  resetDefaultValues();
  if (version === '1.0') {
    setDefaultValue('fanchor', 0.5);
  }
}

export const resetLoadedSounds = () => soundMap.set({});

let audioContext;

export const setDefaultAudioContext = () => {
  audioContext = new AudioContext();
  return audioContext;
};

export const getAudioContext = () => {
  if (!audioContext) {
    return setDefaultAudioContext();
  }

  return audioContext;
};

export function getAudioContextCurrentTime() {
  return getAudioContext().currentTime;
}

let workletsLoading;
function loadWorklets() {
  if (!workletsLoading) {
    const audioCtx = getAudioContext();
    workletsLoading = audioCtx.audioWorklet.addModule(workletsUrl);
  }

  return workletsLoading;
}

// this function should be called on first user interaction (to avoid console warning)
export async function initAudio(options = {}) {
  const {
    disableWorklets = false,
    maxPolyphony,
    audioDeviceName = DEFAULT_AUDIO_DEVICE_NAME,
    multiChannelOrbits = false,
  } = options;

  setMaxPolyphony(maxPolyphony);
  setMultiChannelOrbits(multiChannelOrbits);
  if (typeof window === 'undefined') {
    return;
  }

  const audioCtx = getAudioContext();

  if (audioDeviceName != null && audioDeviceName != DEFAULT_AUDIO_DEVICE_NAME) {
    try {
      const devices = await getAudioDevices();
      const id = devices.get(audioDeviceName);
      const isValidID = (id ?? '').length > 0;
      if (audioCtx.sinkId !== id && isValidID) {
        await audioCtx.setSinkId(id);
      }
      logger(
        `[superdough] Audio Device set to ${audioDeviceName}, it might take a few seconds before audio plays on all output channels`,
      );
    } catch {
      logger('[superdough] failed to set audio interface', 'warning');
    }
  }

  await audioCtx.resume();
  if (disableWorklets) {
    logger('[superdough]: AudioWorklets disabled with disableWorklets');
    return;
  }
  try {
    await loadWorklets();
    logger('[superdough] AudioWorklets loaded');
  } catch (err) {
    console.warn('could not load AudioWorklet effects', err);
  }
  logger('[superdough] ready');
}
let audioReady;
export async function initAudioOnFirstClick(options) {
  if (!audioReady) {
    audioReady = new Promise((resolve) => {
      document.addEventListener('click', async function listener() {
        document.removeEventListener('click', listener);
        await initAudio(options);
        resolve();
      });
    });
  }
  return audioReady;
}

let delays = {};
const maxfeedback = 0.98;

let channelMerger, destinationGain, recorderNode;
//update the output channel configuration to match user's audio device
export function initializeAudioOutput() {
  const audioContext = getAudioContext();
  const maxChannelCount = audioContext.destination.maxChannelCount;
  audioContext.destination.channelCount = maxChannelCount;
  channelMerger = new ChannelMergerNode(audioContext, { numberOfInputs: audioContext.destination.channelCount });
  destinationGain = new GainNode(audioContext);
  channelMerger.connect(destinationGain);
  destinationGain.connect(audioContext.destination);
}

/** Called by startRecording(), ensures the recording node is properly initialized when play is pressed. */
function insertRecorderNode(audioContext) {
  // Ensure output chain is initialized
  if (!channelMerger || !destinationGain) {
    initializeAudioOutput();
  }

  recorderNode?.disconnect();
  recorderNode = null;

  recorderNode = new AudioWorkletNode(audioContext, 'recorder-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: audioContext.destination.channelCount,
  });
  recorderNode.port.onmessage = (e) => {
    recorderNodeOnMessage(e);
  };

  // Insert recorderNode between channelMerger and destinationGain
  channelMerger.disconnect();
  destinationGain.disconnect();
  channelMerger.connect(recorderNode);
  recorderNode.connect(destinationGain);
  destinationGain.connect(audioContext.destination);
}

export const connectToDestination = (input, channels = [0, 1]) => {
  const ctx = getAudioContext();
  if (channelMerger == null) {
    initializeAudioOutput();
  }
  //This upmix can be removed if correct channel counts are set throughout the app,
  // and then strudel could theoretically support surround sound audio files
  const stereoMix = new StereoPannerNode(ctx);
  input.connect(stereoMix);

  const splitter = new ChannelSplitterNode(ctx, {
    numberOfOutputs: stereoMix.channelCount,
  });
  stereoMix.connect(splitter);
  channels.forEach((ch, i) => {
    splitter.connect(channelMerger, i % stereoMix.channelCount, ch % ctx.destination.channelCount);
  });
};

export const panic = () => {
  if (destinationGain == null) {
    return;
  }
  destinationGain.gain.linearRampToValueAtTime(0, getAudioContext().currentTime + 0.01);
  destinationGain = null;
  channelMerger == null;
};

function getDelay(orbit, delaytime, delayfeedback, t, channels) {
  if (delayfeedback > maxfeedback) {
    //logger(`delayfeedback was clamped to ${maxfeedback} to save your ears`);
  }
  delayfeedback = clamp(delayfeedback, 0, 0.98);
  if (!delays[orbit]) {
    const ac = getAudioContext();
    const dly = ac.createFeedbackDelay(1, delaytime, delayfeedback);
    dly.start?.(t); // for some reason, this throws when audion extension is installed..
    connectToDestination(dly, channels);
    delays[orbit] = dly;
  }
  delays[orbit].delayTime.value !== delaytime && delays[orbit].delayTime.setValueAtTime(delaytime, t);
  delays[orbit].feedback.value !== delayfeedback && delays[orbit].feedback.setValueAtTime(delayfeedback, t);
  return delays[orbit];
}

export function getLfo(audioContext, time, end, properties = {}) {
  return getWorklet(audioContext, 'lfo-processor', {
    frequency: 1,
    depth: 1,
    skew: 0,
    phaseoffset: 0,
    time,
    end,
    shape: 1,
    dcoffset: -0.5,
    ...properties,
  });
}

function getPhaser(time, end, frequency = 1, depth = 0.5, centerFrequency = 1000, sweep = 2000) {
  const ac = getAudioContext();
  const lfoGain = getLfo(ac, time, end, { frequency, depth: sweep * 2 });

  //filters
  const numStages = 2; //num of filters in series
  let fOffset = 0;
  const filterChain = [];
  for (let i = 0; i < numStages; i++) {
    const filter = ac.createBiquadFilter();
    filter.type = 'notch';
    filter.gain.value = 1;
    filter.frequency.value = centerFrequency + fOffset;
    filter.Q.value = 2 - Math.min(Math.max(depth * 2, 0), 1.9);

    lfoGain.connect(filter.detune);
    fOffset += 282;
    if (i > 0) {
      filterChain[i - 1].connect(filter);
    }
    filterChain.push(filter);
  }
  return filterChain[filterChain.length - 1];
}

function getFilterType(ftype) {
  ftype = ftype ?? 0;
  const filterTypes = ['12db', 'ladder', '24db'];
  return typeof ftype === 'number' ? filterTypes[Math.floor(_mod(ftype, filterTypes.length))] : ftype;
}

let reverbs = {};
let hasChanged = (now, before) => now !== undefined && now !== before;
function getReverb(orbit, duration, fade, lp, dim, ir, channels) {
  // If no reverb has been created for a given orbit, create one
  if (!reverbs[orbit]) {
    const ac = getAudioContext();
    const reverb = ac.createReverb(duration, fade, lp, dim, ir);
    connectToDestination(reverb, channels);
    reverbs[orbit] = reverb;
  }
  if (
    hasChanged(duration, reverbs[orbit].duration) ||
    hasChanged(fade, reverbs[orbit].fade) ||
    hasChanged(lp, reverbs[orbit].lp) ||
    hasChanged(dim, reverbs[orbit].dim) ||
    reverbs[orbit].ir !== ir
  ) {
    // only regenerate when something has changed
    // avoids endless regeneration on things like
    // stack(s("a"), s("b").rsize(8)).room(.5)
    // this only works when args may stay undefined until here
    // setting default values breaks this
    reverbs[orbit].generate(duration, fade, lp, dim, ir);
  }
  return reverbs[orbit];
}

export let analysers = {},
  analysersData = {};

export function getAnalyserById(id, fftSize = 1024, smoothingTimeConstant = 0.5) {
  if (!analysers[id]) {
    // make sure this doesn't happen too often as it piles up garbage
    const analyserNode = getAudioContext().createAnalyser();
    analyserNode.fftSize = fftSize;
    analyserNode.smoothingTimeConstant = smoothingTimeConstant;
    // getDestination().connect(analyserNode);
    analysers[id] = analyserNode;
    analysersData[id] = new Float32Array(analysers[id].frequencyBinCount);
  }
  if (analysers[id].fftSize !== fftSize) {
    analysers[id].fftSize = fftSize;
    analysersData[id] = new Float32Array(analysers[id].frequencyBinCount);
  }
  return analysers[id];
}

export function getAnalyzerData(type = 'time', id = 1) {
  const getter = {
    time: () => analysers[id]?.getFloatTimeDomainData(analysersData[id]),
    frequency: () => analysers[id]?.getFloatFrequencyData(analysersData[id]),
  }[type];
  if (!getter) {
    throw new Error(`getAnalyzerData: ${type} not supported. use one of ${Object.keys(getter).join(', ')}`);
  }
  getter();
  return analysersData[id];
}

function effectSend(input, effect, wet) {
  const send = gainNode(wet);
  input.connect(send);
  send.connect(effect);
  return send;
}

export function resetGlobalEffects() {
  delays = {};
  reverbs = {};
  analysers = {};
  analysersData = {};
}

let activeSoundSources = new Map();
//music programs/audio gear usually increments inputs/outputs from 1, we need to subtract 1 from the input because the webaudio API channels start at 0

function mapChannelNumbers(channels) {
  return (Array.isArray(channels) ? channels : [channels]).map((ch) => ch - 1);
}

export const superdough = async (value, t, hapDuration, cps = 0.5) => {
  const ac = getAudioContext();
  t = typeof t === 'string' && t.startsWith('=') ? Number(t.slice(1)) : ac.currentTime + t;
  let { stretch } = value;
  if (stretch != null) {
    //account for phase vocoder latency
    const latency = 0.04;
    t = t - latency;
  }
  if (typeof value !== 'object') {
    throw new Error(
      `expected hap.value to be an object, but got "${value}". Hint: append .note() or .s() to the end`,
      'error',
    );
  }

  // duration is passed as value too..
  value.duration = hapDuration;
  // calculate absolute time

  if (t < ac.currentTime) {
    console.warn(
      `[superdough]: cannot schedule sounds in the past (target: ${t.toFixed(2)}, now: ${ac.currentTime.toFixed(2)})`,
    );
    return;
  }
  // destructure
  let {
    s = getDefaultValue('s'),
    bank,
    source,
    gain = getDefaultValue('gain'),
    postgain = getDefaultValue('postgain'),
    density = getDefaultValue('density'),
    // filters
    fanchor = getDefaultValue('fanchor'),
    drive = 0.69,
    // low pass
    cutoff,
    lpenv,
    lpattack,
    lpdecay,
    lpsustain,
    lprelease,
    resonance = getDefaultValue('resonance'),
    // high pass
    hpenv,
    hcutoff,
    hpattack,
    hpdecay,
    hpsustain,
    hprelease,
    hresonance = getDefaultValue('hresonance'),
    // band pass
    bpenv,
    bandf,
    bpattack,
    bpdecay,
    bpsustain,
    bprelease,
    bandq = getDefaultValue('bandq'),

    //phaser
    phaserrate: phaser,
    phaserdepth = getDefaultValue('phaserdepth'),
    phasersweep,
    phasercenter,
    //
    coarse,
    crush,
    shape,
    shapevol = getDefaultValue('shapevol'),
    distort,
    distortvol = getDefaultValue('distortvol'),
    pan,
    vowel,
    delay = getDefaultValue('delay'),
    delayfeedback = getDefaultValue('delayfeedback'),
    delaysync = getDefaultValue('delaysync'),
    delaytime,
    orbit = getDefaultValue('orbit'),
    room,
    roomfade,
    roomlp,
    roomdim,
    roomsize,
    ir,
    i = getDefaultValue('i'),
    velocity = getDefaultValue('velocity'),
    analyze, // analyser wet
    fft = getDefaultValue('fft'), // fftSize 0 - 10
    compressor: compressorThreshold,
    compressorRatio,
    compressorKnee,
    compressorAttack,
    compressorRelease,
  } = value;

  delaytime = delaytime ?? cycleToSeconds(delaysync, cps);

  const orbitChannels = mapChannelNumbers(
    multiChannelOrbits && orbit > 0 ? [orbit * 2 - 1, orbit * 2] : getDefaultValue('channels'),
  );
  const channels = value.channels != null ? mapChannelNumbers(value.channels) : orbitChannels;

  gain = applyGainCurve(nanFallback(gain, 1));
  postgain = applyGainCurve(postgain);
  shapevol = applyGainCurve(shapevol);
  distortvol = applyGainCurve(distortvol);
  delay = applyGainCurve(delay);
  velocity = applyGainCurve(velocity);
  gain *= velocity; // velocity currently only multiplies with gain. it might do other things in the future

  const chainID = Math.round(Math.random() * 1000000);

  // oldest audio nodes will be destroyed if maximum polyphony is exceeded
  for (let i = 0; i <= activeSoundSources.size - maxPolyphony; i++) {
    const ch = activeSoundSources.entries().next();
    const source = ch.value[1];
    const chainID = ch.value[0];
    const endTime = t + 0.25;
    source?.node?.gain?.linearRampToValueAtTime(0, endTime);
    source?.stop?.(endTime);
    activeSoundSources.delete(chainID);
  }

  let audioNodes = [];

  if (['-', '~', '_'].includes(s)) {
    return;
  }
  if (bank && s) {
    s = `${bank}_${s}`;
    value.s = s;
  }

  // get source AudioNode
  let sourceNode;
  if (source) {
    sourceNode = source(t, value, hapDuration, cps);
  } else if (getSound(s)) {
    const { onTrigger } = getSound(s);
    const onEnded = () => {
      audioNodes.forEach((n) => n?.disconnect());
      activeSoundSources.delete(chainID);
    };
    const soundHandle = await onTrigger(t, value, onEnded);

    if (soundHandle) {
      sourceNode = soundHandle.node;
      activeSoundSources.set(chainID, soundHandle);
    }
  } else {
    throw new Error(`sound ${s} not found! Is it loaded?`);
  }
  if (!sourceNode) {
    // if onTrigger does not return anything, we will just silently skip
    // this can be used for things like speed(0) in the sampler
    return;
  }

  if (ac.currentTime > t) {
    logger('[webaudio] skip hap: still loading', ac.currentTime - t);
    return;
  }
  const chain = []; // audio nodes that will be connected to each other sequentially
  chain.push(sourceNode);
  stretch !== undefined && chain.push(getWorklet(ac, 'phase-vocoder-processor', { pitchFactor: stretch }));

  // gain stage
  chain.push(gainNode(gain));

  //filter
  const ftype = getFilterType(value.ftype);
  if (cutoff !== undefined) {
    let lp = () =>
      createFilter(
        ac,
        'lowpass',
        cutoff,
        resonance,
        lpattack,
        lpdecay,
        lpsustain,
        lprelease,
        lpenv,
        t,
        t + hapDuration,
        fanchor,
        ftype,
        drive,
      );
    chain.push(lp());
    if (ftype === '24db') {
      chain.push(lp());
    }
  }

  if (hcutoff !== undefined) {
    let hp = () =>
      createFilter(
        ac,
        'highpass',
        hcutoff,
        hresonance,
        hpattack,
        hpdecay,
        hpsustain,
        hprelease,
        hpenv,
        t,
        t + hapDuration,
        fanchor,
      );
    chain.push(hp());
    if (ftype === '24db') {
      chain.push(hp());
    }
  }

  if (bandf !== undefined) {
    let bp = () =>
      createFilter(
        ac,
        'bandpass',
        bandf,
        bandq,
        bpattack,
        bpdecay,
        bpsustain,
        bprelease,
        bpenv,
        t,
        t + hapDuration,
        fanchor,
      );
    chain.push(bp());
    if (ftype === '24db') {
      chain.push(bp());
    }
  }

  if (vowel !== undefined) {
    const vowelFilter = ac.createVowelFilter(vowel);
    chain.push(vowelFilter);
  }

  // effects
  coarse !== undefined && chain.push(getWorklet(ac, 'coarse-processor', { coarse }));
  crush !== undefined && chain.push(getWorklet(ac, 'crush-processor', { crush }));
  shape !== undefined && chain.push(getWorklet(ac, 'shape-processor', { shape, postgain: shapevol }));
  distort !== undefined && chain.push(getWorklet(ac, 'distort-processor', { distort, postgain: distortvol }));

  compressorThreshold !== undefined &&
    chain.push(
      getCompressor(ac, compressorThreshold, compressorRatio, compressorKnee, compressorAttack, compressorRelease),
    );

  // panning
  if (pan !== undefined) {
    const panner = ac.createStereoPanner();
    panner.pan.value = 2 * pan - 1;
    chain.push(panner);
  }
  // phaser
  if (phaser !== undefined && phaserdepth > 0) {
    const phaserFX = getPhaser(t, t + hapDuration, phaser, phaserdepth, phasercenter, phasersweep);
    chain.push(phaserFX);
  }

  // last gain
  const post = new GainNode(ac, { gain: postgain });
  chain.push(post);
  connectToDestination(post, channels);

  // delay
  let delaySend;
  if (delay > 0 && delaytime > 0 && delayfeedback > 0) {
    const delayNode = getDelay(orbit, delaytime, delayfeedback, t, orbitChannels);
    delaySend = effectSend(post, delayNode, delay);
    audioNodes.push(delaySend);
  }
  // reverb
  let reverbSend;
  if (room > 0) {
    let roomIR;
    if (ir !== undefined) {
      let url;
      let sample = getSound(ir);
      if (Array.isArray(sample)) {
        url = sample.data.samples[i % sample.data.samples.length];
      } else if (typeof sample === 'object') {
        url = Object.values(sample.data.samples).flat()[i % Object.values(sample.data.samples).length];
      }
      roomIR = await loadBuffer(url, ac, ir, 0);
    }
    const reverbNode = getReverb(orbit, roomsize, roomfade, roomlp, roomdim, roomIR, orbitChannels);
    reverbSend = effectSend(post, reverbNode, room);
    audioNodes.push(reverbSend);
  }

  // analyser
  let analyserSend;
  if (analyze) {
    const analyserNode = getAnalyserById(analyze, 2 ** (fft + 5));
    analyserSend = effectSend(post, analyserNode, 1);
    audioNodes.push(analyserSend);
  }

  // connect chain elements together
  chain.slice(1).reduce((last, current) => last.connect(current), chain[0]);
  audioNodes = audioNodes.concat(chain);
};

export const superdoughTrigger = (t, hap, ct, cps) => {
  superdough(hap, t - ct, hap.duration / cps, cps);
};

/** Called when Play is pressed, initializes and configures recording node if recording is enabled. */
export async function startRecording(recordingEnabled = true) {
  if (!recordingEnabled) {
    return null;
  }
  const audioContext = getAudioContext();
  if (!audioContext) {
    console.error(
      "[superdough] Start Recording Failed: 'audioContext' is not initialized, unable to create 'recorderNode'",
    );
    return null;
  }
  insertRecorderNode(audioContext);
  if (!recorderNode) {
    console.error("[superdough] Start Recording Failed: 'recorderNode' failed to initialize");
    return null;
  }
  console.info('[superdough] Starting Recording');
  recorderNode.port.postMessage({ name: 'start' });
}

/** Called when Stop is pressed, triggers recording export and passes filename if recording is enabled. */
export function stopRecording(recordingEnabled = false, fileName = 'strudel-recording') {
  if (!recordingEnabled) {
    return null;
  }
  if (!recorderNode) {
    console.warn("[superdough] Stop Recording Failed: 'recorderNode' is not initialized");
    return null;
  }
  console.info('[superdough] Stopping Recording');
  recorderNode.port.postMessage({ name: 'stop', fileName: fileName });
}

/** Handles audio processing and export. Triggered when Stop is pressed (if recording is enabled). */
function recorderNodeOnMessage(e) {
  if (!e || !e.data || !e.data.buffers) {
    return null;
  }

  const debugOutputs = false;

  // Immediately process and export recording
  let recordingBuffers = e.data.buffers;
  if (!recordingBuffers || recordingBuffers.length === 0) {
    console.error('[superdough] Recording Export Failure: No buffers received');
    return null;
  }
  if (recordingBuffers.length != 2) {
    console.error('[superdough] Recording Export Failure: Not enough channels to interleave');
    return null;
  }
  if (debugOutputs) {
    console.log('[superdough] Raw Recording Buffers: ', recordingBuffers);
  }

  const channelCount = recordingBuffers.length;
  // The number of channels is the length of the recordingBuffers array.
  // Due to the nature of the current implementation, this should always be 2.
  const sampleRate = getAudioContext().sampleRate;
  // The sample rate is the number of samples per second,
  // which is typically 44100 or 48000 for audio worklets.
  // In this case, 48000 has been observed.
  const bitDepth = 32;
  // WAV format supports 16, 24, and 32 bit depths,
  // So far 32 is the only tested and working value
  const wavFormat = 3; // 1 = PCM, 3 = IEEE Float

  // recordingBuffers Format:
  // [[[128],[128],...],[[128],[128],...]]
  //
  //               Outer Array containing L & R Channel Arrays
  // [                                                                       ]
  //   [[128xFloat32],[128xFloat32],...],  [[128xFloat32],[128xFloat32],...]
  //
  //      L-Channel Values 2D Array           R-Channel Values 2D Array
  //
  // Inside the main array, there are two sub-arrays:
  // The first is for the left channel, the second is for the right channel.
  // Inside each channel array, every element is an array of 128 Float32 values.
  //
  // In order for this data to work properly with encodeWAV,
  // we need to interleave the two channels into a single Float32Array.
  //
  // This is done by taking the first value from the left channel,
  // then the first value from the right channel, and so on.

  let interleaved = new Float32Array(recordingBuffers[0].length * 128 + recordingBuffers[1].length * 128);

  let index = 0,
    inputIndex = 0,
    totalLength = interleaved.length;
  while (index < totalLength) {
    interleaved[index++] = recordingBuffers[0][Math.floor(inputIndex / 128)][inputIndex % 128];
    interleaved[index++] = recordingBuffers[1][Math.floor(inputIndex / 128)][inputIndex % 128];
    inputIndex++;
  }
  if (debugOutputs) {
    console.log('[superdough] Interleaved recording buffers:', interleaved);
  }

  // Encode as WAV
  const encodedWAV = encodeWAV(interleaved, wavFormat, sampleRate, channelCount, bitDepth);
  if (debugOutputs) {
    console.log('[superdough] Encoded WAV Buffer:', encodedWAV);
  }
  if (!encodedWAV) {
    console.error('[superdough] Recording Failure: WAV encoding failed');
    return null;
  } else {
    console.log('[superdough] Recording Success: WAV encoded successfully');
  }

  // get and santize the download name to use only valid filename characters
  let downloadName = e.data.fileName || 'strudel-recording';
  downloadName = downloadName
    .replace('\\', '-') // Replace backslashes with dashes
    .replace('/', '-') // Replace forward slashes with dashes
    .replace(/[^a-zA-Z0-9-_ ]/g, '') // Remove other invalid characters
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .toLowerCase(); // Convert to lowercase
  if (debugOutputs) {
    console.log('[superdough] Download Name:', downloadName);
  }

  try {
    // Create blob from WAV file for download
    const blob = new Blob([encodedWAV], { type: 'audio/wav' });
    if (!blob) {
      console.error('[superdough] Recording Failure: Could not create Blob');
      return null;
    } else {
      console.log('[superdough] Recording Success: Blob created successfully');
    }

    // Create a download link and trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // remove leading dash if they want an empty download name
    if (downloadName == '') {
      downloadName = `${new Date().toISOString()}.wav`;
    } else {
      downloadName = downloadName + `-${new Date().toISOString()}.wav`;
    }
    a.download = `${downloadName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[superdough] Recording Failure: Error creating blob download', error);
    return null;
  }

  console.log('[superdough] Recording Export Triggered Successfully: ', downloadName);
}

/** WAV encoding stuff, borrowed from https://github.com/Experience-Monks/audiobuffer-to-wav under the MIT license */
function encodeWAV(samples, format, sampleRate, numChannels, bitDepth) {
  var bytesPerSample = bitDepth / 8;
  var blockAlign = numChannels * bytesPerSample;

  var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  var view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * bytesPerSample, true);
  if (format === 1) {
    // Raw PCM
    floatTo16BitPCM(view, 44, samples);
  } else {
    writeFloat32(view, 44, samples);
  }

  return buffer;
}

/** WAV encoding stuff, borrowed from https://github.com/Experience-Monks/audiobuffer-to-wav under the MIT license */
function writeFloat32(output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 4) {
    output.setFloat32(offset, input[i], true);
  }
}

/** WAV encoding stuff, borrowed from https://github.com/Experience-Monks/audiobuffer-to-wav under the MIT license */
function floatTo16BitPCM(output, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 2) {
    var s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

/** WAV encoding stuff, borrowed from https://github.com/Experience-Monks/audiobuffer-to-wav under the MIT license */
function writeString(view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
