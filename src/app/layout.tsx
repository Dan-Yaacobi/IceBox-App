import type { Metadata, Viewport } from "next";
import { Snowfall } from "@/components/Snowfall";
import "mobile-drag-drop/default.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "IceBox — a freezer for your ideas",
  description: "Capture ideas fast, keep them organised in compartments, and thaw them when you're ready.",
};

export const viewport: Viewport = {
  // Draw under the phone's status/navigation bars; globals.css pads content back out.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6f4fd" },
    { media: "(prefers-color-scheme: dark)", color: "#071526" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Snowfall count={10} />
        {children}
      </body>
    </html>
  );
}
