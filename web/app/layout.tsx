import type { Metadata, Viewport } from "next";
import "./globals.css";
import { body, devaDisplay, display } from "./fonts";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthHeader } from "@/components/AuthHeader";

export const metadata: Metadata = {
  title: "BoldaBoldai — captions that speak नेपाली",
  description: "Nepali-first AI auto-captioning — Devanagari, Roman, Ninglish.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0c0a09",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ne" className={`${body.variable} ${devaDisplay.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-paper focus:px-3 focus:py-2 focus:text-ink"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <AuthHeader />
          <div id="main">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
