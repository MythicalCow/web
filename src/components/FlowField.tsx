"use client";
import { useEffect, useRef } from "react";

const COUNT = 4200;
const FOCAL = 620;        // perspective focal length
const ROT_Y = 0.000045;   // rad/ms → ~140s per revolution (very slow)
const ROT_X = 0.000018;

type P3 = { x: number; y: number; z: number; r: number };

// Box-Muller gaussian, clamped so there are no far stragglers (keeps the
// cloud's silhouette contained with clear margin on every side).
function gauss(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(-2.2, Math.min(2.2, g));
}

export default function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0;
    let animId = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // Point cloud in model space: a vertical spindle, gaussian-dense at the
    // core so the silhouette dissolves softly at the edges. Units are scene
    // pixels; scaled to viewport below.
    // Dense, compact cloud of fine particles — a volumetric dust mass with a
    // bright gaussian-dense core dissolving to nothing at the edges.
    const SPREAD = Math.min(H * 0.12, 135);
    const pts: P3[] = Array.from({ length: COUNT }, () => ({
      x: gauss() * SPREAD * 0.92,
      y: gauss() * SPREAD * 1.06,
      z: gauss() * SPREAD * 0.92,
      r: 0.45 + Math.random() * 0.7,
    }));

    // Center of mass: centered in the open right-hand space (the canvas is
    // the right half of the viewport), vertically centered.
    const ox = () => W * 0.46;
    const oy = () => H * 0.5;

    // Cursor (canvas-local). Heavily damped smoothed position drives a local
    // brightening of particles near the pointer — the dense core follows it.
    let rawMX = -9999, rawMY = -9999, hasMouse = false;
    let smX = ox(), smY = oy();
    const GLOW_R = 150;     // radius of influence in px
    const GLOW_R2 = GLOW_R * GLOW_R;
    const GLOW_STRENGTH = 0.5;

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      rawMX = e.clientX - rect.left;
      rawMY = e.clientY - rect.top;
      hasMouse = true;
    }
    function onLeave() { hasMouse = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);

    // Satellite orbit (in the cloud's rotating frame).
    const SAT_R = SPREAD * 2.35;     // orbit radius, just outside the cloud
    const SAT_INCL = 0.62;           // orbital inclination (rad)
    const SAT_SPEED = (Math.PI * 2) / 19000; // ~19s per orbit

    function draw(ay: number, ax: number, breath: number, time: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      const cosY = Math.cos(ay), sinY = Math.sin(ay);
      const cosX = Math.cos(ax), sinX = Math.sin(ax);
      const cX = ox(), cY = oy();

      // Project a model-space point through the shared camera rotation.
      const project = (px: number, py: number, pz: number) => {
        let x = px * cosY - pz * sinY;
        let z = px * sinY + pz * cosY;
        let y = py;
        const y2 = y * cosX - z * sinX;
        z = y * sinX + z * cosX;
        y = y2;
        const denom = FOCAL + z;
        const scale = FOCAL / denom;
        return { sx: cX + x * scale, sy: cY + y * scale, scale, z, denom };
      };

      // Depth sort: far points first so near points layer on top.
      const proj: { sx: number; sy: number; rad: number; a: number; z: number }[] = [];

      for (const p of pts) {
        const px = p.x * breath, py = p.y * breath, pz = p.z * breath;
        // rotate Y
        let x = px * cosY - pz * sinY;
        let z = px * sinY + pz * cosY;
        let y = py;
        // rotate X
        const y2 = y * cosX - z * sinX;
        z = y * sinX + z * cosX;
        y = y2;

        const denom = FOCAL + z;
        if (denom <= 1) continue;
        const scale = FOCAL / denom;
        const sx = cX + x * scale;
        const sy = cY + y * scale;

        // Depth → brightness & size. Near (z<0) brighter/larger.
        const depth = (z + SPREAD * 1.4) / (SPREAD * 2.8); // ~0 far, ~1 near
        const dn = Math.max(0, Math.min(1, depth));
        let a = (0.08 + dn * 0.40);
        let rad = p.r * scale * (0.7 + dn * 0.7);

        // Local cursor glow: brighten + slightly enlarge near the pointer.
        if (hasMouse) {
          const mdx = sx - smX, mdy = sy - smY;
          const d2 = mdx * mdx + mdy * mdy;
          if (d2 < GLOW_R2) {
            const f = 1 - d2 / GLOW_R2; // 1 at pointer → 0 at radius
            const g = f * f;
            a += g * GLOW_STRENGTH;
            rad *= 1 + g * 0.6;
          }
        }
        proj.push({ sx, sy, rad, a, z });
      }

      proj.sort((m, n) => n.z - m.z);

      // Tiny particles → cheap fillRect (much faster than arc at this count).
      for (const q of proj) {
        if (q.a < 0.012) continue;
        const s = Math.max(0.6, q.rad);
        ctx.fillStyle = `rgba(200,200,200,${q.a.toFixed(3)})`;
        ctx.fillRect(q.sx - s / 2, q.sy - s / 2, s, s);
      }

      // Satellite: a bright point on a tilted orbit. Drawn over the dust, but
      // its brightness drops as it swings behind the cloud (z far) so it reads
      // as passing behind.
      const satPos = (th: number) => {
        const mx = Math.cos(th) * SAT_R;
        const my = Math.sin(th) * SAT_R * Math.sin(SAT_INCL);
        const mz = Math.sin(th) * SAT_R * Math.cos(SAT_INCL);
        return project(mx, my, mz);
      };

      const theta = time * SAT_SPEED;

      // Comet trail: a few trailing samples, fading back.
      for (let i = 10; i >= 1; i--) {
        const tp = satPos(theta - i * 0.05);
        if (tp.denom <= 1) continue;
        const near = Math.max(0, Math.min(1, (SAT_R - tp.z) / (2 * SAT_R)));
        const a = (1 - i / 11) * (0.18 + near * 0.32);
        const r = Math.max(0.5, 1.4 * tp.scale * (1 - i / 14));
        ctx.fillStyle = `rgba(230,230,235,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(tp.sx, tp.sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Satellite body + soft glow.
      const s = satPos(theta);
      if (s.denom > 1) {
        const near = Math.max(0, Math.min(1, (SAT_R - s.z) / (2 * SAT_R)));
        const coreA = 0.45 + near * 0.5;
        const rad = Math.max(1.6, 2.5 * s.scale);

        const grd = ctx.createRadialGradient(s.sx, s.sy, 0, s.sx, s.sy, rad * 5);
        grd.addColorStop(0, `rgba(240,240,245,${(coreA * 0.6).toFixed(3)})`);
        grd.addColorStop(0.4, `rgba(225,225,235,${(coreA * 0.22).toFixed(3)})`);
        grd.addColorStop(1, "rgba(225,225,235,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, rad * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(248,248,250,${Math.min(1, coreA + 0.15).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (reduced) {
      draw(0.4, 0.1, 1, 4200);
      const ro0 = new ResizeObserver(() => { resize(); draw(0.4, 0.1, 1, 4200); });
      ro0.observe(canvas);
      return () => ro0.disconnect();
    }

    let last = 0;
    let elapsed = 0;
    const INTERVAL = 1000 / 60;

    function frame(now: number) {
      animId = requestAnimationFrame(frame);
      if (!last) last = now;
      const dt = now - last;
      if (dt < INTERVAL) return;
      last = now;
      elapsed += dt;

      // Heavily damped easing toward the cursor (or back to center on leave).
      const tX = hasMouse ? rawMX : ox();
      const tY = hasMouse ? rawMY : oy();
      smX += (tX - smX) * 0.16;
      smY += (tY - smY) * 0.16;

      const breath = 1 + Math.sin(elapsed * 0.00024) * 0.04;
      draw(elapsed * ROT_Y, Math.sin(elapsed * ROT_X) * 0.28, breath, elapsed);
    }

    animId = requestAnimationFrame(frame);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed top-0 right-0 h-screen pointer-events-none hidden lg:block"
      style={{ width: "50vw" }}
    />
  );
}
