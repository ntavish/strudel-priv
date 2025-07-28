/**
 * Resolves a config color value, handling Pattern objects and fallbacks.
 * @param {*} configColor - The color from config, may be a Pattern or primitive value
 * @param {Array} haps - Array of haps to check for color fallback
 * @returns {*} The resolved color value
 */
export function resolveConfigColor(configColor, haps) {
  if (configColor?._Pattern) {
    return configColor.queryArc(0, 0)?.[0]?.value;
  } else if (!configColor) {
    return haps[0]?.value?.color ?? getTheme().color;
  }
  return configColor;
}