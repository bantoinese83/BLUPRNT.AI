import { useState, useCallback, useRef, useLayoutEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Use a ref to store the current value so that setValue has access to it
  // without needing to include storedValue in its dependency array.
  const valueRef = useRef<T>(initialValue);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;

      try {
        const parsed = JSON.parse(item) as T;
        const resolved =
          parsed === null && initialValue !== null ? initialValue : parsed;
        // We don't update valueRef.current here because it's during render.
        // It will be updated by useLayoutEffect.
        return resolved;
      } catch {
        return item as unknown as T;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Sync the ref with the state after every render.
  useLayoutEffect(() => {
    valueRef.current = storedValue;
  }, [storedValue]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(valueRef.current) : value;

        // Update both state and ref.
        // Updating ref here is safe because it's in a callback, not during render.
        valueRef.current = valueToStore;
        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
      valueRef.current = initialValue;
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}
