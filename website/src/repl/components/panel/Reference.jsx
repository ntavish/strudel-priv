import { useMemo, useState, useEffect } from 'react';
import { flushSync } from 'react-dom'

import jsdocJson from '../../../../../doc.json';
import { replaceLinkWithReference } from '../../../docs/util';
import { Textbox } from '../textbox/Textbox';
const availableFunctions = jsdocJson.docs
  .filter(({ name, description }) => name && !name.startsWith('_') && !!description)
  .sort((a, b) => /* a.meta.filename.localeCompare(b.meta.filename) +  */ a.name.localeCompare(b.name));

const getInnerText = (html) => {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const _scrollToReference = (id) => {
  const el = document.getElementById(`doc-${id}`);
  const container = document.getElementById('reference-container');
  container.scrollTo(0, el.offsetTop);
}

export function Reference() {
  const [search, setSearch] = useState('');

  const visibleFunctions = useMemo(() => {
    return availableFunctions.filter((entry) => {
      if (!search) {
        return true;
      }

      const lowCaseSearch = search.toLowerCase();
      return (
        entry.name.toLowerCase().includes(lowCaseSearch) ||
        (entry.synonyms?.some((s) => s.includes(lowCaseSearch)) ?? false)
      );
    });
  }, [search]);

  useEffect(() => {
    const onOpenReference = (e) => {
      const { id } = e.detail || {};
      flushSync(() => {
        setSearch(id);
      });
      _scrollToReference(0);
    };
    window.addEventListener("open-reference", onOpenReference);
    return () => window.removeEventListener("open-reference", onOpenReference);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a.jsdoc-ref[data-ref]');
      if (!a) return;
      e.preventDefault();
      const id = a.getAttribute('data-ref');
      flushSync(() => {
        setSearch(id);
      });
      _scrollToReference(0);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="flex h-full w-full p-2 overflow-hidden">
      <div className="h-full  flex flex-col gap-2 w-1/3 max-w-72 ">
        <div className="w-full flex">
          <Textbox className="w-full" placeholder="Search" value={search} onChange={setSearch} />
        </div>
        <div className="flex flex-col h-full overflow-y-auto  gap-1.5 bg-background bg-opacity-50  rounded-md">
          {visibleFunctions.map((entry, i) => (
            <a
              key={i}
              className="cursor-pointer text-foreground flex-none hover:bg-lineHighlight overflow-x-hidden  px-1 text-ellipsis"
              onClick={() => _scrollToReference(i)}
            >
              {entry.name} {/* <span className="text-gray-600">{entry.meta.filename}</span> */}
            </a>
          ))}
        </div>
      </div>
      <div
        className="break-normal flex-grow flex-col overflow-y-auto overflow-x-hidden   px-2 flex relative"
        id="reference-container"
      >
        <div className="prose dark:prose-invert min-w-full px-1 ">
          <h2>API Reference</h2>
          <p>
            This is the long list of functions you can use. Remember that you don't need to remember all of those and
            that you can already make music with a small set of functions!
          </p>
          {visibleFunctions.map((entry, i) => (
            <section key={i}>
              <h3 id={`doc-${i}`}>{entry.name}</h3>
              {!!entry.synonyms_text && (
                <p>
                  Synonyms: <code>{entry.synonyms_text}</code>
                </p>
              )}
              {/* <small>{entry.meta.filename}</small> */}
              <p dangerouslySetInnerHTML={{ __html: replaceLinkWithReference(entry.description) }}></p>
              <ul>
                {entry.params?.map(({ name, type, description }, i) => (
                  <li key={i}>
                    {name} : {type?.names?.join(' | ')} {description ? <> - {getInnerText(description)}</> : ''}
                  </li>
                ))}
              </ul>
              {entry.examples?.map((example, j) => (
                <pre className="bg-background" key={j}>
                  {example}
                </pre>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
