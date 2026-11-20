/* A seated figure meditating beneath a tree, drawn as tapered brush strokes
   and woodcut-style filled shapes. Everything is deterministic so SSR is stable. */

const INK = "#1c1a17";
const PAPER = "var(--paper, #ece6d6)";

type Pt = [number, number];

export function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/* Catmull-Rom through control points, sampled evenly-ish. */
function spline(pts: Pt[], samples = 40): Pt[] {
  const out: Pt[] = [];
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let k = 0; k < samples; k++) {
      const t = k / samples, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/* A brush stroke: a filled polygon whose width swells and tapers. */
export function brush(pts: Pt[], w: number, opts: { start?: number; end?: number; seed?: number; wobble?: number } = {}) {
  const { start = 0.15, end = 0.1, seed = 1, wobble = 0.12 } = opts;
  const r = rng(seed * 7919 + 13);
  const line = spline(pts, 24);
  const n = line.length;
  const left: Pt[] = [], right: Pt[] = [];
  const phase = r() * 6;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const rise = Math.min(1, t / 0.18), fall = Math.min(1, (1 - t) / 0.3);
    const prof = Math.max(start + (1 - start) * Math.sin((rise * Math.PI) / 2), 0) *
      Math.max(end + (1 - end) * Math.sin((fall * Math.PI) / 2), 0);
    const hw = (w / 2) * prof * (1 + wobble * Math.sin(t * 9 + phase));
    left.push([line[i][0] - dy * hw, line[i][1] + dx * hw]);
    right.push([line[i][0] + dy * hw, line[i][1] - dx * hw]);
  }
  const ring = [...left, ...right.reverse()];
  return "M" + ring.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
}

/* An irregular rounded blob (for the canopy masses). */
function blob(cx: number, cy: number, rx: number, ry: number, seed: number) {
  const r = rng(seed);
  const k = [r() * 6, r() * 6, r() * 6];
  const pts: Pt[] = [];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const m = 1 + 0.09 * Math.sin(3 * a + k[0]) + 0.06 * Math.sin(5 * a + k[1]) + 0.04 * Math.sin(8 * a + k[2]);
    pts.push([cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m]);
  }
  const s = spline([...pts, pts[0], pts[1]], 6).slice(6);
  return "M" + s.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
}

const CANOPY: [number, number, number, number][] = [
  [150, 250, 100, 78],
  [250, 178, 118, 92],
  [352, 230, 104, 80],
  [262, 292, 120, 62],
  [78, 312, 58, 44],
  [432, 300, 66, 46],
  [178, 140, 70, 54],
];

function insideCanopy(x: number, y: number, margin: number) {
  return CANOPY.some(([cx, cy, rx, ry]) => ((x - cx) / (rx - margin)) ** 2 + ((y - cy) / (ry - margin)) ** 2 < 1);
}

/* Woodcut gouges: short paper-coloured flicks carved out of the dark canopy,
   running in loose arcs so the mass reads as foliage without drawing leaves. */
function canopyCuts() {
  const r = rng(42);
  const cuts: string[] = [];
  for (let row = 0; row < 32; row++) {
    const y0 = 90 + row * 9;
    for (let x = 20 + (row % 2) * 8; x < 520; x += 12 + r() * 9) {
      const y = y0 + Math.sin(x * 0.03 + row) * 4 + (r() - 0.5) * 4;
      if (!insideCanopy(x, y, 16)) continue;
      // lighter toward the upper right where the sun is, darker underneath
      const lit = 0.5 + (x - 280) / 500 - (y - 220) / 260;
      if (r() > 0.1 + lit * 0.62) continue;
      const len = 7 + r() * 9;
      const tilt = -0.35 + r() * 0.25;
      cuts.push(
        brush([[x, y], [x + len * 0.5, y + len * tilt * 0.5 - 2], [x + len, y + len * tilt]], 2.6 + r() * 1.4, { seed: row * 100 + x, start: 0.3, end: 0.05 }),
      );
    }
  }
  return cuts;
}

function fallingLeaves() {
  const spots: [number, number, number][] = [[478, 400, 0.7], [452, 468, -0.3], [112, 418, 1.1]];
  return spots.map(([x, y, a], i) => {
    const c = Math.cos(a), s = Math.sin(a);
    return brush([[x - 7 * c, y - 7 * s], [x + 2 * s, y - 2 * c], [x + 7 * c, y + 7 * s]], 5.5, { seed: 900 + i, start: 0.05, end: 0.05, wobble: 0 });
  });
}

