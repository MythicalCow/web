import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Raghav Tirumale";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const description =
  "Engineer working close to the metal — GPU kernels, processor design, and real-time machine intelligence.";

function Lattice() {
  const nodes: { x: number; y: number; lit: boolean }[] = [];
  const cols = 8;
  const rows = 6;
  const cell = 28;
  const ox = 0;
  const oy = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - 2.1;
      const dy = y - 2.3;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const lit = Math.abs(distance - 2.25) < 0.55;
      nodes.push({ x: ox + x * cell + y * 8, y: oy + y * cell, lit });
    }
  }

  return (
    <svg width="330" height="260" viewBox="-20 -20 330 260" style={{ position: "absolute", right: 70, bottom: 62 }}>
      <g transform="skewX(-12) rotate(-8 130 100)">
        {nodes.map((node, i) => {
          const right = i + 1;
          const down = i + cols;
          return (
            <g key={`e-${i}`}>
              {i % cols !== cols - 1 && (
                <line x1={node.x} y1={node.y} x2={nodes[right].x} y2={nodes[right].y} stroke="#1D1D1F" strokeWidth="1" />
              )}
              {down < nodes.length && (
                <line x1={node.x} y1={node.y} x2={nodes[down].x} y2={nodes[down].y} stroke="#1D1D1F" strokeWidth="1" />
              )}
            </g>
          );
        })}
        {nodes.map((node, i) => (
          <rect
            key={`n-${i}`}
            x={node.x - 2}
            y={node.y - 2}
            width="4"
            height="4"
            fill={node.lit ? "#F5F5F4" : "#5C5C59"}
            opacity={node.lit ? 0.55 : 0.72}
          />
        ))}
      </g>
    </svg>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0A0A0B",
          color: "#F5F5F4",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 76, marginTop: 190 }}>
          <div style={{ fontSize: 78, fontWeight: 500, letterSpacing: "-2px" }}>raghav tirumale</div>
          <div style={{ width: 690, marginTop: 26, fontSize: 28, lineHeight: 1.4, color: "#A6A6A3" }}>
            {description}
          </div>
        </div>
        <Lattice />
      </div>
    ),
    size
  );
}
