'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface UsePollingOptions<T> {
  interval?: number;
  maxRetries?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => boolean | void;
  onError?: (error: Error) => void;
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions<T> = {}
) {
  const {
    interval = 3000,
    maxRetries = 60,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [isPolling, setIsPolling] = useState(enabled);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const savedCallback = useRef(fetchFn);
  const savedOnSuccess = useRef(onSuccess);
  const savedOnError = useRef(onError);

  useEffect(() => {
    savedCallback.current = fetchFn;
    savedOnSuccess.current = onSuccess;
    savedOnError.current = onError;
  });

  const poll = useCallback(async () => {
    try {
      const result = await savedCallback.current();
      setData(result);
      setError(null);

      if (savedOnSuccess.current) {
        const shouldContinue = savedOnSuccess.current(result);
        if (shouldContinue === false) {
          setIsPolling(false);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Polling failed');
      setError(error);

      if (savedOnError.current) {
        savedOnError.current(error);
      }

      setRetryCount((prev) => prev + 1);

      if (retryCount >= maxRetries) {
        setIsPolling(false);
      }
    }
  }, [retryCount, maxRetries]);

  useEffect(() => {
    if (!isPolling || !enabled) return;

    poll();

    const id = setInterval(poll, interval);

    return () => clearInterval(id);
  }, [isPolling, enabled, interval, poll]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
    setRetryCount(0);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    data,
    error,
    isPolling,
    retryCount,
    startPolling,
    stopPolling,
  };
}
