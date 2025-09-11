
import jsdoc from '../../doc.json';
import { autocompletion } from '@codemirror/autocomplete';
import { h } from './html';
import { Scale } from '@tonaljs/tonal';
import { soundMap } from 'superdough';



const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.innerText = str;
  return div.innerHTML;
};

const stripHtml = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const getDocLabel = (doc) => doc.name || doc.longname;

const buildParamsList = (params) =>
  params?.length
    ? `
    <div class="autocomplete-info-params-section">
      <h4 class="autocomplete-info-section-title">Parameters</h4>
      <ul class="autocomplete-info-params-list">
        ${params
          .map(
            ({ name, type, description }) => `
          <li class="autocomplete-info-param-item">
            <span class="autocomplete-info-param-name">${name}</span>
            <span class="autocomplete-info-param-type">${type.names?.join(' | ')}</span>
            ${description ? `<div class="autocomplete-info-param-desc">${stripHtml(description)}</div>` : ''}
          </li>
        `,
          )
          .join('')}
      </ul>
    </div>
  `
    : '';

const buildExamples = (examples) =>
  examples?.length
    ? `
    <div class="autocomplete-info-examples-section">
      <h4 class="autocomplete-info-section-title">Examples</h4>
      ${examples
        .map(
          (example) => `
        <pre class="autocomplete-info-example-code">${escapeHtml(example)}</pre>
      `,
        )
        .join('')}
    </div>
  `
    : '';

export const Autocomplete = ({ doc, label }) =>
  h`
  <div class="autocomplete-info-container">
    <div class="autocomplete-info-tooltip">
      <h3 class="autocomplete-info-function-name">${label || getDocLabel(doc)}</h3>
      ${doc.description ? `<div class="autocomplete-info-function-description">${doc.description}</div>` : ''}
      ${buildParamsList(doc.params)}
      ${buildExamples(doc.examples)}
    </div>
  </div>
`[0];

const isValidDoc = (doc) => {
  const label = getDocLabel(doc);
  return label && !label.startsWith('_') && !['package'].includes(doc.kind);
};

const hasExcludedTags = (doc) =>
  ['superdirtOnly', 'noAutocomplete'].some((tag) => doc.tags?.find((t) => t.originalTitle === tag));



export function bankCompletions() {
  const soundDict = soundMap.get();
  const banks = new Set();
  for (const key of Object.keys(soundDict)) {
    const [bank, suffix] = key.split('_');
    if (suffix && bank) banks.add(bank);
  }
  return Array.from(banks).sort().map((name) => ({ label: name, type: 'bank' }));
}

// Placeholder: Replace with actual logic to get live sound names
const soundCompletions = [
  // Example: { label: 'clap', type: 'sound' }, ...
];

// Attempt to get all scale names from Tonal
let scaleCompletions = [];
try {
  scaleCompletions = (Scale.names ? Scale.names() : []).map((name) => ({ label: name, type: 'scale' }));
} catch (e) {
  console.warn('[autocomplete] Could not load scale names from Tonal:', e);
}

const jsdocCompletions = jsdoc.docs
  .filter((doc) => isValidDoc(doc) && !hasExcludedTags(doc))
  // https://codemirror.net/docs/ref/#autocomplete.Completion
  .map((doc) => ({
    label: getDocLabel(doc),
    // detail: 'xxx', // An optional short piece of information to show (with a different style) after the label.
    info: () => Autocomplete({ doc }),
    type: 'function', // https://codemirror.net/docs/ref/#autocomplete.Completion.type
  }));

