"use client";

import React, { useEffect, useRef, useState } from "react";

export default function AsciiFluid() {
  const preRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ cols: 61, rows: 18 });

  // Measure character width for accurate sizing (so we can truly fill the container).
  useEffect(() => {
    const measureAndResize = () => {
      if (!containerRef.current) return;

      // Create hidden span to measure a single monospace glyph width.
      const span = document.createElement("span");
      const preStyle = preRef.current ? getComputedStyle(preRef.current) : null;
      span.style.fontFamily = preStyle?.fontFamily ?? "ui-monospace, monospace";
      span.style.fontSize = preStyle?.fontSize ?? "11px";
      span.style.fontWeight = preStyle?.fontWeight ?? "400";
      span.style.letterSpacing = preStyle?.letterSpacing ?? "normal";
      span.style.visibility = "hidden";
      span.style.position = "absolute";
      span.textContent = "M";
      document.body.appendChild(span);
      const charWidth = span.getBoundingClientRect().width;
      document.body.removeChild(span);

      const containerWidth = containerRef.current.offsetWidth;
      // Leave 1 column of slack to avoid occasional wrapping from subpixel rounding.
      let cols = Math.floor(containerWidth / Math.max(1, charWidth)) - 1;
      cols = Math.max(41, cols);
      // Force odd column count so the art can be perfectly symmetric around a true center column.
      if (cols % 2 === 0) cols -= 1;

      const rows = 18;
      setDimensions((prev) => (prev.cols === cols && prev.rows === rows ? prev : { cols, rows }));
    };

    measureAndResize();
    window.addEventListener("resize", measureAndResize);
    return () => window.removeEventListener("resize", measureAndResize);
  }, []);

  useEffect(() => {
    const { cols, rows } = dimensions;
    const center = Math.floor(cols / 2);

    // Simple deterministic noise (so it doesn't feel "tweaky"/random-chaotic).
    const noise01 = (x: number, y: number, t: number) => {
      // 32-bit integer hash -> [0,1)
      let n = (x * 374761393 + y * 668265263 + t * 69069) | 0;
      n = (n ^ (n >>> 13)) | 0;
      n = Math.imul(n, 1274126177);
      n = (n ^ (n >>> 16)) >>> 0;
      return n / 4294967296;
    };

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const makeOdd = (v: number) => (v % 2 === 0 ? v - 1 : v);

    const renderFrame = (frame: number) => {
      const grid: string[][] = Array.from({ length: rows }, () => new Array(cols).fill(" "));

      // CHIP / WAFER VIGNETTE
      // Goal: blocky, symmetric, "silicon die" vibe using ░▒▓█.

      const marginX = 2;
      const marginY = 2;

      const chipX0 = marginX;
      const chipY0 = marginY;
      const chipX1 = cols - marginX - 1;
      const chipY1 = rows - marginY - 1;

      const pinLeftX = chipX0 - 1;
      const pinRightX = chipX1 + 1;

      const ix0 = chipX0 + 1;
      const ix1 = chipX1 - 1;
      const iy0 = chipY0 + 1;
      const iy1 = chipY1 - 1;
      const iw = Math.max(1, ix1 - ix0 + 1);
      const ih = Math.max(1, iy1 - iy0 + 1);

      // Outer chip border.
      for (let x = chipX0; x <= chipX1; x++) {
        grid[chipY0][x] = "█";
        grid[chipY1][x] = "█";
      }
      for (let y = chipY0; y <= chipY1; y++) {
        grid[y][chipX0] = "█";
        grid[y][chipX1] = "█";
      }

      // Pins (subtle).
      for (let y = chipY0 + 2; y <= chipY1 - 2; y += 2) {
        if (pinLeftX >= 0) grid[y][pinLeftX] = "▓";
        if (pinRightX < cols) grid[y][pinRightX] = "▓";
      }

      // A small orientation mark.
      const notchX = chipX0 + 2;
      const notchY = chipY0;
      if (notchY >= 0 && notchY < rows && notchX >= 0 && notchX < cols) {
        grid[notchY][notchX] = "▓";
      }

      // Inner "core" block.
      let coreW = makeOdd(Math.floor(iw * 0.45));
      let coreH = makeOdd(Math.floor(ih * 0.55));
      coreW = clamp(coreW, 9, iw - (iw % 2 === 0 ? 3 : 2));
      coreH = clamp(coreH, 5, ih - 2);
      coreW = makeOdd(coreW);
      coreH = makeOdd(coreH);

      const coreX0 = center - Math.floor(coreW / 2);
      const coreX1 = coreX0 + coreW - 1;
      const coreY0 = iy0 + Math.floor((ih - coreH) / 2);
      const coreY1 = coreY0 + coreH - 1;

      // Fill interior with a stable "circuit" texture (symmetric), then overlay dynamic "activity"
      // via flowing and pulsing effects each tick (also symmetric).
      for (let y = iy0; y <= iy1; y++) {
        const vy = y - iy0;
        for (let x = ix0; x <= ix1; x++) {
          const vx = x - ix0;
          const mirrorX = Math.min(vx, (iw - 1) - vx); // symmetry

          const inCore = x >= coreX0 && x <= coreX1 && y >= coreY0 && y <= coreY1;
          const gridLine = vx % 6 === 0 || vy % 3 === 0;

          // Stable seed (doesn't "tweak" each frame).
          const n = noise01(mirrorX, vy, 1337);

          let ch: string;
          if (inCore) {
            const n2 = noise01(Math.min(x - coreX0, coreX1 - x), y - coreY0, 4242);
            ch = n2 < 0.18 ? "▓" : "▒";

            // Dynamic "activity" blocks with multiple layers of animation:
            // - Flowing ripple effect
            // - Pulsing core intensity
            // - Activity waves
            const ax = Math.min(x - coreX0, coreX1 - x);
            const ay = y - coreY0;

            // Flowing ripple across core (left to right)
            const ripple = (ax + frame * 0.8) % coreW;
            const rippleIntensity = Math.max(0, 1 - Math.abs(ripple - coreW / 2) / (coreW / 3));

            // Pulsing core (slower cycle)
            const pulse = (Math.sin(frame * 0.1) + 1) * 0.5;

            // Activity hotspots
            const a = noise01(ax, ay, frame * 97);
            const aIntensity = rippleIntensity * 0.6 + pulse * 0.4;

            if (a < 0.04 + aIntensity * 0.08) ch = "█";
            else if (a < 0.1 + aIntensity * 0.12) ch = "▓";
          } else {
            if (gridLine) ch = "▒";
            else if (n < 0.035) ch = "▓";
            else if (n < 0.09) ch = "▒";
            else ch = "░";
          }

          grid[y][x] = ch;
        }
      }

      const output = grid.map((row) => row.join("")).join("\n") + "\n";
      if (preRef.current) preRef.current.textContent = output;
    };

    // Higher framerate for smooth, fluid animation.
    let frame = 0;
    renderFrame(frame);
    const intervalId = window.setInterval(() => {
      frame += 1;
      renderFrame(frame);
    }, 80); // ~12.5 fps (production-grade smooth animation)

    return () => window.clearInterval(intervalId);
  }, [dimensions.cols, dimensions.rows]);

  return (
    <div ref={containerRef} className="w-full flex justify-start overflow-hidden mt-2 mb-8" aria-hidden="true">
      <pre
        ref={preRef}
        className="inline-block text-[11px] leading-[11px] font-mono whitespace-pre text-[#666] dark:text-[#888] select-none transition-colors duration-300"
      />
    </div>
  );
}
