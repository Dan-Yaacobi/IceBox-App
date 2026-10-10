import { Capacitor } from "@capacitor/core";

/** True inside the Android app, false in a normal browser. */
export const isNativeApp = () => Capacitor.isNativePlatform();