/* Heart-shaped peepal leaves poking out from the canopy outline. */
function edgeLeaves() {
  const r = rng(77);
  const out: string[] = [];
  CANOPY.forEach(([cx, cy, rx, ry], bi) => {
    const n = Math.round((rx + ry) / 14);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.3;
      const x = cx + Math.cos(a) * rx * 0.98, y = cy + Math.sin(a) * ry * 0.98;
      if (insideCanopy(x + Math.cos(a) * 6, y + Math.sin(a) * 6, -2)) continue; // buried in another lobe
      if (y > 330 && Math.sin(a) > 0.2 && r() < 0.5) continue;
      const ang = a + (r() - 0.5) * 0.9;
      const L = 9 + r() * 6;
      const c = Math.cos(ang), sn = Math.sin(ang);
      const P = (u: number, v: number) => `${(x + c * u - sn * v).toFixed(1)},${(y + sn * u + c * v).toFixed(1)}`;
      out.push(
        `M${P(0, 0)} C${P(L * 0.1, -L * 0.42)} ${P(L * 0.6, -L * 0.5)} ${P(L * 0.75, -L * 0.22)} ` +
          `C${P(L * 0.86, -L * 0.08)} ${P(L * 0.95, 0)} ${P(L * 1.3, 0)} ` +
          `C${P(L * 0.95, 0)} ${P(L * 0.86, L * 0.08)} ${P(L * 0.75, L * 0.22)} ` +
          `C${P(L * 0.6, L * 0.5)} ${P(L * 0.1, L * 0.42)} ${P(0, 0)}Z`,
      );
      void bi;
    }
  });
  return out;
}

const MOTION_CSS = `
@keyframes md-sway { from { transform: rotate(-0.7deg); } to { transform: rotate(0.7deg); } }
@keyframes md-fall {
  0%   { transform: translate(0, -70px) rotate(0deg); opacity: 0; }
  12%  { opacity: 1; }
  45%  { transform: translate(var(--dx), calc(var(--dy) * 0.35)) rotate(110deg); }
  88%  { opacity: 1; }
  100% { transform: translate(calc(var(--dx) * -0.4), var(--dy)) rotate(230deg); opacity: 0; }
}
@keyframes md-birds { 0%, 100% { transform: translate(-10px, 3px); } 50% { transform: translate(8px, -5px); } }
.md-canopy { transform-box: view-box; transform-origin: 236px 360px; animation: md-sway 7s ease-in-out infinite alternate; }
.md-leaf { transform-box: fill-box; transform-origin: center; animation: md-fall var(--t) linear infinite; animation-delay: var(--delay); }
.md-birds { transform-box: view-box; animation: md-birds 16s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .md-canopy, .md-leaf, .md-birds { animation: none; } .md-leaf { opacity: 0; } }
`;

/* leaves that drift down from the canopy when animated: start, sideways drift, drop, duration, delay */
const DRIFTERS: [number, number, number, number, number, number][] = [
  [300, 360, 22, 190, 13, 0],
  [180, 380, -18, 170, 11, -4],
  [430, 330, 26, 220, 15, -9],
  [110, 360, 14, 190, 12, -6],
  [360, 300, -20, 250, 17, -12],
];

function leafPath(x: number, y: number, a: number, L = 7) {
  const c = Math.cos(a), s = Math.sin(a);
  return brush([[x - L * c, y - L * s], [x + 2 * s, y - 2 * c], [x + L * c, y + L * s]], 5.5, { seed: Math.round(x * 3 + y), start: 0.05, end: 0.05, wobble: 0 });
}

