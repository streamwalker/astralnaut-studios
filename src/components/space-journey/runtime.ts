import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import * as T from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { stars } from "./beats/stars";
import { worlds, dispose } from "./beats/worlds";
import { flight, gaze, chapterIds } from "./flight";
export async function mountSpace(
  host: HTMLElement,
  home: boolean,
  onProgress: (p: number) => void,
  onReady: () => void,
  signal: AbortSignal,
  path = "/",
) {
  gsap.registerPlugin(ScrollTrigger);
  let renderer: T.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch {
    onReady();
    return () => {};
  }
  const gl = renderer.getContext();
  const low =
    matchMedia("(pointer:coarse)").matches ||
    navigator.hardwareConcurrency < 6 ||
    gl.getParameter(gl.MAX_TEXTURE_SIZE) < 8192;
  renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1.2 : 1.7));
  renderer.setSize(innerWidth, innerHeight);
  renderer.info.autoReset = false;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  scene.background = null;
  renderer.setClearColor(0x000000, 0);
  const environmentGenerator = new T.PMREMGenerator(renderer);
  const environmentRoom = new RoomEnvironment();
  const environment = environmentGenerator.fromScene(environmentRoom, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.35;
  environmentRoom.dispose();
  environmentGenerator.dispose();
  const camera = new T.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 900);
  scene.add(new T.HemisphereLight(0xbdd9f3, 0x18202b, 0.7));
  const sun = new T.DirectionalLight(0xe1f5ff, 2.5);
  const rim = new T.DirectionalLight(0x6dbdff, 2.2);
  rim.position.set(-50, 5, -100);
  scene.add(rim);
  sun.position.set(80, 45, 90);
  scene.add(sun);
  const manager = new T.LoadingManager();
  manager.onProgress = (_, loaded, total) => onProgress(Math.round((loaded / total) * 100));
  const updateStars = stars(scene, low);
  const objects = worlds(scene, low);
  let updateNebula: (t: number) => void = () => {};
  let dead = false,
    animation = 0,
    paused = false;
  const cleanups: Array<() => void> = [];
  const triggers: ScrollTrigger[] = [];
  function cleanup() {
    if (dead) return;
    dead = true;
    cancelAnimationFrame(animation);
    cleanups.forEach((f) => f());
    triggers.forEach((t) => t.kill());
    objects.dispose();
    dispose(scene);
    environment.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    host.dataset.ready = "false";
  }
  signal.addEventListener("abort", cleanup, { once: true });
  try {
    // Canon reference plates supply the environment; retain the readiness callback.
    updateNebula = () => {};
  } catch {
    cleanup();
    onReady();
    return cleanup;
  }
  if (dead || signal.aborted) {
    dispose(scene);
    return cleanup;
  }
  const target = new T.Vector2(),
    pointer = new T.Vector2();
  let touch: number | null = null;
  const move = (e: PointerEvent) => {
    if (e.target instanceof Element && e.target.closest(".vessel-viewer")) return;
    if (e.pointerType === "touch" && touch !== e.pointerId) return;
    target.set((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2);
    document.documentElement.style.setProperty("--cursor-x", e.clientX + "px");
    document.documentElement.style.setProperty("--cursor-y", e.clientY + "px");
  };
  const down = (e: PointerEvent) => {
    if (e.target instanceof Element && e.target.closest(".vessel-viewer")) return;
    if (e.isPrimary && e.pointerType === "touch") touch = e.pointerId;
  };
  const reset = () => {
    touch = null;
    target.set(0, 0);
  };
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerdown", down, { passive: true });
  window.addEventListener("pointerup", reset);
  window.addEventListener("pointercancel", reset);
  document.addEventListener("pointerleave", reset);
  cleanups.push(() => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerdown", down);
    window.removeEventListener("pointerup", reset);
    window.removeEventListener("pointercancel", reset);
    document.removeEventListener("pointerleave", reset);
  });
  let lenis: Lenis | undefined;
  let progress = home ? 0 : 0.72;
  const story = document.querySelector(".space-journey");
  if (home && story) {
    lenis = new Lenis({
      duration: 1.3,
      smoothWheel: true,
      anchors: true,
      prevent: (n) =>
        !!n.closest('[role="dialog"],dialog,[data-lenis-prevent],input,textarea,select'),
    });
    lenis.on("scroll", ScrollTrigger.update);
    cleanups.push(() => lenis?.destroy());
    const syncProgress = () => {
      const y = window.scrollY;
      const anchors = chapterIds.map((id) => {
        const el = document.getElementById(id)!;
        return el.getBoundingClientRect().top + y;
      });
      let p = 0;
      for (let i = 0; i < anchors.length - 1; i++) {
        if (y >= anchors[i])
          p = (i + T.MathUtils.clamp((y - anchors[i]) / (anchors[i + 1] - anchors[i]), 0, 1)) / 4;
      }
      progress = p;
    };
    triggers.push(
      ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: "bottom bottom",
        onUpdate: syncProgress,
        onRefresh: syncProgress,
      }),
    );
    syncProgress();
    const context = gsap.context(() => {
      document.querySelectorAll<HTMLElement>(".flight-copy").forEach((el, i) => {
        if (i)
          gsap.fromTo(
            el,
            { opacity: 0.7, y: 24 },
            {
              opacity: 1,
              y: 0,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 95%", end: "top 65%", scrub: 0.5 },
            },
          );
      });
    });
    cleanups.push(() => context.revert());
  }
  if (!home) {
    const base = path.includes("children-of-aquarius")
      ? 0.2
      : path.includes("darker-ages")
        ? 0.43
        : path.includes("industry")
          ? 0.93
          : 0.72;
    triggers.push(
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          progress = base + self.progress * 0.04;
        },
      }),
    );
    progress = base;
  }
  const resize = () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    ScrollTrigger.refresh();
  };
  window.addEventListener("resize", resize);
  cleanups.push(() => window.removeEventListener("resize", resize));
  const pause = () => {
    paused = !paused;
    host.dataset.paused = String(paused);
  };
  window.addEventListener("space-toggle-motion", pause);
  cleanups.push(() => window.removeEventListener("space-toggle-motion", pause));
  let last = 0,
    time = 0,
    count = 0,
    slow = 0;
  const aim = new T.Vector3();
  const frame = (ms: number) => {
    if (dead) return;
    animation = requestAnimationFrame(frame);
    if (document.hidden) {
      last = ms;
      return;
    }
    const dt = Math.min((ms - last) / 1000 || 0.016, 0.05);
    last = ms;
    lenis?.raf(ms);
    if (!paused) time += dt;
    pointer.lerp(target, 1 - Math.exp(-dt * 3));
    host.parentElement?.style.setProperty("--scene-x", `${pointer.x * 10}px`);
    host.parentElement?.style.setProperty("--scene-y", `${pointer.y * 7}px`);
    camera.position.copy(flight.getPoint(progress));
    camera.position.x += pointer.x * 1.8;
    camera.position.y -= pointer.y * 1.2;
    aim.copy(gaze.getPoint(progress));
    camera.lookAt(aim);
    updateStars(time, camera);
    updateNebula(time);
    objects.update(time, progress);
    void objects.load();
    renderer.info.reset();
    renderer.render(scene, camera);
    if (++count % 20 === 0) {
      const fleetStatus = objects.getStatus();
      host.dataset.fleetAssets = JSON.stringify(fleetStatus.assets);
      host.dataset.fleetCount = String(fleetStatus.trafficCount);
      host.dataset.fleetTime = String(fleetStatus.trafficTime);
      host.dataset.progress = progress.toFixed(3);
      host.dataset.drawCalls = String(renderer.info.render.calls);
      host.dataset.quality = low ? "mobile" : "full";
      host.dataset.pointer = `${pointer.x.toFixed(3)},${pointer.y.toFixed(3)}`;
      host.dataset.ambientTime = time.toFixed(3);
    }
    if (dt > 0.029 && !low && count > 100) slow++;
    if (slow > 70) {
      renderer.setPixelRatio(1);
      slow = 0;
    }
  };
  host.dataset.ready = "true";
  onProgress(100);
  onReady();
  animation = requestAnimationFrame(frame);
  ScrollTrigger.refresh();
  const contextLost = (e: Event) => {
    e.preventDefault();
    cleanup();
    onReady();
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost, { once: true });
  return cleanup;
}
