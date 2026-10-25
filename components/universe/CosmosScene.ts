import * as THREE from 'three';
import gsap from 'gsap';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { WORLDS, WORLD_LAYOUT, FOCUS_LAYOUT, type WorldId, type Slot } from './worlds';
import {
  planetVertex, planetFragment, atmosphereFragment, ringVertex, ringFragment,
  rockVertex, rockFragment, skyVertex, skyFragment,
} from './shaders';

export type CosmosMode = 'worlds' | 'tasks' | 'ambient';
export type Frame = { left: number; top: number; width: number; height: number };
/** Projected body on screen in CSS px (viewport coordinates). */
export type Projection = { x: number; y: number; r: number; o: number };

type BodyState = { x: number; y: number; r: number; o: number; hover: number; press: number };

interface Planet {
  id: WorldId;
  group: THREE.Group;
  spin: THREE.Group;
  planetMat: THREE.ShaderMaterial;
  atmoMat: THREE.ShaderMaterial;
  ringMat: THREE.ShaderMaterial;
  moons: { pivot: THREE.Group; speed: number; mat: THREE.ShaderMaterial }[];
  state: BodyState;
}
interface Rock { group: THREE.Group; mesh: THREE.Mesh; mat: THREE.ShaderMaterial; state: BodyState; tumble: THREE.Vector3 }

const FOV = 32;
const CAM_Z = 30;

// Small deterministic value-noise for CPU-side rock displacement.
function hash3(x: number, y: number, z: number) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(ix + dx, iy + dy, iz + dz);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w) * 2 - 1;
}
function rockGeometry(seed: number, detail = 4) {
  // Merge the icosahedron's duplicated vertices so displaced rocks get smooth, natural shading.
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, detail).deleteAttribute('normal').deleteAttribute('uv'));
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const stretch = new THREE.Vector3(1 + hash3(seed, 1, 2) * 0.45, 0.72 + hash3(seed, 3, 1) * 0.25, 0.85 + hash3(seed, 5, 7) * 0.3);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let d = 0, a = 0.42, f = 1.15;
    for (let o = 0; o < 4; o++) { d += a * vnoise(v.x * f + seed, v.y * f - seed, v.z * f + seed * 0.5); a *= 0.5; f *= 2.1; }
    // Flattened facets give the chipped, rocky silhouette from the artwork.
    const facet = Math.abs(vnoise(v.x * 2.3 + seed * 3, v.y * 2.3, v.z * 2.3)) * -0.09;
    v.multiplyScalar(1 + d + facet).multiply(stretch);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function hex(c: string) { return new THREE.Color(c); }

