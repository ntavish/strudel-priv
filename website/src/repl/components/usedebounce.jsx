import { useMemo } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';

function debounce(fn, wait) {
  let timer;
  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => fn(...args), wait);
  };
}

export function useDebounce(callback, delay) {
  const ref = useRef;
  if (delay === undefined) {
    delay = 1000;
  }
  
  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  const debouncedCallback = useMemo(() => {
    const func = () => {
      ref.current?.();
    };

    return debounce(func, delay);
  }, []);

  return debouncedCallback;
}
