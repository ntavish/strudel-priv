import { Pattern } from '@strudel/core/pattern.mjs';
import { colorMap } from '@strudel/draw/color.mjs';

/**
 * Registers an alias for a Pattern method and its standalone function.
 * @param {string|string[]|object} source - The existing method/function name(s), as a string, array of strings, or object (with string keys and string values).
 * @param {string|string[]|undefined} target - The new alias name(s) (undefined when source is an object).
 * @example
 * aliasFuncs('fast', 'schnell')
 * s("bd").schnell(2) // same as s("bd").fast(2)
 * @example
 * aliasFuncs('fast', ['schnell', 'rapide'])
 * $: s("bd").schnell(2) // same as s("bd").fast(2)
 * $: s("~ cp").rapide(2) // same as s("~ cp").fast(2)
 * @example
 * aliasFuncs(['fast', 'slow'], ['vite', 'lent'])
 * $: s("bd").vite(2) // same as s("bd").fast(2)
 * $: s("~ cp").lent(2) // same as s("~ cp").slow(2)
 * @example
 * aliasFuncs({ fast: 'schnell', slow: 'lent' })
 * $: s("bd").schnell(2) // same as s("bd").fast(2)
 * $: s("~ cp").lent(2) // same as s("~ cp").slow(2)
 */
export function aliasFuncs(source, target) {
  // Ignore empty string targets
  if (target === '') {
    return;
  }

  // If source is a dictionary/object and target is undefined, batch alias
  if (typeof source === 'object' && source !== null && !Array.isArray(source) && target === undefined) {
    for (const [k, v] of Object.entries(source)) {
      aliasFuncs(k, v);
    }
    return;
  }
  // Support batch aliasing
  if (Array.isArray(source) && Array.isArray(target)) {
    if (source.length !== target.length) {
      throw new Error('alias: source and target arrays must have the same length');
    }
    for (let i = 0; i < source.length; ++i) {
      aliasFuncs(source[i], target[i]);
    }
    return;
  } else if (Array.isArray(source)) {
    for (const s of source) {
      aliasFuncs(s, target);
    }
    return;
  } else if (Array.isArray(target)) {
    // Filter out empty strings from target array
    const filteredTargets = target.filter(t => t !== '');
    for (const t of filteredTargets) {
      aliasFuncs(source, t);
    }
    return;
  }

  let methodAliased = false;
  // Add method alias to Pattern.prototype if it exists
  if (typeof Pattern !== 'undefined' && typeof Pattern.prototype[source] === 'function') {
    Pattern.prototype[target] = Pattern.prototype[source];
    methodAliased = true;
  }

  // Add standalone function alias if it exists, cross-environment
  let functionAliased = false;
  try {
    if (typeof exports !== 'undefined' && typeof exports[source] === 'function') {
      exports[target] = exports[source];
      functionAliased = true;
    } else if (typeof globalThis !== 'undefined' && typeof globalThis[source] === 'function') {
      globalThis[target] = globalThis[source];
      functionAliased = true;
    }
  } catch (e) {
    // Ignore if not possible in this environment
  }

  if (!methodAliased && functionAliased) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn(`alias: source method '${source}' does not exist on Pattern.prototype, but standalone function was aliased.`);
    }
    return;
  }

  if (!methodAliased && !functionAliased) {
    throw new Error(`alias: source method or function '${source}' does not exist on Pattern.prototype or as a standalone function`);
  }
}

/**
 * Registers aliases for color names from the colorMap.
 * @param {string|string[]|object} source - The existing color name(s), as a string, array of strings, or object (with string keys and string values).
 * @param {string|string[]|undefined} target - The new alias name(s) (undefined when source is an object).
 * @example
 * aliasColors('red', 'rouge')
 * s("bd").color('rouge') // same as s("bd").color('red')
 * @example
 * aliasColors('red', ['rouge', 'rojo'])
 * $: s("bd").color('rouge') // same as s("bd").color('red')
 * $: s("~ cp").color('rojo') // same as s("~ cp").color('red')
 * @example
 * aliasColors(['red', 'blue'], ['rouge', 'bleu'])
 * $: s("bd").color('rouge') // same as s("bd").color('red')
 * $: s("~ cp").color('bleu') // same as s("~ cp").color('blue')
 * @example
 * aliasColors({ red: 'rouge', blue: 'bleu' })
 * $: s("bd").color('rouge') // same as s("bd").color('red')
 * $: s("~ cp").color('bleu') // same as s("~ cp").color('blue')
 */
