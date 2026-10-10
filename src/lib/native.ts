"use client";

import { App } from "@capacitor/app";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { useEffect, useRef } from "react";
import { isNativeApp } from "./platform";

/**
 * Hands a text file to the user: a normal download in the browser, the Android
 * share sheet (Drive, Files, email…) in the app, where downloads don't work.
 */
export async function saveTextFile(filename: string, text: string, mime: string) {
  if (isNativeApp()) {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, files: [uri], dialogTitle: "Save your IceBox backup" });
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Android back button. The handler returns true if it handled the press
 * (closed something, went up a level); otherwise the app is sent to the background.
 */
export function useBackButton(handler: () => boolean) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => {
    if (!isNativeApp()) return;
    const sub = App.addListener("backButton", () => {
      if (!ref.current()) void App.minimizeApp();
    });
    return () => {
      void sub.then((s) => s.remove());
    };
  }, []);
}

let touchDragEnabled = false;

/**
 * Touch screens don't fire HTML drag-and-drop events, so polyfill them:
 * long-press a card or compartment, then drag it. A quick tap still clicks.
 */
export async function enableTouchDrag() {
  if (touchDragEnabled || typeof window === "undefined") return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  touchDragEnabled = true;
  const [{ polyfill }, { scrollBehaviourDragImageTranslateOverride }] = await Promise.all([
    import("mobile-drag-drop"),
    import("mobile-drag-drop/scroll-behaviour"),
  ]);
  polyfill({
    // Chromium reports native drag support even where touch can't use it.
    forceApply: true,
    holdToDrag: 350,
    // The built-in lookup reads event.composedPath(), which is empty by the time the
    // long-press timer fires, so find the draggable from the touched element instead.
    tryFindDraggableTarget: (e) =>
      (e.target instanceof Element && e.target.closest<HTMLElement>('[draggable="true"]')) || undefined,
    dragImageCenterOnTouch: true,
    // Auto-scrolls the page when dragging near the top or bottom edge.
    dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
  });
}
