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
    "Software engineer working on machine learning, autonomy, and efficient systems.",
  openGraph: {
    title: "Raghav Tirumale",
    description:
      "Software engineer working on machine learning, autonomy, and efficient systems.",
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
      "Software engineer working on machine learning, autonomy, and efficient systems.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
