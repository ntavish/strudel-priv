import { alias } from '@strudel/core/pattern.mjs';

/**
 * setLocale('de') loads strudel/packages/locale/locales/de.json and applies aliases.
 * see alias defined in @strudel/core/pattern.mjs for more details.
 * @param {string} language - The language to set the locale for. There should be a file in strudel/packages/locale/locales/language.json.
 * @example
 * await setLocale('de');
 * s('bd').schnell(2); // same as s('bd').fast(2)
 */
export async function setLocale(language) {
  let localeDict;
  try {
    localeDict = (await import(`./locales/${language}.json`, { assert: { type: 'json' } })).default;
  } catch (e) {
    throw new Error(`Locale file for '${language}' not found. Please create a file in strudel/packages/locale/locales/${language}.json.`);
  }
  alias(localeDict);
} 