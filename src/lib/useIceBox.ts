"use client";

import { useEffect, useReducer, useState } from "react";
import { EMPTY, STORAGE_KEY, loadData, parseData, reducer, saveData } from "./store";

export function useIceBox() {
  const [data, dispatch] = useReducer(reducer, EMPTY);
  const [loaded, setLoaded] = useState(false);

  // localStorage only exists in the browser, so load after mount.
  useEffect(() => {
    dispatch({ type: "load", data: loadData() });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveData(data);
  }, [data, loaded]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      try {
        const parsed = parseData(JSON.parse(e.newValue));
        if (parsed) dispatch({ type: "load", data: parsed });
      } catch {
        // ignore malformed writes from elsewhere
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { data, dispatch, loaded };
}
