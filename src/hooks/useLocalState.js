import { useState, useEffect, useRef, useCallback } from "react";

// Debounced localStorage — writes only after 400ms of no changes (fixes memory leak / jank)
export function useLocalState(key, def) {
  const [s, set] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  });

  const timer = useRef(null);

  // Separate effect to handle persistence to avoid side-effects in state updater
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(s));
      } catch (e) {
        console.error("Error saving to localStorage", e);
      }
    }, 400);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key, s]);

  const setAndSync = useCallback((val) => {
    set(val);
  }, []);

  return [s, setAndSync];
}
