"use client";

import React from "react";
import AsciiFluid from "@/components/AsciiFluid";

export default function Home() {
  return (
    <main className="bg-white min-h-screen selection:bg-black selection:text-white">
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        
        {/* Intro */}
        <div>
            <AsciiFluid />

            <h1 className="text-4xl font-sans font-medium tracking-tight mb-8 text-[#111]">
                Raghav Tirumale
            </h1>
            
            <div className="text-[#555] text-lg leading-relaxed max-w-2xl space-y-6">
                <p>
                    Currently at DeepGrove (YC S25), headed to Anduril. 8VC Engineering Fellow.
                </p>
                <p>
                    I write low-level code that makes machine intelligence run faster on hardware. Fell in love with working close to the metal early on and never looked back.
                </p>
                <p>
                    Outside of that I enjoy drinking teas, cook, meditate, solve sudoku way too fast, and enjoy long conversations with friends.
                </p>
                <p className="pt-2">
                    Say hi: tirumale [dot] raghav [at] gmail [dot] com
                </p>
            </div>
        </div>

      </div>
    </main>
  );
}
