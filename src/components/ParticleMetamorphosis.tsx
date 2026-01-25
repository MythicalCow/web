"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const PARTICLE_COUNT = 15000;
const SPARK_COUNT = 2000;
const STAR_COUNT = 7000;

function normalise(points: THREE.Vector3[], size: number): THREE.Vector3[] {
  if (points.length === 0) return [];
  const box = new THREE.Box3().setFromPoints(points);
  const maxDim = Math.max(...box.getSize(new THREE.Vector3()).toArray()) || 1;
  const centre = box.getCenter(new THREE.Vector3());
  return points.map((p) => p.clone().sub(centre).multiplyScalar(size / maxDim));
}

function torusKnot(n: number): THREE.Vector3[] {
  const geometry = new THREE.TorusKnotGeometry(10, 3, 200, 16, 2, 3);
  const points: THREE.Vector3[] = [];
  const positionAttribute = geometry.attributes.position;
  for (let i = 0; i < positionAttribute.count; i++) {
    points.push(new THREE.Vector3().fromBufferAttribute(positionAttribute, i));
  }
  const result: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    result.push(points[i % points.length].clone());
  }
  return normalise(result, 50);
}

function halvorsen(n: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  let x = 0.1,
    y = 0,
    z = 0;
  const a = 1.89;
  const dt = 0.005;
  for (let i = 0; i < n * 25; i++) {
    const dx = -a * x - 4 * y - 4 * z - y * y;
    const dy = -a * y - 4 * z - 4 * x - z * z;
    const dz = -a * z - 4 * x - 4 * y - x * x;
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;
    if (i > 200 && i % 25 === 0) {
      pts.push(new THREE.Vector3(x, y, z));
    }
    if (pts.length >= n) break;
  }
  while (pts.length < n)
    pts.push(pts[Math.floor(Math.random() * pts.length)].clone());
  return normalise(pts, 60);
}

function dualHelix(n: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const turns = 5;
  const radius = 15;
  const height = 40;
  for (let i = 0; i < n; i++) {
    const isSecondHelix = i % 2 === 0;
    const angle = (i / n) * Math.PI * 2 * turns;
    const yPos = (i / n) * height - height / 2;
    const r = radius + (isSecondHelix ? 5 : -5);
    const xPos = Math.cos(angle) * r;
    const zPos = Math.sin(angle) * r;
    pts.push(new THREE.Vector3(xPos, yPos, zPos));
  }
  return normalise(pts, 60);
}

function deJong(n: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  let x = 0.1,
    y = 0.1;
  const a = 1.4,
    b = -2.3,
    c = 2.4,
    d = -2.1;
  for (let i = 0; i < n; i++) {
    const xn = Math.sin(a * y) - Math.cos(b * x);
    const yn = Math.sin(c * x) - Math.cos(d * y);
    x = xn;
    y = yn;
    const z = Math.sin(x * y * 0.5);
    pts.push(new THREE.Vector3(x, y, z));
  }
  return normalise(pts, 55);
}

const PATTERNS = [torusKnot, halvorsen, dualHelix, deJong];

