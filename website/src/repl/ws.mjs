import { register, signal } from '@strudel/core';
import { clamp } from '../../../packages/superdough/util.mjs';

let sigs = [0, 0, 0, 0, 0, 0, 0, 0];

export let sig = register('sig', (pat) =>
  pat
    .fmap((n) => {
      return signal(() => clamp(sigs[n], 0.0001, 1));
    })
    .outerJoin(),
);

let socket;
export function initSocket(ip) {
  // e.g. 192.168.1.12:4422
  socket = socket || new WebSocket(`ws://${ip}`);
  socket.addEventListener('open', () => console.log('connection opened'));
  socket.addEventListener('error', () => console.log('connection error'));
  socket.addEventListener('message', (event) => {
      if (Math.random() < 0.01) {
        console.log(event.data.toString());
      }
    sigs = JSON.parse(event.data.toString());
  });
}
