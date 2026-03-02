import { useState, useEffect, useRef, useCallback } from 'react';

export default function useTimer(duration, onExpire) {
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef(null);
  const expireCbRef = useRef(onExpire);
  expireCbRef.current = onExpire;

  useEffect(() => {
    setRemaining(duration);

    if (duration <= 0) return;

    const startTime = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(0, duration - elapsed);
      setRemaining(left);

      if (left <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        expireCbRef.current?.();
      }
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [duration]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { remaining, stop };
}
