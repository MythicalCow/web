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

function falloff(value: number, center: number, spread: number) {
  const normalized = (value - center) / spread;
  return Math.exp(-normalized * normalized);
}

function PortraitLines() {
  const lines = Array.from({ length: 42 }, (_, column) => {
    const u = -0.98 + (column / 41) * 1.96;
    const side = Math.abs(u);
    const top = 28 + 36 * Math.pow(side, 1.8);
    const bottom = 282 - 46 * Math.pow(side, 1.35);
    const points = Array.from({ length: 58 }, (_, sample) => {
      const t = sample / 57;
      const y = top + (bottom - top) * t;
      const yn = (y - 28) / 254;
      const rounded = 0.84 + 0.16 * Math.pow(Math.sin(Math.PI * t), 0.42);
      const jaw = 1 - 0.17 * Math.max(0, (yn - 0.55) / 0.45);
      let x = 160 + u * 118 * rounded * jaw;

      // Facial relief in the same three-quarter direction as the live canvas.
      x += 18 * falloff(u, 0, 0.12) * falloff(yn, 0.48, 0.2);
      x += 12 * falloff(u, 0, 0.16) * falloff(yn, 0.57, 0.075);
      x -= 7 * falloff(u, 0.24, 0.13) * falloff(yn, 0.39, 0.06);
      x += 6 * falloff(u, 0, 0.26) * falloff(yn, 0.7, 0.05);
      x += Math.sin(yn * 14 + u * 2) * 1.1 * (1 - side);

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      d: `M ${points.join(" L ")}`,
      opacity: 0.25 + (1 - side) * 0.42,
    };
  });

  return (
    <svg
      width="350"
      height="350"
      viewBox="0 0 330 320"
      style={{ position: "absolute", right: 58, bottom: 42 }}
    >
      {lines.map((line, index) => (
        <path
          key={index}
          d={line.d}
          fill="none"
          stroke={index % 8 === 0 ? "#C99169" : "#B1744E"}
          strokeWidth={index % 8 === 0 ? 1.1 : 0.75}
          strokeLinecap="round"
          opacity={line.opacity}
        />
      ))}
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
          background: "#0B0A0A",
          color: "#F0EDE9",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 76, marginTop: 190 }}>
          <div style={{ fontSize: 78, fontWeight: 500, letterSpacing: "-2px" }}>raghav tirumale</div>
          <div style={{ width: 690, marginTop: 26, fontSize: 28, lineHeight: 1.4, color: "#A7A19B" }}>
            {description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: 82,
            top: 112,
            color: "#76503B",
            fontSize: 15,
            letterSpacing: 3,
          }}
        >
          FORM STUDY / 01
        </div>
        <PortraitLines />
      </div>
    ),
    size
  );
}
