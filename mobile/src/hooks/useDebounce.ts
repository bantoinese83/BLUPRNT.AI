import { useState, useEffect } from "react";
import { debounce } from "@shared/lib/debounce";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * no changes.
 *
 * @example
 * const debouncedQuery = useDebounce(searchQuery, 300);
 * useEffect(() => { search(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const setter = debounce((v: T) => setDebouncedValue(v), delay);
    setter(value);
    return () => setter.cancel();
  }, [value, delay]);

  return debouncedValue;
}
