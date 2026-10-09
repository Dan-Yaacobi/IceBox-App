import type { Metadata, Viewport } from "next";
import { Snowfall } from "@/components/Snowfall";
import "./globals.css";

export const metadata: Metadata = {
  title: "IceBox — a freezer for your ideas",
  description: "Capture ideas fast, keep them organised in compartments, and thaw them when you're ready.",
};

export const viewport: Viewport = {
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
        <Snowfall />
        {children}
      </body>
    </html>
  );
}
