import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.danyaacobi.icebox",
  appName: "IceBox",
  webDir: "out",
  plugins: {
    SystemBars: {
      // The page uses viewport-fit=cover and pads itself with the safe-area insets.
      initialViewportFitValueHint: "cover",
    },
  },
};

export default config;