export const strudelAutocomplete = (context) => {
  // --- Pitch names for scale key completion ---
  // Ideally, these should be imported from packages/tonal/tonleiter.mjs
  // but are duplicated here as they are not exported.
  const pitchNames = [
    'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'Fb', 'F', 'F#', 'Gb',
    'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'Cb'
  ];
  
  // Block fallback completions inside .scale("..."), even before the colon
  let scalePreColonContext = context.matchBefore(/\.scale\(\s*['"][^'"]*$/);
  if (scalePreColonContext) {
    // Only yield completions if a colon is present (handled below)
    if (!scalePreColonContext.text.includes(':')) {
      if (context.explicit) {
        // Provide pitch completions on explicit request
        // (Union of sharps and flats from tonleiter.mjs)
        const text = scalePreColonContext.text;
        const match = text.match(/([A-Ga-g][#b]*)?$/);
        const fragment = match ? match[0] : '';
        const filtered = pitchNames.filter((p) => p.toLowerCase().startsWith(fragment.toLowerCase()));
        const from = scalePreColonContext.to - fragment.length;
        const options = filtered.map((p) => ({ label: p, type: 'pitch' }));
        return { from, options };
      } else {
        // Block fallback completions
        return { from: scalePreColonContext.to, options: [] };
      }
    }

    // (second block removed, handled above)
    if (!scalePreColonContext.text.includes(':')) {
      return { from: scalePreColonContext.to, options: [] };
    }
  }
  
  // 1. Check for sound context: s("..."), sound("...")
  // Trigger after at least one letter is typed after whitespace or bracket inside the quotes
  let soundContext = context.matchBefore(/(s|sound)\(\s*['"][^'"]*$/);
  if (soundContext) {
    const text = soundContext.text;
    const quoteIdx = Math.max(text.lastIndexOf('"'), text.lastIndexOf("'"));
    if (quoteIdx === -1) return null;
    const inside = text.slice(quoteIdx + 1);
    const fragMatch = inside.match(/(?:[\s\[\{\(<])([\w]*)$/);
    const fragment = fragMatch ? fragMatch[1] : inside;
    if (!fragment || fragment.length === 0) return null;
    const soundNames = Object.keys(soundMap.get()).sort();
    const filteredSounds = soundNames.filter((name) => name.startsWith(fragment));
    let options = filteredSounds.map((name) => ({ label: name, type: 'sound' }));
    const from = soundContext.to - fragment.length;
    return {
      from,
      options,
    };
  }

  let bankMatch = context.matchBefore(/bank\(\s*(['"])?([\w]*)$/);
  if (bankMatch) {
    let banks = bankCompletions();
    console.log('[autocomplete] Bank context detected:', bankMatch.text);
    console.log('[autocomplete] soundMap keys:', Object.keys(soundMap.get()));
    console.log('[autocomplete] bankCompletions:', banks);
    // Extract quote and fragment using regex groups on match.text
    const groups = bankMatch.text.match(/(['"])?([\w]*)$/);
    const quote = groups ? groups[1] : undefined;
    const fragment = groups ? groups[2] || '' : '';
    let from;
    if (quote) {
      from = bankMatch.from + bankMatch.text.indexOf(quote) + 1;
    } else {
      from = bankMatch.to - fragment.length;
    }
    const filteredBanks = banks.filter((b) => b.label.startsWith(fragment));
    let options;
    if (!quote) {
      options = filteredBanks.map((b) => ({ ...b, apply: '"' + b.label + '"' }));
    } else {
      const afterCursor = context.state.sliceDoc(bankMatch.to, bankMatch.to + 1);
      options = filteredBanks.map((b) => {
        if (afterCursor !== quote) {
          return { ...b, apply: b.label + quote };
        }
        return b;
      });
    }
    return {
      from,
      options,
    };
  }

  // 3. Check for scale context: .scale("..."), only after colon
  let scaleContext = context.matchBefore(/\.scale\(\s*['"][^'"]*:[^'"]*$/);
  if (scaleContext) {
    // Find the last colon in the text
    const text = scaleContext.text;
    const colonIdx = text.lastIndexOf(':');
    if (colonIdx === -1) return null;
    // Get the fragment after the colon
    const fragment = text.slice(colonIdx + 1);
    // Filter scale completions by fragment
    const filteredScales = scaleCompletions.filter((s) => s.label.startsWith(fragment));
    // Insert colon-form (replace spaces with colons) for completions
    const options = filteredScales.map((s) => ({
      ...s,
      apply: s.label.replace(/\s+/g, ':')
    }));
    const from = scaleContext.from + colonIdx + 1;
    return {
      from,
      options,
    };
  }

  // fallback: original logic
  const word = context.matchBefore(/\w*/);
  if (word && word.from === word.to && !context.explicit) return null;

  if (word) {
    console.log('[autocomplete] Default context:', word.text);
    return {
      from: word.from,
      options: jsdocCompletions,
    };
  }
  return null;
};

export const isAutoCompletionEnabled = (enabled) =>
  enabled ? [autocompletion({ override: [strudelAutocomplete], closeOnBlur: false })] : [];
