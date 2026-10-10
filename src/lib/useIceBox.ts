"use client";

import { useEffect, useReducer, useState } from "react";
import { EMPTY, STORAGE_KEY, loadData, parseData, reducer, saveData } from "./store";

export function useIceBox() {
  const [data, dispatch] = useReducer(reducer, EMPTY);
  const [loaded, setLoaded] = useState(false);

  // Storage only exists on the client, so load after mount.
  useEffect(() => {
    let cancelled = false;
    void loadData().then((data) => {
      if (cancelled) return;
      dispatch({ type: "load", data });
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
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
