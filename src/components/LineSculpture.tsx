"use client";

import { useEffect, useRef } from "react";
import type {
  BufferGeometry,
  Color,
  Group,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";

type Variant = "head" | "palm";

type LineSculptureProps = {
  variant: Variant;
  interactive?: boolean;
  showCaption?: boolean;
  className?: string;
};

type SculptureUniforms = {
  uTime: { value: number };
  uPointer: { value: Vector2 };
  uInfluence: { value: number };
  uDensity: { value: number };
  uCopper: { value: Color };
  uHighlight: { value: Color };
  uOpacity: { value: number };
  uMouthless: { value: number };
  uReveal: { value: number };
};

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uInfluence;

  varying vec3 vObjectPosition;
  varying vec3 vViewNormal;

  void main() {
    vec3 transformed = position;
    vec4 restingWorld = modelMatrix * vec4(transformed, 1.0);
    float distanceToPointer = distance(restingWorld.xy, uPointer);
    float falloff = exp(-distanceToPointer * distanceToPointer * 3.2);
    float ripple = 0.085 + 0.04 * sin(restingWorld.y * 15.0 + uTime * 2.2);

    transformed += normal * falloff * uInfluence * ripple;
    vec4 world = modelMatrix * vec4(transformed, 1.0);
    vObjectPosition = transformed;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uDensity;
  uniform vec3 uCopper;
  uniform vec3 uHighlight;
  uniform float uOpacity;
  uniform float uMouthless;
  uniform float uReveal;

  varying vec3 vObjectPosition;
  varying vec3 vViewNormal;

  void main() {
    float stripeCoordinate = vObjectPosition.x * uDensity
      + sin(vObjectPosition.y * 2.4) * 0.045;
    float stripeDistance = abs(fract(stripeCoordinate) - 0.5);
    float antialiasWidth = max(fwidth(stripeCoordinate) * 0.82, 0.0025);
    float line = 1.0 - smoothstep(0.026, 0.026 + antialiasWidth, stripeDistance);
    float lineIndex = floor(stripeCoordinate + 0.5);
    float linePosition = 1.0 - clamp(abs(lineIndex - 0.5) / 37.0, 0.0, 1.0);
    float lineReveal = smoothstep(linePosition - 0.012, linePosition + 0.012, uReveal);

    if (line < 0.012 || lineReveal < 0.01) discard;

    // Keep the exposed surface softly lit even when the source winding shows
    // us the anatomical back of the mesh (notably the extracted right hand).
    float faceSign = gl_FrontFacing ? 1.0 : -1.0;
    float facing = clamp((vViewNormal.z * faceSign) * 0.5 + 0.5, 0.0, 1.0);
    float contourLight = 0.3 + facing * 0.7;
    vec3 color = mix(uCopper, uHighlight, pow(facing, 3.0) * 0.32);
    // The scan's open mouth reads a little severe at this scale. Fade the
    // small front-facing mouth pocket while leaving the surrounding contours.
    float mouthWidth = 1.0 - smoothstep(0.18, 0.4, abs(vObjectPosition.x));
    float mouthHeight = smoothstep(-0.36, -0.24, vObjectPosition.y)
      * (1.0 - smoothstep(-0.04, 0.08, vObjectPosition.y));
    float mouthDepth = smoothstep(0.52, 0.92, vObjectPosition.z);
    float mouthFade = 1.0 - mouthWidth * mouthHeight * mouthDepth * uMouthless;
    float alpha = line * contourLight * 0.72 * uOpacity * mouthFade * lineReveal;
    gl_FragColor = vec4(color, alpha);
  }
`;

function getCssColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export default function LineSculpture({
  variant,
  interactive = false,
  showCaption = true,
  className = "",
}: LineSculptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const element = canvas;

    let disposed = false;
    let cleanup = () => {};

    async function setup() {
      const [THREE, { GLTFLoader }] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/GLTFLoader.js"),
      ]);

      if (disposed) return;

      const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      let reducedMotion = motionQuery.matches;
      let renderer: WebGLRenderer;

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

      const scene: Scene = new THREE.Scene();
      const camera: OrthographicCamera = new THREE.OrthographicCamera(
        -1.6,
        1.6,
        1.6,
        -1.6,
        0.1,
        20
      );
      camera.position.z = 5;

      const group: Group = new THREE.Group();
      scene.add(group);

      const loader = new GLTFLoader();
      const assetPath =
        variant === "head"
          ? "/sculptures/head.glb"
          : "/sculptures/open-hand-v2.glb";
      const gltf = await loader.loadAsync(assetPath);

      if (disposed) {
        renderer.dispose();
        return;
      }

      gltf.scene.updateMatrixWorld(true);
      const meshes: Mesh[] = [];
      gltf.scene.traverse((child) => {
        if ((child as Mesh).isMesh) meshes.push(child as Mesh);
      });
      const sourceMesh = meshes[0];
      if (!sourceMesh) {
        renderer.dispose();
        return;
      }

      const geometry: BufferGeometry = sourceMesh.geometry.clone();
      geometry.applyMatrix4(sourceMesh.matrixWorld);

      if (variant === "palm") {
        // Stand the palm plane up, then cant it into a relaxed open gesture.
        // This axis preserves the clear spacing between all five digits.
        geometry.rotateX(-Math.PI / 2);
        geometry.rotateZ(0.84);
      }

      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox;
      if (!bounds) {
        geometry.dispose();
        renderer.dispose();
        return;
      }

      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      geometry.translate(-center.x, -center.y, -center.z);
      const targetHeight = variant === "head" ? 2.5 : 2.34;
      const scale = targetHeight / Math.max(size.y, 0.001);
      geometry.scale(scale, scale, scale);

      if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
      for (const attribute of [
        "uv",
        "uv1",
        "color",
        "skinIndex",
        "skinWeight",
        "tangent",
      ]) {
        geometry.deleteAttribute(attribute);
      }

      const uniforms: SculptureUniforms = {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uInfluence: { value: 0 },
        uDensity: { value: variant === "head" ? 27 : 30 },
        uCopper: {
          value: new THREE.Color(getCssColor("--copper", "#b1744e")),
        },
        uHighlight: {
          value: new THREE.Color(getCssColor("--copper-light", "#c99169")),
        },
        uOpacity: { value: 1 },
        uMouthless: { value: variant === "head" ? 1 : 0 },
        uReveal: { value: reducedMotion ? 1 : 0 },
      };

      const material: ShaderMaterial = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms,
        transparent: true,
        depthTest: true,
        depthWrite: true,
        side: variant === "palm" ? THREE.DoubleSide : THREE.FrontSide,
        toneMapped: false,
      });

      const sculpture = new THREE.Mesh(geometry, material);
      const baseYaw = variant === "head" ? -0.34 : 0;
      const basePitch = variant === "head" ? -0.025 : 0;
      sculpture.rotation.set(basePitch, baseYaw, 0);
      group.add(sculpture);

      let width = 1;
      let height = 1;
      let frameId = 0;
      let visible = !document.hidden;
      let targetInfluence = 0;
      let influence = 0;
      let targetRotationX = 0;
      let targetRotationY = 0;
      let smoothRotationX = 0;
      let smoothRotationY = 0;
      let opacity = 1;
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
        reveal += (1 - reveal) * (reducedMotion ? 1 : 0.06);
        if (reveal > 0.985) reveal = 1;

        uniforms.uTime.value = time * 0.001;
        uniforms.uPointer.value.copy(smoothPointer);
        uniforms.uInfluence.value = influence;
        uniforms.uOpacity.value = opacity;
        uniforms.uReveal.value = reveal;
        sculpture.rotation.x = basePitch + smoothRotationX * 0.035;
        sculpture.rotation.y = baseYaw + smoothRotationY * 0.055;
        renderer.render(scene, camera);

        const settling =
          Math.abs(targetInfluence - influence) > 0.002 ||
          Math.abs(targetRotationX - smoothRotationX) > 0.002 ||
          Math.abs(targetRotationY - smoothRotationY) > 0.002 ||
          smoothPointer.distanceTo(pointer) > 0.002 ||
          reveal < 0.995;

        if (!reducedMotion && (targetInfluence > 0 || settling)) requestRender();
      }

      function resize() {
        const rect = element.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
        renderer.setSize(width, height, false);

        const aspect = width / height;
        const verticalExtent = variant === "head" ? 1.58 : 1.62;
        camera.left = -verticalExtent * aspect;
        camera.right = verticalExtent * aspect;
        camera.top = verticalExtent;
        camera.bottom = -verticalExtent;
        camera.updateProjectionMatrix();
        requestRender();
      }

      function onPointerMove(event: PointerEvent) {
        if (!interactive || reducedMotion) return;
        const rect = element.getBoundingClientRect();
        const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const normalizedY = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
        pointer.set(
          normalizedX * camera.right,
          normalizedY * camera.top
        );
        targetRotationX = normalizedY;
        targetRotationY = normalizedX;
        targetInfluence = event.pointerType === "touch" ? 1.5 : 1.5;
        requestRender();
      }

      function onPointerLeave() {
        targetInfluence = 0;
        targetRotationX = 0;
        targetRotationY = 0;
        requestRender();
      }

      function onPointerUp(event: PointerEvent) {
        if (event.pointerType !== "mouse") onPointerLeave();
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
          opacity = 1;
          reveal = 1;
        }
        requestRender();
      }

      function onThemeChange() {
        uniforms.uCopper.value.set(getCssColor("--copper", "#b1744e"));
        uniforms.uHighlight.value.set(getCssColor("--copper-light", "#c99169"));
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
      element.addEventListener("pointerup", onPointerUp);
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
        element.removeEventListener("pointerup", onPointerUp);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        motionQuery.removeEventListener("change", onMotionChange);
        window.removeEventListener("themechange", onThemeChange);
        themeObserver.disconnect();
        group.remove(sculpture);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    }

    setup().catch(() => {
      // The figure is decorative; page content remains complete if WebGL or
      // asset loading is unavailable.
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [interactive, variant]);

  const label = variant === "head" ? "portrait study / 01" : "gesture study / 02";

  return (
    <figure className={`line-sculpture flex min-w-0 flex-col ${className}`}>
      {showCaption && (
        <figcaption className="utility flex items-center gap-4 text-[0.65rem] uppercase text-[var(--copper-dim)]">
          <span className="shrink-0">{label}</span>
          <span className="h-px min-w-0 flex-1 bg-[var(--line)]" />
          <span className="shrink-0">
            {variant === "head" ? "pointer / rotate" : "pointer / deform"}
          </span>
        </figcaption>
      )}
      <div className="relative min-h-0 flex-1">
        <div
          className="pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgba(119,66,43,0.055),transparent_68%)]"
          aria-hidden="true"
        />
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