export default function ParticleMetamorphosis() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer;
    controls: OrbitControls;
    particles: THREE.Points;
    sparkles: THREE.Points;
    stars: THREE.Points;
    clock: THREE.Clock;
    currentPattern: number;
    isTrans: boolean;
    prog: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const morphSpeed = 0.03;

    function createStars(): THREE.Points {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(STAR_COUNT * 3);
      const col = new Float32Array(STAR_COUNT * 3);
      const size = new Float32Array(STAR_COUNT);
      const rnd = new Float32Array(STAR_COUNT);
      const R = 900;

      for (let i = 0; i < STAR_COUNT; i++) {
        const i3 = i * 3;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = R * Math.cbrt(Math.random());
        pos[i3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i3 + 2] = r * Math.cos(phi);
        // Grey stars for light mode
        const c = new THREE.Color().setHSL(
          0,
          0,
          0.3 + 0.3 * Math.random()
        );
        col[i3] = c.r;
        col[i3 + 1] = c.g;
        col[i3 + 2] = c.b;
        size[i] = 0.4 + Math.pow(Math.random(), 3) * 2.5;
        rnd[i] = Math.random() * Math.PI * 2;
      }

      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(size, 1));
      geo.setAttribute("random", new THREE.BufferAttribute(rnd, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
          attribute float size;
          attribute float random;
          varying vec3 vColor;
          varying float vRnd;
          void main() {
            vColor = color;
            vRnd = random;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (250.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec3 vColor;
          varying float vRnd;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float a = 1.0 - smoothstep(0.4, 0.5, d);
            a *= 0.7 + 0.3 * sin(time * (0.6 + vRnd * 0.3) + vRnd * 5.0);
            if (a < 0.02) discard;
            gl_FragColor = vec4(vColor, a);
          }
        `,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.NormalBlending, // Changed from Additive for light mode
      });

      return new THREE.Points(geo, mat);
    }

    function makeParticles(count: number, palette: THREE.Color[]): THREE.Points {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const size = new Float32Array(count);
      const rnd = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const base = palette[Math.floor(Math.random() * palette.length)];
        // Use the grey palette directly with slight variation
        const grey = 0.15 + Math.random() * 0.35; // Range from 0.15 to 0.5 (dark to medium grey)
        const c = new THREE.Color(grey, grey, grey);
        col[i3] = c.r;
        col[i3 + 1] = c.g;
        col[i3 + 2] = c.b;
        size[i] = 1.0 + Math.random() * 1.5; // Larger particles for visibility
        rnd[i3] = Math.random() * 10;
        rnd[i3 + 1] = Math.random() * Math.PI * 2;
        rnd[i3 + 2] = 0.5 + 0.5 * Math.random();
      }

      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(size, 1));
      geo.setAttribute("random", new THREE.BufferAttribute(rnd, 3));

      const mat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
          uniform float time;
          attribute float size;
          attribute vec3 random;
          varying vec3 vCol;
          varying float vR;
          void main() {
            vCol = color;
            vR = random.z;
            vec3 p = position;
            float t = time * 0.25 * random.z;
            float ax = t + random.y, ay = t * 0.75 + random.x;
            float amp = (0.6 + sin(random.x + t * 0.6) * 0.3) * random.z;
            p.x += sin(ax + p.y * 0.06 + random.x * 0.1) * amp;
            p.y += cos(ay + p.z * 0.06 + random.y * 0.1) * amp;
            p.z += sin(ax * 0.85 + p.x * 0.06 + random.z * 0.1) * amp;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            float pulse = 0.9 + 0.1 * sin(time * 1.15 + random.y);
            gl_PointSize = size * pulse * (350.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec3 vCol;
          varying float vR;

          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            
            float core = smoothstep(0.08, 0.0, d);
            float glow = smoothstep(0.5, 0.05, d);
            
            float alpha = core * 1.0 + glow * 0.6;
            
            vec3 finalColor = vCol;

            if (alpha < 0.01) discard;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.NormalBlending, // Changed for light mode
      });

      return new THREE.Points(geo, mat);
    }

    function createSparkles(count: number): THREE.Points {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const size = new Float32Array(count);
      const rnd = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        size[i] = 0.8 + Math.random() * 1.2;
        rnd[i * 3] = Math.random() * 10;
        rnd[i * 3 + 1] = Math.random() * Math.PI * 2;
        rnd[i * 3 + 2] = 0.5 + 0.5 * Math.random();
      }

      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(size, 1));
      geo.setAttribute("random", new THREE.BufferAttribute(rnd, 3));

      const mat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
          uniform float time;
          attribute float size;
          attribute vec3 random;
          void main() {
            vec3 p = position;
            float t = time * 0.25 * random.z;
            float ax = t + random.y, ay = t * 0.75 + random.x;
            float amp = (0.6 + sin(random.x + t * 0.6) * 0.3) * random.z;
            p.x += sin(ax + p.y * 0.06 + random.x * 0.1) * amp;
            p.y += cos(ay + p.z * 0.06 + random.y * 0.1) * amp;
            p.z += sin(ax * 0.85 + p.x * 0.06 + random.z * 0.1) * amp;
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float time;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            float alpha = 1.0 - smoothstep(0.4, 0.5, d);
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(0.25, 0.25, 0.25, alpha * 0.8);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });

      return new THREE.Points(geo, mat);
    }

    function applyPattern(
      i: number,
      particles: THREE.Points,
      sparkles: THREE.Points
    ) {
      const pts = PATTERNS[i](PARTICLE_COUNT);
      const particleArr = (particles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      const sparkleArr = (sparkles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;

      for (let j = 0; j < PARTICLE_COUNT; j++) {
        const idx = j * 3;
        const p = pts[j] || new THREE.Vector3();
        particleArr[idx] = p.x;
        particleArr[idx + 1] = p.y;
        particleArr[idx + 2] = p.z;
        if (j < SPARK_COUNT) {
          sparkleArr[idx] = p.x;
          sparkleArr[idx + 1] = p.y;
          sparkleArr[idx + 2] = p.z;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      sparkles.geometry.attributes.position.needsUpdate = true;
    }

    // Initialize scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfafafa, 0.006); // Light grey fog

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2500
    );
    camera.position.set(0, 0, 80);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xfafafa, 1); // Light background
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 20;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    const stars = createStars();
    scene.add(stars);

    // Grey palette for light mode
    const palette = [
      0x2a2a2a, 0x3d3d3d, 0x505050, 0x636363, 0x1a1a1a, 0x474747, 0x5a5a5a,
    ].map((c) => new THREE.Color(c));

    const particles = makeParticles(PARTICLE_COUNT, palette);
    const sparkles = createSparkles(SPARK_COUNT);
    scene.add(particles);
    scene.add(sparkles);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());

    applyPattern(0, particles, sparkles);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      composer,
      controls,
      particles,
      sparkles,
      stars,
      clock: new THREE.Clock(),
      currentPattern: 0,
      isTrans: false,
      prog: 0,
    };

    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer, composer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!sceneRef.current) return;

      const {
        clock,
        controls,
        particles,
        sparkles,
        stars,
        composer,
      } = sceneRef.current;

      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      controls.update();

      (particles.material as THREE.ShaderMaterial).uniforms.time.value = t;
      (sparkles.material as THREE.ShaderMaterial).uniforms.time.value = t;
      (stars.material as THREE.ShaderMaterial).uniforms.time.value = t;

      if (sceneRef.current.isTrans) {
        sceneRef.current.prog += morphSpeed;
        const eased =
          sceneRef.current.prog >= 1
            ? 1
            : 1 - Math.pow(1 - sceneRef.current.prog, 3);
        const { from, to } = particles.userData as {
          from: Float32Array;
          to: Float32Array;
          next: number;
        };
        if (to) {
          const particleArr = (particles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
          const sparkleArr = (sparkles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;

          for (let i = 0; i < particleArr.length; i++) {
            const val = from[i] + (to[i] - from[i]) * eased;
            particleArr[i] = val;
            if (i < sparkleArr.length) {
              sparkleArr[i] = val;
            }
          }
          particles.geometry.attributes.position.needsUpdate = true;
          sparkles.geometry.attributes.position.needsUpdate = true;
        }
        if (sceneRef.current.prog >= 1) {
          sceneRef.current.currentPattern = (particles.userData as { next: number }).next;
          sceneRef.current.isTrans = false;
        }
      }

      composer.render(dt);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (containerRef.current && containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    };
  }, []);

  const handleMorph = () => {
    if (!sceneRef.current || sceneRef.current.isTrans) return;

    const { particles, sparkles, currentPattern } = sceneRef.current;

    sceneRef.current.isTrans = true;
    sceneRef.current.prog = 0;

    const next = (currentPattern + 1) % PATTERNS.length;
    const fromPts = (particles.geometry.attributes.position as THREE.BufferAttribute).array.slice() as Float32Array;
    const toPts = PATTERNS[next](PARTICLE_COUNT);

    const to = new Float32Array(PARTICLE_COUNT * 3);
    if (toPts.length > 0) {
      for (let j = 0; j < PARTICLE_COUNT; j++) {
        const idx = j * 3;
        const p = toPts[j];
        to[idx] = p.x;
        to[idx + 1] = p.y;
        to[idx + 2] = p.z;
      }
      particles.userData = { from: fromPts, to, next };
      sparkles.userData = { from: fromPts, to, next };
    }
  };

  // Handle spacebar to trigger morph
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleMorph();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div ref={containerRef} className="fixed inset-0 z-0 bg-[#fafafa]" />
      <div className="fixed inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(250,250,250,0.6)_100%)]" />
    </>
  );
}
