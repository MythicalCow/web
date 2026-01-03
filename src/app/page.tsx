"use client";

import React, { useState, useRef, useEffect } from "react";
import AsciiFluid from "@/components/AsciiFluid";
import Plug from "@/components/Plug";

export default function Home() {
  const [isPlugged, setIsPlugged] = useState(true);
  const graphicsCardRef = useRef<HTMLDivElement>(null);

  // Apply dark mode to document
  useEffect(() => {
    if (isPlugged) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [isPlugged]);

  return (
    <main className="bg-white dark:bg-[#0a0a0a] min-h-screen selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        
        {/* Intro */}
        <div>
            <div ref={graphicsCardRef} className="relative">
              <AsciiFluid />
            </div>
            <Plug 
              isPlugged={isPlugged} 
              onPlugChange={setIsPlugged}
              graphicsCardRef={graphicsCardRef}
            />

            <h1 className="text-4xl font-sans font-medium tracking-tight mb-8 text-[#111] dark:text-[#e5e5e5] transition-colors duration-300">
                Raghav Tirumale
            </h1>
            
            <div className="text-[#555] dark:text-[#a0a0a0] text-lg leading-relaxed max-w-2xl space-y-6 transition-colors duration-300">
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