export default function MeditationDrawing({
  className = "",
  showSun = true,
  foliage = INK,
  animated = false,
}: {
  className?: string;
  showSun?: boolean;
  /** ink colour for the canopy + leaves; a second colour prints as its own, slightly off-register plate */
  foliage?: string;
  animated?: boolean;
}) {
  const GROUND = 572;
  const cuts = canopyCuts();
  const twoColour = foliage !== INK;
  return (
    <svg viewBox="0 0 560 640" className={className || "block h-auto w-full"} role="img" aria-label="An ink drawing of a person meditating cross-legged under a tree">
      {animated && <style>{MOTION_CSS}</style>}
      <g fill={INK}>
        <g className={animated ? "md-birds" : undefined}>
        {/* distant birds */}
        {[[370, 70, 1], [392, 54, 0.8], [406, 80, 0.7]].map(([x, y, k], i) => (
          <path key={i} d={brush([[x - 9 * k, y - 3 * k], [x - 4 * k, y - 4 * k], [x, y], [x + 4 * k, y - 5 * k], [x + 10 * k, y - 3 * k]], 2.4 * k, { seed: 600 + i, start: 0.1, end: 0.1, wobble: 0 })} />
        ))}
        </g>
        {/* sun, as a loose brushed ring */}
        {showSun && <path d={brush([[470, 64], [505, 84], [508, 124], [478, 150], [440, 142], [424, 108], [440, 74], [474, 66]], 4, { seed: 3, start: 0.2, end: 0.4 })} />}

        {/* trunk + limbs (drawn before canopy so the canopy overlaps them) */}
        <path d={brush([[194, GROUND + 4], [204, 520], [204, 460], [212, 400], [232, 330], [246, 270]], 50, { seed: 11, start: 1, end: 0.3, wobble: 0.05 })} />
        <path d={`M160,${GROUND + 3} C186,${GROUND - 4} 190,${GROUND - 40} 192,${GROUND - 70} L216,${GROUND - 70} C218,${GROUND - 40} 226,${GROUND - 4} 252,${GROUND + 3} Z`} />
        <path d={brush([[210, 410], [176, 352], [126, 304]], 20, { seed: 12, start: 1, end: 0.2 })} />
        <path d={brush([[222, 380], [276, 330], [338, 296]], 20, { seed: 13, start: 1, end: 0.2 })} />
        <path d={brush([[228, 310], [258, 250], [250, 200]], 12, { seed: 14, start: 1, end: 0.2 })} />
        <path d={brush([[206, 430], [190, 400], [150, 372], [112, 362]], 10, { seed: 17, start: 1, end: 0.1 })} />
        <path d={brush([[150, 372], [140, 356], [142, 340]], 5, { seed: 18, start: 1, end: 0.1 })} />
        <path d={brush([[290, 318], [300, 340], [318, 350]], 5, { seed: 19, start: 1, end: 0.1 })} />
        {/* roots */}
        <path d={brush([[202, GROUND - 16], [196, GROUND - 2], [186, GROUND + 6]], 9, { seed: 23, start: 1, end: 0.1 })} />
        <path d={brush([[196, GROUND - 22], [176, GROUND - 4], [150, GROUND + 2]], 14, { seed: 15, start: 1, end: 0.1 })} />
        <path d={brush([[212, GROUND - 20], [232, GROUND - 4], [262, GROUND + 1]], 14, { seed: 16, start: 1, end: 0.1 })} />

        {/* ground: one long confident stroke plus a few shorter ones */}
        <path d={brush([[20, GROUND + 3], [200, GROUND], [380, GROUND + 2], [540, GROUND - 1]], 5, { seed: 31, start: 0.1, end: 0.1 })} />
        <path d={brush([[70, GROUND + 22], [150, GROUND + 20], [230, GROUND + 23]], 3, { seed: 32 })} />
        <path d={brush([[300, GROUND + 18], [420, GROUND + 16], [500, GROUND + 19]], 3, { seed: 33 })} />
        <path d={brush([[150, GROUND + 42], [260, GROUND + 40], [330, GROUND + 43]], 2.4, { seed: 34 })} />
        {/* grass tufts */}
        {[[60, 0], [268, 1], [470, 2], [520, 3], [28, 4], [140, 5], [490, 6]].map(([x, s]) => (
          <g key={x}>
            <path d={brush([[x, GROUND + 1], [x - 3, GROUND - 9], [x - 8, GROUND - 16]], 3, { seed: 40 + s, start: 1, end: 0.05 })} />
            <path d={brush([[x + 3, GROUND + 1], [x + 4, GROUND - 12], [x + 9, GROUND - 19]], 3, { seed: 50 + s, start: 1, end: 0.05 })} />
          </g>
        ))}

        {/* --- the sitter --- */}
        {/* woven mat */}
        <path d={`M300,${GROUND - 1} L462,${GROUND - 1} L470,${GROUND + 9} L292,${GROUND + 9} Z`} />
        {/* crossed legs */}
        <path d={`M318,${GROUND - 2} C316,${GROUND - 24} 340,${GROUND - 36} 380,${GROUND - 34} C420,${GROUND - 36} 446,${GROUND - 24} 444,${GROUND - 2} C410,${GROUND + 4} 350,${GROUND + 4} 318,${GROUND - 2} Z`} />
        {/* torso, slightly tapered, sitting tall */}
        <path d={`M347,${GROUND - 26} C342,${GROUND - 66} 344,${GROUND - 92} 354,${GROUND - 103} C364,${GROUND - 112} 400,${GROUND - 112} 410,${GROUND - 103} C420,${GROUND - 92} 421,${GROUND - 66} 415,${GROUND - 26} Z`} />
        {/* neck + head, gently bowed */}
        <path d={brush([[381, GROUND - 106], [381, GROUND - 121]], 14, { seed: 60, start: 1, end: 1, wobble: 0 })} />
        <ellipse cx={382} cy={GROUND - 136} rx={15} ry={17} transform={`rotate(8 382 ${GROUND - 136})`} />
        {/* topknot */}
        {/* short, slightly messy hair */}
        <path d={`M365,${GROUND - 136} C362,${GROUND - 150} 368,${GROUND - 160} 378,${GROUND - 162} C384,${GROUND - 163} 390,${GROUND - 161} 394,${GROUND - 158} C399,${GROUND - 157} 403,${GROUND - 150} 400,${GROUND - 140} L398,${GROUND - 134} C395,${GROUND - 143} 390,${GROUND - 147} 384,${GROUND - 147} C378,${GROUND - 147} 372,${GROUND - 143} 368,${GROUND - 140} Z`} />
        {/* fringe sweeping to one side */}
        <path d={brush([[366, GROUND - 150], [376, GROUND - 146], [388, GROUND - 145], [397, GROUND - 141]], 6, { seed: 63, start: 0.6, end: 0.1, wobble: 0 })} />
        {/* ears */}
        <ellipse cx={366.5} cy={GROUND - 134} rx={3.2} ry={5} />
        <ellipse cx={397.5} cy={GROUND - 133} rx={3.2} ry={5} />
        {/* paper-coloured carving: arms and folds read through the silhouette */}
        <g fill={PAPER}>
          {/* left arm line: shoulder → elbow → hands in lap */}
          <path d={brush([[357, GROUND - 96], [348, GROUND - 68], [353, GROUND - 46], [374, GROUND - 38]], 3.2, { seed: 70, start: 0.2, end: 0.6 })} />
          <path d={brush([[405, GROUND - 96], [414, GROUND - 68], [409, GROUND - 46], [388, GROUND - 38]], 3.2, { seed: 71, start: 0.2, end: 0.6 })} />
          {/* hands cupped */}
          <path d={brush([[368, GROUND - 32], [381, GROUND - 27], [394, GROUND - 32]], 2.6, { seed: 72, start: 0.4, end: 0.4 })} />
          {/* the crossing of the shins */}
          <path d={brush([[332, GROUND - 14], [370, GROUND - 22], [410, GROUND - 12]], 2.6, { seed: 73, start: 0.1, end: 0.1 })} />
          <path d={brush([[352, GROUND - 6], [390, GROUND - 14], [432, GROUND - 8]], 2.2, { seed: 74, start: 0.1, end: 0.1 })} />
          {/* hairline */}
          <path d={brush([[368, GROUND - 139], [377, GROUND - 143], [389, GROUND - 146], [397, GROUND - 141]], 1.5, { seed: 93, start: 0.2, end: 0.2, wobble: 0 })} />
          {/* kurta collar + placket */}
          <path d={brush([[370, GROUND - 106], [376, GROUND - 101], [381, GROUND - 92], [386, GROUND - 101], [392, GROUND - 106]], 2, { seed: 94, start: 0.3, end: 0.3, wobble: 0 })} />
          <path d={brush([[381, GROUND - 92], [381, GROUND - 74]], 1.5, { seed: 99, start: 0.3, end: 0.1, wobble: 0 })} />
          {[GROUND - 86, GROUND - 79].map((y) => <circle key={y} cx={384.5} cy={y} r={1.2} />)}
          {/* knee folds */}
          <path d={brush([[324, GROUND - 6], [330, GROUND - 16], [342, GROUND - 22]], 1.6, { seed: 95, start: 0.1, end: 0.1 })} />
          <path d={brush([[438, GROUND - 6], [432, GROUND - 16], [420, GROUND - 22]], 1.6, { seed: 96, start: 0.1, end: 0.1 })} />
          {/* mat weave */}
          {Array.from({ length: 13 }).map((_, i) => (
            <path key={`m${i}`} d={brush([[306 + i * 12.5, GROUND + 1.5], [303 + i * 12.8, GROUND + 7.5]], 1.4, { seed: 700 + i, start: 0.6, end: 0.6, wobble: 0 })} />
          ))}
          {/* more bark */}
          <path d={brush([[184, GROUND - 40], [186, 500], [184, 470]], 1.6, { seed: 97, start: 0.1, end: 0.05 })} />
          <path d={brush([[220, 420], [226, 380], [238, 340]], 1.6, { seed: 98, start: 0.1, end: 0.05 })} />
          {/* closed eye, a single short arc */}
          <path d={brush([[373, GROUND - 136], [376.5, GROUND - 134], [380, GROUND - 136]], 1.8, { seed: 75, start: 0.3, end: 0.3, wobble: 0 })} />
          <path d={brush([[385, GROUND - 135], [388.5, GROUND - 133], [392, GROUND - 135]], 1.8, { seed: 76, start: 0.3, end: 0.3, wobble: 0 })} />
          {/* bark: a few long vertical gouges up the trunk */}
          <path d={brush([[190, GROUND - 14], [196, 490], [194, 430], [204, 380]], 2.6, { seed: 77, start: 0.1, end: 0.05 })} />
          <path d={brush([[210, GROUND - 30], [214, 500], [212, 452]], 2.2, { seed: 78, start: 0.1, end: 0.05 })} />
          <path d={brush([[202, 470], [206, 420], [218, 368], [230, 330]], 2, { seed: 79, start: 0.1, end: 0.05 })} />
        </g>

        {/* shade under the canopy: loose horizontal hatching */}
        {Array.from({ length: 7 }).map((_, i) => {
          const y = GROUND + 8 + i * 4.5;
          const x0 = 90 + i * 9, x1 = 300 - i * 14;
          return <path key={i} d={brush([[x0, y], [(x0 + x1) / 2, y - 1], [x1, y + 0.5]], 1.8, { seed: 80 + i })} />;
        })}

        {[[110, GROUND + 12, 5, 2.4], [126, GROUND + 14, 3, 1.6], [508, GROUND + 10, 4.5, 2.2], [282, GROUND + 30, 3.5, 1.8]].map(([x, y, rx, ry], i) => (
          <ellipse key={`s${i}`} cx={x} cy={y} rx={rx} ry={ry} />
        ))}
      </g>

      {/* foliage plate: canopy, its carved texture, and the leaves that fall from it */}
      <g transform={twoColour ? "translate(1.4 -1)" : undefined}>
        <g className={animated ? "md-canopy" : undefined} fill={foliage}>
        {/* canopy masses */}
          {CANOPY.map(([cx, cy, rx, ry], i) => <path key={i} d={blob(cx, cy, rx, ry, 100 + i)} />)}
          {edgeLeaves().map((d, i) => <path key={`e${i}`} d={d} />)}
          {/* aerial roots hanging from the lower limbs */}
          <path d={brush([[150, 340], [146, 380], [150, 420]], 2.2, { seed: 24, start: 1, end: 0.05 })} />
          <path d={brush([[278, 336], [276, 368], [282, 396]], 2, { seed: 25, start: 1, end: 0.05 })} />

          {/* a couple of hanging twigs below the canopy */}
          <path d={brush([[330, 330], [342, 352], [340, 372]], 4, { seed: 21, start: 1, end: 0.05 })} />
          <path d={brush([[96, 348], [92, 372], [100, 390]], 4, { seed: 22, start: 1, end: 0.05 })} />

          <g fill={PAPER}>
            {cuts.map((d, i) => <path key={i} d={d} />)}
          {/* lobe edges: carved arcs that separate the canopy masses */}
            {CANOPY.slice(0, 6).map(([cx, cy, rx, ry], i) => {
              const pts: Pt[] = [];
              for (let k = 0; k <= 8; k++) {
                const a = Math.PI * (0.12 + 0.76 * (k / 8));
                pts.push([cx + Math.cos(a) * (rx - 10), cy + Math.sin(a) * (ry - 9)]);
              }
              return <path key={i} d={brush(pts, 3.4, { seed: 300 + i, start: 0.05, end: 0.05 })} />;
            })}
          </g>
        </g>
        <g fill={foliage}>
          {!animated && fallingLeaves().map((d, i) => <path key={i} d={d} />)}
          {animated &&
            DRIFTERS.map(([x, y, dx, dy, t, delay], i) => (
              <path
                key={i}
                className="md-leaf"
                d={leafPath(x, y, 0.4 + i)}
                style={{ ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px`, ["--t" as string]: `${t}s`, ["--delay" as string]: `${delay}s` }}
              />
            ))}
        </g>
      </g>
    </svg>
  );
}