export class CosmosScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private skyMat: THREE.ShaderMaterial;
  private planets: Planet[] = [];
  private rocks: Rock[] = [];
  private foreground: { mesh: THREE.Mesh; base: THREE.Vector3; mat: THREE.ShaderMaterial; dim: number; small?: boolean }[] = [];
  private dust: THREE.Points;
  private clock = new THREE.Clock();
  private raf = 0;
  private running = false;
  private mode: CosmosMode = 'worlds';
  private focus: WorldId | null = null;
  private portrait = false;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private sky = { dim: 1 };
  private disposed = false;
  private reduced: boolean;
  private rtl = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private getFrame: () => Frame,
    private onFrame: (planets: Record<WorldId, Projection>, rocks: Projection[]) => void,
    opts: { reducedMotion: boolean },
  ) {
    this.reduced = opts.reducedMotion;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x03050a, 1);
    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    this.camera.position.set(0, 0, CAM_Z);

    // Sky (full-screen quad drawn behind everything).
    this.skyMat = new THREE.ShaderMaterial({
      vertexShader: skyVertex, fragmentShader: skyFragment, depthWrite: false, depthTest: false,
      uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uDim: { value: 1 }, uShift: { value: new THREE.Vector2() }, uPortrait: { value: 0 } },
    });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.skyMat);
    sky.frustumCulled = false; sky.renderOrder = -10;
    this.scene.add(sky);

    const sphere = new THREE.SphereGeometry(1, 96, 64);
    const atmoSphere = new THREE.SphereGeometry(1.07, 64, 48);
    const moonGeo = rockGeometry(4.2, 3);

    for (const w of WORLDS) {
      const L = w.look;
      const group = new THREE.Group();
      const spin = new THREE.Group();
      group.add(spin);
      const planetMat = new THREE.ShaderMaterial({
        vertexShader: planetVertex, fragmentShader: planetFragment, transparent: true,
        uniforms: {
          uOcean: { value: hex(L.ocean) }, uLand: { value: hex(L.land) }, uLand2: { value: hex(L.land2) }, uEmit: { value: hex(L.emit) }, uRim: { value: hex(L.rim) },
          uSeed: { value: L.seed }, uOpacity: { value: 1 }, uVeins: { value: L.veins }, uHover: { value: 0 }, uLandAmt: { value: L.landAmt },
        },
      });
      const planet = new THREE.Mesh(sphere, planetMat);
      planet.rotation.z = 0.32;
      spin.add(planet);
      const atmoMat = new THREE.ShaderMaterial({
        vertexShader: planetVertex, fragmentShader: atmosphereFragment, transparent: true, side: THREE.BackSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
        uniforms: { uRim: { value: hex(L.rim) }, uOpacity: { value: 1 }, uHover: { value: 0 } },
      });
      group.add(new THREE.Mesh(atmoSphere, atmoMat));
      const ringMat = new THREE.ShaderMaterial({
        vertexShader: ringVertex, fragmentShader: ringFragment, transparent: true, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
        uniforms: {
          uColor: { value: hex(L.ring) }, uColor2: { value: hex(L.ring2) }, uInner: { value: L.ringInner }, uOuter: { value: L.ringOuter },
          uSeed: { value: L.seed }, uOpacity: { value: 1 }, uTime: { value: 0 }, uHover: { value: 0 }, uDensity: { value: L.ringDensity },
        },
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(L.ringInner, L.ringOuter, 220, 1), ringMat);
      ring.rotation.set(-L.ringTilt[0], L.ringTilt[1], L.ringTilt[2]);
      group.add(ring);
      const moons: Planet['moons'] = [];
      for (let m = 0; m < L.moons; m++) {
        const pivot = new THREE.Group();
        pivot.rotation.set(-L.ringTilt[0] + (m ? 0.25 : -0.1), m * 2.1, L.ringTilt[2]);
        const mat = new THREE.ShaderMaterial({
          vertexShader: rockVertex, fragmentShader: rockFragment, transparent: true,
          uniforms: { uSeed: { value: L.seed + m * 9 }, uOpacity: { value: 1 }, uHover: { value: 0 }, uGlow: { value: hex(L.rim) }, uDim: { value: 0.9 }, uSelected: { value: 0 } },
        });
        const moon = new THREE.Mesh(moonGeo, mat);
        const dist = L.ringOuter * (m ? 0.92 : 1.12);
        moon.position.set(dist, 0, 0);
        moon.scale.setScalar(m ? 0.07 : 0.11);
        pivot.add(moon);
        group.add(pivot);
        moons.push({ pivot, speed: (m ? -0.12 : 0.18) * (1 + L.seed % 1), mat });
      }
      this.scene.add(group);
      this.planets.push({ id: w.id, group, spin, planetMat, atmoMat, ringMat, moons, state: { x: 0.5, y: 0.5, r: 0, o: 0, hover: 0, press: 0 } });
    }

    // Four task asteroids, each with its own silhouette.
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: rockVertex, fragmentShader: rockFragment, transparent: true,
        uniforms: { uSeed: { value: 11 + i * 5.3 }, uOpacity: { value: 0 }, uHover: { value: 0 }, uGlow: { value: hex('#f2c46f') }, uDim: { value: 1 }, uSelected: { value: 0 } },
      });
      const mesh = new THREE.Mesh(rockGeometry(2.3 + i * 3.7, 5), mat);
      const group = new THREE.Group(); group.add(mesh);
      mesh.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      this.scene.add(group);
      this.rocks.push({ group, mesh, mat, state: { x: 0.5, y: 0.5, r: 0, o: 0, hover: 0, press: 0 }, tumble: new THREE.Vector3(0.05 + i * 0.02, 0.08 - i * 0.012, 0.03) });
    }

    // Large, dark foreground rocks framing the scene (parallax depth like the artwork's corners).
    const fgSpots: [number, number, number, number][] = [[-1.14, -1.1, 2.2, 1], [1.13, -1.0, 1.8, 2], [-1.12, 0.22, 1.0, 3], [1.12, 0.5, 0.8, 4]];
    for (const [x, y, s, seed] of fgSpots) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: rockVertex, fragmentShader: rockFragment, transparent: true,
        uniforms: { uSeed: { value: seed * 7.7 }, uOpacity: { value: 1 }, uHover: { value: 0 }, uGlow: { value: hex('#c99a5a') }, uDim: { value: 0.42 }, uSelected: { value: 0 } },
      });
      const mesh = new THREE.Mesh(rockGeometry(seed * 2.9, 5), mat);
      mesh.scale.setScalar(s);
      mesh.rotation.set(seed, seed * 0.6, seed * 0.3);
      this.scene.add(mesh);
      this.foreground.push({ mesh, base: new THREE.Vector3(x, y, 8), mat, dim: 0.38 });
    }

    // Small floating debris scattered through the scene, like the artwork's rock field.
    const debrisGeos = [rockGeometry(41, 2), rockGeometry(57, 2), rockGeometry(73, 2)];
    const debris: [number, number, number, number][] = [
      [-0.62, 0.32, 1, 0.16], [-0.28, 0.12, -2, 0.1], [0.3, 0.22, 0, 0.12], [0.46, -0.08, 2, 0.14], [0.68, 0.04, -1, 0.11],
      [-0.4, -0.42, 2, 0.18], [-0.12, -0.66, 0, 0.12], [0.16, -0.5, 3, 0.15], [0.38, -0.82, 1, 0.2], [-0.78, -0.2, 3, 0.13],
      [0.82, -0.3, 2, 0.12], [-0.5, 0.62, -3, 0.09], [0.6, 0.66, -2, 0.1], [0.04, 0.58, -4, 0.08],
    ];
    debris.forEach(([x, y, z, sc], i) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: rockVertex, fragmentShader: rockFragment, transparent: true,
        uniforms: { uSeed: { value: i * 3.3 }, uOpacity: { value: 1 }, uHover: { value: 0 }, uGlow: { value: hex('#d9a861') }, uDim: { value: 0.85 }, uSelected: { value: 0 } },
      });
      const mesh = new THREE.Mesh(debrisGeos[i % 3], mat);
      mesh.scale.setScalar(sc * 2.2);
      mesh.rotation.set(i, i * 0.7, i * 0.2);
      this.scene.add(mesh);
      this.foreground.push({ mesh, base: new THREE.Vector3(x, y, z), mat, dim: 0.85, small: true });
    });

    // Drifting dust motes for depth.
    const count = 420;
    const dpos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      dpos[i * 3] = (Math.random() - 0.5) * 60; dpos[i * 3 + 1] = (Math.random() - 0.5) * 36; dpos[i * 3 + 2] = Math.random() * 18 - 6;
    }
    const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
    this.dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0xf3d6a4, size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.scene.add(this.dust);

    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    this.resize();
    this.applyMode(true);
    this.start();
  }

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  private onScroll = () => { this.renderOnce(); };
  private onVisibility = () => { if (document.hidden) this.stop(); else this.start(); };

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const mobile = w < 760;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.skyMat.uniforms.uRes.value.set(w, h);
    const portrait = h > w * 1.05;
    const changed = portrait !== this.portrait;
    this.portrait = portrait;
    this.skyMat.uniforms.uPortrait.value = portrait ? 1 : 0;
    if (changed) this.applyMode(true);
    if (this.reduced) this.renderOnce();
  }

  get isPortrait() { return this.portrait; }

  /** Task order follows reading direction: in Arabic, 01 sits on the right. */
  setDirection(rtl: boolean) {
    if (rtl === this.rtl) return;
    this.rtl = rtl;
    if (this.mode === 'tasks') this.applyMode(true);
  }

  setMode(mode: CosmosMode, focus: WorldId | null) {
    if (mode === this.mode && focus === this.focus) return;
    this.mode = mode; this.focus = focus;
    this.applyMode(false);
  }

  setHover(kind: 'world' | 'task', key: string | number | null) {
    const d = this.reduced ? 0 : 0.35;
    if (kind === 'world') this.planets.forEach(p => gsap.to(p.state, { hover: p.id === key ? 1 : 0, duration: d, ease: 'power2.out' }));
    else this.rocks.forEach((r, i) => gsap.to(r.state, { hover: i === key ? 1 : 0, duration: d, ease: 'power2.out' }));
    if (this.reduced) this.renderOnce();
  }

  /** Short squash on press, so a tap is felt before the stage changes. */
  press(kind: 'world' | 'task', key: string | number) {
    if (this.reduced) return;
    const s = kind === 'world' ? this.planets.find(p => p.id === key)?.state : this.rocks[key as number]?.state;
    if (s) gsap.fromTo(s, { press: 0 }, { press: 1, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' });
  }

  private layoutKey(): 'landscape' | 'portrait' { return this.portrait ? 'portrait' : 'landscape'; }

  private applyMode(instant: boolean) {
    const k = this.layoutKey();
    const dur = instant || this.reduced ? 0 : 1;
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    if (this.mode === 'worlds') {
      tl.to(this.sky, { dim: 1, duration: dur * 0.9 }, 0);
      this.planets.forEach((p, i) => {
        const slot = WORLD_LAYOUT[k][p.id];
        tl.to(p.state, { x: slot.x, y: slot.y, r: slot.r, o: 1, duration: dur * 1.05 }, dur ? i * 0.04 : 0);
      });
      this.rocks.forEach((r, i) => {
        const home = this.focus ? FOCUS_LAYOUT[k].planet : { x: 0.5, y: 0.5, r: 0 };
        tl.to(r.state, { x: home.x, y: home.y, r: 0, o: 0, duration: dur * 0.55, ease: 'power2.in' }, dur ? i * 0.03 : 0);
      });
    } else if (this.mode === 'tasks' && this.focus) {
      const F = FOCUS_LAYOUT[k];
      tl.to(this.sky, { dim: 0.5, duration: dur * 0.9 }, 0); // the approved fade behind the focused world
      this.planets.forEach(p => {
        if (p.id === this.focus) {
          tl.to(p.state, { x: F.planet.x, y: F.planet.y, r: F.planet.r, o: 1, duration: dur * 1.15 }, 0);
        } else {
          const slot = WORLD_LAYOUT[k][p.id];
          const dx = slot.x - 0.5, dy = slot.y - 0.5;
          tl.to(p.state, { x: 0.5 + dx * 1.9, y: 0.5 + dy * 1.9, r: slot.r * 0.7, o: 0, duration: dur * 0.8, ease: 'power2.in' }, 0);
        }
      });
      this.rocks.forEach((r, i) => {
        const slot = F.tasks[i];
        const t = this.rtl ? { ...slot, x: 1 - slot.x } : slot;
        if (dur) gsap.set(r.state, { x: F.planet.x, y: F.planet.y, r: 0, o: 0 });
        tl.to(r.state, { x: t.x, y: t.y, r: t.r, o: 1, duration: dur * 0.9, ease: 'back.out(1.4)' }, dur ? 0.55 + i * 0.09 : 0);
      });
    } else {
      // Ambient: the conversation sits in front of a calm cosmos with the chosen world resting at the edge.
      tl.to(this.sky, { dim: 0.62, duration: dur }, 0);
      this.planets.forEach(p => {
        const chosen = p.id === this.focus;
        const target: Slot & { o: number } = chosen
          ? (this.portrait ? { x: 0.98, y: 0.95, r: 0.42, o: 0.38 } : { x: 0.93, y: 0.92, r: 0.4, o: 0.35 })
          : { ...WORLD_LAYOUT[k][p.id], o: 0 };
        tl.to(p.state, { ...target, duration: dur * 1.1 }, 0);
      });
      this.rocks.forEach(r => tl.to(r.state, { r: 0, o: 0, duration: dur * 0.5 }, 0));
    }
    if (this.reduced) { tl.progress(1); this.renderOnce(); }
  }

  /** Converts a stage-fraction slot into world units at z = 0. */
  private place(obj: THREE.Object3D, s: BodyState, frame: Frame, scaleMul = 1) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const unit = this.portrait ? frame.width : Math.min(frame.height, frame.width * 0.62);
    const px = frame.left + s.x * frame.width, py = frame.top + s.y * frame.height;
    const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
    const perPx = (2 * halfH) / vh;
    obj.position.set((px - vw / 2) * perPx, -(py - vh / 2) * perPx, 0);
    const rWorld = s.r * unit * perPx * scaleMul * (1 + s.hover * 0.035 - s.press * 0.05);
    obj.scale.setScalar(Math.max(rWorld, 0.0001));
    obj.visible = s.o > 0.005 && s.r > 0.0005;
    return { x: px, y: py, r: s.r * unit, o: s.o } as Projection;
  }

  private tick = () => {
    if (!this.running || this.disposed) return;
    this.renderFrame();
    this.raf = requestAnimationFrame(this.tick);
  };

  private renderFrame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const motion = this.reduced ? 0 : 1;
    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.04;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.04;
    this.camera.position.x = this.pointer.x * 0.55 * motion;
    this.camera.position.y = -this.pointer.y * 0.35 * motion;
    this.camera.lookAt(0, 0, 0);
    this.skyMat.uniforms.uTime.value = t;
    this.skyMat.uniforms.uDim.value = this.sky.dim;
    this.skyMat.uniforms.uShift.value.set(this.pointer.x * 0.012 * motion, -this.pointer.y * 0.008 * motion);

    const frame = this.getFrame();
    const proj = {} as Record<WorldId, Projection>;
    this.planets.forEach((p, i) => {
      const s = p.state;
      proj[p.id] = this.place(p.group, s, frame);
      // Gentle float + rotation, so every world feels alive but calm.
      p.group.position.y += Math.sin(t * 0.5 + i * 1.7) * 0.05 * motion * p.group.scale.x;
      p.spin.rotation.y += dt * 0.06 * motion;
      p.moons.forEach(m => { m.pivot.rotation.y += dt * m.speed * motion; m.mat.uniforms.uOpacity.value = s.o; });
      p.planetMat.uniforms.uOpacity.value = s.o;
      p.planetMat.uniforms.uHover.value = s.hover;
      p.atmoMat.uniforms.uOpacity.value = s.o;
      p.atmoMat.uniforms.uHover.value = s.hover;
      p.ringMat.uniforms.uOpacity.value = s.o;
      p.ringMat.uniforms.uHover.value = s.hover;
      p.ringMat.uniforms.uTime.value = t * motion;
      p.group.renderOrder = p.id === this.focus ? 2 : 1;
    });
    const rockProj = this.rocks.map((r, i) => {
      const pr = this.place(r.group, r.state, frame);
      r.group.position.y += Math.sin(t * 0.8 + i * 2.1) * 0.08 * motion * r.group.scale.x;
      r.mesh.rotation.x += r.tumble.x * dt * motion * (1 + r.state.hover * 3);
      r.mesh.rotation.y += r.tumble.y * dt * motion * (1 + r.state.hover * 3);
      r.mat.uniforms.uOpacity.value = r.state.o;
      r.mat.uniforms.uHover.value = r.state.hover;
      return pr;
    });

    // Framing rocks and debris: anchored to the viewport, so they work in portrait and landscape.
    const fgDim = this.mode === 'worlds' ? 1 : 0.5;
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    this.foreground.forEach((f, i) => {
      const halfH = tan * (CAM_Z - f.base.z);
      const halfW = halfH * this.camera.aspect;
      f.mesh.position.set(f.base.x * halfW, f.base.y * halfH, f.base.z);
      f.mesh.position.y += Math.sin(t * (f.small ? 0.35 : 0.2) + i) * (f.small ? 0.25 : 0.15) * motion;
      f.mesh.rotation.y += dt * (f.small ? 0.08 : 0.015) * motion;
      f.mesh.rotation.x += dt * (f.small ? 0.05 : 0) * motion;
      // Big framing rocks only frame the landscape worlds view; they never cover a world or a task.
      // On portrait screens only edge debris stays, so nothing floats over a world's name.
      f.mesh.visible = f.small ? (!this.portrait || (Math.abs(f.base.x) > (this.mode === 'tasks' ? 0.7 : 0.55) && f.base.y < 0.25)) : (!this.portrait && this.mode === 'worlds');
      f.mat.uniforms.uDim.value = f.dim * fgDim;
      f.mat.uniforms.uOpacity.value = f.small && this.mode === 'tasks' ? 0.35 : 1;
    });
    this.dust.rotation.y = Math.sin(t * 0.02) * 0.08 * motion;
    (this.dust.material as THREE.PointsMaterial).opacity = 0.5 * this.sky.dim;

    this.renderer.render(this.scene, this.camera);
    this.onFrame(proj, rockProj);
  }

  private pendingRender = 0;
  /** Renders a single frame on the next animation frame (used when the loop is paused, e.g. reduced motion). */
  renderOnce() {
    if (this.disposed || this.running || this.pendingRender) return;
    this.pendingRender = requestAnimationFrame(() => { this.pendingRender = 0; if (!this.disposed) this.renderFrame(); });
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.clock.getDelta();
    if (this.reduced) { this.running = false; this.renderOnce(); return; }
    this.raf = requestAnimationFrame(this.tick);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  dispose() {
    this.disposed = true;
    this.stop();
    cancelAnimationFrame(this.pendingRender);
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('scroll', this.onScroll);
    document.removeEventListener('visibilitychange', this.onVisibility);
    gsap.killTweensOf([this.sky, ...this.planets.map(p => p.state), ...this.rocks.map(r => r.state)]);
    this.scene.traverse(o => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | undefined;
      if (mat) mat.dispose();
    });
    this.renderer.dispose();
  }
}
