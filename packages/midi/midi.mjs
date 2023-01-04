/*
midi.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/midi/midi.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as _WebMidi from 'webmidi';
import { Pattern, isPattern, isNote, getPlayableNoteValue, logger } from '@strudel.cycles/core';
import { getAudioContext } from '@strudel.cycles/webaudio';

// if you use WebMidi from outside of this package, make sure to import that instance:
export const { WebMidi } = _WebMidi;

function supportsMidi() {
  return typeof navigator.requestMIDIAccess === 'function';
}

export function enableWebMidi(options = {}) {
  const { onReady, onConnected, onDisconnected } = options;

  if (!supportsMidi()) {
    throw new Error('Your Browser does not support WebMIDI.');
  }
  return new Promise((resolve, reject) => {
    if (WebMidi.enabled) {
      // if already enabled, just resolve WebMidi
      resolve(WebMidi);
      return;
    }
    WebMidi.enable((err) => {
      if (err) {
        reject(err);
      }
      WebMidi.addListener('connected', (e) => {
        onConnected?.(WebMidi);
      });
      // Reacting when a device becomes unavailable
      WebMidi.addListener('disconnected', (e) => {
        onDisconnected?.(WebMidi, e);
      });
      onReady?.(WebMidi);
      resolve(WebMidi);
    });
  });
}
// const outputByName = (name: string) => WebMidi.getOutputByName(name);
const outputByName = (name) => WebMidi.getOutputByName(name);

let midiReady;

// output?: string | number, outputs: typeof WebMidi.outputs
function getDevice(output, outputs) {
  if (!outputs.length) {
    throw new Error(`🔌 No MIDI devices found. Connect a device or enable IAC Driver.`);
  }
  if (typeof output === 'number') {
    return outputs[output];
  }
  if (typeof output === 'string') {
    return outputByName(output);
  }
  return outputs[0];
}

// Pattern.prototype.midi = function (output: string | number, channel = 1) {
Pattern.prototype.midi = function (output, channel = 1) {
  if (!supportsMidi()) {
    throw new Error(`🎹 WebMidi is not enabled. Supported Browsers: https://caniuse.com/?search=webmidi`);
  }
  /* await */ enableWebMidi({
    onConnected: ({ outputs }) =>
      logger(`Midi device connected! Available: ${outputs.map((o) => `'${o.name}'`).join(', ')}`),
    onDisconnected: ({ outputs }) =>
      logger(`Midi device disconnected! Available: ${outputs.map((o) => `'${o.name}'`).join(', ')}`),
    onReady: ({ outputs }) => {
      const device = getDevice(output, outputs);
      const otherOutputs = outputs
        .filter((o) => o.name !== device.name)
        .map((o) => `'${o.name}'`)
        .join(' | ');
      midiReady = true;
      logger(`Midi connected! Using "${device.name}". ${otherOutputs ? `Also available: ${otherOutputs}` : ''}`);
    },
  });
  if (isPattern(output)) {
    throw new Error(
      `.midi does not accept Pattern input. Make sure to pass device name with single quotes. Example: .midi('${
        WebMidi.outputs?.[0]?.name || 'IAC Driver Bus 1'
      }')`,
    );
  }
  return this.onTrigger((time, hap) => {
    let note = getPlayableNoteValue(hap);
    const velocity = hap.context?.velocity ?? 0.9;
    if (!isNote(note)) {
      throw new Error('not a note: ' + note);
    }
    if (!midiReady) {
      return;
    }
    const device = getDevice(output, WebMidi.outputs);
    if (!device) {
      throw new Error(
        `🔌 MIDI device '${output ? output : ''}' not found. Use one of ${WebMidi.outputs
          .map((o) => `'${o.name}'`)
          .join(' | ')}`,
      );
    }
    // console.log('midi', value, output);
    const timingOffset = WebMidi.time - getAudioContext().currentTime * 1000;
    time = time * 1000 + timingOffset;
    // const inMs = '+' + (time - Tone.getContext().currentTime) * 1000;
    // await enableWebMidi()
    device.playNote(note, channel, {
      time,
      duration: hap.duration.valueOf() * 1000 - 5,
      attack: velocity,
    });
  });
};
