import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Newsreader } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const display = Newsreader({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: {
    default: "Orbit · Campus events, run properly",
    template: "%s · Orbit",
  },
  description:
    "Orbit is the campus event operating system for clubs and committees. ProofDesk is its evidence-conditioned support desk.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "Orbit · Campus events, run properly",
    description:
      "Run registrations, payments, announcements, and QR check-in for every campus event. Support that cites its sources.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f2ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
