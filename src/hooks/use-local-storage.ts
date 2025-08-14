'use client';

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [isMounted, setIsMounted] = useState(false);

  // This function will only run on the client, and will safely get the value from localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item, (reviverKey, value) => {
          if (reviverKey === 'entryDate' || reviverKey === 'exitDate') {
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

  // This function will only run on the client, and will safely set the value in localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      console.warn(
        `Tried to set localStorage key “${key}” even though environment is not a client`
      );
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
    setIsMounted(true);
    // On mount, we read the value from localStorage and update the state.
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return the initial value until the component is mounted to avoid hydration mismatch
  if (!isMounted) {
    return [initialValue, () => {}];
  }

  return [storedValue, setValue];
}

export default useLocalStorage;