export function aliasColors(source, target) {
  // Ignore empty string targets
  if (target === '') {
    return;
  }

  // If source is a dictionary/object and target is undefined, batch alias
  if (typeof source === 'object' && source !== null && !Array.isArray(source) && target === undefined) {
    for (const [k, v] of Object.entries(source)) {
      aliasColors(k, v);
    }
    return;
  }
  
  // Support batch aliasing
  if (Array.isArray(source) && Array.isArray(target)) {
    if (source.length !== target.length) {
      throw new Error('aliasColors: source and target arrays must have the same length');
    }
    for (let i = 0; i < source.length; ++i) {
      aliasColors(source[i], target[i]);
    }
    return;
  } else if (Array.isArray(source)) {
    for (const s of source) {
      aliasColors(s, target);
    }
    return;
  } else if (Array.isArray(target)) {
    // Filter out empty strings from target array
    const filteredTargets = target.filter(t => t !== '');
    for (const t of filteredTargets) {
      aliasColors(source, t);
    }
    return;
  }

  // Validate that source color exists in colorMap
  if (!(source in colorMap)) {
    throw new Error(`aliasColors: source color '${source}' does not exist in colorMap`);
  }

  // Add the alias to colorMap
  colorMap[target] = colorMap[source];
}

/**
 * Resolves a color name or alias to its actual CSS color value.
 * This function checks the colorMap for the color name (including aliases)
 * and returns the corresponding hex value, or returns the input unchanged
 * if it's already a valid CSS color (hex code or known CSS color).
 * @param {string} color - The color name, alias, or CSS color value
 * @returns {string} The resolved CSS color value
 */
export function resolveColor(color) {
  if (!color || typeof color !== 'string') {
    return color;
  }

  // Convert to lowercase for case-insensitive lookup
  const lowerColor = color.toLowerCase();

  // If it's in the colorMap (including aliases), return the hex value
  if (colorMap[lowerColor]) {
    return colorMap[lowerColor];
  }

  // If it's already a hex code, return as-is
  if (color.startsWith('#')) {
    return color;
  }

  // If it's a CSS color function (rgb, hsl, etc.), return as-is
  if (color.includes('(') && color.includes(')')) {
    return color;
  }

  // For any other case (including standard CSS color names not in our map), return as-is
  return color;
}

/**
 * locale(url) loads a JSON file from a public URL and applies aliases.
 * see alias defined in @strudel/core/pattern.mjs for more details.
 * assumes that locale is a JSON object with sub-objects for functions and colors.
 * @param {string|object} urlOrDict - The URL to fetch the locale JSON file from, or a JSON object.
 * @example
 * locale({
 *   "functions": {
 *     "fast": "schnell",
 *     "slow": "lent"
 *   },
 *   "colors": {
 *     "red": "rouge",
 *     "blue": "bleu"
 *   }
 * })
 * s("bd").schnell(2).color('rouge') // same as s("bd").fast(2).color('red')
 * @example
 * await locale('https://example.com/locales/de.json')
 * s("bd").schnell(2).color('rouge') // same as s("bd").fast(2).color('red')
 */
export async function locale(urlOrDict) {
  let localeDict;
  if (typeof urlOrDict === 'string') {
    const response = await fetch(urlOrDict);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    localeDict = await response.json();
  } else if (typeof urlOrDict === 'object' && urlOrDict !== null) {
    localeDict = urlOrDict;
  } else {
    throw new Error(`locale: invalid argument type, must be string or object, received ${typeof urlOrDict}`);
  }
  if (localeDict.functions) {
    aliasFuncs(localeDict.functions);
  }
  if (localeDict.colors) {
    aliasColors(localeDict.colors);
  }
} 