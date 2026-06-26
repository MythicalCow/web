import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from "@/components/Navigation";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
