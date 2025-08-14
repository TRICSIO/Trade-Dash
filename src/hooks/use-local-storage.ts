'use client';

import { useState, useEffect, useCallback } from 'react';

// A custom hook for persisting state to local storage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [isMounted, setIsMounted] = useState(false);

  // This function will run on the client and safely get the value from localStorage
  const readValue = useCallback((): T => {
    // Prevent build errors from server-side rendering
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        // The reviver function is used to correctly parse Date objects
        return JSON.parse(item, (reviverKey, value) => {
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
            return new Date(value);
          }
          return value;
        });
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
    }
    return initialValue;
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // This function will run on the client and safely set the value in localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn(
        `Tried to set localStorage key “${key}” even though the environment is not a client`
      );
      return;
    }

    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  useEffect(() => {
    // Set mounted state to true after the initial render
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only on the client, after mounting, read the value from localStorage and update the state.
    if(isMounted) {
        setStoredValue(readValue());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);
  
  // Until the component is mounted, we return the initial value.
  // After mounting, we return the stored value. This prevents hydration mismatches.
  return [isMounted ? storedValue : initialValue, setValue];
}

export default useLocalStorage;
