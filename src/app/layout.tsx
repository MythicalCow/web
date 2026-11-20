import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Navigation from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://raghavtirumale.vercel.app"),
  title: {
    default: "Raghav Tirumale",
    template: "%s — Raghav Tirumale",
  },
  description:
    "Engineer working close to the metal — GPU kernels, processor design, and real-time machine intelligence.",
  openGraph: {
    title: "Raghav Tirumale",
    description:
      "Engineer working close to the metal — GPU kernels, processor design, and real-time machine intelligence.",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Raghav Tirumale",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Raghav Tirumale",
    description:
      "Engineer working close to the metal — GPU kernels, processor design, and real-time machine intelligence.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
