"use client";

import React, { useEffect, useRef } from 'react';

const AsciiFluid = () => {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const width = 160;
    const height = 56;
    const buffer = new Array(width * height);
    
    // Extended character set for smoother gradients
    // Ordered from empty to solid
    const chars = "       .,-~:;=!*#$@"; 

    let time = 0;

    const numBlobs = 18;
    const blobs = Array.from({length: numBlobs}, (_, i) => ({
        // Start mostly centered
        x: width / 2,
        y: height / 2,
        // Random phase and speeds
        kx: (Math.random() - 0.5) * 2, 
        ky: (Math.random() - 0.5) * 2,
        speed: 0.2 + Math.random() * 0.4,
        offset: Math.random() * 100,
        radius: 5 + Math.random() * 8
    }));

    const renderFrame = () => {
        time += 0.005;

        // Update blob positions
        blobs.forEach(b => {
            // Complex orbital movement
            // Lissajous curves confined to the container
            b.x = (width / 2) + Math.sin(time * b.speed + b.offset) * (width * 0.35) + Math.cos(time * 0.2 * b.speed) * 15;
            b.y = (height / 2) + Math.cos(time * b.speed * 0.8 + b.offset) * (height * 0.35) + Math.sin(time * 0.3 * b.speed) * 8;
            
            // Breathing radius - Significantly smaller
            b.radius = 9 + Math.sin(time * 3 + b.offset) * 3;
        });

        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                let sumField = 0;
                
                for(let b of blobs) {
                    const dx = x - b.x;
                    const dy = (y - b.y) * 2.2; // Aspect ratio correction
                    const rSq = b.radius * b.radius;
                    const distSq = dx*dx + dy*dy;
                    
                    // Metaball formula: R^2 / D^2
                    // Tighter falloff with smaller epsilon and higher multiplier to maintain core intensity
                    sumField += (rSq * 2.5) / (distSq + 8);
                }

                const idx = x + y * width;
                
                // Map field intensity to character
                
                // Higher threshold (0.95) increases separation ("death ratio") between blobs
                let val = sumField;
                let norm = (val - 0.95) * 0.7;
                
                if (norm < 0) norm = 0;
                if (norm > 1) norm = 1;
                
                const charIdx = Math.floor(norm * (chars.length - 1));
                buffer[idx] = chars[charIdx];
            }
        }

        if (preRef.current) {
            let output = "";
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    output += buffer[x + y * width];
                }
                output += "\n";
            }
            preRef.current.innerText = output;
        }
        
        requestAnimationFrame(renderFrame);
    };

    const animationId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="w-full flex justify-center overflow-hidden my-8" aria-hidden="true">
        <pre 
        ref={preRef} 
        className="text-[10px] leading-[10px] font-mono whitespace-pre text-[#282828] select-none"
        />
    </div>
  );
};

export default AsciiFluid;
