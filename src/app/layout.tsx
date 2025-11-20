import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { GameProvider } from "@/context/GameContext";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reverso-display",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-reverso-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Reverso",
  description: "Reverse-speaking party game MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <GameProvider>
          {children}
          <Analytics />
        </GameProvider>
      </body>
    </html>
  );
}
