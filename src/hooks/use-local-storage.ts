'use client';

import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item, (key, value) => {
              if (key === 'entryDate' || key === 'exitDate') {
                  return new Date(value);
              }
              return value;
          });
          setStoredValue(parsed);
        }
      } catch (error) {
        console.error(error);
        setStoredValue(initialValue);
      }
    }
  }, [isMounted, key, initialValue]);

  useEffect(() => {
    if (isMounted) {
        try {
          const valueToStore =
            typeof storedValue === 'function'
              ? storedValue(storedValue)
              : storedValue;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.error(error);
        }
    }
  }, [key, storedValue, isMounted]);

  if (!isMounted) {
    return [initialValue, () => {}];
  }

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
