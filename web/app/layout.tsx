import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, mukta, display } from "./fonts";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthHeader } from "@/components/AuthHeader";

export const metadata: Metadata = {
  title: "Nepali AI Caption",
  description: "Nepali-first AI auto-captioning — Devanagari, Roman, Ninglish.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b0b0f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ne" className={`${inter.variable} ${mukta.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-black"
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
