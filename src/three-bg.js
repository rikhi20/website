import * as THREE from "three";

export function startThreeBackground(canvas) {
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a16, 0.065);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
  camera.position.set(0, 0, 7);

  // Premium lighting (cool + soft)
  const ambient = new THREE.AmbientLight(0x90a8ff, 0.55);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(4, 3, 6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x66e3ff, 0.55);
  fill.position.set(-5, -1, 4);
  scene.add(fill);

  const rim = new THREE.PointLight(0xff8bd1, 0.95, 30);
  rim.position.set(-2.2, 1.2, 8);
  scene.add(rim);

  // Hero object (Aurora pearl)
  const geo = new THREE.IcosahedronGeometry(1.45, 3);

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xbfd3ff,
    roughness: 0.18,
    metalness: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.10,
    transmission: 0.18,        // subtle glassiness
    thickness: 0.65,
    ior: 1.35,
    sheen: 1.0,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(0x66e3ff),
    specularIntensity: 0.85,
    specularColor: new THREE.Color(0xffffff)
  });

  const hero = new THREE.Mesh(geo, mat);
  hero.position.set(1.8, 0.15, 0);
  scene.add(hero);

  // Wire shimmer
  const wire = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.14 })
  );
  wire.position.copy(hero.position);
  scene.add(wire);

  // Particles (aurora dust)
  const pCount = 1100;
  const pos = new Float32Array(pCount * 3);
  const speed = new Float32Array(pCount);
  for (let i = 0; i < pCount; i++) {
    const r = 7.5 * Math.random();
    const a = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 5.5;
    pos[i * 3 + 0] = Math.cos(a) * r;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = (Math.sin(a) * r) - 7;
    speed[i] = Math.random() * 0.22 + 0.06;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.017,
    transparent: true,
    opacity: 0.65,
    color: 0xffffff
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // Resize
  const dpr = () => Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setPixelRatio(dpr());
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();

  // Mouse parallax + scroll coupling
  const mouse = { x: 0, y: 0 };
  const onMove = (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("mousemove", onMove, { passive: true });

  let scrollT = 0;
  const onScroll = () => {
    const doc = document.documentElement;
    const s = (doc.scrollTop || document.body.scrollTop);
    const h = (doc.scrollHeight - doc.clientHeight) || 1;
    scrollT = s / h; // 0..1
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  let last = performance.now();
  const animate = (t) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;

    if (!prefersReduced) {
      // slow premium rotation
      hero.rotation.y += dt * (0.28 + scrollT * 0.18);
      hero.rotation.x += dt * 0.14;
      wire.rotation.copy(hero.rotation);

      // gentle parallax
      const tx = mouse.x * 0.18;
      const ty = -mouse.y * 0.12;
      hero.position.x = 1.8 + tx;
      hero.position.y = 0.15 + ty;
      wire.position.copy(hero.position);

      // particles drift
      points.rotation.y += dt * 0.035;
      points.rotation.x += dt * 0.018;

      // tiny depth breathing
      camera.position.z = 7 + Math.sin(t * 0.00035) * 0.18;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  return () => {
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("scroll", onScroll);
    renderer.dispose();
    geo.dispose();
    mat.dispose();
    pGeo.dispose();
    pMat.dispose();
  };
}