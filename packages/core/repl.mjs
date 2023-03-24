import { Cyclist } from './cyclist.mjs';
import { evaluate as _evaluate } from './evaluate.mjs';
import { logger } from './logger.mjs';
import { setTime } from './time.mjs';
import { evalScope } from './evaluate.mjs';

export function repl({
  interval,
  defaultOutput,
  onSchedulerError,
  onEvalError,
  beforeEval,
  afterEval,
  getTime,
  transpiler,
  onToggle,
  editPattern,
}) {
  const scheduler = new Cyclist({
    interval,
    onTrigger: async (hap, deadline, duration, cps) => {
      try {
        if (!hap.context.onTrigger || !hap.context.dominantTrigger) {
          await defaultOutput(hap, deadline, duration, cps);
        }
        if (hap.context.onTrigger) {
          // call signature of output / onTrigger is different...
          await hap.context.onTrigger(getTime() + deadline, hap, getTime(), cps);
        }
      } catch (err) {
        logger(`[cyclist] error: ${err.message}`, 'error');
      }
    },
    onError: onSchedulerError,
    getTime,
    onToggle,
  });
  setTime(() => scheduler.now()); // TODO: refactor?
  const evaluate = async (code, autostart = true) => {
    if (!code) {
      throw new Error('no code to evaluate');
    }
    try {
      await beforeEval?.({ code });
      let { pattern } = await _evaluate(code, transpiler);

      logger(`[eval] code updated`);
      pattern = editPattern?.(pattern) || pattern;
      scheduler.setPattern(pattern, autostart);
      afterEval?.({ code, pattern });
      return pattern;
    } catch (err) {
      // console.warn(`[repl] eval error: ${err.message}`);
      logger(`[eval] error: ${err.message}`, 'error');
      onEvalError?.(err);
    }
  };
  const stop = () => scheduler.stop();
  const start = () => scheduler.start();
  const pause = () => scheduler.pause();
  const setCps = (cps) => scheduler.setCps(cps);
  evalScope({
    setCps,
    setcps: setCps,
  });
  return { scheduler, evaluate, start, stop, pause, setCps };
}
