import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { flight, gaze } from "../flight";

/** The photo plate supplies the reference planet; these are independently moving 3D craft. */
export function worlds(scene: T.Scene, low: boolean) {
  const draco = new DRACOLoader().setDecoderPath("/battlefield-atlantis/cinematic/draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const root = new T.Group();
  root.name = "ReferenceFleet";
  scene.add(root);
  const fleetRoot = new T.Group();
  fleetRoot.name = "OrbitalTraffic";
  root.add(fleetRoot);
  const traffic: T.Group[] = [];
  const trailMaterials: T.MeshBasicMaterial[] = [];
  let dead = false;
  let started = false;
  let hero: T.Group | undefined;
  const axis = new T.Vector3(0, 0, 1);
  const tangent = new T.Vector3();
  const camera = new T.Vector3();
  const view = new T.Vector3();
  const angle = new T.Quaternion();
  const preferredUp = new T.Vector3(0, 0.8, 0.6).normalize();
  const right = new T.Vector3();
  const dorsal = new T.Vector3();
  const basis = new T.Matrix4();
  const assets = { station: "interactive-viewer", ryuken: "pending" };
  root.userData.assets = assets;

  // Wrap, rather than changing the exported model's origin, so clone materials stay shared.
  function normalized(model: T.Object3D, length: number) {
    const bounds = new T.Box3().setFromObject(model);
    const size = bounds.getSize(new T.Vector3());
    const center = bounds.getCenter(new T.Vector3());
    const holder = new T.Group();
    model.position.sub(center);
    holder.add(model);
    holder.scale.setScalar(length / Math.max(size.x, size.y, size.z, 0.001));
    return holder;
  }

  async function load() {
    if (started || dead) return;
    started = true;
    await Promise.allSettled([
      loader.loadAsync("/space-journey/reference-fleet/ryuken.glb").then(({ scene: model }) => {
        if (dead) { dispose(model); return; }
        // One geometry/material set is reused by every craft, including the close flyby.
        hero = normalized(model, 30);
        hero.name = "Ryuken";
        hero.position.set(19, 2, -355);
        hero.rotation.set(0.5, -0.5, -0.14);
        hero.visible = false;
        // Source holder remains off-scene; fleet clones share its GPU resources.
        const count = low ? 6 : 10;
        const trailGeometry = new T.ConeGeometry(0.16, 4, 6, 1, true);
        trailGeometry.rotateX(-Math.PI / 2);
        for (let i = 0; i < count; i++) {
          const vessel = new T.Group();
          vessel.name = `RyukenEscort-${i + 1}`;
          const clone = model.clone(true);
          clone.position.copy(model.position);
          const hull = new T.Group();
          hull.add(clone);
          const length = i < 2 ? 7.4 : 3.1 + (i % 3) * 0.75;
          hull.scale.setScalar(hero!.scale.x * length / 30);
          vessel.add(hull);
          const plume = new T.MeshBasicMaterial({
            color: "#8edbff", transparent: true, opacity: 0.28,
            depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
          });
          trailMaterials.push(plume);
          // Two separate thin cyan exhaust trails echo the two reference nacelles.
          for (const side of [-1, 1]) {
            const trail = new T.Mesh(trailGeometry, plume);
            trail.position.set(side * length * 0.2, 0, -length * 0.38 - 1.8);
            vessel.add(trail);
          }
          traffic.push(vessel);
          fleetRoot.add(vessel);
        }
        assets.ryuken = "ready";
      }).catch(() => { assets.ryuken = "unavailable"; }),
    ]);
  }

  return {
    load,
    getStatus() {
      return { assets: { ...assets }, trafficCount: traffic.length, trafficTime: root.userData.trafficTime ?? 0 };
    },
    update(time: number, progress = 0.72) {
      const p = T.MathUtils.clamp(progress, 0, 1);
      fleetRoot.visible = p < 0.15 || (p > 0.62 && p < 0.89);
      if (!fleetRoot.visible || !traffic.length) return;
      camera.copy(flight.getPoint(p));
      view.copy(gaze.getPoint(p)).sub(camera).normalize();
      fleetRoot.position.copy(camera).addScaledVector(view, 74);
      fleetRoot.lookAt(camera);
      // Elliptical orbital lanes have real depth: ships recede and return at different rates.
      traffic.forEach((vessel, i) => {
        const theta = time * (0.055 + (i % 4) * 0.012) + i * 2.39996;
        const radius = 19 + (i % 4) * 5;
        const lane = i % 2 ? 1 : -1;
        vessel.position.set(12 + Math.cos(theta) * radius, 3 + Math.sin(theta) * radius * 0.32, Math.sin(theta + 0.5) * 13 + (i % 3) * 3);
        tangent.set(-Math.sin(theta) * radius, Math.cos(theta) * radius * 0.32, Math.cos(theta + 0.5) * 13).normalize();
        right.crossVectors(preferredUp, tangent).normalize();
        dorsal.crossVectors(tangent, right).normalize();
        basis.makeBasis(right, dorsal, tangent);
        vessel.quaternion.setFromRotationMatrix(basis);
        angle.setFromAxisAngle(axis, lane * 0.09 + Math.sin(theta) * 0.12);
        vessel.quaternion.multiply(angle);
        trailMaterials[i].opacity = 0.24 + Math.sin(time * 1.8 + i) * 0.035;
      });
      root.userData.trafficTime = time;
      root.userData.trafficCount = traffic.length;
    },
    dispose() {
      if (dead) return;
      dead = true;
      draco.dispose();
      dispose(root);
      root.removeFromParent();
    },
  };
}

/** Shared fleet geometry, material and texture allocations are each released once. */
export function dispose(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  const textures = new Set<T.Texture>();
  root.traverse((object) => {
    if (object instanceof T.Mesh || object instanceof T.Points || object instanceof T.Line) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        Object.values(material).forEach((value) => { if (value instanceof T.Texture) textures.add(value); });
        if (material instanceof T.ShaderMaterial) {
          Object.values(material.uniforms).forEach(({ value }) => { if (value instanceof T.Texture) textures.add(value); });
        }
      }
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}
