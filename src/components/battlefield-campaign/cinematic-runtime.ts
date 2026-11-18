import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const BASE = "/battlefield-atlantis/cinematic";

/** Desktop-only enhancement. Static HTML artwork is authoritative and survives every failure path. */
export function mountCinematic(root: HTMLDivElement) {
  gsap.registerPlugin(ScrollTrigger);
  const cleanups: Array<() => void> = [];
  const frames: Array<(time: number) => void> = [];
  let disposed = false;
  const headerHeight = () => document.querySelector("header")?.getBoundingClientRect().height ?? 130;
  const lenis = new Lenis({ duration: 1.05, smoothWheel: true, anchors: { offset: -headerHeight() - 20 }, prevent: node => !!node.closest('[role="dialog"], [data-lenis-prevent], .ba-intro') });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => {
    lenis.raf(time * 1000);
    if (!document.hidden) frames.forEach(frame => frame(time));
  };
  gsap.ticker.add(tick);
  root.dataset.motion = "active";

  const context = gsap.context(() => {
    root.parentElement?.querySelectorAll<HTMLElement>("[data-reveal], .ba-campaign__section-heading").forEach(el => {
      gsap.fromTo(el, { y: 60, opacity: .25 }, { y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 92%", end: "top 58%", scrub: .5 } });
    });
  }, root);

  function mountScene(host: HTMLElement) {
    if (disposed || host.dataset.loaded) return;
    host.dataset.loaded = "true";
    const showcase = host.dataset.scene === "showcase";
    const section = host.closest("section")!;
    const canvasHost = host.querySelector<HTMLElement>(".ba-cinematic__canvas")!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { host.dataset.loaded = "fallback"; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    canvasHost.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
    camera.position.set(0, 0, 7.3);
    const ambient = new THREE.HemisphereLight(0xd6efff, 0x242b38, 2.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x54ceff, 3); rim.position.set(4, 1, -2); scene.add(rim);
    const warm = new THREE.DirectionalLight(0xd9ac72, 1.5); warm.position.set(-3, -2, -1); scene.add(warm);
    const scrollGroup = new THREE.Group();
    const pointerGroup = new THREE.Group();
    scrollGroup.add(pointerGroup); scene.add(scrollGroup);
    const pointer = new THREE.Vector2();
    const rotation = new THREE.Vector2();
    const state = { progress: 0 };
    let visible = false;
    let failed = false;
    let localDisposed = false;
    let model: THREE.Group | undefined;
    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Tween[] = [];
    const draco = new DRACOLoader().setDecoderPath(`${BASE}/draco/`).setWorkerLimit(1);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const disposeModel = (object: THREE.Object3D) => {
      const textures = new Set<THREE.Texture>();
      object.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(mat => { Object.values(mat).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); }); mat.dispose(); });
      });
      textures.forEach(texture => { const source = texture.source.data; if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) source.close(); texture.dispose(); });
    };
    const fail = () => {
      failed = true;
      delete host.dataset.ready;
      host.dataset.loaded = "fallback";
      tweens.forEach(tween => tween.kill()); triggers.forEach(trigger => trigger.kill());
      section.querySelector("[data-rotation-label]")?.replaceChildren("Cover study");
    };
    const onContextLost = (event: Event) => { event.preventDefault(); fail(); };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    const timeout = window.setTimeout(fail, 18000);
    loader.load(`${BASE}/battlefield-edition.glb`, gltf => {
      window.clearTimeout(timeout);
      if (disposed || localDisposed || failed) { disposeModel(gltf.scene); return; }
      model = gltf.scene;
      pointerGroup.add(model);
      model.traverse(child => { if (child instanceof THREE.Mesh) { const material = child.material as THREE.MeshStandardMaterial; if (material.map) material.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4); } });
      host.dataset.ready = "true";
      if (showcase) {
        section.querySelector("[data-rotation-label]")?.replaceChildren("Scroll to rotate");
        const tween = gsap.to(state, { progress: 1, ease: "none", scrollTrigger: {
          trigger: section, start: () => `top top+=${headerHeight()}`, end: () => `+=${Math.round(window.innerHeight * 1.5)}`,
          pin: true, pinSpacing: true, scrub: .8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: trigger => { (section.querySelector(".ba-cinematic__progress") as HTMLElement).style.setProperty("--progress", String(trigger.progress)); },
        } });
        tweens.push(tween); if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      } else {
        const tween = gsap.to(state, { progress: 1, ease: "none", scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: .7 } });
        tweens.push(tween); if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      }
      ScrollTrigger.refresh();
    }, undefined, () => { window.clearTimeout(timeout); fail(); });

    function resize() {
      const { width, height } = canvasHost.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvasHost); resize();
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: 0 }); observer.observe(host);
    const move = (event: PointerEvent) => { const box = section.getBoundingClientRect(); pointer.set(((event.clientX-box.left)/box.width-.5)*2, ((event.clientY-box.top)/box.height-.5)*2); };
    const leave = () => pointer.set(0, 0);
    section.addEventListener("pointermove", move); section.addEventListener("pointerleave", leave); section.addEventListener("pointercancel", leave);
    const frame = (time: number) => {
      if (!visible || failed || !model) return;
      rotation.lerp(pointer, .055);
      pointerGroup.rotation.set(rotation.y * .07, rotation.x * .1, 0);
      if (showcase) {
        scrollGroup.rotation.set(.08 + Math.sin(state.progress*Math.PI)*.14, -.25 + state.progress*Math.PI*2, -.045);
        scrollGroup.position.y = Math.sin(time*.65)*.035;
        camera.position.z = 6.7 - Math.sin(state.progress*Math.PI)*.7;
      } else {
        scrollGroup.rotation.set(.055+state.progress*.15, -.32+state.progress*.9, -.065+state.progress*.08);
        scrollGroup.position.y = Math.sin(time*.65)*.045 + state.progress*.25;
        camera.position.z = 6.55-state.progress*.85;
      }
      renderer.render(scene, camera);
      // Read-only diagnostics for browser QA; no background telemetry.
      host.dataset.drawCalls = String(renderer.info.render.calls);
      host.dataset.triangles = String(renderer.info.render.triangles);
    };
    frames.push(frame);
    cleanups.push(() => {
      localDisposed = true; clearTimeout(timeout);
      tweens.forEach(tween => tween.kill()); triggers.forEach(trigger => trigger.kill());
      observer.disconnect(); resizeObserver.disconnect();
      section.removeEventListener("pointermove", move); section.removeEventListener("pointerleave", leave); section.removeEventListener("pointercancel", leave);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      if (model) disposeModel(model);
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); draco.dispose();
      delete host.dataset.loaded; delete host.dataset.ready;
      section.querySelector("[data-rotation-label]")?.replaceChildren("Cover study");
      (section.querySelector(".ba-cinematic__progress") as HTMLElement | null)?.style.removeProperty("--progress");
    });
  }

  const lazyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { mountScene(entry.target as HTMLElement); lazyObserver.unobserve(entry.target); } });
  }, { rootMargin: "500px 0px" });
  root.querySelectorAll<HTMLElement>("[data-scene]").forEach(host => lazyObserver.observe(host));
  return () => {
    disposed = true; lazyObserver.disconnect(); cleanups.forEach(cleanup => cleanup());
    context.revert(); gsap.ticker.remove(tick); lenis.destroy(); delete root.dataset.motion;
    ScrollTrigger.refresh();
  };
}
