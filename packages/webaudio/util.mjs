import { getTheme } from '@strudel/draw';

/**
 * Resolves a config color value, handling Pattern objects and fallbacks.
 * @param {Object} configColor - The color from the config object.
 * @param {Array} haps - haps to check for color() setting.
 */
export function resolveConfigColor(configColor, haps) {
  if (configColor?._Pattern) {
    return configColor.queryArc(0, 0)?.[0]?.value;
  } else if (!configColor) {
    return haps[0]?.value?.color ?? getTheme().color;
  }
  return configColor;
}