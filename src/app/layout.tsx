import type { Metadata, Viewport } from "next";
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

const SITE_URL = "https://reverso.lol";
const SITE_DESCRIPTION =
  "Record a phrase, hear it flipped backwards, and dare a friend to mimic the gibberish. Reverso reverses their attempt back to forward speech and scores how close they got. Free browser party game — no app, no signup.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Reverso — the backwards talking party game",
    template: "%s · Reverso",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Reverso",
  keywords: [
    "reverso",
    "party game",
    "backwards talking game",
    "reverse audio game",
    "reversed speech challenge",
    "talk backwards",
    "voice game",
    "pass and play",
    "free browser game",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Reverso",
    title: "Reverso — the backwards talking party game",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Reverso — the backwards talking party game",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Reverso",
  },
  category: "games",
};

export const viewport: Viewport = {
  themeColor: "#04010b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
