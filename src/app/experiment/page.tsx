"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const ParticleMetamorphosis = dynamic(
  () => import("@/components/ParticleMetamorphosis"),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-[#fafafa]">
        <div className="text-neutral-400 animate-pulse">Loading visualization...</div>
      </div>
    )
  }
);

export default function ExperimentPage() {
  return (
    <main className="min-h-screen bg-[#fafafa] overflow-hidden">
      {/* Name overlay - centered both horizontally and vertically */}
      <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
        <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-neutral-700">
        </h1>
      </div>
      <Link
        href="/"
        className="fixed top-6 right-6 z-30 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 bg-white/60 backdrop-blur-md border border-neutral-200 rounded-full transition-colors duration-200"
      >
        ← Back
      </Link>

      {/* Particle visualization */}
      <ParticleMetamorphosis />
    </main>
  );
}
