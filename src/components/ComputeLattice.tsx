"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  depth: number;
  excitation: number;
};

type Pulse = {
  origin: number;
  started: number;
  delay: number;
};

const COLS = 14;
const ROWS = 10;
const LAYERS = 2;
const FOCAL = 1800;
const CROSS_MS = 2500;
const DECAY_MS = 800;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function ComputeLattice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const canvasEl = canvas;
    const context = ctx;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = !document.hidden;
    let pointerX = 0;
    let pointerY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let lastPulseAt = 0;
    let nextPulseAt = 1600;
    let pulses: Pulse[] = [];

    const nodes: Node[] = [];
    for (let z = 0; z < LAYERS; z++) {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          nodes.push({
            x: x - (COLS - 1) / 2,
            y: y - (ROWS - 1) / 2,
            z: z - (LAYERS - 1) / 2,
            sx: 0,
            sy: 0,
            depth: 0,
            excitation: 0,
          });
        }
      }
    }

    const edges: [number, number][] = [];
    const index = (x: number, y: number, z: number) => z * ROWS * COLS + y * COLS + x;
    for (let z = 0; z < LAYERS; z++) {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (x < COLS - 1) edges.push([index(x, y, z), index(x + 1, y, z)]);
          if (y < ROWS - 1) edges.push([index(x, y, z), index(x, y + 1, z)]);
          if (z < LAYERS - 1 && (x + y) % 2 === 0) edges.push([index(x, y, z), index(x, y, z + 1)]);
        }
      }
    }

    function resize() {
      const rect = canvasEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvasEl.width = Math.max(1, Math.round(width * dpr));
      canvasEl.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function project(time: number) {
      const mobile = width < 768;
      const scale = Math.min(width / (mobile ? 16 : 17), height / (mobile ? 12 : 12.5));
      const baseX = -0.22;
      const baseY = -0.2;
      const rotY = reduced ? baseY : baseY + time * 0.000012 + smoothX * 0.035;
      const rotX = reduced ? baseX : baseX + smoothY * 0.035;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cx = width * (mobile ? 0.5 : 0.45);
      const cy = height * (mobile ? 0.5 : 0.44);

      for (const n of nodes) {
        const px = n.x * scale;
        const py = n.y * scale;
        const pz = n.z * scale * 4.4;
        let x = px * cosY - pz * sinY;
        let z = px * sinY + pz * cosY;
        let y = py * cosX - z * sinX;
        z = py * sinX + z * cosX;
        const perspective = FOCAL / (FOCAL + z);
        n.sx = cx + x * perspective;
        n.sy = cy + y * perspective;
        n.depth = perspective;
      }
    }

    function updatePulse(time: number) {
      if (reduced) {
        for (const node of nodes) node.excitation = 0;
        return;
      }

      if (time > nextPulseAt && pulses.length === 0) {
        const origin = Math.floor(Math.random() * nodes.length);
        pulses = [{ origin, started: time, delay: 0 }];
        if (Math.random() < 0.25) pulses.push({ origin, started: time, delay: 400 });
        lastPulseAt = time;
        nextPulseAt = time + 5000 + Math.random() * 3000;
      }

      const active: Pulse[] = [];
      for (const node of nodes) node.excitation = 0;

      for (const pulse of pulses) {
        const age = time - pulse.started - pulse.delay;
        if (age < 0) {
          active.push(pulse);
          continue;
        }
        if (age < CROSS_MS + DECAY_MS) active.push(pulse);

        const origin = nodes[pulse.origin];
        const maxDistance = Math.hypot(COLS, ROWS);
        const front = (age / CROSS_MS) * maxDistance;
        for (const node of nodes) {
          const distance = Math.hypot(node.x - origin.x, node.y - origin.y);
          const passed = front - distance;
          if (passed < -0.16 || passed > 1.4) continue;
          const attack = clamp(1 - Math.abs(passed) / 0.18, 0, 1);
          const decay = passed > 0 ? Math.exp((-passed * 1000) / DECAY_MS) : 1;
          node.excitation = Math.max(node.excitation, clamp(attack + 0.45 * decay, 0, 1));
        }
      }

      pulses = active;
      if (!lastPulseAt && time > 1400) nextPulseAt = time;
    }

    function draw(time: number) {
      context.clearRect(0, 0, width, height);
      project(time);
      updatePulse(time);

      const drawProgress = reduced ? 1 : clamp((time - 450) / 1200, 0, 1);
      const edgeLimit = Math.floor(edges.length * drawProgress);

      context.lineWidth = 1;
      for (let i = 0; i < edgeLimit; i++) {
        const [aIndex, bIndex] = edges[i];
        const a = nodes[aIndex];
        const b = nodes[bIndex];
        const lit = Math.min(a.excitation, b.excitation);
        context.strokeStyle = lit > 0.18
          ? `rgba(245,245,244,${(0.08 + lit * 0.22).toFixed(3)})`
          : "rgba(29,29,31,0.92)";
        context.beginPath();
        context.moveTo(a.sx, a.sy);
        context.lineTo(b.sx, b.sy);
        context.stroke();
      }

      for (const node of nodes) {
        const alpha = 0.34 + node.excitation * 0.55;
        const size = (1.15 + node.depth * 0.32 + node.excitation * 0.8) * (width < 768 ? 0.9 : 1);
        context.fillStyle = node.excitation > 0.05
          ? `rgba(245,245,244,${Math.min(0.55, alpha).toFixed(3)})`
          : "rgba(92,92,89,0.7)";
        context.fillRect(node.sx - size / 2, node.sy - size / 2, size, size);
      }
    }

    function frame(time: number) {
      if (!visible) return;
      smoothX += (pointerX - smoothX) * 0.08;
      smoothY += (pointerY - smoothY) * 0.08;
      draw(time);
      if (!reduced) raf = requestAnimationFrame(frame);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvasEl.getBoundingClientRect();
      pointerX = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5) * 2;
      pointerY = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5) * 2;
    }

    function onVisibilityChange() {
      visible = !document.hidden;
      if (visible) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    }

    function onMotionChange() {
      reduced = media.matches;
      cancelAnimationFrame(raf);
      if (reduced) draw(1800);
      else raf = requestAnimationFrame(frame);
    }

    resize();
    const observer = new ResizeObserver(() => {
      resize();
      draw(reduced ? 1800 : performance.now());
    });
    observer.observe(canvasEl);
    canvasEl.addEventListener("pointermove", onPointerMove);
    document.addEventListener("visibilitychange", onVisibilityChange);
    media.addEventListener("change", onMotionChange);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvasEl.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      media.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div className="animate-fadeUp-delay2 mt-14 h-[40vh] min-h-[260px] lg:mt-0 lg:h-[min(68vh,620px)]" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
