import cx from '@src/cx.mjs';
import { useMemo, useState } from 'react';

import jsdocJson from '../../../../../doc.json';
import { Textbox } from '../textbox/Textbox';
import { useDebounce } from '../usedebounce.jsx';

const availableFunctions = jsdocJson.docs
  .filter(({ name, description }) => name && !name.startsWith('_') && !!description)
  .sort((a, b) => /* a.meta.filename.localeCompare(b.meta.filename) +  */ a.name.localeCompare(b.name));

const getInnerText = (html) => {
  var div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

function FunctionName({ name, visible }) {
  return (
    <a
      className={cx(
        'cursor-pointer text-foreground flex-none hover:bg-lineHighlight overflow-x-hidden  px-1 text-ellipsis',
        visible ? '' : 'hidden',
      )}
      onClick={() => {
        const el = document.getElementById(`detail-${name}`);
        const container = document.getElementById('reference-container');
        container.scrollTo(0, el.offsetTop);
      }}
    >
      {name} {/* <span className="text-gray-600">{entry.meta.filename}</span> */}
    </a>
  );
}

function FunctionDetail({ entry, visible }) {
  const key = `detail-${entry.name}`;

  return (
    <section key={key} id={`detail-${entry.name}`} className={cx(visible ? '' : 'hidden')}>
      <h3>{entry.name}</h3>
      {!!entry.synonyms_text && (
        <p>
          Synonyms: <code>{entry.synonyms_text}</code>
        </p>
      )}
      {/* <small>{entry.meta.filename}</small> */}
      <p dangerouslySetInnerHTML={{ __html: entry.description }}></p>
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
  );
}

export function Reference() {
  const [search, setSearch] = useState('');
  const [tmpSearch, setTmpSearch] = useState('');  

  const visibleFunctions = useMemo(() => {
    const lowCaseSearch = search.toLowerCase();
    return availableFunctions.map((entry) => {
      const base = {
        visible:
          !search ||
          entry.name.toLowerCase().includes(lowCaseSearch) ||
          (entry.synonyms?.some((s) => s.includes(lowCaseSearch)) ?? false),
      };
      return { ...entry, ...base };
    });
  }, [search]);

  const debouncedSetSearch = useDebounce(() => {
    setSearch(tmpSearch);
  }, 100);

  // Store search input in a tmp var and wait a bit to apply
  // it and update the result list
  const onChangeSearch = (event) => {
    setTmpSearch(event);
    debouncedSetSearch();
  };
  
  return (
    <div className="flex h-full w-full p-2 overflow-hidden">
      <div className="h-full  flex flex-col gap-2 w-1/3 max-w-72 ">
        <div class="w-full flex">
          <Textbox className="w-full"
                   placeholder="Search"
                   value={search}
                   onChange={onChangeSearch} />
        </div>
        <div className="flex flex-col h-full overflow-y-auto  gap-1.5 bg-background bg-opacity-50  rounded-md">
          {visibleFunctions.map((entry, index) => (
            <FunctionName name={entry.name} visible={entry.visible} key={index} />
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
          {visibleFunctions.map((entry, index) => (
            <FunctionDetail entry={entry} visible={entry.visible} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
