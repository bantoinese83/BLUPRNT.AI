/**
 * Shared debounce utilities for both web and mobile.
 *
 * @example
 * // Vanilla debounce (any environment):
 * const debouncedSearch = debounce((q: string) => search(q), 300);
 *
 * @example
 * // React hook (web or React Native):
 * const debouncedValue = useDebounce(searchQuery, 300);
 */

/**
 * Returns a debounced version of `fn` that delays invocation by `delay` ms.
 * The returned function also exposes a `cancel()` method.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number,
): T & { cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced as T & { cancel(): void };
}
