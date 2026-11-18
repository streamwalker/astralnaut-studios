import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export interface VesselController {
  rotate: (yaw: number, pitch?: number, roll?: number) => void;
  zoom: (direction: number) => void;
  reset: () => void;
  setTouchEnabled: (enabled: boolean) => void;
  dispose: () => void;
}
interface Options { signal: AbortSignal; onReady: () => void; onError: () => void; onExit: () => void; }

function disposeModel(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  const textures = new Set<T.Texture>();
  root.traverse(object => {
    const mesh = object as T.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value);
    }
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

/** Demand-rendered viewer: no background animation loop or reduced-motion exception to manual controls. */
export async function mountVessel(host: HTMLElement, vessel: "santee" | "ryuken", options: Options): Promise<VesselController> {
  const { signal, onReady, onError, onExit } = options;
  const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setClearColor(0x030810, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  const gl = renderer.getContext();
  const low = matchMedia("(pointer: coarse)").matches || navigator.hardwareConcurrency < 6 || gl.getParameter(gl.MAX_TEXTURE_SIZE) < 8192;
  renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1.4 : 1.8));
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, .01, 100);
  const rig = new T.Group();
  scene.add(rig);
  const environmentGenerator = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = environmentGenerator.fromScene(room, .035);
  scene.environment = environment.texture;
  scene.environmentIntensity = .3;
  room.dispose();
  environmentGenerator.dispose();
  scene.add(new T.HemisphereLight(0xc8e8ff, 0x162438, .4));
  const key = new T.DirectionalLight(0xe2f1ff, 1.8); key.position.set(-3, 5, 6); scene.add(key);
  const rim = new T.DirectionalLight(0x72b9f5, 2.5); rim.position.set(3, 2, -4); scene.add(rim);
  const fill = new T.DirectionalLight(0xffd6a6, .8); fill.position.set(4, -1, 4); scene.add(fill);
  const lower = new T.DirectionalLight(0x94b4d8, .55); lower.position.set(-2, -4, -1); scene.add(lower);
  const draco = new DRACOLoader().setDecoderPath("/battlefield-atlantis/cinematic/draco/").setWorkerLimit(1);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  let dead = false, frame = 0, ready = false, notified = false, visible = false, zoom = 1;
  let pointer: number | null = null, lastX = 0, lastY = 0, touchEnabled = false;
  let baseDistance = 7;
  let parsing = false, decoderDisposed = false;
  const silhouette: T.Vector3[] = [];
  const projected = new T.Vector3();
  function releaseDecoder() {
    // Draco may create its worker only after fetching WASM. Let an in-flight
    // parse settle before terminating workers; late geometry is disposed below.
    if (!parsing && !decoderDisposed) { decoderDisposed = true; draco.dispose(); }
  }
  function frameDistance() {
    if (!silhouette.length) return baseDistance;
    const vertical = Math.tan(T.MathUtils.degToRad(camera.fov) / 2);
    const horizontal = vertical * camera.aspect;
    let distance = 0;
    for (const point of silhouette) {
      projected.copy(point).applyQuaternion(rig.quaternion);
      distance = Math.max(distance, projected.z + Math.abs(projected.x) * 1.16 / horizontal, projected.z + Math.abs(projected.y) * 1.16 / vertical);
    }
    return distance;
  }
  const base = new T.Quaternion().setFromEuler(vessel === "santee" ? new T.Euler(.1, -.28, 0) : new T.Euler(.65, .5, .12));
  rig.quaternion.copy(base);
  const q = new T.Quaternion(), axisX = new T.Vector3(1, 0, 0), axisY = new T.Vector3(0, 1, 0), axisZ = new T.Vector3(0, 0, 1);
  host.dataset.dragging = "false";
  host.dataset.rendering = "false";
  host.dataset.model = vessel;
  let renderCount = 0;

  function render() {
    frame = 0;
    if (dead || !ready || !visible || document.hidden) return;
    // The loaded model is normalized inside a unit sphere. Even an end-on
    // maximum zoom must leave the near plane outside the physical hull.
    camera.position.set(0, 0, Math.max(1 + camera.near + .08, frameDistance() / zoom));
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    // These values are taken from the rendered model, after the actual GPU draw.
    host.dataset.orientation = rig.quaternion.toArray().map(n => n.toFixed(6)).join(",");
    host.dataset.zoom = zoom.toFixed(3);
    host.dataset.triangles = String(renderer.info.render.triangles);
    host.dataset.drawCalls = String(renderer.info.render.calls);
    host.dataset.frames = String(++renderCount);
    host.dataset.rendering = "true";
    if (!notified) { notified = true; onReady(); }
  }
  function schedule() { if (!dead && !frame && visible && !document.hidden) frame = requestAnimationFrame(render); }
  function fit() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || dead) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const vertical = T.MathUtils.degToRad(camera.fov) / 2;
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    baseDistance = 1 / Math.sin(Math.min(vertical, horizontal)) * 1.12;
    camera.far = baseDistance * 5;
    camera.updateProjectionMatrix();
    schedule();
  }
  function rotate(yaw: number, pitch = 0, roll = 0) {
    if (dead || !ready) return;
    if (yaw) rig.quaternion.premultiply(q.setFromAxisAngle(axisY, yaw));
    if (pitch) rig.quaternion.premultiply(q.setFromAxisAngle(axisX, pitch));
    if (roll) rig.quaternion.premultiply(q.setFromAxisAngle(axisZ, roll));
    rig.quaternion.normalize(); schedule();
  }
  function stopDrag() {
    const id = pointer; pointer = null; host.dataset.dragging = "false";
    if (id !== null && host.hasPointerCapture(id)) host.releasePointerCapture(id);
  }
  function down(event: PointerEvent) {
    if (!ready || !event.isPrimary || event.button !== 0 || (event.pointerType === "touch" && !touchEnabled)) return;
    pointer = event.pointerId; lastX = event.clientX; lastY = event.clientY;
    host.dataset.dragging = "true";
    host.focus({ preventScroll: true });
    host.setPointerCapture(event.pointerId);
    event.preventDefault(); event.stopPropagation();
  }
  function move(event: PointerEvent) {
    if (pointer !== event.pointerId) return;
    const dx = event.clientX - lastX, dy = event.clientY - lastY;
    const factor = Math.PI * 1.7 / Math.max(240, Math.min(host.clientWidth, host.clientHeight));
    if (event.shiftKey) rotate(0, 0, -dx * factor);
    else rotate(dx * factor, dy * factor);
    lastX = event.clientX; lastY = event.clientY;
    event.preventDefault(); event.stopPropagation();
  }
  function end(event: PointerEvent) { if (pointer === event.pointerId) stopDrag(); }
  function zoomBy(direction: number) { if (!ready || dead) return; zoom = T.MathUtils.clamp(zoom * Math.pow(1.14, direction), .65, 1.8); schedule(); }
  function reset() { stopDrag(); rig.quaternion.copy(base); zoom = 1; schedule(); }
  function keyboard(event: KeyboardEvent) {
    const step = Math.PI / (event.shiftKey ? 8 : 24);
    switch (event.key) {
      case "ArrowLeft": rotate(-step); break;
      case "ArrowRight": rotate(step); break;
      case "ArrowUp": rotate(0, -step); break;
      case "ArrowDown": rotate(0, step); break;
      case "q": case "Q": rotate(0, 0, step); break;
      case "e": case "E": rotate(0, 0, -step); break;
      case "+": case "=": zoomBy(1); break;
      case "-": case "_": zoomBy(-1); break;
      case "Home": reset(); break;
      case "Escape": stopDrag(); touchEnabled = false; onExit(); break;
      default: return;
    }
    event.preventDefault(); event.stopPropagation();
  }
  function visibility() { if (document.hidden) { stopDrag(); cancelAnimationFrame(frame); frame = 0; host.dataset.rendering = "false"; } else schedule(); }
  const intersection = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible) schedule();
    else { stopDrag(); cancelAnimationFrame(frame); frame = 0; host.dataset.rendering = "false"; }
  });
  intersection.observe(host);
  const resize = new ResizeObserver(fit); resize.observe(host);
  function lost(event: Event) { event.preventDefault(); if (!dead) { dispose(); onError(); } }
  host.addEventListener("pointerdown", down);
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerup", end);
  host.addEventListener("pointercancel", end);
  host.addEventListener("lostpointercapture", end);
  host.addEventListener("keydown", keyboard);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  window.addEventListener("blur", stopDrag);
  document.addEventListener("visibilitychange", visibility);
  signal.addEventListener("abort", dispose, { once: true });
  function dispose() {
    if (dead) return; dead = true; stopDrag(); cancelAnimationFrame(frame);
    resize.disconnect(); intersection.disconnect();
    host.removeEventListener("pointerdown", down); host.removeEventListener("pointermove", move);
    host.removeEventListener("pointerup", end); host.removeEventListener("pointercancel", end); host.removeEventListener("lostpointercapture", end);
    host.removeEventListener("keydown", keyboard); window.removeEventListener("blur", stopDrag);
    document.removeEventListener("visibilitychange", visibility); signal.removeEventListener("abort", dispose);
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    disposeModel(rig); releaseDecoder(); environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    host.dataset.rendering = "false";
  }
  const controller: VesselController = { rotate, zoom: zoomBy, reset, setTouchEnabled(enabled) { touchEnabled = enabled; if (!enabled) stopDrag(); }, dispose };
  if (signal.aborted) { dispose(); return controller; }
  fit();
  try {
    const response = await fetch(`/space-journey/interactive-vessels/${vessel}-v2.glb`, { signal });
    if (!response.ok) throw new Error("Model download unavailable");
    const buffer = await response.arrayBuffer();
    if (dead) return controller;
    parsing = true;
    const loaded = await loader.parseAsync(buffer, "/space-journey/interactive-vessels/").finally(() => {
      parsing = false;
      releaseDecoder();
    });
    if (dead) { disposeModel(loaded.scene); return controller; }
    const bounds = new T.Box3().setFromObject(loaded.scene);
    const center = bounds.getCenter(new T.Vector3());
    const radius = bounds.getBoundingSphere(new T.Sphere()).radius;
    if (!Number.isFinite(radius) || radius <= 0) { disposeModel(loaded.scene); throw new Error("Empty model"); }
    // Use the model's outer surface instead of empty box corners for framing.
    // Keep one farthest vertex per spherical sector: ~1,000 points after one
    // load-time pass, so rotation framing remains cheap even on dense meshes.
    const sectors = new Map<number, T.Vector3>();
    const sample = new T.Vector3();
    loaded.scene.updateMatrixWorld(true);
    loaded.scene.traverse(object => {
      const mesh = object as T.Mesh;
      const positions = mesh.geometry?.getAttribute("position");
      if (!positions) return;
      for (let i = 0; i < positions.count; i++) {
        sample.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).sub(center).divideScalar(radius);
        const length = sample.length();
        if (!length) continue;
        const azimuth = Math.floor((Math.atan2(sample.z, sample.x) + Math.PI) / (2 * Math.PI) * 48);
        const elevation = Math.floor((Math.asin(T.MathUtils.clamp(sample.y / length, -1, 1)) + Math.PI / 2) / Math.PI * 24);
        const sector = Math.min(47, azimuth) + Math.min(23, elevation) * 48;
        const previous = sectors.get(sector);
        if (!previous || previous.lengthSq() < sample.lengthSq()) sectors.set(sector, sample.clone());
      }
    });
    silhouette.push(...sectors.values());
    const normalized = new T.Group();
    loaded.scene.position.sub(center); normalized.add(loaded.scene); normalized.scale.setScalar(1 / radius); rig.add(normalized);
    ready = true; fit(); schedule();
  } catch {
    if (!dead && !signal.aborted) { dispose(); onError(); }
  }
  return controller;
}
