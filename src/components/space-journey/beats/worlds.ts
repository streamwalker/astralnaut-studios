import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
export function worlds(scene: T.Scene, low: boolean) {
  const draco = new DRACOLoader().setDecoderPath("/battlefield-atlantis/cinematic/draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);
  let dead = false,
    started = false;
  const root = new T.Group();
  scene.add(root);
  const rotating: T.Object3D[] = [];
  let planet: T.Object3D | undefined;
  let ship: T.Object3D | undefined;
  async function load() {
    if (started || dead) return;
    started = true;
    await Promise.allSettled(
      ["station", "asteroids", "planet", "starship"].map(async (name) => {
        const gltf = await loader.loadAsync(`/space-journey/${name}.glb`);
        if (dead) {
          dispose(gltf.scene);
          return;
        }
        const model = gltf.scene;
        if (name === "station") {
          model.scale.setScalar(2.1);
          model.position.set(18, 9, -158);
          model.rotation.set(0.7, 0.25, 0.3);
          root.add(model);
          rotating.push(model);
        }
        if (name === "starship") {
          model.scale.setScalar(3);
          model.position.set(19, 2, -355);
          model.rotation.set(-0.25, 0.65, Math.PI * 0.1);
          root.add(model);
          ship = model;
        }
        if (name === "asteroids") {
          let i = 0;
          model.traverse((o) => {
            if (!(o instanceof T.Mesh)) return;
            const count = low ? 5 : 13;
            const field = new T.InstancedMesh(o.geometry, o.material, count);
            const dummy = new T.Object3D();
            for (let k = 0; k < count; k++) {
              const a = k * 2.4 + i * 1.7;
              dummy.position.set(
                Math.cos(a) * (22 + k * 2),
                Math.sin(a) * 20,
                -105 - k * 2 - i * 3,
              );
              dummy.rotation.set(a, a * 0.7, a * 0.2);
              dummy.scale.setScalar(0.7 + (k % 3) * 1.3);
              dummy.updateMatrix();
              field.setMatrixAt(k, dummy.matrix);
            }
            root.add(field);
            i++;
          });
        }
        if (name === "planet") {
          model.scale.setScalar(23);
          model.position.set(34, 9, -255);
          planet = model;
          root.add(model);
          model.traverse((o) => {
            if (!(o instanceof T.Mesh)) return;
            if (o.name === "CloudShell") {
              o.material = new T.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                uniforms: { time: { value: 0 } },
                vertexShader: `varying vec3 pos;varying vec3 norm;void main(){pos=position;norm=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
                fragmentShader: `varying vec3 pos;varying vec3 norm;float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,31.714)))*43758.5);}float n(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){vec3 p=normalize(pos);float v=n(p*9.)*.55+n(p*23.)*.28+n(p*65.)*.12+n(p*140.)*.05;float shade=max(.12,dot(normalize(norm),normalize(vec3(.8,.45,.9))));gl_FragColor=vec4(vec3(.8,.88,.95)*shade,smoothstep(.54,.7,v)*.65);}`,
              });
            }
          });
          const atmosphere = new T.Mesh(
            new T.SphereGeometry(1.025, 64, 40),
            new T.ShaderMaterial({
              transparent: true,
              depthWrite: false,
              side: T.FrontSide,
              blending: T.AdditiveBlending,
              vertexShader: `varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
              fragmentShader: `varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(.16,.58,1.,f*.5);}`,
            }),
          );
          model.add(atmosphere);
        }
      }),
    );
  }
  return {
    load,
    update(time: number) {
      rotating.forEach((o) => (o.rotation.z = time * 0.025));
      if (planet) planet.rotation.y = time * 0.012;
      if (ship) ship.position.y = 2 + Math.sin(time * 0.4) * 0.7;
    },
    dispose() {
      dead = true;
      draco.dispose();
      dispose(root);
    },
  };
}
export function dispose(root: T.Object3D) {
  const textures = new Set<T.Texture>();
  root.traverse((o) => {
    if (o instanceof T.Mesh || o instanceof T.Points) {
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        Object.values(m).forEach((v) => {
          if (v instanceof T.Texture) textures.add(v);
        });
        if (m instanceof T.ShaderMaterial)
          Object.values(m.uniforms).forEach((v) => {
            if (v.value instanceof T.Texture) textures.add(v.value);
          });
        m.dispose();
      }
    }
  });
  textures.forEach((t) => t.dispose());
}
