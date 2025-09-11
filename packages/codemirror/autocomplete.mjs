
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


// --- Handler functions for each context ---
const pitchNames = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'E#', 'Fb', 'F', 'F#', 'Gb',
  'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B', 'B#', 'Cb'
];

function scalePreColonHandler(context) {
  let scalePreColonContext = context.matchBefore(/\.scale\(\s*['"][^'"]*$/);
  if (scalePreColonContext) {
    if (!scalePreColonContext.text.includes(':')) {
      if (context.explicit) {
        const text = scalePreColonContext.text;
        const match = text.match(/([A-Ga-g][#b]*)?$/);
        const fragment = match ? match[0] : '';
        const filtered = pitchNames.filter((p) => p.toLowerCase().startsWith(fragment.toLowerCase()));
        const from = scalePreColonContext.to - fragment.length;
        const options = filtered.map((p) => ({ label: p, type: 'pitch' }));
        return { from, options };
      } else {
        return { from: scalePreColonContext.to, options: [] };
      }
    }
    if (!scalePreColonContext.text.includes(':')) {
      return { from: scalePreColonContext.to, options: [] };
    }
  }
  return null;
}

function soundHandler(context) {
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
  return null;
}

function bankHandler(context) {
  let bankMatch = context.matchBefore(/bank\(\s*(['"])?([\w]*)$/);
  if (bankMatch) {
    let banks = bankCompletions();
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
  return null;
}

function scaleAfterColonHandler(context) {
  let scaleContext = context.matchBefore(/\.scale\(\s*['"][^'"]*:[^'"]*$/);
  if (scaleContext) {
    const text = scaleContext.text;
    const colonIdx = text.lastIndexOf(':');
    if (colonIdx === -1) return null;
    const fragment = text.slice(colonIdx + 1);
    const filteredScales = scaleCompletions.filter((s) => s.label.startsWith(fragment));
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
  return null;
}

function fallbackHandler(context) {
  const word = context.matchBefore(/\w*/);
  if (word && word.from === word.to && !context.explicit) return null;
  if (word) {
    return {
      from: word.from,
      options: jsdocCompletions,
    };
  }
  return null;
}

const handlers = [
  scalePreColonHandler,
  soundHandler,
  bankHandler,
  scaleAfterColonHandler,
  // this handler *must* be last
  fallbackHandler
];

export const strudelAutocomplete = (context) => {
  for (const handler of handlers) {
    const result = handler(context);
    if (result) return result;
  }
  return null;
};

export const isAutoCompletionEnabled = (enabled) =>
  enabled ? [autocompletion({ override: [strudelAutocomplete], closeOnBlur: false })] : [];
