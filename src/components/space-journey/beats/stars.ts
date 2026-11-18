import * as T from "three";
export function stars(scene: T.Scene, low: boolean) {
  const group = new T.Group();
  scene.add(group);
  let seed = 173;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let layer = 0; layer < 3; layer++) {
    const count = low ? 400 : 1400,
      positions = new Float32Array(count * 3),
      sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions.set([(rand() - 0.5) * 360, (rand() - 0.5) * 220, 80 - rand() * 650], i * 3);
      sizes[i] = 0.5 + rand() * 2;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(positions, 3));
    geo.setAttribute("size", new T.BufferAttribute(sizes, 1));
    const material = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        tint: { value: new T.Color(layer === 1 ? "#a5b7ef" : "#d2f5ff") },
      },
      vertexShader: `attribute float size;uniform float time;varying float light;void main(){vec4 p=modelViewMatrix*vec4(position,1.);light=.65+.35*sin(time*.45+position.x);gl_PointSize=clamp(size*100./max(15.,-p.z),.6,3.);gl_Position=projectionMatrix*p;}`,
      fragmentShader: `uniform vec3 tint;varying float light;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(tint,(1.-smoothstep(.0,.5,d))*light);}`,
    });
    group.add(new T.Points(geo, material));
  }
  const shooting = new T.Mesh(
    new T.CylinderGeometry(0, 0.018, 4, 4),
    new T.MeshBasicMaterial({ color: "#b8f7ff", transparent: true, opacity: 0 }),
  );
  shooting.rotation.z = -1;
  scene.add(shooting);
  return (time: number, camera: T.Camera) => {
    group.children.forEach(
      (o) => (((o as T.Points).material as T.ShaderMaterial).uniforms.time.value = time),
    );
    const t = time % 16;
    (shooting.material as T.MeshBasicMaterial).opacity = t < 0.8 ? (1 - t / 0.8) * 0.5 : 0;
    shooting.position.copy(camera.position).add(new T.Vector3(14 - t * 30, 9 - t * 14, -35));
  };
}
