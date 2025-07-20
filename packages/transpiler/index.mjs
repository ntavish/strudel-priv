import { evaluate as _evaluate } from '@strudel/cyclist';
import { transpiler } from './transpiler.mjs';
export * from './transpiler.mjs';

export const evaluate = (code) => _evaluate(code, transpiler);
