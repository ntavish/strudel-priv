/*
voicings.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tonal/voicings.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { stack, register } from '@strudel.cycles/core';
import _voicings from 'chord-voicings';
const { dictionaryVoicing, minTopNoteDiff } = _voicings.default || _voicings; // parcel module resolution fuckup

const lefthand = {
  m7: ['3m 5P 7m 9M', '7m 9M 10m 12P'],
  7: ['3M 6M 7m 9M', '7m 9M 10M 13M'],
  '^7': ['3M 5P 7M 9M', '7M 9M 10M 12P'],
  69: ['3M 5P 6A 9M'],
  m7b5: ['3m 5d 7m 8P', '7m 8P 10m 12d'],
  '7b9': ['3M 6m 7m 9m', '7m 9m 10M 13m'],
  '7b13': ['3M 6m 7m 9m', '7m 9m 10M 13m'],
  o7: ['1P 3m 5d 6M', '5d 6M 8P 10m'],
  '7#11': ['7m 9M 11A 13A'],
  '7#9': ['3M 7m 9A'],
  mM7: ['3m 5P 7M 9M', '7M 9M 10m 12P'],
  m6: ['3m 5P 6M 9M', '6M 9M 10m 12P'],
};

const guidetones = {
  m7: ['3m 7m', '7m 10m'],
  m9: ['3m 7m', '7m 10m'],
  7: ['3M 7m', '7m 10M'],
  '^7': ['3M 7M', '7M 10M'],
  '^9': ['3M 7M', '7M 10M'],
  69: ['3M 6M'],
  6: ['3M 6M', '6M 10M'],
  m7b5: ['3m 7m', '7m 10m'],
  '7b9': ['3M 7m', '7m 10M'],
  '7b13': ['3M 7m', '7m 10M'],
  o7: ['3m 6M', '6M 10m'],
  '7#11': ['3M 7m', '7m 10M'],
  '7#9': ['3M 7m', '7m 10M'],
  mM7: ['3m 7M', '7M 10m'],
  m6: ['3m 6M', '6M 10m'],
};

const triads = {
  '': ['1P 3M 5P', '3M 5P 8P', '5P 8P 10M'],
  M: ['1P 3M 5P', '3M 5P 8P', '5P 8P 10M'],
  m: ['1P 3m 5P', '3m 5P 8P', '5P 8P 10m'],
  o: ['1P 3m 5d', '3m 5d 8P', '5d 8P 10m'],
  aug: ['1P 3m 5A', '3m 5A 8P', '5A 8P 10m'],
};

export const voicingRegistry = {
  lefthand: { dictionary: lefthand, range: ['F3', 'A4'] },
  triads: { dictionary: triads },
  guidetones: { dictionary: guidetones },
};
export const setVoicingRange = (name, range) => addVoicings(name, voicingRegistry[name].dictionary, range);

/**
 * Adds a new custom voicing dictionary.
 *
 * @name addVoicings
 * @memberof Pattern
 * @param {string} name identifier for the voicing dictionary
 * @param {Object} dictionary maps chord symbol to possible voicings
 * @param {Array} range min, max note
 * @returns Pattern
 * @example
 * addVoicings('cookie', {
 *   7: ['3M 7m 9M 12P 15P', '7m 10M 13M 16M 19P'],
 *   '^7': ['3M 6M 9M 12P 14M', '7M 10M 13M 16M 19P'],
 *   m7: ['8P 11P 14m 17m 19P', '5P 8P 11P 14m 17m'],
 *   m7b5: ['3m 5d 8P 11P 14m', '5d 8P 11P 14m 17m'],
 *   o7: ['3m 6M 9M 11A 15P'],
 *   '7alt': ['3M 7m 10m 13m 15P'],
 *   '7#11': ['7m 10m 13m 15P 17m'],
 * }, ['C3', 'C6'])
 * "<C^7 A7 Dm7 G7>".voicings('cookie').note()
 */
export const addVoicings = (name, dictionary, range = ['F3', 'A4']) => {
  Object.assign(voicingRegistry, { [name]: { dictionary, range } });
};

const getVoicing = (chord, dictionaryName, lastVoicing) => {
  const { dictionary, range } = voicingRegistry[dictionaryName];
  return dictionaryVoicing({
    chord,
    dictionary,
    range,
    picker: minTopNoteDiff,
    lastVoicing,
  });
};

/**
 * Turns chord symbols into voicings, using the smoothest voice leading possible.
 * Uses [chord-voicings package](https://github.com/felixroos/chord-voicings#chord-voicings).
 *
 * @name voicings
 * @memberof Pattern
 * @param {string} dictionary which voicing dictionary to use.
 * @returns Pattern
 * @example
 * stack("<C^7 A7 Dm7 G7>".voicings('lefthand'), "<C3 A2 D3 G2>").note()
 */

let lastVoicing; // this now has to be global until another solution is found :-/
// it used to be local to the voicings function at evaluation time
// but since register will patternify by default, means that
// the function is called over and over again, resetting the lastVoicing variables
export const voicings = register('voicings', function (dictionary, pat) {
  return pat
    .fmap((value) => {
      lastVoicing = getVoicing(value, dictionary, lastVoicing);
      return stack(...lastVoicing);
    })
    .outerJoin();
});

/**
 * Maps the chords of the incoming pattern to root notes in the given octave.
 *
 * @name rootNotes
 * @memberof Pattern
 * @param {octave} octave octave to use
 * @returns Pattern
 * @example
 * "<C^7 A7 Dm7 G7>".rootNotes(2).note()
 */
export const rootNotes = register('rootNotes', function (octave, pat) {
  return pat.fmap((value) => {
    const root = value.match(/^([a-gA-G][b#]?).*$/)[1];
    return root + octave;
  });
});
