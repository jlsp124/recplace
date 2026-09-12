import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const PUBLIC_MODEL_URL = new URL('/Assets/3d/recplace-exterior.glb', location.origin);
const VIEWS = {
  perspective: { theta: .64, phi: 1.28, zoom: 1.04 },
  approach: { theta: .40, phi: 1.615, zoom: 1 },
  opposite: { theta: Math.PI + .3, phi: 1.60, zoom: 1 },
  overview: { theta: .58, phi: .85, zoom: 1 },
};

function reflectionEnvironment(renderer) {
  // A small, neutral outdoor reflection field. It describes sky and a distant
  // treeline, not the actual property; no photograph is projected on the model.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, '#526f94');
  sky.addColorStop(.37, '#abc2d7');
  sky.addColorStop(.49, '#e8e5da');
  sky.addColorStop(.51, '#676f66');
  sky.addColorStop(1, '#8b8678');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 22; i++) {
    const x = (i * 83) % 512;
    const y = 68 + (i * 17) % 57;
    const cloud = ctx.createRadialGradient(x, y, 0, x, y, 40);
    cloud.addColorStop(0, 'rgba(255,252,244,.95)');
    cloud.addColorStop(1, 'rgba(255,252,244,0)');
    ctx.fillStyle = cloud;
    ctx.fillRect(x - 40, y - 40, 80, 80);
  }
  for (let i = 0; i < 95; i++) {
    const x = i * 5.5;
    const h = 4 + ((i * 37) % 17);
    ctx.fillStyle = i % 2 ? '#59655d' : '#68756c';
    ctx.beginPath();
    ctx.moveTo(x, 130 - h);
    ctx.lineTo(x - 5, 137);
    ctx.lineTo(x + 5, 137);
    ctx.fill();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.mapping = THREE.EquirectangularReflectionMapping;
  map.colorSpace = THREE.SRGBColorSpace;
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromEquirectangular(map);
  map.dispose();
  generator.dispose();
  return target;
}

function addSign(model) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5f3ea';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 78px Arial, sans-serif';
  ctx.fillText('RECPLACE', 512, 72);
  ctx.font = '500 64px Arial, sans-serif';
  ctx.fillText('PROFESSIONAL CENTRE', 512, 159);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.9), new THREE.MeshStandardMaterial({
    map: texture, transparent: true, alphaTest: .2, roughness: .45, metalness: .15,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
  }));
  sign.name = 'entrance_building_sign';
  sign.position.set(0, 7.82, 5.96);
  sign.userData = { floorId: 'floor-02', source: 'Supplied professional front rendering; illustrative sign treatment.' };
  model.getObjectByName('floor_02').add(sign);
}

function releaseTree(tree) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  tree.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of [].concat(object.material || [])) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  geometries.forEach((value) => value.dispose());
  materials.forEach((value) => value.dispose());
  textures.forEach((value) => { value.source?.data?.close?.(); value.dispose(); });
}

