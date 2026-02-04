import { useState, useEffect, useRef } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const lastValue = useRef(value);
  useEffect(() => {
    lastValue.current = value;
    const handler = setTimeout(() => {
      // Only update if value hasn't changed during debounce
      if (lastValue.current === value) {
        setDebounced(value);
      }
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

