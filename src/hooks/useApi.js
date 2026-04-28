import { useCallback, useEffect, useState } from 'react';

export function useApi(fetcher, deps = [], options = {}) {
  const { skip = false } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!skip) refetch();
  }, [refetch, skip]);

  return { data, loading, error, refetch };
}