export async function createViewer(stage, { signal, onFailure, onInteraction, initialView = 'perspective' }) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power' });
  if (!context) throw new Error('WebGL2 is unavailable');
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  canvas.setAttribute('aria-label', 'Interactive RECPLACE exterior. Use left and right arrow keys to rotate, up and down to change angle, plus and minus to zoom, and Home to reset.');
  canvas.setAttribute('aria-describedby', `${stage.id}-help`);
  canvas.tabIndex = 0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .5, 500);
  const target = new THREE.Vector3(0, 6.15, 0);
  let environment;
  let model;
  let frame = 0;
  let disposed = false;
  let visible = true;
  let resizeObserver;
  let visibilityObserver;
  let pose = { ...(VIEWS[initialView] || VIEWS.perspective) };
  let animation;
  let orbiting = false;
  let lastTime = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  const points = new Map();
  let pinchGap = 0;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    listeners.abort();
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    releaseTree(scene);
    environment?.dispose();
    scene.traverse((object) => { object.shadow?.map?.dispose(); object.shadow?.mapPass?.dispose(); });
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
  signal.addEventListener('abort', dispose, { once: true });

  function draw(now = performance.now()) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    if (orbiting && !animation) pose.theta += Math.min(50, now - (lastTime || now)) * .000075;
    lastTime = now;
    if (animation) {
      const t = Math.min(1, (now - animation.start) / 620);
      const e = 1 - (1 - t) ** 3;
      for (const key of ['theta', 'phi', 'zoom']) pose[key] = THREE.MathUtils.lerp(animation.from[key], animation.to[key], e);
      if (t === 1) animation = null;
    }
    const direction = new THREE.Vector3(Math.sin(pose.phi) * Math.sin(pose.theta), Math.cos(pose.phi), Math.sin(pose.phi) * Math.cos(pose.theta));
    const right = new THREE.Vector3(Math.cos(pose.theta), 0, -Math.sin(pose.theta));
    const up = new THREE.Vector3().crossVectors(direction, right);
    const tan = Math.tan(THREE.MathUtils.degToRad(16));
    let fit = 0;
    for (const x of [-31, 31]) for (const y of [-.3, 15.5]) for (const z of [-14, 14]) {
      const corner = new THREE.Vector3(x, y, z).sub(target);
      fit = Math.max(fit, corner.dot(direction) + Math.max(Math.abs(corner.dot(right)) * 1.12 / (tan * camera.aspect), Math.abs(corner.dot(up)) * 1.12 / tan));
    }
    const distance = fit / pose.zoom;
    camera.position.set(target.x + distance * Math.sin(pose.phi) * Math.sin(pose.theta),
      Math.max(1.8, target.y + distance * Math.cos(pose.phi)), target.z + distance * Math.sin(pose.phi) * Math.cos(pose.theta));
    camera.lookAt(target);
    renderer.render(scene, camera);
    if (animation || orbiting) requestDraw();
  }

  function requestDraw() {
    if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestDraw();
  }

  function setView(name, instant = false) {
    const next = VIEWS[name];
    if (!next || disposed) return;
    setOrbit(false);
    const delta = THREE.MathUtils.euclideanModulo(next.theta - pose.theta + Math.PI, Math.PI * 2) - Math.PI;
    const to = { ...next, theta: pose.theta + delta };
    animation = instant || reducedMotion.matches ? null : { from: { ...pose }, to, start: performance.now() };
    if (!animation) pose = to;
    requestDraw();
  }

  function zoom(factor) {
    animation = null;
    pose.zoom = THREE.MathUtils.clamp(pose.zoom * factor, .8, 2.1);
    requestDraw();
  }

  function setOrbit(enabled) {
    orbiting = Boolean(enabled) && !reducedMotion.matches;
    lastTime = 0;
    requestDraw();
    return orbiting;
  }

  try {
    const response = await fetch(PUBLIC_MODEL_URL, { signal });
    if (!response.ok) throw new Error(`Model request failed: ${response.status}`);
    const data = await response.arrayBuffer();
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(data, '/Assets/3d/');
    model = gltf.scene;
    if (signal.aborted) { releaseTree(model); throw new DOMException('Aborted', 'AbortError'); }
    scene.add(model);
    const glassMaterials = new Map();
    model.traverse((object) => {
      if (!object.isMesh) return;
      if (object.material.name === 'glass') {
        const original = object.material;
        if (!glassMaterials.has(original)) glassMaterials.set(original, new THREE.MeshPhysicalMaterial({
          name: 'glass', color: '#253d53', metalness: .22, roughness: .10,
          clearcoat: 1, clearcoatRoughness: .08, ior: 1.5, specularIntensity: 1,
          envMapIntensity: 2.3,
        }));
        object.material = glassMaterials.get(original);
      }
      object.castShadow = object.material.name !== 'glass';
      object.receiveShadow = true;
      object.material.envMapIntensity = object.material.name === 'glass' ? 2.3 : .45;
      if (object.material.map) object.material.map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      if (object.material.name === 'stone' || object.material.name === 'wood') {
        object.material.bumpMap = object.material.map;
        object.material.bumpScale = object.material.name === 'stone' ? .08 : .015;
      }
    });
    glassMaterials.forEach((_, original) => original.dispose());
    addSign(model);
    environment = reflectionEnvironment(renderer);
    scene.environment = environment.texture;
    scene.add(new THREE.HemisphereLight('#e2edff', '#c1b39b', 1.4));
    const sun = new THREE.DirectionalLight('#fff4df', 2.6);
    sun.position.set(-32, 48, 34);
    sun.castShadow = true;
    const shadowSize = matchMedia('(max-width: 600px)').matches ? 1024 : 2048;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(sun.shadow.camera, { left: -43, right: 43, top: 35, bottom: -35, near: 1, far: 130 });
    sun.shadow.bias = -.00025;
    sun.shadow.normalBias = .055;
    sun.shadow.radius = 3;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#c3d8f0', 1);
    fill.position.set(25, 20, -32);
    scene.add(fill);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.ShadowMaterial({ opacity: .19 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -.265;
    ground.receiveShadow = true;
    scene.add(ground);
    renderer.shadowMap.needsUpdate = true;
    stage.append(canvas);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
      else requestDraw();
    });
    visibilityObserver.observe(stage);
    document.addEventListener('visibilitychange', requestDraw, { signal: listeners.signal });
    reducedMotion.addEventListener('change', () => { setOrbit(false); onInteraction?.(); }, { signal: listeners.signal });
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      onFailure(new Error('Graphics context lost'));
    }, { signal: listeners.signal });
    canvas.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      animation = null;
      setOrbit(false);
      onInteraction?.();
      canvas.setPointerCapture(event.pointerId);
      points.set(event.pointerId, [event.clientX, event.clientY]);
      canvas.classList.add('is-dragging');
    }, { signal: listeners.signal });
    canvas.addEventListener('pointermove', (event) => {
      if (!points.has(event.pointerId)) return;
      const prior = points.get(event.pointerId);
      points.set(event.pointerId, [event.clientX, event.clientY]);
      if (points.size === 1) {
        pose.theta -= (event.clientX - prior[0]) * .008;
        // On touch, reserve vertical movement for normal page scrolling.
        if (event.pointerType !== 'touch') pose.phi = THREE.MathUtils.clamp(pose.phi - (event.clientY - prior[1]) * .005, .55, 1.64);
      } else {
        const [a, b] = [...points.values()];
        const gap = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinchGap > 0 && gap > 0) zoom(gap / pinchGap);
        pinchGap = gap;
      }
      requestDraw();
    }, { signal: listeners.signal });
    const end = (event) => {
      points.delete(event.pointerId);
      pinchGap = 0;
      if (!points.size) canvas.classList.remove('is-dragging');
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, end, { signal: listeners.signal });
    canvas.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', 'Home'].includes(event.key)) return;
      event.preventDefault();
      animation = null;
      setOrbit(false);
      onInteraction?.();
      if (event.key === 'ArrowLeft') pose.theta += .12;
      if (event.key === 'ArrowRight') pose.theta -= .12;
      if (event.key === 'ArrowUp') pose.phi = Math.max(.55, pose.phi - .07);
      if (event.key === 'ArrowDown') pose.phi = Math.min(1.64, pose.phi + .07);
      if ('+='.includes(event.key)) zoom(1.12);
      if ('-_'.includes(event.key)) zoom(1 / 1.12);
      if (event.key === 'Home') setView(initialView);
      requestDraw();
    }, { signal: listeners.signal });
    // Deliberately no wheel listener: scrolling over the model scrolls the page.
    resize();
    draw();
    return {
      dispose, setView, zoom, setOrbit,
      // Stable, deliberately small extension point for future leasing clients.
      // These groups contain exterior slices, not authored interiors or suites.
      getFloor: (id) => model.getObjectByName(id.replaceAll('-', '_')) || null,
      resolveIntersection: (intersection) => ({
        nodeName: intersection.object.name,
        floorId: intersection.object.userData.floorId || null,
        materialRole: intersection.object.userData.materialRole || null,
        triangleIndex: intersection.faceIndex,
      }),
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
