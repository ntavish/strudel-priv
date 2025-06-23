import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';
import StopCircleIcon from '@heroicons/react/20/solid/StopCircleIcon';
import cx from '@src/cx.mjs';
import { useSettings, setIsZen } from '../../settings.mjs';
import '../Repl.css';

const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

export function Header({ context, embedded = false }) {
  const { started, pending, isDirty, activeCode, handleTogglePlay, handleEvaluate, handleShuffle, handleShare } =
    context;
  const isEmbedded = typeof window !== 'undefined' && (embedded || window.location !== window.parent.location);
  const { isZen, isButtonRowHidden, isCSSAnimationDisabled, fontFamily } = useSettings();

  return (
    <header
      id="header"
      className={cx(
        'flex-none text-black  z-[100] text-lg select-none h-20 md:h-14',
        !isZen && !isEmbedded && 'bg-lineHighlight',
        isZen ? 'h-12 w-8 fixed top-0 left-0' : 'sticky top-0 w-full py-1 justify-between',
        isEmbedded ? 'flex' : 'md:flex',
      )}
      style={{ fontFamily }}
    >
      <div className="px-4 flex space-x-2 md:pt-0 select-none">
        <h1
          onClick={() => {
            if (isEmbedded) window.open(window.location.href.replace('embed', ''));
          }}
          className={cx(
            isEmbedded ? 'text-l cursor-pointer' : 'text-xl',
            'text-foreground font-bold flex space-x-2 items-center',
          )}
        >
          <div
            className={cx(
              'mt-[1px]',
              started && !isCSSAnimationDisabled && 'animate-spin',
              'cursor-pointer text-blue-500',
              isZen && 'fixed top-2 right-4',
            )}
            onClick={() => {
              if (!isEmbedded) {
                setIsZen(!isZen);
              }
            }}
          >
            <span className="block text-foreground rotate-90">꩜</span>
          </div>
          {!isZen && (
            <div className="space-x-2">
              <span className="">strudel</span>
              <span className="text-sm font-medium">REPL</span>
              {!isEmbedded && isButtonRowHidden && (
                <a href={`${baseNoTrailing}/learn`} className="text-sm opacity-25 font-medium">
                  DOCS
                </a>
              )}
            </div>
          )}
        </h1>
      </div>
      {!isZen && !isButtonRowHidden && (
        <div className="flex max-w-full overflow-auto text-foreground px-1 md:px-2 items-center">
          {/* Recording controls group */}
          <div
            className="flex flex-col self-center border border-gray-100 my-0 px-2 mr-2"
            style={{
              gap: '0px',
              paddingBottom: '4px',
              paddingRight: '0.5rem',
              borderLeft: '0px',
              borderTop: '0px',
              borderBottom: '0px',
              borderRight: '2px solid gray-100',
            }}
          >
            {/* First row: label and toggle */}
            <div
              className="flex self-end items-center"
              style={{ alignContent: 'space-between', width: 'auto', marginRight: '0.5rem', gap: '0.1rem' }}
            >
              <span
                style={{
                  fontSize: '0.9rem',
                  textTransform: 'lowercase',
                  letterSpacing: '0.05em',
                  opacity: 0.7,
                  marginBottom: '0px',
                  paddingBottom: '1px',
                }}
                title={
                  'Click the button to the right to toggle recording.\n' +
                  "When recording is enabled (ON 🔴), audio will begin recording when you press 'play'.\n" +
                  "When you press 'stop' the recorded audio will automatically be saved to a .wav file.\n" +
                  'If you provide a file name in the text box below it will be used to prefix the file name.'
                }
              >
                recording
              </span>
              {/* Recording toggle button */}
              <button
                id="recordingCheckbox"
                type="button"
                aria-pressed={false}
                defaultChecked={false}
                data-checked="false"
                title={
                  typeof window !== 'undefined' &&
                  document?.getElementById('recordingCheckbox')?.dataset.checked !== 'false'
                    ? 'Recording is enabled'
                    : 'Recording is disabled'
                }
                className={cx(
                  'ml-1 text-sm focus:outline-none select-none',
                  'transition-colors duration-100',
                  'flex items-center justify-center',
                )}
                style={{ padding: 0, marginLeft: '8px' }}
                onClick={(e) => {
                  const btn = e.currentTarget;
                  const checked = btn.dataset.checked !== 'false';
                  btn.dataset.checked = checked ? 'false' : 'true';
                  btn.innerText = checked ? 'OFF⚪' : 'ON 🔴';
                  btn.title = checked ? 'Recording is disabled' : 'Recording is enabled';
                }}
              >
                OFF⚪
              </button>
            </div>
            {/* File Name Input */}
            <input
              type="text"
              id="recordingFileName"
              placeholder="file name (optional)"
              title="File name used for recording (optional), will be appended with a timestamp and .wav extension"
              className={cx('border border-gray-300 rounded px-1 py-0 text-xs')}
              style={{
                marginRight: '0.5rem',
                width: '140px',
                height: '1rem',
                color: 'black',
                marginTop: 0,
                marginBottom: 0,
              }}
            />
          </div>
          <button
            onClick={handleTogglePlay}
            title={started ? 'stop' : 'play'}
            className={cx(
              !isEmbedded ? 'p-2' : 'px-2',
              'hover:opacity-50',
              !started && !isCSSAnimationDisabled && 'animate-pulse',
            )}
          >
            {!pending ? (
              <span className={cx('flex items-center space-x-2')}>
                {started ? <StopCircleIcon className="w-6 h-6" /> : <PlayCircleIcon className="w-6 h-6" />}
                {!isEmbedded && <span>{started ? 'stop' : 'play'}</span>}
              </span>
            ) : (
              <>loading...</>
            )}
          </button>
          <button
            onClick={handleEvaluate}
            title="update"
            className={cx(
              'flex items-center space-x-1',
              !isEmbedded ? 'p-2' : 'px-2',
              !isDirty || !activeCode ? 'opacity-50' : 'hover:opacity-50',
            )}
          >
            {!isEmbedded && <span>update</span>}
          </button>
          {/* !isEmbedded && (
            <button
              title="shuffle"
              className="hover:opacity-50 p-2 flex items-center space-x-1"
              onClick={handleShuffle}
            >
              <span> shuffle</span>
            </button>
          ) */}
          {!isEmbedded && (
            <button
              title="share"
              className={cx(
                'cursor-pointer hover:opacity-50 flex items-center space-x-1',
                !isEmbedded ? 'p-2' : 'px-2',
              )}
              onClick={handleShare}
            >
              <span>share</span>
            </button>
          )}
          {!isEmbedded && (
            <a
              title="learn"
              href={`${baseNoTrailing}/workshop/getting-started/`}
              className={cx('hover:opacity-50 flex items-center space-x-1', !isEmbedded ? 'p-2' : 'px-2')}
            >
              <span>learn</span>
            </a>
          )}
          {/* {isEmbedded && (
            <button className={cx('hover:opacity-50 px-2')}>
              <a href={window.location.href} target="_blank" rel="noopener noreferrer" title="Open in REPL">
                🚀
              </a>
            </button>
          )}
          {isEmbedded && (
            <button className={cx('hover:opacity-50 px-2')}>
              <a
                onClick={() => {
                  window.location.href = initialUrl;
                  window.location.reload();
                }}
                title="Reset"
              >
                💔
              </a>
            </button>
          )} */}
        </div>
      )}
    </header>
  );
}
