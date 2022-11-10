/*
evaluate.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/eval/test/evaluate.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { expect, describe, it } from 'vitest';

import { evaluate } from '../evaluate.mjs';
import { mini } from '@strudel.cycles/mini';
import * as strudel from '@strudel.cycles/core';
const { fastcat, evalScope } = strudel;

describe('evaluate', async () => {
  await evalScope({ mini }, strudel);
  const ev = async (code) => (await evaluate(code)).pattern.firstCycleValues;
  it('Should evaluate strudel functions', async () => {
    expect(await ev('pure("c3")')).toEqual(['c3']);
    expect(await ev('cat("c3")')).toEqual(['c3']);
    expect(await ev('fastcat("c3", "d3")')).toEqual(['c3', 'd3']);
    expect(await ev('slowcat("c3", "d3")')).toEqual(['c3']);
  });
  it('Scope should be extendable', async () => {
    await evalScope({ myFunction: (...x) => fastcat(...x) });
    expect(await ev('myFunction("c3", "d3")')).toEqual(['c3', 'd3']);
  });
  it('Should evaluate simple double quoted mini notation', async () => {
    expect(await ev('"c3"')).toEqual(['c3']);
    expect(await ev('"c3 d3"')).toEqual(['c3', 'd3']);
    expect(await ev('"<c3 d3>"')).toEqual(['c3']);
  });
});
