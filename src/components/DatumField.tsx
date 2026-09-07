"use client";

import { useEffect, useRef } from "react";

/**
 * Homepage figure — intentional, minimal, reactive line drawing.
 * Few nodes. Clear silhouette. Soft response to pointer.
 * No particle storms, grids, or surplus chrome.
 */

type Node = {
  id: string;
  /** rest pose in unit space */
  ux: number;
  uy: number;
  x: number;
  y: number;
  /** reactive offset */
  dx: number;
  dy: number;
  r: number;
};

/** Ordered skeleton edges by node id */
const EDGES: [string, string][] = [
  ["head", "neck"],
  ["neck", "chest"],
  ["chest", "hip"],
  ["chest", "lShoulder"],
  ["chest", "rShoulder"],
  ["lShoulder", "lElbow"],
  ["lElbow", "lHand"],
  ["rShoulder", "rElbow"],
  ["rElbow", "rHand"],
  ["hip", "lHip"],
  ["hip", "rHip"],
  ["lHip", "lKnee"],
  ["lKnee", "lFoot"],
  ["rHip", "rKnee"],
  ["rKnee", "rFoot"],
];

/** Sparse rest pose — soft robot / person, centered */
const REST: { id: string; ux: number; uy: number; r: number }[] = [
  { id: "head", ux: 0.5, uy: 0.16, r: 3.2 },
  { id: "neck", ux: 0.5, uy: 0.26, r: 1.6 },
  { id: "chest", ux: 0.5, uy: 0.38, r: 2.4 },
  { id: "hip", ux: 0.5, uy: 0.54, r: 2.2 },
  { id: "lShoulder", ux: 0.36, uy: 0.34, r: 2.0 },
  { id: "rShoulder", ux: 0.64, uy: 0.34, r: 2.0 },
  { id: "lElbow", ux: 0.28, uy: 0.46, r: 1.6 },
  { id: "rElbow", ux: 0.72, uy: 0.46, r: 1.6 },
  { id: "lHand", ux: 0.24, uy: 0.58, r: 1.8 },
  { id: "rHand", ux: 0.76, uy: 0.58, r: 1.8 },
  { id: "lHip", ux: 0.43, uy: 0.56, r: 1.8 },
  { id: "rHip", ux: 0.57, uy: 0.56, r: 1.8 },
  { id: "lKnee", ux: 0.42, uy: 0.72, r: 1.6 },
  { id: "rKnee", ux: 0.58, uy: 0.72, r: 1.6 },
  { id: "lFoot", ux: 0.4, uy: 0.88, r: 1.8 },
  { id: "rFoot", ux: 0.6, uy: 0.88, r: 1.8 },
];

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function DatumField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;
    const el = canvas;
    const g = ctx;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = mq.matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = !document.hidden;
    let px = 0.5;
    let py = 0.5;
    let spx = 0.5;
    let spy = 0.5;
    let t0 = performance.now();
    let nodes: Node[] = [];
    const byId = new Map<string, Node>();

    function layout() {
      const padX = w * 0.18;
      const padY = h * 0.1;
      const spanX = w - padX * 2;
      const spanY = h - padY * 2;
      nodes = REST.map((r) => {
        const n: Node = {
          id: r.id,
          ux: r.ux,
          uy: r.uy,
          x: padX + r.ux * spanX,
          y: padY + r.uy * spanY,
          dx: 0,
          dy: 0,
          r: r.r,
        };
        return n;
      });
      byId.clear();
      for (const n of nodes) byId.set(n.id, n);
    }

    function resize() {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      el.width = Math.max(1, Math.round(w * dpr));
      el.height = Math.max(1, Math.round(h * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout();
    }

    function restPos(n: Node, breathe: number) {
      const padX = w * 0.18;
      const padY = h * 0.1;
      const spanX = w - padX * 2;
      const spanY = h - padY * 2;
      const cx = 0.5;
      const cy = 0.5;
      const ux = cx + (n.ux - cx) * breathe;
      const uy = cy + (n.uy - cy) * breathe;
      return { x: padX + ux * spanX, y: padY + uy * spanY };
    }

    function simulate(now: number) {
      const t = (now - t0) / 1000;
      const breathe = reduced ? 1 : 1 + Math.sin(t * 1.05) * 0.018;
      spx = lerp(spx, px, 0.08);
      spy = lerp(spy, py, 0.08);

      const mx = spx * w;
      const my = spy * h;

      for (const n of nodes) {
        const rest = restPos(n, breathe);
        // Intentional reactivity: falloff pull toward pointer (sketch yields to hand)
        const ddx = rest.x - mx;
        const ddy = rest.y - my;
        const dist = Math.hypot(ddx, ddy) + 1;
        const influence = Math.exp(-(dist * dist) / (2 * (Math.min(w, h) * 0.22) ** 2));
        const pull = influence * 22;

        const targetX = rest.x - (ddx / dist) * pull;
        const targetY = rest.y - (ddy / dist) * pull;

        n.dx = lerp(n.dx, targetX - rest.x, reduced ? 1 : 0.12);
        n.dy = lerp(n.dy, targetY - rest.y, reduced ? 1 : 0.12);
        n.x = rest.x + n.dx;
        n.y = rest.y + n.dy;
      }
    }

    function strokeEdge(a: Node, b: Node, alpha: number, width: number) {
      // Slight quadratic bow for illustrated (not CAD) quality
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const nx = -(b.y - a.y);
      const ny = b.x - a.x;
      const len = Math.hypot(nx, ny) || 1;
      const bow = 0.04 * Math.min(w, h) * 0.02;
      const cx = mx + (nx / len) * bow;
      const cy = my + (ny / len) * bow;

      g.beginPath();
      g.moveTo(a.x, a.y);
      g.quadraticCurveTo(cx, cy, b.x, b.y);
      g.strokeStyle = `rgba(228, 214, 188, ${alpha})`;
      g.lineWidth = width;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.stroke();
    }

    function draw() {
      g.clearRect(0, 0, w, h);

      // Quiet warm ground — one gradient, no grain
      const grd = g.createRadialGradient(
        w * 0.5,
        h * 0.42,
        Math.min(w, h) * 0.04,
        w * 0.5,
        h * 0.5,
        Math.min(w, h) * 0.62
      );
      grd.addColorStop(0, "rgba(32, 28, 24, 0.4)");
      grd.addColorStop(1, "rgba(0, 0, 0, 0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);

      // Skeleton
      for (const [ia, ib] of EDGES) {
        const a = byId.get(ia);
        const b = byId.get(ib);
        if (!a || !b) continue;
        strokeEdge(a, b, 0.38, 1.25);
      }

      // Head circle — illustrated, intentional
      const head = byId.get("head");
      if (head) {
        const hr = Math.min(w, h) * 0.055;
        g.strokeStyle = "rgba(228, 214, 188, 0.42)";
        g.lineWidth = 1.25;
        g.beginPath();
        g.arc(head.x, head.y - hr * 0.15, hr, 0, Math.PI * 2);
        g.stroke();
      }

      // Joints — few dots, clean
      for (const n of nodes) {
        if (n.id === "head") continue;
        // Soft halo
        const glow = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3.5);
        glow.addColorStop(0, "rgba(236, 220, 190, 0.16)");
        glow.addColorStop(1, "rgba(236, 220, 190, 0)");
        g.fillStyle = glow;
        g.beginPath();
        g.arc(n.x, n.y, n.r * 3.5, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = "rgba(236, 224, 200, 0.72)";
        g.beginPath();
        g.arc(n.x, n.y, n.r * 0.55, 0, Math.PI * 2);
        g.fill();
      }
    }

    function frame(now: number) {
      if (!visible) return;
      simulate(now);
      draw();
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    function onMove(e: PointerEvent) {
      const rect = el.getBoundingClientRect();
      px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      py = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      if (reduced) {
        simulate(performance.now());
        draw();
      }
    }

    function onVisibility() {
      visible = !document.hidden;
      if (visible) {
        cancelAnimationFrame(raf);
        if (reduced) {
          simulate(performance.now());
          draw();
        } else raf = requestAnimationFrame(frame);
      }
    }

    function onMotion() {
      reduced = mq.matches;
      cancelAnimationFrame(raf);
      if (reduced) {
        simulate(performance.now());
        draw();
      } else raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      simulate(performance.now());
      draw();
    });
    ro.observe(el);
    el.addEventListener("pointermove", onMove);
    document.addEventListener("visibilitychange", onVisibility);
    mq.addEventListener("change", onMotion);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      mq.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-hidden="true"
    />
  );
}
