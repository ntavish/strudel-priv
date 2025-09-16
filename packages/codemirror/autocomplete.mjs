import jsdoc from '../../doc.json';
import { autocompletion } from '@codemirror/autocomplete';
import { h } from './html';
import { Scale } from '@tonaljs/tonal';
import { soundMap } from 'superdough';
import { complex } from '../tonal/ireal.mjs';

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

export const Autocomplete = (doc) =>
  h`
  <div class="autocomplete-info-container">
    <div class="autocomplete-info-tooltip">
      <h3 class="autocomplete-info-function-name">${getDocLabel(doc)}</h3>
      ${doc.synonyms_text ? `<div class="autocomplete-info-function-synonyms">Synonyms: ${doc.synonyms_text}</div>` : ''}
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
  return Array.from(banks)
    .sort()
    .map((name) => ({ label: name, type: 'bank' }));
}

// Attempt to get all scale names from Tonal
let scaleCompletions = [];
try {
  scaleCompletions = (Scale.names ? Scale.names() : []).map((name) => ({ label: name, type: 'scale' }));
} catch (e) {
  console.warn('[autocomplete] Could not load scale names from Tonal:', e);
}

// Valid mode values for voicing
const modeCompletions = [
  { label: 'below', type: 'mode' },
  { label: 'above', type: 'mode' },
  { label: 'duck', type: 'mode' },
  { label: 'root', type: 'mode' },
];

// Valid chord symbols from ireal dictionary plus empty string for major triads
const chordSymbols = ['', ...Object.keys(complex)].sort();
const chordSymbolCompletions = chordSymbols.map((symbol) => {
  if (symbol === '') {
    return {
      label: 'major',
      apply: '',
      type: 'chord-symbol',
    };
  }
  return {
    label: symbol,
    apply: symbol,
    type: 'chord-symbol',
  };
});

export const getSynonymDoc = (doc, synonym) => {
  const synonyms = doc.synonyms || [];
  const docLabel = getDocLabel(doc);
  // Swap `doc.name` in for `s` in the list of synonyms
  const synonymsWithDoc = [docLabel, ...synonyms].filter((x) => x && x !== synonym);
  return {
    ...doc,
    name: synonym,
    longname: synonym,
    synonyms: synonymsWithDoc,
    synonyms_text: synonymsWithDoc.join(', '),
  };
};

const jsdocCompletions = (() => {
  const seen = new Set(); // avoid repetition
  const completions = [];
  for (const doc of jsdoc.docs) {
    if (!isValidDoc(doc) || hasExcludedTags(doc)) continue;
    const docLabel = getDocLabel(doc);
    // Remove duplicates
    const synonyms = doc.synonyms || [];
    let labels = [docLabel, ...synonyms];
    for (const label of labels) {
      // https://codemirror.net/docs/ref/#autocomplete.Completion
      if (label && !seen.has(label)) {
        seen.add(label);
        completions.push({
          label,
          info: () => Autocomplete(getSynonymDoc(doc, label)),
          type: 'function', // https://codemirror.net/docs/ref/#autocomplete.Completion.type
        });
      }
    }
  }
  return completions;
})();

// --- Handler functions for each context ---
const pitchNames = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'E#',
  'Fb',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
  'B#',
  'Cb',
];

function scalePreColonHandler(context) {
  // First check for scale context without quotes - block with empty completions
  let scaleNoQuotesContext = context.matchBefore(/scale\(\s*$/);
  if (scaleNoQuotesContext) {
    return {
      from: scaleNoQuotesContext.to,
      options: [],
    };
  }

  // Then check for scale context with quotes - provide completions
  let scalePreColonContext = context.matchBefore(/scale\(\s*['"][^'"]*$/);
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
  }
  return null;
}

function soundHandler(context) {
  // First check for sound context without quotes - block with empty completions
  let soundNoQuotesContext = context.matchBefore(/(s|sound)\(\s*$/);
  if (soundNoQuotesContext) {
    return {
      from: soundNoQuotesContext.to,
      options: [],
    };
  }

  // Then check for sound context with quotes - provide completions
  let soundContext = context.matchBefore(/(s|sound)\(\s*['"][^'"]*$/);
  if (!soundContext) return null;

  const text = soundContext.text;
  const quoteIdx = Math.max(text.lastIndexOf('"'), text.lastIndexOf("'"));
  if (quoteIdx === -1) return null;
  const inside = text.slice(quoteIdx + 1);
  const fragMatch = inside.match(/(?:[\s[{(<])([\w]*)$/);
  const fragment = fragMatch ? fragMatch[1] : inside;
  const soundNames = Object.keys(soundMap.get()).sort();
  const filteredSounds = soundNames.filter((name) => name.includes(fragment));
  let options = filteredSounds.map((name) => ({ label: name, type: 'sound' }));
  const from = soundContext.to - fragment.length;
  return {
    from,
    options,
  };
}

function bankHandler(context) {
  // First check for bank context without quotes - block with empty completions
  let bankNoQuotesContext = context.matchBefore(/bank\(\s*$/);
  if (bankNoQuotesContext) {
    return {
      from: bankNoQuotesContext.to,
      options: [],
    };
  }

  // Then check for bank context with quotes - provide completions
  let bankMatch = context.matchBefore(/bank\(\s*['"][^'"]*$/);
  if (!bankMatch) return null;

  const text = bankMatch.text;
  const quoteIdx = Math.max(text.lastIndexOf('"'), text.lastIndexOf("'"));
  if (quoteIdx === -1) return null;
  const inside = text.slice(quoteIdx + 1);
  const fragment = inside;
  let banks = bankCompletions();
  const filteredBanks = banks.filter((b) => b.label.startsWith(fragment));
  const from = bankMatch.to - fragment.length;
  return {
    from,
    options: filteredBanks,
  };
}

function modePreColonHandler(context) {
  // First check for mode context without quotes - block with empty completions
  let modeNoQuotesContext = context.matchBefore(/mode\(\s*$/);
  if (modeNoQuotesContext) {
    return {
      from: modeNoQuotesContext.to,
      options: [],
    };
  }

  // Then check for mode context with quotes - provide completions
  let modeContext = context.matchBefore(/mode\(\s*['"][^'"]*$/);
  if (!modeContext) return null;

  const text = modeContext.text;
  const quoteIdx = Math.max(text.lastIndexOf('"'), text.lastIndexOf("'"));
  if (quoteIdx === -1) return null;
  const inside = text.slice(quoteIdx + 1);
  const fragMatch = inside.match(/(?:[\s[{(<])([\w:]*)$/);
  const fragment = fragMatch ? fragMatch[1] : inside;
  const filteredModes = modeCompletions.filter((m) => m.label.startsWith(fragment));
  const from = modeContext.to - fragment.length;
  return {
    from,
    options: filteredModes,
  };
}

function modeAfterColonHandler(context) {
  let modeContext = context.matchBefore(/mode\(\s*['"][^'"]*:[^'"]*$/);
  if (!modeContext) return null;

  const text = modeContext.text;
  const colonIdx = text.lastIndexOf(':');
  if (colonIdx === -1) return null;
  const fragment = text.slice(colonIdx + 1);

  // For anchor after colon, we can suggest pitch names
  const filtered = pitchNames.filter((p) => p.toLowerCase().startsWith(fragment.toLowerCase()));
  const options = filtered.map((p) => ({ label: p, type: 'pitch' }));
  const from = modeContext.from + colonIdx + 1;
  return {
    from,
    options,
  };
}

function chordHandler(context) {
  // First check for chord context without quotes - block with empty completions
  let chordNoQuotesContext = context.matchBefore(/chord\(\s*$/);
  if (chordNoQuotesContext) {
    return {
      from: chordNoQuotesContext.to,
      options: [],
    };
  }

  // Then check for chord context with quotes - provide completions
  let chordContext = context.matchBefore(/chord\(\s*['"][^'"]*$/);
  if (!chordContext) return null;

  const text = chordContext.text;
  const quoteIdx = Math.max(text.lastIndexOf('"'), text.lastIndexOf("'"));
  if (quoteIdx === -1) return null;
  const inside = text.slice(quoteIdx + 1);

  // Use same fragment matching as sound/mode for expressions like "<G Am>"
  const fragMatch = inside.match(/(?:[\s[{(<])([\w#b+^:-]*)$/);
  const fragment = fragMatch ? fragMatch[1] : inside;

  // Check if fragment contains any pitch name at start (for root + symbol)
  let rootMatch = null;
  let symbolFragment = fragment;
  for (const pitch of pitchNames) {
    if (fragment.toLowerCase().startsWith(pitch.toLowerCase())) {
      rootMatch = pitch;
      symbolFragment = fragment.slice(pitch.length);
      break;
    }
  }

  if (rootMatch) {
    // We have a root, now complete chord symbols
    const filteredSymbols = chordSymbolCompletions.filter((s) =>
      s.label.toLowerCase().startsWith(symbolFragment.toLowerCase()),
    );

    // Create completions that replace the entire chord, not just the symbol part
    const options = filteredSymbols;

    const from = chordContext.to - symbolFragment.length;
    return { from, options };
  } else {
    // No root yet, complete with pitch names
    const filteredPitches = pitchNames.filter((p) => p.toLowerCase().startsWith(fragment.toLowerCase()));
    const options = filteredPitches.map((p) => ({ label: p, type: 'pitch' }));
    const from = chordContext.to - fragment.length;
    return { from, options };
  }
}

function scaleAfterColonHandler(context) {
  let scaleContext = context.matchBefore(/scale\(\s*['"][^'"]*:[^'"]*$/);
  if (!scaleContext) return null;

  const text = scaleContext.text;
  const colonIdx = text.lastIndexOf(':');
  if (colonIdx === -1) return null;
  const fragment = text.slice(colonIdx + 1);
  const filteredScales = scaleCompletions.filter((s) => s.label.startsWith(fragment));
  const options = filteredScales.map((s) => ({
    ...s,
    apply: s.label.replace(/\s+/g, ':'),
  }));
  const from = scaleContext.from + colonIdx + 1;
  return {
    from,
    options,
  };
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
  soundHandler,
  bankHandler,
  chordHandler,
  scalePreColonHandler,
  scaleAfterColonHandler,
  modePreColonHandler,
  modeAfterColonHandler,
  // this handler *must* be last
  fallbackHandler,
];

export const strudelAutocomplete = (context) => {
  for (const handler of handlers) {
    const result = handler(context);
    if (result) {
      return result;
    }
  }
  return null;
};

export const isAutoCompletionEnabled = (enabled) =>
  enabled ? [autocompletion({ override: [strudelAutocomplete], closeOnBlur: false })] : [];
