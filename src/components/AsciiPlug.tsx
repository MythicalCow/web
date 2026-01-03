"use client";

import React, { useEffect, useRef, useState } from "react";

interface AsciiPlugProps {
  isPlugged: boolean;
}

export default function AsciiPlug({ isPlugged }: AsciiPlugProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ cols: 8, rows: 18 });

  // Measure character width for accurate sizing
  useEffect(() => {
    const measureAndResize = () => {
      if (!containerRef.current) return;

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

      // Fixed dimensions for plug: 8 columns, 18 rows (same height as card)
      const cols = 8;
      const rows = 18;
      setDimensions((prev) => (prev.cols === cols && prev.rows === rows ? prev : { cols, rows }));
    };

    measureAndResize();
    window.addEventListener("resize", measureAndResize);
    return () => window.removeEventListener("resize", measureAndResize);
  }, []);

  useEffect(() => {
    const { cols, rows } = dimensions;

    const renderPlug = () => {
      const grid: string[][] = Array.from({ length: rows }, () => new Array(cols).fill(" "));

      // Plug connector (left side) - aligns with card pins
      const connectorX = 0;
      const marginY = 2;
      const plugY0 = marginY;
      const plugY1 = rows - marginY - 1;

      // Connector pins that match the card's pin positions
      // Card pins are at: chipY0 + 2, chipY0 + 4, ..., chipY1 - 2
      // So plug pins should be at: plugY0 + 2, plugY0 + 4, ..., plugY1 - 2
      for (let y = plugY0 + 2; y <= plugY1 - 2; y += 2) {
        if (isPlugged) {
          grid[y][connectorX] = "█"; // Solid when connected
        } else {
          grid[y][connectorX] = "▓"; // Lighter when disconnected
        }
      }

      // Plug body
      const bodyX0 = 1;
      const bodyX1 = cols - 1;
      
      // Outer border
      for (let x = bodyX0; x <= bodyX1; x++) {
        grid[plugY0][x] = "█";
        grid[plugY1][x] = "█";
      }
      for (let y = plugY0; y <= plugY1; y++) {
        grid[y][bodyX1] = "█";
      }

      // Inner texture
      const ix0 = bodyX0 + 1;
      const ix1 = bodyX1 - 1;
      const iy0 = plugY0 + 1;
      const iy1 = plugY1 - 1;

      for (let y = iy0; y <= iy1; y++) {
        for (let x = ix0; x <= ix1; x++) {
          const vx = x - ix0;
          const vy = y - iy0;
          
          // Simple texture pattern
          if (vx % 3 === 0 || vy % 2 === 0) {
            grid[y][x] = isPlugged ? "▒" : "░";
          } else {
            grid[y][x] = isPlugged ? "▓" : "▒";
          }
        }
      }

      // Cable (extends downward)
      const cableX = Math.floor(cols / 2);
      for (let y = plugY1 + 1; y < rows; y++) {
        grid[y][cableX] = isPlugged ? "▓" : "▒";
      }

      const output = grid.map((row) => row.join("")).join("\n") + "\n";
      if (preRef.current) preRef.current.textContent = output;
    };

    renderPlug();
  }, [dimensions.cols, dimensions.rows, isPlugged]);

  return (
    <div ref={containerRef} className="inline-block overflow-hidden" aria-hidden="true">
      <pre
        ref={preRef}
        className="inline-block text-[11px] leading-[11px] font-mono whitespace-pre text-[#666] dark:text-[#888] select-none transition-colors duration-300"
      />
    </div>
  );
}

