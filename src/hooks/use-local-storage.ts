'use client';

import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        // When retrieving from localStorage, dates are stored as strings.
        // We need to parse them back into Date objects.
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
            parsed.forEach(trade => {
                if (trade.entryDate) trade.entryDate = new Date(trade.entryDate);
                if (trade.exitDate) trade.exitDate = new Date(trade.exitDate);
            });
        }
        return parsed;
      }
      return initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
