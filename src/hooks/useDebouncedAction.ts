import { useCallback, useRef, useReducer, useState } from 'react';

/**
 * Hook that returns a debounced version of the provided function.
 * Useful for preventing multiple rapid clicks on toggle buttons.
 * 
 * @param callback - The function to debounce
 * @param delay - The debounce delay in milliseconds (default: 300ms)
 * @returns A debounced version of the callback
 */
export function useDebouncedAction<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      // If called too soon after the last call, ignore
      if (now - lastCallRef.current < delay) {
        return;
      }

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      lastCallRef.current = now;
      callback(...args);
    },
    [callback, delay]
  );
}

/**
 * Hook that prevents multiple rapid executions of an async function.
 * Returns a wrapped function that ignores calls while a previous call is still pending.
 * 
 * @param callback - The async function to protect
 * @returns A protected version of the callback and a loading state
 */
export function useThrottledAsync<T extends (...args: any[]) => Promise<any>>(
  callback: T
): [(...args: Parameters<T>) => Promise<void>, boolean] {
  const isPendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const wrappedCallback = useCallback(
    async (...args: Parameters<T>) => {
      if (isPendingRef.current) return;

      isPendingRef.current = true;
      setIsPending(true);

      try {
        await callback(...args);
      } finally {
        isPendingRef.current = false;
        setIsPending(false);
      }
    },
    [callback]
  );

  return [wrappedCallback, isPending];
}

/**
 * Hook for tracking which item is currently being toggled.
 * Useful for showing loading state on specific items.
 */
export function useToggleTracker() {
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const startToggling = useCallback((id: string) => {
    setTogglingIds(prev => new Set(prev).add(id));
  }, []);

  const stopToggling = useCallback((id: string) => {
    setTogglingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isToggling = useCallback((id: string) => {
    return togglingIds.has(id);
  }, [togglingIds]);

  const wrapToggle = useCallback(
    <T extends (id: string, ...args: any[]) => Promise<any>>(fn: T) => {
      return async (id: string, ...args: any[]) => {
        if (togglingIds.has(id)) return;
        
        startToggling(id);
        try {
          await fn(id, ...args);
        } finally {
          stopToggling(id);
        }
      };
    },
    [togglingIds, startToggling, stopToggling]
  );

  return { isToggling, wrapToggle, togglingIds };
}
