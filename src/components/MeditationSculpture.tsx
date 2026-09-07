"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uInfluence;

  varying vec3 vObjectPosition;
  varying float vRevealPosition;

  void main() {
    vec3 transformed = position;
    vec4 restingWorld = modelMatrix * vec4(transformed, 1.0);
    float distanceToPointer = distance(restingWorld.xy, uPointer);
    float falloff = exp(-distanceToPointer * distanceToPointer * 2.8);
    float ripple = 0.024 + 0.01 * sin(restingWorld.y * 10.0 + uTime * 1.6);

    transformed += normal * falloff * uInfluence * ripple;
    vec4 world = modelMatrix * vec4(transformed, 1.0);
    vObjectPosition = transformed;
    vRevealPosition = clamp((world.x + 1.35) / 2.7, 0.0, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uDensity;
  uniform vec3 uMetal;
  uniform float uOpacity;
  uniform float uReveal;

  varying vec3 vObjectPosition;
  varying float vRevealPosition;

  void main() {
    float stripeCoordinate = (vObjectPosition.x + vObjectPosition.z * 0.26) * uDensity
      + sin(vObjectPosition.y * 2.4) * 0.045;
    float stripeDistance = abs(fract(stripeCoordinate) - 0.5);
    float antialiasWidth = max(fwidth(stripeCoordinate) * 0.82, 0.0025);
    float line = 1.0 - smoothstep(0.026, 0.026 + antialiasWidth, stripeDistance);

    float reveal = smoothstep(vRevealPosition - 0.025, vRevealPosition + 0.025, uReveal);

    if (line < 0.012 || reveal < 0.01) discard;

    float edgeLight = 0.42 + 0.58 * abs(vObjectPosition.z + 0.18);
    float alpha = line * edgeLight * 0.72 * uOpacity * reveal;
    gl_FragColor = vec4(uMetal, alpha);
  }
`;

// Begin loading the renderer and loader as soon as this client chunk is
// evaluated, instead of waiting for the effect after the first paint.
const threeModulePromise =
  typeof window !== "undefined" ? import("three") : undefined;
const gltfLoaderModulePromise =
  typeof window !== "undefined"
    ? import("three/examples/jsm/loaders/GLTFLoader.js")
    : undefined;

function getCssColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export default function MeditationSculpture({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const element = canvas;

    let disposed = false;
    let cleanup = () => {};

    async function setup() {
      const [THREE, { GLTFLoader }] = await Promise.all([
        threeModulePromise ?? import("three"),
        gltfLoaderModulePromise ?? import("three/examples/jsm/loaders/GLTFLoader.js"),
      ]);

      if (disposed) return;

      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      let reducedMotion = motionQuery.matches;
      let renderer: import("three").WebGLRenderer;

      try {
        renderer = new THREE.WebGLRenderer({
          canvas: element,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
      } catch {
        return;
      }

      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1.6, 1.6, 1.6, -1.6, 0.1, 20);
      camera.position.z = 5;

      // The meditator is a CC0 MakeHuman (MPFB) body posed into lotus
      // offline and baked to plain geometry (see ATTRIBUTIONS.txt).
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync("/sculptures/meditator.glb");
      if (disposed) {
        renderer.dispose();
        return;
      }

      let loadedGeometry: import("three").BufferGeometry | null = null;
      gltf.scene.traverse((child) => {
        const mesh = child as import("three").Mesh;
        if (!loadedGeometry && mesh.isMesh) loadedGeometry = mesh.geometry;
      });
      if (!loadedGeometry) {
        renderer.dispose();
        return;
      }
      const geometry = loadedGeometry as import("three").BufferGeometry;
      geometry.computeBoundingBox();

      const bounds = geometry.boundingBox!;
      const center = bounds.getCenter(new THREE.Vector3());
      const extent = bounds.getSize(new THREE.Vector3());
      const scale = 2.35 / Math.max(extent.y, 0.001);
      geometry.translate(-center.x, -center.y, -center.z);
      geometry.scale(scale, scale, scale);

      const figure = new THREE.Group();
      scene.add(figure);

      const uniforms = {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uInfluence: { value: 0 },
        uDensity: { value: 25 },
        uMetal: {
          value: new THREE.Color(getCssColor("--copper", "#6f7878")),
        },
        uOpacity: { value: 1 },
        uReveal: { value: reducedMotion ? 1 : 0 },
      };

      const surfaceMaterial = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms,
        transparent: true,
        depthTest: true,
        depthWrite: true,
        side: THREE.FrontSide,
        toneMapped: false,
      });

      figure.add(new THREE.Mesh(geometry, surfaceMaterial));

      let frameId = 0;
      let visible = !document.hidden;
      let targetInfluence = 0;
      let influence = 0;
      let targetRotationX = 0;
      let targetRotationY = 0;
      let smoothRotationX = 0;
      let smoothRotationY = 0;
      let reveal = reducedMotion ? 1 : 0;
      const pointer = new THREE.Vector2(0, 0);
      const smoothPointer = new THREE.Vector2(0, 0);

      function requestRender() {
        if (!frameId && visible) frameId = requestAnimationFrame(renderFrame);
      }

      function renderFrame(time: number) {
        frameId = 0;
        smoothPointer.lerp(pointer, reducedMotion ? 1 : 0.12);
        smoothRotationX += (targetRotationX - smoothRotationX) * 0.1;
        smoothRotationY += (targetRotationY - smoothRotationY) * 0.1;
        influence += (targetInfluence - influence) * (reducedMotion ? 1 : 0.1);
        reveal += (1 - reveal) * (reducedMotion ? 1 : 0.1);
        if (reveal > 0.985) reveal = 1;

        uniforms.uTime.value = time * 0.001;
        uniforms.uPointer.value.copy(smoothPointer);
        uniforms.uInfluence.value = influence;
        uniforms.uReveal.value = reveal;
        figure.rotation.x = smoothRotationX * 0.035;
        figure.rotation.y = smoothRotationY * 0.055;
        renderer.render(scene, camera);

        const settling =
          reveal < 1 ||
          Math.abs(targetInfluence - influence) > 0.002 ||
          Math.abs(targetRotationX - smoothRotationX) > 0.002 ||
          Math.abs(targetRotationY - smoothRotationY) > 0.002 ||
          smoothPointer.distanceTo(pointer) > 0.002;

        if (!reducedMotion && (targetInfluence > 0 || settling)) requestRender();
      }

      function resize() {
        const rect = element.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
        renderer.setSize(width, height, false);

        const aspect = width / height;
        camera.left = -1.58 * aspect;
        camera.right = 1.58 * aspect;
        camera.top = 1.58;
        camera.bottom = -1.58;
        camera.updateProjectionMatrix();
        requestRender();
      }

      function onPointerMove(event: PointerEvent) {
        if (reducedMotion) return;
        const rect = element.getBoundingClientRect();
        const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const normalizedY = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
        pointer.set(normalizedX * camera.right, normalizedY * camera.top);
        targetRotationX = normalizedY;
        targetRotationY = normalizedX;
        targetInfluence = event.pointerType === "touch" ? 0.85 : 0.75;
        requestRender();
      }

      function onPointerLeave() {
        targetInfluence = 0;
        targetRotationX = 0;
        targetRotationY = 0;
        requestRender();
      }

      function onVisibilityChange() {
        visible = !document.hidden;
        if (visible) requestRender();
        else {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }
      }

      function onMotionChange() {
        reducedMotion = motionQuery.matches;
        if (reducedMotion) {
          targetInfluence = 0;
          influence = 0;
          reveal = 1;
        }
        requestRender();
      }

      function onThemeChange() {
        uniforms.uMetal.value.set(getCssColor("--copper", "#6f7878"));
        requestRender();
      }

      const themeObserver = new MutationObserver(onThemeChange);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(element);
      element.addEventListener("pointermove", onPointerMove);
      element.addEventListener("pointerenter", onPointerMove);
      element.addEventListener("pointerleave", onPointerLeave);
      document.addEventListener("visibilitychange", onVisibilityChange);
      motionQuery.addEventListener("change", onMotionChange);
      window.addEventListener("themechange", onThemeChange);
      resize();

      cleanup = () => {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        element.removeEventListener("pointermove", onPointerMove);
        element.removeEventListener("pointerenter", onPointerMove);
        element.removeEventListener("pointerleave", onPointerLeave);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        motionQuery.removeEventListener("change", onMotionChange);
        window.removeEventListener("themechange", onThemeChange);
        themeObserver.disconnect();
        figure.removeFromParent();
        geometry.dispose();
        surfaceMaterial.dispose();
        renderer.dispose();
      };
    }

    setup().catch(() => {
      // The figure is decorative; page content remains complete if WebGL
      // is unavailable.
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <figure className={`line-sculpture flex min-w-0 flex-col ${className}`}>
      <figcaption className="utility flex items-center gap-4 text-[0.65rem] uppercase text-[var(--copper-dim)]">
        <span className="shrink-0">stillness study / 01</span>
        <span className="h-px min-w-0 flex-1 bg-[var(--line)]" />
        <span className="shrink-0">pointer / rotate</span>
      </figcaption>
      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="relative h-full w-full"
          style={{ touchAction: "pan-y" }}
          aria-hidden="true"
        />
      </div>
    </figure>
  );
}
