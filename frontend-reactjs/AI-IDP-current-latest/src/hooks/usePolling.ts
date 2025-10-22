import { useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions {
  interval?: number;
  enabled?: boolean;
  stopCondition?: () => boolean;
}

export const usePolling = (
  callback: () => Promise<void> | void,
  options: UsePollingOptions = {}
) => {
  const {
    interval = 5000,
    enabled = true,
    stopCondition
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        await callbackRef.current();
        
        // Check stop condition after each poll
        if (stopCondition && stopCondition()) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }, [interval, stopCondition]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const isPolling = useCallback(() => {
    return intervalRef.current !== null;
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling
  };
};
