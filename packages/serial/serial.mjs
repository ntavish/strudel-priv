/*
serial.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/serial/serial.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, isPattern } from '@strudel.cycles/core';

var serialWriter;
var choosing = false;

export async function getWriter(br = 38400) {
  if (choosing) {
    return;
  }
  choosing = true;
  if (serialWriter) {
    return serialWriter;
  }
  if ('serial' in navigator) {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: br });
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    const writer = textEncoder.writable.getWriter();
    serialWriter = function (message) {
      writer.write(message);
    };
  } else {
    throw 'Webserial is not available in this browser.';
  }
}

const latency = 0.1;

Pattern.prototype.serial = function (...args) {
  return this._withHap((hap) => {
    if (!serialWriter) {
      getWriter(...args);
    }
    const onTrigger = (time, hap, currentTime) => {
      var message = '';
      if (typeof hap.value === 'object') {
        if ('action' in hap.value) {
          message += hap.value['action'] + '(';
          var first = true;
          for (const [key, val] of Object.entries(hap.value)) {
            if (key === 'action') {
              continue;
            }
            if (first) {
              first = false;
            } else {
              message += ',';
            }
            message += `${key}:${val}`;
          }
          message += ')';
        } else {
          for (const [key, val] of Object.entries(hap.value)) {
            message += `${key}:${val};`;
          }
        }
      } else {
        message = hap.value;
      }
      const offset = (time - currentTime + latency) * 1000;
      window.setTimeout(serialWriter, offset, message);
    };
    return hap.setContext({ ...hap.context, onTrigger, dominantTrigger: true });
  });
};
