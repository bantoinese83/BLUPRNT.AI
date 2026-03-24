import { useState, useEffect } from "react";

// Global cache for promises. This survives component unmounts.
const promiseCache = new Map<string, Promise<unknown>>();
const dataCache = new Map<string, unknown>();

interface CacheOptions<T> {
  key: string | null;
  fetcher: () => Promise<T>;
  revalidateOnMount?: boolean;
}

export function useCachedData<T>({
  key,
  fetcher,
  revalidateOnMount = true,
}: CacheOptions<T>) {
  const [data, setData] = useState<T | null>(() => {
    if (key && dataCache.has(key)) {
      return dataCache.get(key) as T;
    }
    return null;
  });

  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    !key || !dataCache.has(key),
  );

  useEffect(() => {
    if (!key) {
      setData(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const executeFetch = async () => {
      // If we already have a fetching promise for this key, await it
      if (promiseCache.has(key)) {
        setIsLoading(!dataCache.has(key)); // Only show loading if we really have no data
        try {
          const result = await promiseCache.get(key);
          if (isMounted) {
            setData(result as T);
            setIsLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            setError(err as Error);
            setIsLoading(false);
          }
        }
        return;
      }

      // We have data but want to revalidate in the background
      if (dataCache.has(key)) {
        if (!revalidateOnMount) return;
        setIsLoading(false); // Stale-while-revalidate
      } else {
        setIsLoading(true);
      }

      const p = fetcher();
      promiseCache.set(key, p);

      try {
        const result = await p;
        dataCache.set(key, result);
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        promiseCache.delete(key);
        if (isMounted) setIsLoading(false);
      }
    };

    executeFetch();

    return () => {
      isMounted = false;
    };
  }, [key, fetcher, revalidateOnMount]);

  return { data, error, isLoading, mutate: setData };
}
