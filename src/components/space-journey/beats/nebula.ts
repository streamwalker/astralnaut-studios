import * as T from "three";
export async function nebula(scene: T.Scene, manager: T.LoadingManager, low: boolean) {
  const textures = await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      new T.TextureLoader(manager).loadAsync(
        `/space-journey/nebula-${String(i).padStart(2, "0")}.png`,
      ),
    ),
  );
  const group = new T.Group();
  scene.add(group);
  for (let i = 0; i < (low ? 18 : 34); i++) {
    const material = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      uniforms: {
        map: { value: textures[i % 12] },
        time: { value: i * 3 },
        tint: { value: new T.Color(i % 3 === 0 ? "#a188eb" : "#5bcac9") },
      },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform sampler2D map;uniform float time;uniform vec3 tint;varying vec2 vUv;void main(){vec2 uv=vUv+vec2(sin(vUv.y*8.+time*.035),cos(vUv.x*7.+time*.026))*.025;vec4 tex=texture2D(map,uv);float edge=smoothstep(.5,.23,length(vUv-.5));gl_FragColor=vec4(tex.rgb*tint*.85,tex.a*edge*.18);}`,
    });
    const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), material);
    mesh.position.set(Math.sin(i * 2.39) * 32, Math.cos(i * 1.6) * 18, -18 - i * 9);
    mesh.scale.set(65 + (i % 4) * 13, 40 + (i % 3) * 12, 1);
    mesh.rotation.z = i * 1.7;
    group.add(mesh);
  }
  // Deep gas behind the transparent billboards, domain-warped fractal noise.
  const fog = new T.ShaderMaterial({
    side: T.DoubleSide,
    transparent: true,
    depthWrite: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float time;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(.8,.6,-.6,.8)*p*2.1;a*=.5;}return v;}void main(){vec2 p=vUv*5.;float n=fbm(p+vec2(fbm(p+time*.012),fbm(p+4.)));float lane=exp(-pow((vUv.y-.5+(vUv.x-.5)*.3)*3.,2.));vec3 col=mix(vec3(.12,.035,.24),vec3(.015,.24,.28),smoothstep(.35,.75,n));gl_FragColor=vec4(col*(.15+n)*lane*.65,.8);}`,
  });
  const plane = new T.Mesh(new T.PlaneGeometry(2000, 1200), fog);
  plane.position.z = -430;
  scene.add(plane);
  return (time: number) => {
    fog.uniforms.time.value = time;
    group.children.forEach((o, i) => {
      (o as T.Mesh<T.BufferGeometry, T.ShaderMaterial>).material.uniforms.time.value = time + i * 3;
      o.rotation.z += 0.000015 * (i % 2 ? 1 : -1);
    });
  };
}
