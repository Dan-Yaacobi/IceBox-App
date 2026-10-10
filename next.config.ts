import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Plain static files in out/ — served by any web host and bundled into the Android app by Capacitor.
  output: "export",
};

export default nextConfig;
