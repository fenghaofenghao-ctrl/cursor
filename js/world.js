/**
 * 星尘遗迹 / Aether Ruins — world geometry & zone layout
 * createWorld(THREE, scene) builds the island; THREE is passed in (no import).
 */
import { createMaterials } from './materials.js';

const ISLAND_RADIUS = 40;
const WALK_RADIUS = 34;

export function createWorld(THREE, scene) {
  const mats = createMaterials(THREE);

  // Atmosphere
  scene.background = new THREE.Color(0x07111f);
  scene.fog = new THREE.FogExp2(0x0a1628, 0.016);

  const root = new THREE.Group();
  root.name = 'aether-world';
  scene.add(root);

  const blockers = [];
  const lanterns = [];

  function mesh(geo, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (opts.rotY) m.rotation.y = opts.rotY;
    if (opts.rotX) m.rotation.x = opts.rotX;
    if (opts.rotZ) m.rotation.z = opts.rotZ;
    if (opts.scale != null) {
      if (typeof opts.scale === 'number') m.scale.setScalar(opts.scale);
      else m.scale.set(opts.scale.x ?? 1, opts.scale.y ?? 1, opts.scale.z ?? 1);
    }
    m.castShadow = opts.castShadow !== false;
    m.receiveShadow = opts.receiveShadow !== false;
    (opts.parent || root).add(m);
    return m;
  }

  function addBlocker(x, z, r = 1.1) {
    blockers.push({ x, z, r });
  }

  // ── Island base (radius ~40) ──────────────────────────────────────
  const island = mesh(
    new THREE.CylinderGeometry(ISLAND_RADIUS, ISLAND_RADIUS + 4, 3.6, 72),
    mats.moss,
    0, -1.6, 0,
    { castShadow: false }
  );
  island.receiveShadow = true;

  mesh(new THREE.CylinderGeometry(30, 32, 1.0, 56), mats.darkStone, 0, 0.15, 0, { castShadow: false });
  mesh(new THREE.CylinderGeometry(18, 19, 0.55, 48), mats.stone, 0, 0.55, 0, { castShadow: false });

  // Soft cliff rise toward north (星井高台)
  mesh(new THREE.CylinderGeometry(14, 16, 2.2, 40), mats.warmStone, 0, 1.0, -22, { castShadow: false });
  mesh(new THREE.CylinderGeometry(9, 10.5, 1.4, 32), mats.darkStone, 0, 2.2, -24, { castShadow: false });

  // ── Water plane ───────────────────────────────────────────────────
  const water = mesh(
    new THREE.CircleGeometry(90, 64),
    mats.water,
    0, -0.9, 0,
    { rotX: -Math.PI / 2, castShadow: false, receiveShadow: false }
  );

  // ── Zones ─────────────────────────────────────────────────────────
  const zones = [
    { id: 'harbor', name: '晨雾港湾', center: { x: 0, z: 20 }, radius: 14 },
    { id: 'courtyard', name: '残碑庭院', center: { x: 0, z: 0 }, radius: 12 },
    { id: 'summit', name: '星井高台', center: { x: 0, z: -22 }, radius: 13 },
    { id: 'mosswalk', name: '苔径回廊', center: { x: 16, z: 2 }, radius: 10 },
  ];

  // ── 残碑庭院 — plaza + paths ──────────────────────────────────────
  mesh(new THREE.CylinderGeometry(7.2, 7.2, 0.28, 40), mats.stone, 0, 0.88, 0, { castShadow: false });
  mesh(new THREE.BoxGeometry(3.4, 0.16, 22), mats.stone, 0, 0.84, 12, { castShadow: false });
  mesh(new THREE.BoxGeometry(3.4, 0.16, 20), mats.warmStone, 0, 1.35, -12, { castShadow: false });
  mesh(new THREE.BoxGeometry(18, 0.16, 3.0), mats.stone, -10, 0.84, 0, { castShadow: false });
  mesh(new THREE.BoxGeometry(18, 0.16, 3.0), mats.stone, 10, 0.84, -2, { castShadow: false });

  mesh(new THREE.BoxGeometry(5.5, 2.6, 0.55), mats.darkStone, -9, 2.0, -6, { rotY: 0.35 });
  mesh(new THREE.BoxGeometry(4.2, 2.1, 0.5), mats.stone, 8, 1.8, 5, { rotY: -0.45 });
  mesh(new THREE.BoxGeometry(3.5, 3.0, 0.55), mats.darkStone, 6, 2.2, -8, { rotY: 0.15 });
  addBlocker(-9, -6, 1.4);
  addBlocker(8, 5, 1.2);
  addBlocker(6, -8, 1.2);

  // Fallen columns + mossy rubble (残碑庭院)
  const fallenShaftGeo = new THREE.CylinderGeometry(0.48, 0.58, 1, 9);
  function fallenColumn(x, y, z, len, rotX, rotY, rotZ, mat = mats.rubble) {
    const shaft = new THREE.Mesh(fallenShaftGeo, mat);
    shaft.position.set(x, y, z);
    shaft.scale.set(1, len, 1);
    shaft.rotation.set(rotX, rotY, rotZ);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    root.add(shaft);
    addBlocker(x, z, 0.85);
  }
  fallenColumn(-4.2, 1.15, 3.8, 3.4, Math.PI / 2.15, 0.35, 0.08, mats.stone);
  fallenColumn(5.5, 1.05, -2.2, 2.8, Math.PI / 2.05, -0.55, -0.12, mats.rubble);
  fallenColumn(-7.5, 1.2, -3.5, 2.2, Math.PI / 2.3, 0.9, 0.2, mats.darkStone);
  // Cap/base fragments lying nearby
  mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.32, 9), mats.darkStone, -2.8, 1.0, 4.6, { rotX: 0.4, rotZ: 0.25 });
  mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.28, 9), mats.rubble, 6.8, 0.98, -3.4, { rotX: -0.5, rotY: 0.3 });
  // Mossy rubble piles
  const rubbleChunkGeo = new THREE.DodecahedronGeometry(0.35, 0);
  [
    [-3.5, 0.95, 5.2, 0.9], [-5.0, 0.92, 2.5, 1.15], [4.2, 0.95, -5.5, 1.0],
    [7.2, 0.9, 2.8, 0.8], [-1.5, 0.92, -6.5, 1.2], [2.2, 0.95, 6.8, 0.85],
    [-10.5, 0.9, 1.5, 1.05], [9.5, 0.92, -1.2, 0.95], [0.8, 0.9, -4.8, 0.7],
  ].forEach(([x, y, z, s], i) => {
    const chunk = new THREE.Mesh(rubbleChunkGeo, i % 3 === 0 ? mats.mossLit : mats.rubble);
    chunk.position.set(x, y, z);
    chunk.scale.setScalar(s);
    chunk.rotation.set(i * 0.7, i * 1.1, i * 0.4);
    chunk.castShadow = true;
    chunk.receiveShadow = true;
    root.add(chunk);
  });
  // Soft moss patches on plaza edge
  mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.12, 12), mats.mossLit, -5.5, 0.86, 4.0, { castShadow: false });
  mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.1, 10), mats.moss, 6.0, 0.86, -5.0, { castShadow: false });
  mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.1, 10), mats.mossLit, 3.0, 0.86, 7.2, { castShadow: false });
  // Plaza tile ring inlay
  mesh(new THREE.TorusGeometry(5.4, 0.12, 6, 40), mats.tile, 0, 0.98, 0, { rotX: Math.PI / 2, castShadow: false });
  mesh(new THREE.TorusGeometry(4.2, 0.08, 6, 36), mats.tile, 0, 0.99, 0, { rotX: Math.PI / 2, castShadow: false });

  // Low plaza steps
  const stepGeo = new THREE.BoxGeometry(2.6, 0.16, 1.0);
  [
    [0, 0.95, 6.6, 0], [-4.2, 0.95, 5.2, 0.45], [4.2, 0.95, 5.0, -0.4],
    [0, 1.05, -6.4, 0], [-5.5, 0.95, -1.5, 0.9],
  ].forEach(([x, y, z, ry]) => {
    mesh(stepGeo, mats.stone, x, y, z, { rotY: ry, castShadow: false });
  });

  // Collapsed small arch
  mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5), mats.darkStone, -8.2, 2.0, 1.2, { rotZ: 0.4 });
  mesh(new THREE.BoxGeometry(0.5, 1.8, 0.5), mats.stone, -6.4, 1.7, 2.0, { rotZ: -0.55 });
  mesh(new THREE.BoxGeometry(2.6, 0.42, 0.5), mats.rubble, -7.3, 3.0, 1.55, { rotZ: 0.5, rotY: 0.15 });
  addBlocker(-7.3, 1.6, 1.15);

  // Portal arch
  const portal = new THREE.Group();
  portal.name = 'portal';
  portal.position.set(0, 0.95, 0);
  root.add(portal);

  const archL = new THREE.Mesh(new THREE.BoxGeometry(1.15, 7.2, 1.15), mats.darkStone);
  archL.position.set(-3.3, 3.6, 0);
  archL.castShadow = true;
  archL.receiveShadow = true;
  const archR = new THREE.Mesh(new THREE.BoxGeometry(1.15, 7.2, 1.15), mats.darkStone);
  archR.position.set(3.3, 3.6, 0);
  archR.castShadow = true;
  archR.receiveShadow = true;
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(7.8, 1.15, 1.15), mats.darkStone);
  archTop.position.set(0, 7.4, 0);
  archTop.castShadow = true;
  archTop.receiveShadow = true;
  const filigree = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.06, 8, 48), mats.gold);
  filigree.position.set(0, 3.8, 0);
  portal.add(archL, archR, archTop, filigree);

  const portalGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 6.4),
    mats.portalGlow
  );
  portalGlow.position.set(0, 3.7, 0);
  portal.add(portalGlow);

  const portalHaloPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 9.2),
    mats.portalHaloMat
  );
  portalHaloPlane.position.set(0, 3.7, -0.06);
  portal.add(portalHaloPlane);

  const portalGoldRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.55, 0.048, 8, 56),
    mats.portalRing
  );
  portalGoldRing.position.set(0, 3.8, 0.03);
  portal.add(portalGoldRing);

  const dustCount = 96;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const a = (i / dustCount) * Math.PI * 2;
    const rr = 1.6 + (i % 8) * 0.22 + (i % 5) * 0.05;
    dustPos[i * 3] = Math.cos(a) * rr;
    dustPos[i * 3 + 1] = 1.6 + (i % 12) * 0.48;
    dustPos[i * 3 + 2] = Math.sin(a) * (0.1 + (i % 4) * 0.04);
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const portalDustPts = new THREE.Points(dustGeo, mats.portalDust);
  portalDustPts.position.set(0, 0.5, 0);
  portal.add(portalDustPts);
  // Climax outer dust cloud (opacity driven by setPortalPower near 1)
  const climaxDustCount = 64;
  const climaxDustGeo = new THREE.BufferGeometry();
  const climaxDustPos = new Float32Array(climaxDustCount * 3);
  for (let i = 0; i < climaxDustCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = 2.4 + Math.random() * 2.2;
    climaxDustPos[i * 3] = Math.cos(a) * rr;
    climaxDustPos[i * 3 + 1] = 1.2 + Math.random() * 6.5;
    climaxDustPos[i * 3 + 2] = Math.sin(a) * rr * 0.35;
  }
  climaxDustGeo.setAttribute('position', new THREE.BufferAttribute(climaxDustPos, 3));
  const climaxDustMat = mats.portalDust.clone();
  climaxDustMat.size = 0.09;
  climaxDustMat.opacity = 0.0;
  const climaxDustPts = new THREE.Points(climaxDustGeo, climaxDustMat);
  climaxDustPts.position.set(0, 0.4, 0);
  portal.add(climaxDustPts);

  const portalLight = new THREE.PointLight(0x88ddff, 0.4, 20);
  portalLight.position.set(0, 3.6, 0);
  portal.add(portalLight);

  const portalHalo = new THREE.PointLight(0xa8e8ff, 0.0, 28);
  portalHalo.position.set(0, 4.0, 0);
  portal.add(portalHalo);

  // Soft vertical beam (rises with portal power; open center stays walkable)
  const portalBeamMat = mats.portalHaloMat.clone();
  portalBeamMat.opacity = 0.0;
  portalBeamMat.side = THREE.DoubleSide;
  const portalBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 1.15, 1, 16, 1, true),
    portalBeamMat
  );
  portalBeam.position.set(0, 4.2, 0);
  portalBeam.scale.y = 7.5;
  portalBeam.castShadow = false;
  portalBeam.receiveShadow = false;
  portal.add(portalBeam);

  // Ground rune ring — thin torus on plaza floor (radius keeps walk center clear)
  const portalRuneMat = mats.portalGlow.clone();
  portalRuneMat.opacity = 0.0;
  const portalRune = new THREE.Mesh(
    new THREE.TorusGeometry(2.85, 0.055, 6, 48),
    portalRuneMat
  );
  portalRune.position.set(0, 0.08, 0);
  portalRune.rotation.x = Math.PI / 2;
  portalRune.castShadow = false;
  portalRune.receiveShadow = false;
  portal.add(portalRune);
  const portalRuneOuterMat = mats.portalRing.clone();
  portalRuneOuterMat.opacity = 0.0;
  const portalRuneOuter = new THREE.Mesh(
    new THREE.TorusGeometry(3.35, 0.03, 6, 40),
    portalRuneOuterMat
  );
  portalRuneOuter.position.set(0, 0.06, 0);
  portalRuneOuter.rotation.x = Math.PI / 2;
  portalRuneOuter.castShadow = false;
  portal.add(portalRuneOuter);

  // Climax energy rings (fade in hard as power → 1; walk center stays clear)
  const climaxRingMat = mats.portalRing.clone();
  climaxRingMat.opacity = 0.0;
  const climaxRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.9, 0.04, 6, 56),
    climaxRingMat
  );
  climaxRing.position.set(0, 3.9, 0);
  climaxRing.castShadow = false;
  portal.add(climaxRing);
  const climaxRing2Mat = mats.portalHaloMat.clone();
  climaxRing2Mat.opacity = 0.0;
  const climaxRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(4.6, 0.06, 6, 48),
    climaxRing2Mat
  );
  climaxRing2.position.set(0, 4.1, 0);
  climaxRing2.rotation.x = 0.18;
  climaxRing2.castShadow = false;
  portal.add(climaxRing2);
  // Soft bloom flash plane (additive, scales with climax)
  const climaxBloomMat = mats.portalHaloMat.clone();
  climaxBloomMat.opacity = 0.0;
  climaxBloomMat.color.setHex(0xb8f0ff);
  const climaxBloom = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 13),
    climaxBloomMat
  );
  climaxBloom.position.set(0, 3.8, -0.12);
  climaxBloom.castShadow = false;
  climaxBloom.receiveShadow = false;
  portal.add(climaxBloom);
  const climaxFlash = new THREE.PointLight(0xc0f4ff, 0.0, 36);
  climaxFlash.position.set(0, 4.2, 0);
  portal.add(climaxFlash);

  addBlocker(-3.3, 0, 1.0);
  addBlocker(3.3, 0, 1.0);

  // ── Pillars (shared geometries) ───────────────────────────────────
  const pillarShaftGeo = new THREE.CylinderGeometry(0.55, 0.7, 1, 10);
  const pillarBaseGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.35, 10);
  const pillarCapGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 10);

  function pillar(x, z, h = 5, rot = 0, mat = mats.stone) {
    const shaft = new THREE.Mesh(pillarShaftGeo, mat);
    shaft.position.set(x, h / 2 + 0.75, z);
    shaft.scale.y = h;
    shaft.rotation.y = rot;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    root.add(shaft);
    const base = new THREE.Mesh(pillarBaseGeo, mats.darkStone);
    base.position.set(x, 0.9, z);
    base.castShadow = true;
    base.receiveShadow = true;
    root.add(base);
    const cap = new THREE.Mesh(pillarCapGeo, mats.darkStone);
    cap.position.set(x, h + 0.75, z);
    cap.castShadow = true;
    root.add(cap);
    addBlocker(x, z, 1.15);
  }

  [
    [-10, 8, 4.5], [10, 7, 5.5], [-12, -6, 6], [11, -9, 4.2],
    [-6, 12, 3.8], [7, 11, 5], [-16, 2, 4], [15, 3, 5.2],
  ].forEach(([x, z, h], i) => pillar(x, z, h, i * 0.28));

  [
    [-8, -20, 7.5], [8, -19, 8.2], [-4, -28, 6.5], [5, -27, 9.0],
    [-12, -24, 5.8], [12, -23, 6.8],
  ].forEach(([x, z, h], i) => pillar(x, z, h, i * 0.4, mats.warmStone));

  mesh(new THREE.BoxGeometry(9, 4.2, 0.75), mats.warmStone, -14, 3.6, -18, { rotY: 0.55 });
  mesh(new THREE.BoxGeometry(7, 3.5, 0.7), mats.darkStone, 13, 3.4, -26, { rotY: -0.4 });
  mesh(new THREE.BoxGeometry(5.5, 5.0, 0.7), mats.warmStone, 2, 4.5, -30, { rotY: 0.1 });
  addBlocker(-14, -18, 1.6);
  addBlocker(13, -26, 1.5);
  addBlocker(2, -30, 1.4);

  // Star-well basin + glow rings
  mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.5, 28), mats.darkStone, 0, 2.55, -24, { castShadow: false });
  mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.35, 24), mats.amberStone, 0, 2.75, -24, { castShadow: false });
  mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.18, 20), mats.gold, 0, 2.92, -24, { castShadow: false });
  // Inner well pool (emissive amber)
  const wellPoolMat = mats.portalRing.clone();
  wellPoolMat.opacity = 0.32;
  const wellPool = mesh(
    new THREE.CircleGeometry(1.35, 24),
    wellPoolMat,
    0, 2.98, -24,
    { rotX: -Math.PI / 2, castShadow: false, receiveShadow: false }
  );
  const wellRings = [];
  [2.0, 2.7, 3.5].forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.035 + i * 0.01, 8, 48),
      mats.portalRing
    );
    ring.position.set(0, 3.05 + i * 0.08, -24);
    ring.rotation.x = Math.PI / 2;
    ring.material = mats.portalRing.clone();
    ring.material.opacity = 0.28 - i * 0.06;
    root.add(ring);
    wellRings.push(ring);
  });
  // Vertical light shaft (soft additive cylinder)
  const wellShaft = mesh(
    new THREE.CylinderGeometry(0.9, 1.4, 6.5, 16, 1, true),
    mats.portalHaloMat.clone(),
    0, 6.2, -24,
    { castShadow: false, receiveShadow: false }
  );
  wellShaft.material.opacity = 0.06;
  wellShaft.material.side = THREE.DoubleSide;
  const wellGlow = new THREE.PointLight(0xffd090, 1.15, 16);
  wellGlow.position.set(0, 3.4, -24);
  root.add(wellGlow);
  const wellHalo = new THREE.PointLight(0xffe2a0, 0.45, 22);
  wellHalo.position.set(0, 5.2, -24);
  root.add(wellHalo);

  // Amber rail remnants around well mouth
  const amberRailGeo = new THREE.BoxGeometry(1.05, 0.5, 0.26);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.15;
    const rx = Math.cos(a) * 2.85;
    const rz = Math.sin(a) * 2.85 - 24;
    mesh(amberRailGeo, mats.amberStone, rx, 3.12, rz, { rotY: -a + Math.PI / 2, castShadow: false });
  }
  mesh(new THREE.BoxGeometry(0.32, 1.15, 0.26), mats.amberStone, 2.55, 3.55, -22.3, { rotZ: 0.28 });
  mesh(new THREE.BoxGeometry(0.32, 0.9, 0.26), mats.amberStone, -2.5, 3.4, -25.6, { rotZ: -0.4 });
  addBlocker(2.55, -22.3, 0.5);
  addBlocker(-2.5, -25.6, 0.5);

  // Tiny spark points inside the well shaft
  const wellSparkCount = 28;
  const wellSparkGeo = new THREE.BufferGeometry();
  const wellSparkPos = new Float32Array(wellSparkCount * 3);
  const wellSparkPhase = new Float32Array(wellSparkCount);
  for (let i = 0; i < wellSparkCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.35;
    wellSparkPos[i * 3] = Math.cos(a) * r;
    wellSparkPos[i * 3 + 1] = 3.0 + Math.random() * 5.5;
    wellSparkPos[i * 3 + 2] = -24 + Math.sin(a) * r;
    wellSparkPhase[i] = Math.random() * Math.PI * 2;
  }
  wellSparkGeo.setAttribute('position', new THREE.BufferAttribute(wellSparkPos, 3));
  const wellSparks = new THREE.Points(wellSparkGeo, mats.stars);
  root.add(wellSparks);

  // ── 晨雾港湾 — planked piers, crates, teal quay ───────────────────
  mesh(new THREE.BoxGeometry(14, 0.2, 3.5), mats.tealStone, 0, 0.78, 22, { castShadow: false });
  // Shallow water wash near harbor edge
  mesh(
    new THREE.RingGeometry(38, 44, 48),
    mats.shallowWater,
    0, -0.72, 8,
    { rotX: -Math.PI / 2, castShadow: false, receiveShadow: false }
  );

  const plankGeo = new THREE.BoxGeometry(0.85, 0.1, 3.15);
  function buildPier(cx, cz, plankCount, alongZ = true) {
    const pierGroup = new THREE.Group();
    pierGroup.position.set(cx, 0.78, cz);
    root.add(pierGroup);
    for (let i = 0; i < plankCount; i++) {
      const plank = new THREE.Mesh(plankGeo, i % 3 === 1 ? mats.weatheredWood : mats.wood);
      if (alongZ) {
        plank.position.set((i - (plankCount - 1) / 2) * 0.92, 0, 0);
        plank.scale.set(1, 1, alongZ ? 1.05 + (i % 2) * 0.08 : 1);
      } else {
        plank.rotation.y = Math.PI / 2;
        plank.position.set(0, 0, (i - (plankCount - 1) / 2) * 0.92);
      }
      plank.position.y += (i % 4) * 0.008;
      plank.castShadow = true;
      plank.receiveShadow = true;
      pierGroup.add(plank);
    }
    // Side rails
    const railGeo = new THREE.BoxGeometry(plankCount * 0.92 + 0.4, 0.12, 0.12);
    const railL = new THREE.Mesh(railGeo, mats.weatheredWood);
    const railR = new THREE.Mesh(railGeo, mats.weatheredWood);
    if (alongZ) {
      railL.position.set(0, 0.22, -1.45);
      railR.position.set(0, 0.22, 1.45);
    } else {
      railL.rotation.y = Math.PI / 2;
      railR.rotation.y = Math.PI / 2;
      railL.position.set(-1.45, 0.22, 0);
      railR.position.set(1.45, 0.22, 0);
    }
    pierGroup.add(railL, railR);
    return pierGroup;
  }
  // West pier (extends south), east pier, short crosswalk
  buildPier(-6, 26.5, 4, true);
  // Stretch west pier length with extra plank rows along Z
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4; i++) {
      mesh(
        plankGeo,
        i % 2 ? mats.weatheredWood : mats.wood,
        -6 + (i - 1.5) * 0.92,
        0.78 + (i % 3) * 0.006,
        23.5 + row * 2.8,
        { scale: { x: 1, y: 1, z: 0.9 } }
      );
    }
  }
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 4; i++) {
      mesh(
        plankGeo,
        i % 2 ? mats.wood : mats.weatheredWood,
        6 + (i - 1.5) * 0.92,
        0.78 + (i % 3) * 0.006,
        25.0 + row * 2.6,
        { scale: { x: 1, y: 1, z: 0.95 } }
      );
    }
  }
  // Connecting boardwalk strip
  for (let i = 0; i < 8; i++) {
    mesh(
      new THREE.BoxGeometry(1.55, 0.09, 0.72),
      i % 2 ? mats.weatheredWood : mats.wood,
      -5.2 + i * 1.5,
      0.76,
      22.6,
      { castShadow: true }
    );
  }

  const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.4, 6);
  [
    [-7.2, 24], [-4.8, 24], [-7.2, 30], [-4.8, 30],
    [4.8, 26], [7.2, 26], [4.8, 32], [7.2, 32],
    [-7.2, 27], [7.2, 29],
  ].forEach(([x, z]) => {
    mesh(postGeo, mats.wood, x, 0.2, z);
    addBlocker(x, z, 0.55);
  });

  // Cargo crates on piers / quay
  function crate(x, y, z, sx, sy, sz, rotY = 0, mat = mats.weatheredWood) {
    mesh(new THREE.BoxGeometry(sx, sy, sz), mat, x, y, z, { rotY });
    // Lid seam strip
    mesh(new THREE.BoxGeometry(sx * 0.92, 0.04, sz * 0.92), mats.wood, x, y + sy / 2 + 0.02, z, { rotY, castShadow: false });
    addBlocker(x, z, Math.max(sx, sz) * 0.55);
  }
  crate(-5.2, 1.15, 24.5, 0.9, 0.75, 0.85, 0.2);
  crate(-4.1, 1.05, 25.3, 0.7, 0.55, 0.7, -0.4);
  crate(-5.5, 1.55, 24.8, 0.55, 0.45, 0.55, 0.6); // stacked
  crate(5.5, 1.2, 27.2, 1.0, 0.8, 0.9, -0.25);
  crate(6.6, 1.05, 28.0, 0.65, 0.5, 0.7, 0.5);
  crate(4.8, 1.1, 29.5, 0.8, 0.65, 0.75, 0.15);
  crate(-2.5, 1.1, 21.5, 0.85, 0.7, 0.8, -0.3);
  crate(2.8, 1.05, 21.8, 0.7, 0.55, 0.65, 0.45);
  crate(8.5, 1.15, 23.5, 0.95, 0.75, 0.85, -0.15);

  [[-14, 16, 4.0], [14, 15, 4.5], [-10, 24, 3.5], [11, 25, 3.8]].forEach(([x, z, h], i) =>
    pillar(x, z, h, i * 0.5, mats.tealStone)
  );

  mesh(new THREE.BoxGeometry(8, 2.8, 0.65), mats.tealStone, -16, 2.1, 12, { rotY: 0.5 });
  mesh(new THREE.BoxGeometry(6.5, 2.3, 0.6), mats.stone, 15, 1.9, 14, { rotY: -0.55 });
  mesh(new THREE.BoxGeometry(5.2, 1.9, 0.55), mats.tealStone, -18, 1.75, 19.5, { rotY: 0.9 });
  mesh(new THREE.BoxGeometry(4.6, 1.6, 0.5), mats.tealStone, 17.5, 1.65, 17.5, { rotY: -0.75 });
  addBlocker(-16, 12, 1.5);
  addBlocker(15, 14, 1.4);
  addBlocker(-18, 19.5, 1.25);
  addBlocker(17.5, 17.5, 1.2);

  // Extra weathered piles + tide-worn rubble
  [
    [-6.0, 22], [-6.0, 28], [-6.0, 33], [6.0, 24], [6.0, 30], [6.0, 34],
    [-8.8, 27], [8.8, 29],
  ].forEach(([x, z]) => {
    mesh(postGeo, mats.weatheredWood, x, 0.15, z);
    addBlocker(x, z, 0.5);
  });
  const tideRubbleGeo = new THREE.DodecahedronGeometry(0.4, 0);
  [
    [-12, 0.85, 28], [-3.5, 0.8, 33.5], [4, 0.82, 34.2], [12, 0.85, 31],
    [-15, 0.9, 25], [14.5, 0.88, 26.5], [0.5, 0.8, 35.8],
  ].forEach(([x, y, z], i) => {
    const c = new THREE.Mesh(tideRubbleGeo, mats.rubble);
    c.position.set(x, y, z);
    c.scale.setScalar(0.85 + (i % 3) * 0.2);
    c.rotation.set(i * 0.5, i * 0.9, i * 0.3);
    c.castShadow = false;
    c.receiveShadow = true;
    root.add(c);
  });

  // ── Layer 3: inter-zone paths, ruins, shore, shrubs ────────────────
  // Harbor ↔ Courtyard stone/tile path (center spine, keep walk clear)
  const pathSlabGeo = new THREE.BoxGeometry(1.05, 0.08, 1.05);
  const pathBrickGeo = new THREE.BoxGeometry(0.72, 0.07, 0.72);
  const pathSideRubble = new THREE.DodecahedronGeometry(0.28, 0);

  function layPathSlab(x, y, z, mat, rotY = 0, geo = pathSlabGeo) {
    mesh(geo, mat, x, y, z, { rotY, castShadow: false });
  }

  // Harbor→courtyard: z 18 → 8 along x≈0 corridor (offset slightly irregular)
  for (let i = 0; i < 11; i++) {
    const z = 18.5 - i * 1.05;
    const wobble = ((i % 3) - 1) * 0.12;
    layPathSlab(wobble, 0.86, z, i % 2 ? mats.tile : mats.stone, i * 0.04);
    if (i % 2 === 0) {
      layPathSlab(wobble + 1.05, 0.855, z + 0.1, mats.tile, -0.08, pathBrickGeo);
      layPathSlab(wobble - 1.05, 0.855, z - 0.08, mats.stone, 0.1, pathBrickGeo);
    }
  }
  // Courtyard→summit: z -7 → -16 rising onto warm terrace
  for (let i = 0; i < 10; i++) {
    const z = -7.2 - i * 1.0;
    const y = 0.9 + i * 0.045;
    const wobble = ((i % 3) - 1) * 0.1;
    layPathSlab(wobble, y, z, i % 2 ? mats.warmStone : mats.tile, i * -0.03);
    if (i % 2 === 1) {
      layPathSlab(wobble + 1.0, y - 0.01, z, mats.stone, 0.12, pathBrickGeo);
      layPathSlab(wobble - 1.0, y - 0.01, z + 0.05, mats.warmStone, -0.1, pathBrickGeo);
    }
  }
  // Path-side moss markers (no blockers — walkable cues)
  [
    [-2.1, 0.88, 16.5], [2.15, 0.88, 14.2], [-2.0, 0.88, 11.0], [2.05, 0.88, 9.2],
    [-2.05, 0.95, -8.5], [2.1, 1.0, -11.0], [-2.0, 1.08, -13.8], [2.05, 1.15, -15.5],
  ].forEach(([x, y, z], i) => {
    mesh(
      new THREE.CylinderGeometry(0.35 + (i % 3) * 0.08, 0.42, 0.08, 8),
      i % 2 ? mats.mossLit : mats.moss,
      x, y, z,
      { castShadow: false }
    );
  });
  // Sparse path-edge rubble (offset off spine; avoid shard anchors)
  [
    [-2.8, 0.9, 15.0], [2.9, 0.9, 12.5], [-2.7, 0.9, 8.8],
    [2.85, 0.98, -9.5], [-2.9, 1.05, -12.2], [2.7, 1.12, -14.8],
  ].forEach(([x, y, z], i) => {
    const c = new THREE.Mesh(pathSideRubble, i % 2 ? mats.rubble : mats.mossLit);
    c.position.set(x, y, z);
    c.scale.setScalar(0.7 + (i % 3) * 0.15);
    c.rotation.set(i * 0.6, i * 0.9, i * 0.3);
    c.castShadow = true;
    c.receiveShadow = true;
    root.add(c);
  });

  // ── Extra ruins per zone (unique wreckage) ─────────────────────────
  // Harbor: collapsed quay wall, half-sunken stele, broken pier timber, tide arch stub
  mesh(new THREE.BoxGeometry(3.2, 1.4, 0.45), mats.tealStone, -11.5, 1.4, 20.5, { rotY: 0.55, rotZ: 0.18 });
  mesh(new THREE.BoxGeometry(2.4, 0.9, 0.4), mats.stone, -10.2, 0.95, 21.4, { rotY: 0.4, rotX: 0.25 });
  addBlocker(-11.2, 20.8, 1.2);
  // Half-buried stele near east quay
  mesh(new THREE.BoxGeometry(0.55, 1.8, 0.28), mats.darkStone, 12.5, 0.55, 20.0, { rotZ: -0.35, rotY: -0.2 });
  mesh(new THREE.BoxGeometry(0.9, 0.22, 0.5), mats.stone, 12.5, 0.82, 20.0, { rotY: -0.2, castShadow: false });
  addBlocker(12.5, 20.0, 0.7);
  // Broken bridge / pier beam across shallow
  mesh(new THREE.BoxGeometry(4.5, 0.28, 0.45), mats.weatheredWood, 0.5, 0.55, 34.2, { rotY: 0.15, rotZ: 0.12 });
  mesh(new THREE.BoxGeometry(1.6, 0.22, 0.35), mats.wood, 2.8, 0.48, 34.6, { rotY: -0.4, rotX: 0.3 });
  addBlocker(0.5, 34.2, 0.9);
  // Collapsed arch stub west of west pier
  mesh(new THREE.BoxGeometry(0.45, 2.0, 0.45), mats.tealStone, -13.5, 1.6, 27.5, { rotZ: 0.45 });
  mesh(new THREE.BoxGeometry(0.45, 1.3, 0.45), mats.stone, -12.2, 1.2, 28.2, { rotZ: -0.55 });
  mesh(new THREE.BoxGeometry(2.0, 0.35, 0.4), mats.rubble, -12.85, 2.3, 27.85, { rotZ: 0.2, rotY: 0.25 });
  addBlocker(-13.0, 27.8, 1.1);
  // Capstan / winch remnant
  mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.5, 10), mats.weatheredWood, -1.5, 1.0, 26.8, { castShadow: true });
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), mats.wood, -1.5, 1.7, 26.8, { rotZ: 0.9 });
  addBlocker(-1.5, 26.8, 0.65);
  // Rope coil proxy (torus)
  mesh(new THREE.TorusGeometry(0.35, 0.1, 6, 14), mats.weatheredWood, 8.2, 0.95, 25.5, { rotX: Math.PI / 2.4, castShadow: false });

  // ── Layer 4: harbor landmark — lighthouse / watchtower + net-pole silhouette ──
  const lighthouseShaftGeo = new THREE.CylinderGeometry(0.85, 1.15, 1, 12);
  const lighthouseMidGeo = new THREE.CylinderGeometry(0.7, 0.9, 1, 10);
  const lighthouseCapGeo = new THREE.CylinderGeometry(1.05, 0.95, 0.45, 12);
  mesh(new THREE.CylinderGeometry(1.55, 1.7, 0.55, 12), mats.tealStone, -19.5, 1.05, 14.5, { castShadow: true });
  mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.4, 10), mats.darkStone, -19.5, 1.45, 14.5, { castShadow: false });
  {
    const shaft = new THREE.Mesh(lighthouseShaftGeo, mats.tealStone);
    shaft.position.set(-19.5, 4.2, 14.5);
    shaft.scale.y = 5.8;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    root.add(shaft);
  }
  {
    const mid = new THREE.Mesh(lighthouseMidGeo, mats.darkStone);
    mid.position.set(-19.5, 7.6, 14.5);
    mid.scale.y = 2.4;
    mid.castShadow = true;
    root.add(mid);
  }
  mesh(lighthouseCapGeo, mats.tealStone, -19.5, 9.0, 14.5);
  mesh(new THREE.BoxGeometry(1.8, 0.9, 1.8), mats.darkStone, -19.5, 9.65, 14.5, { castShadow: true });
  mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.1, 8), mats.weatheredWood, -19.5, 10.5, 14.5, { castShadow: false });
  mesh(new THREE.BoxGeometry(0.55, 2.8, 0.45), mats.tealStone, -18.4, 3.5, 15.3, { rotZ: 0.35, rotY: 0.2 });
  addBlocker(-19.5, 14.5, 1.7);

  // Hanging-net pole silhouette
  const netPoleGeo = new THREE.CylinderGeometry(0.12, 0.16, 1, 6);
  {
    const pole = new THREE.Mesh(netPoleGeo, mats.weatheredWood);
    pole.position.set(16.5, 3.4, 22.5);
    pole.scale.y = 5.6;
    pole.castShadow = true;
    root.add(pole);
  }
  mesh(new THREE.BoxGeometry(3.6, 0.14, 0.14), mats.weatheredWood, 16.5, 5.8, 22.5, { rotY: 0.35 });
  mesh(new THREE.BoxGeometry(2.4, 0.1, 0.1), mats.tealStone, 16.5, 5.2, 22.5, { rotY: 0.35 });
  mesh(new THREE.TorusGeometry(0.9, 0.04, 4, 16), mats.weatheredWood, 15.4, 4.4, 23.1, { rotX: 0.9, rotY: 0.3, castShadow: false });
  mesh(new THREE.TorusGeometry(0.7, 0.035, 4, 14), mats.weatheredWood, 17.5, 4.1, 22.0, { rotX: 1.1, rotY: -0.4, castShadow: false });
  mesh(new THREE.TorusGeometry(0.55, 0.03, 4, 12), mats.tealStone, 16.0, 3.6, 23.4, { rotX: 0.7, castShadow: false });
  addBlocker(16.5, 22.5, 0.55);

  // ── Layer 4: harbor crane / mast ruin silhouette ──
  // Broken dock crane: mast + angled boom + counterweight (east quay, clear of shards)
  {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 1, 8),
      mats.weatheredWood
    );
    mast.position.set(18.2, 4.6, 28.5);
    mast.scale.y = 7.4;
    mast.castShadow = true;
    root.add(mast);
  }
  // Boom arm (angled over water)
  mesh(new THREE.BoxGeometry(6.8, 0.22, 0.28), mats.weatheredWood, 20.6, 7.4, 28.5, {
    rotZ: -0.55, rotY: 0.15, castShadow: true,
  });
  mesh(new THREE.BoxGeometry(0.18, 0.18, 3.2), mats.wood, 18.2, 7.55, 28.5, { rotY: 0.15 });
  // Counterweight block + hanging hook stub
  mesh(new THREE.BoxGeometry(0.7, 0.55, 0.55), mats.tealStone, 16.3, 8.0, 28.2, { rotY: 0.15 });
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 5), mats.wood, 22.8, 5.6, 28.9, { rotZ: 0.12 });
  mesh(new THREE.TorusGeometry(0.18, 0.04, 4, 10), mats.tealStone, 22.9, 4.4, 28.95, {
    rotX: Math.PI / 2, castShadow: false,
  });
  // Fallen mast segment on quay
  mesh(new THREE.CylinderGeometry(0.14, 0.18, 4.2, 7), mats.weatheredWood, 15.5, 1.05, 30.8, {
    rotZ: Math.PI / 2.1, rotY: 0.6,
  });
  mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.35, 8), mats.darkStone, 18.2, 0.95, 28.5);
  addBlocker(18.2, 28.5, 0.7);
  addBlocker(15.5, 30.8, 0.85);
  addBlocker(22.5, 28.8, 0.45);

  // Courtyard: fallen wall segment, sunken stele row, broken lintel, rubble gate
  mesh(new THREE.BoxGeometry(4.0, 1.6, 0.5), mats.darkStone, -13.5, 1.5, -2.5, { rotY: 0.25, rotZ: 0.22 });
  mesh(new THREE.BoxGeometry(1.8, 1.1, 0.45), mats.stone, -12.0, 1.1, -1.6, { rotY: 0.3, rotX: 0.35 });
  addBlocker(-13.0, -2.2, 1.35);
  // Half-buried memorial steles
  mesh(new THREE.BoxGeometry(0.5, 1.5, 0.22), mats.darkStone, 7.5, 0.55, -6.5, { rotZ: 0.28 });
  mesh(new THREE.BoxGeometry(0.45, 1.2, 0.2), mats.stone, 8.4, 0.45, -5.8, { rotZ: -0.4, rotY: 0.15 });
  mesh(new THREE.BoxGeometry(0.48, 1.35, 0.2), mats.darkStone, 6.8, 0.5, -7.2, { rotZ: 0.15 });
  addBlocker(7.6, -6.5, 0.95);
  // Broken lintel across two stubs
  mesh(new THREE.BoxGeometry(0.4, 1.6, 0.4), mats.stone, 13.5, 1.5, 2.5, { rotZ: 0.1 });
  mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), mats.darkStone, 15.2, 1.25, 3.2, { rotZ: -0.2 });
  mesh(new THREE.BoxGeometry(2.4, 0.35, 0.4), mats.rubble, 14.35, 2.35, 2.85, { rotZ: 0.35, rotY: 0.2 });
  addBlocker(14.3, 2.8, 1.15);
  // Toppled capital + pedestal fragment
  mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.4, 9), mats.darkStone, -2.0, 1.0, -9.5, { rotX: 0.55, rotY: 0.4 });
  mesh(new THREE.BoxGeometry(1.1, 0.55, 1.1), mats.stone, -0.8, 0.95, -9.8, { rotY: 0.3 });
  addBlocker(-1.4, -9.6, 0.9);
  // Courtyard rubble gate wing
  mesh(new THREE.BoxGeometry(2.8, 2.2, 0.48), mats.darkStone, 9.5, 1.85, 8.5, { rotY: -0.65, rotZ: 0.08 });
  addBlocker(9.5, 8.5, 1.25);

  // ── Layer 4: courtyard landmark — raised dual-column gatehouse + stele tower ──
  const gateColGeo = new THREE.BoxGeometry(0.85, 1, 0.85);
  // Dual columns further south (clear of shard at 4.5,9); path stays on x≈0
  {
    const colL = new THREE.Mesh(gateColGeo, mats.darkStone);
    colL.position.set(-5.4, 4.6, 11.2);
    colL.scale.y = 7.2;
    colL.castShadow = true;
    colL.receiveShadow = true;
    root.add(colL);
    const colR = new THREE.Mesh(gateColGeo, mats.darkStone);
    colR.position.set(5.4, 4.6, 11.2);
    colR.scale.y = 7.2;
    colR.castShadow = true;
    colR.receiveShadow = true;
    root.add(colR);
  }
  mesh(new THREE.BoxGeometry(11.8, 0.7, 1.0), mats.stone, 0, 8.4, 11.2, { castShadow: true });
  mesh(new THREE.BoxGeometry(11.0, 0.35, 0.7), mats.gold, 0, 8.95, 11.2, { castShadow: false });
  // Pediment fangs / broken crest
  mesh(new THREE.BoxGeometry(1.2, 1.4, 0.55), mats.darkStone, -2.2, 9.9, 11.2, { rotZ: 0.15 });
  mesh(new THREE.BoxGeometry(1.0, 1.1, 0.5), mats.stone, 2.0, 9.7, 11.2, { rotZ: -0.25 });
  mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.4, 10), mats.darkStone, -5.4, 1.0, 11.2);
  mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.4, 10), mats.darkStone, 5.4, 1.0, 11.2);
  addBlocker(-5.4, 11.2, 1.05);
  addBlocker(5.4, 11.2, 1.05);
  // Central stele tower (碑塔) west of plaza — tall readable silhouette
  const steleShaftGeo = new THREE.BoxGeometry(1.1, 1, 0.55);
  {
    const stele = new THREE.Mesh(steleShaftGeo, mats.darkStone);
    stele.position.set(-14.5, 5.2, 0.5);
    stele.scale.y = 8.0;
    stele.rotation.y = 0.2;
    stele.castShadow = true;
    stele.receiveShadow = true;
    root.add(stele);
  }
  mesh(new THREE.BoxGeometry(1.6, 0.45, 0.9), mats.stone, -14.5, 1.05, 0.5, { rotY: 0.2 });
  mesh(new THREE.BoxGeometry(1.3, 0.7, 0.65), mats.gold, -14.5, 9.5, 0.5, { rotY: 0.2, castShadow: false });
  mesh(new THREE.BoxGeometry(0.35, 1.2, 0.25), mats.stone, -14.5, 10.4, 0.5, { rotY: 0.2 });
  addBlocker(-14.5, 0.5, 1.1);

  // ── Layer 4: courtyard broken arch silhouette (north-west plaza rim) ──
  // Tall incomplete arch — readable skyline without blocking plaza walk
  mesh(new THREE.BoxGeometry(0.75, 6.8, 0.75), mats.darkStone, -11.8, 4.2, -10.5, { rotZ: 0.06 });
  mesh(new THREE.BoxGeometry(0.7, 5.2, 0.7), mats.stone, -7.4, 3.4, -11.2, { rotZ: -0.12 });
  // Collapsed keystone / arch crown fragment suspended
  mesh(new THREE.BoxGeometry(3.6, 0.55, 0.7), mats.darkStone, -9.6, 7.6, -10.8, {
    rotZ: 0.28, rotY: 0.08, castShadow: true,
  });
  mesh(new THREE.BoxGeometry(1.4, 0.45, 0.55), mats.rubble, -8.4, 8.15, -10.7, {
    rotZ: -0.4, castShadow: false,
  });
  // Fallen arch voussoir on ground
  mesh(new THREE.BoxGeometry(1.8, 0.5, 0.6), mats.stone, -9.2, 1.05, -9.4, {
    rotY: 0.35, rotZ: 0.45,
  });
  mesh(new THREE.BoxGeometry(1.1, 0.4, 0.5), mats.rubble, -10.5, 0.98, -9.8, {
    rotY: -0.5, rotX: 0.2,
  });
  // Soft gold filigree remnant on standing pier
  mesh(new THREE.TorusGeometry(0.85, 0.04, 6, 20, Math.PI * 0.85), mats.gold, -11.8, 6.8, -10.5, {
    rotY: 0.2, castShadow: false,
  });
  addBlocker(-11.8, -10.5, 0.95);
  addBlocker(-7.4, -11.2, 0.9);
  addBlocker(-9.5, -9.6, 0.85);

  // Summit: altar side-wing steps, collapsed colonnade, broken brazier, amber shard plinth
  // Altar side-wing steps (east / west of well approach)
  const wingStepGeo = new THREE.BoxGeometry(1.8, 0.18, 0.7);
  [
    [-5.5, 2.4, -23.5, 0.35], [-6.2, 2.55, -24.5, 0.4], [-5.8, 2.7, -25.4, 0.3],
    [5.5, 2.4, -23.5, -0.35], [6.2, 2.55, -24.5, -0.4], [5.8, 2.7, -25.4, -0.3],
  ].forEach(([x, y, z, ry]) => {
    mesh(wingStepGeo, mats.amberStone, x, y, z, { rotY: ry, castShadow: false });
  });
  addBlocker(-5.8, -24.5, 0.85);
  addBlocker(5.8, -24.5, 0.85);
  // Collapsed colonnade beam
  mesh(new THREE.BoxGeometry(5.5, 0.55, 0.55), mats.warmStone, -10.5, 2.8, -27.5, { rotZ: 0.45, rotY: 0.2 });
  mesh(new THREE.CylinderGeometry(0.45, 0.55, 2.2, 8), mats.warmStone, -8.5, 2.0, -26.8, { rotX: Math.PI / 2.2, rotY: 0.5 });
  addBlocker(-10.0, -27.2, 1.4);
  // Broken brazier
  mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.7, 10), mats.darkStone, 8.5, 2.55, -28.5);
  mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.25, 8), mats.amberStone, 8.5, 2.95, -28.5, { castShadow: false });
  mesh(new THREE.DodecahedronGeometry(0.25, 0), mats.rubble, 9.2, 2.4, -28.0, { scale: 0.9 });
  addBlocker(8.5, -28.5, 0.75);
  // Ritual plinth remnants
  mesh(new THREE.BoxGeometry(1.4, 0.45, 1.4), mats.amberStone, -3.5, 2.65, -30.5, { rotY: 0.2 });
  mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), mats.darkStone, -3.5, 3.15, -30.5, { rotY: 0.2 });
  addBlocker(-3.5, -30.5, 0.85);
  mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), mats.warmStone, 4.0, 2.6, -31.0, { rotY: -0.35 });
  addBlocker(4.0, -31.0, 0.7);
  // Fallen wall north rim
  mesh(new THREE.BoxGeometry(3.5, 2.0, 0.55), mats.warmStone, 14.5, 3.2, -21.5, { rotY: -0.5, rotZ: 0.25 });
  addBlocker(14.5, -21.5, 1.3);

  // ── Layer 4: summit landmark — upright stone ring + amber obelisk ──
  const summitRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.22, 8, 36),
    mats.amberStone
  );
  summitRing.position.set(-7.5, 5.4, -29.5);
  summitRing.rotation.y = 0.55;
  summitRing.castShadow = true;
  summitRing.receiveShadow = true;
  root.add(summitRing);
  // Broken ring fragment leaning
  mesh(new THREE.TorusGeometry(1.6, 0.18, 6, 20, Math.PI * 1.1), mats.warmStone, -6.2, 3.4, -28.2, {
    rotX: 0.9, rotY: 0.4, castShadow: true,
  });
  // Amber obelisk (方尖碑)
  const obeliskGeo = new THREE.BoxGeometry(0.7, 1, 0.7);
  {
    const ob = new THREE.Mesh(obeliskGeo, mats.amberStone);
    ob.position.set(6.8, 6.0, -30.5);
    ob.scale.set(1, 7.2, 1);
    ob.rotation.y = 0.25;
    ob.castShadow = true;
    ob.receiveShadow = true;
    root.add(ob);
  }
  mesh(new THREE.BoxGeometry(1.3, 0.45, 1.3), mats.darkStone, 6.8, 2.55, -30.5, { rotY: 0.25 });
  mesh(new THREE.BoxGeometry(0.45, 0.9, 0.45), mats.gold, 6.8, 10.0, -30.5, { rotY: 0.25, castShadow: false });
  // Small companion needle
  {
    const needle = new THREE.Mesh(obeliskGeo, mats.warmStone);
    needle.position.set(8.6, 4.6, -29.0);
    needle.scale.set(0.55, 4.2, 0.55);
    needle.rotation.y = -0.3;
    needle.rotation.z = 0.08;
    needle.castShadow = true;
    root.add(needle);
  }
  addBlocker(-7.5, -29.5, 1.35);
  addBlocker(6.8, -30.5, 0.95);
  addBlocker(8.6, -29.0, 0.55);

  // ── Layer 4: summit cliff spires (north rim skyline) ──
  const spireGeo = new THREE.ConeGeometry(0.55, 1, 6);
  const spireBaseGeo = new THREE.CylinderGeometry(0.45, 0.65, 1, 7);
  [
    // x, z, shaftH, coneH, leanZ, matKey
    [-17.5, -32.5, 5.8, 2.4, 0.08, 'darkStone'],
    [-14.0, -34.8, 7.2, 3.0, -0.05, 'warmStone'],
    [12.5, -33.5, 6.4, 2.6, 0.1, 'darkStone'],
    [17.0, -31.0, 4.8, 2.0, -0.12, 'warmStone'],
    [-5.5, -35.5, 5.2, 2.2, 0.06, 'amberStone'],
  ].forEach(([x, z, sh, ch, lean, mk], i) => {
    const mat = mats[mk];
    const shaft = new THREE.Mesh(spireBaseGeo, mat);
    shaft.position.set(x, 2.2 + sh * 0.35, z);
    shaft.scale.set(1.1 + (i % 2) * 0.15, sh, 1.0 + (i % 3) * 0.08);
    shaft.rotation.z = lean;
    shaft.rotation.y = i * 0.4;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    root.add(shaft);
    const tip = new THREE.Mesh(spireGeo, i % 2 ? mats.amberStone : mats.warmStone);
    tip.position.set(x + lean * 1.2, 2.2 + sh * 0.7 + ch * 0.45, z);
    tip.scale.set(1.2, ch, 1.2);
    tip.rotation.z = lean * 1.2;
    tip.castShadow = true;
    root.add(tip);
    // Moss lichen shelf
    mesh(new THREE.DodecahedronGeometry(0.4, 0), mats.mossLit, x + 0.55, 2.0, z + 0.4, {
      scale: { x: 0.85, y: 0.4, z: 0.7 }, rotY: i * 0.5, castShadow: false,
    });
    addBlocker(x, z, 1.15);
  });

  // ── Shoreline / cliff: tide-worn rock + mossLit rim ────────────────
  const shoreRockGeo = new THREE.DodecahedronGeometry(0.55, 0);
  const shoreMossGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.1, 9);
  // Rim scatter (island edge, inside walk radius loosely)
  [
    [-30, 0.55, 12], [-33, 0.5, -5], [-28, 0.55, -18], [-20, 0.5, -32],
    [22, 0.5, -32], [31, 0.55, -12], [33, 0.5, 4], [28, 0.55, 18],
    [-24, 0.5, 28], [18, 0.5, 32], [-34, 0.48, 8], [34, 0.48, -8],
  ].forEach(([x, y, z], i) => {
    const rock = new THREE.Mesh(shoreRockGeo, i % 3 === 0 ? mats.mossLit : mats.rubble);
    rock.position.set(x, y, z);
    rock.scale.set(0.9 + (i % 4) * 0.25, 0.6 + (i % 3) * 0.2, 0.85 + (i % 3) * 0.2);
    rock.rotation.set(i * 0.4, i * 0.7, i * 0.25);
    rock.castShadow = false;
    rock.receiveShadow = true;
    root.add(rock);
    if (i % 2 === 0) {
      mesh(shoreMossGeo, mats.mossLit, x + 0.6, y + 0.15, z - 0.3, { castShadow: false });
    }
  });
  // South shore recognizable reefs (2–3 larger forms near water)
  function reef(x, z, s, rotY) {
    mesh(new THREE.DodecahedronGeometry(1.1, 0), mats.tealStone, x, -0.15, z, {
      scale: { x: s, y: s * 0.55, z: s * 0.85 }, rotY, castShadow: false,
    });
    mesh(new THREE.DodecahedronGeometry(0.7, 0), mats.mossLit, x + 0.6 * s, 0.05, z + 0.4, {
      scale: { x: s * 0.6, y: s * 0.35, z: s * 0.5 }, rotY: rotY + 0.5, castShadow: false,
    });
    mesh(new THREE.CylinderGeometry(0.5 * s, 0.6 * s, 0.12, 8), mats.moss, x, 0.25, z, { castShadow: false });
    addBlocker(x, z, 1.1 * s);
  }
  reef(-8.5, 36.5, 1.35, 0.4);
  reef(3.5, 37.2, 1.15, -0.55);
  reef(11.0, 35.8, 1.25, 0.2);
  // Layer 4: deepen south reef stack (extra mid/low shelves)
  mesh(new THREE.DodecahedronGeometry(0.85, 0), mats.tealStone, -7.6, 0.35, 35.8, {
    scale: { x: 1.1, y: 0.45, z: 0.9 }, rotY: 0.7, castShadow: false,
  });
  mesh(new THREE.DodecahedronGeometry(0.6, 0), mats.rubble, 4.2, 0.45, 36.5, {
    scale: { x: 0.9, y: 0.5, z: 0.75 }, rotY: -0.3, castShadow: false,
  });
  mesh(new THREE.DodecahedronGeometry(0.95, 0), mats.mossLit, 10.2, 0.3, 35.0, {
    scale: { x: 1.05, y: 0.4, z: 0.85 }, rotY: 0.15, castShadow: false,
  });
  mesh(new THREE.DodecahedronGeometry(0.5, 0), mats.tealStone, -9.5, -0.05, 37.2, {
    scale: { x: 0.8, y: 0.35, z: 0.7 }, rotY: 1.1, castShadow: false,
  });
  // North rim taller cliff silhouettes (2–3)
  const cliffGeo = new THREE.DodecahedronGeometry(1.4, 0);
  [
    [-12, -36.5, 2.4, 0.4], [4, -37.5, 2.8, -0.25], [16, -35.0, 2.15, 0.55],
  ].forEach(([x, z, h, ry], i) => {
    const cliff = new THREE.Mesh(cliffGeo, i === 1 ? mats.warmStone : mats.darkStone);
    cliff.position.set(x, 1.2 + h * 0.15, z);
    cliff.scale.set(1.35 + i * 0.15, h, 1.1 + (i % 2) * 0.2);
    cliff.rotation.set(0.15, ry, 0.08 * (i - 1));
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    root.add(cliff);
    mesh(new THREE.DodecahedronGeometry(0.7, 0), mats.mossLit, x + 0.8, 0.7, z + 0.5, {
      scale: { x: 0.9, y: 0.55, z: 0.8 }, rotY: ry + 0.4, castShadow: false,
    });
    addBlocker(x, z, 1.5);
  });

  // ── Path shrubs (small foliage + short trunk, reused geos) ─────────
  const shrubTrunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.55, 5);
  const shrubCrownGeo = new THREE.IcosahedronGeometry(0.55, 0);
  function shrub(x, z, s = 0.7) {
    const trunk = new THREE.Mesh(shrubTrunkGeo, mats.wood);
    trunk.position.set(x, 0.95 * s, z);
    trunk.scale.setScalar(s);
    trunk.castShadow = true;
    root.add(trunk);
    const crown = new THREE.Mesh(shrubCrownGeo, mats.foliage);
    crown.position.set(x, 1.35 * s, z);
    crown.scale.setScalar(s);
    crown.castShadow = true;
    root.add(crown);
    addBlocker(x, z, 0.45 * s);
  }
  [
    // along harbor↔courtyard path edges
    [-3.4, 15.5, 0.65], [3.5, 13.0, 0.7], [-3.6, 10.0, 0.6], [3.4, 7.5, 0.75],
    // courtyard↔summit
    [-3.5, -8.0, 0.7], [3.6, -10.5, 0.65], [-3.4, -13.5, 0.72], [3.5, -16.0, 0.68],
    // zone accents (clear of shard anchors)
    [-14.5, 18.0, 0.8], [15.0, 19.5, 0.75], [-15.5, 4.0, 0.7], [16.0, -6.5, 0.78],
    [-15.0, -22.0, 0.85], [15.5, -24.5, 0.8],
  ].forEach(([x, z, s]) => shrub(x, z, s));

  // Path lanterns (short posts; share lanterns[] flicker) — keep PointLight total ≤44
  function pathLantern(x, z, color = 0xffc978, intensity = 0.75) {
    mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.5, 6), mats.darkStone, x, 1.45, z);
    mesh(new THREE.SphereGeometry(0.18, 10, 10), mats.gold, x, 2.25, z, { castShadow: false });
    const pl = new THREE.PointLight(color, intensity, 8);
    pl.position.set(x, 2.25, z);
    root.add(pl);
    lanterns.push({ pl, base: intensity });
    addBlocker(x, z, 0.35);
  }
  // Harbor↔courtyard (teal), courtyard↔summit (gold/amber) — 5 lights
  pathLantern(-2.4, 15.8, 0x88dde8, 0.7);
  pathLantern(2.4, 11.5, 0x88dde8, 0.7);
  pathLantern(-2.35, -9.0, 0xffc978, 0.72);
  pathLantern(2.4, -12.5, 0xffd090, 0.78);
  pathLantern(-2.3, -15.2, 0xffd090, 0.78);

  // ── Lanterns ──────────────────────────────────────────────────────
  function lantern(x, z, color = 0xffc978, intensity = 1.1) {
    mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 8), mats.darkStone, x, 1.95, z);
    mesh(new THREE.SphereGeometry(0.28, 12, 12), mats.gold, x, 3.25, z, { castShadow: false });
    const pl = new THREE.PointLight(color, intensity, 11);
    pl.position.set(x, 3.25, z);
    root.add(pl);
    lanterns.push({ pl, base: intensity });
    addBlocker(x, z, 0.45);
  }

  // Harbor cool-teal (~9)
  [[-5, 18], [5, 18], [-8, 26], [9, 27], [0, 30], [-12, 14], [13, 13],
   [-2.5, 23], [3.5, 25]].forEach(([x, z]) =>
    lantern(x, z, 0x88dde8, 1.05)
  );
  // Courtyard gold (~8)
  [[-5, 6], [5, 6], [-8, -5], [9, -4],
   [-3, -8], [3.5, 8.5], [-10.5, 1.5], [10, -7.5]].forEach(([x, z]) =>
    lantern(x, z, 0xffc978, 0.95)
  );
  // Summit warm-amber (~11, includes well ring)
  [[-6, -18], [6, -18], [0, -28], [-10, -26], [10, -25],
   [-3.5, -22], [3.5, -22], [-7, -24.5], [7.5, -24], [0, -20.5], [4.5, -27.5]].forEach(([x, z]) =>
    lantern(x, z, 0xffd090, 1.15)
  );

  // ── Trees along rim ───────────────────────────────────────────────
  const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.2, 7);
  const crownGeo = new THREE.IcosahedronGeometry(1.4, 0);

  function tree(x, z, s = 1, doubleCrown = false) {
    const trunk = new THREE.Mesh(trunkGeo, mats.wood);
    trunk.position.set(x, 1.7 * s, z);
    trunk.scale.setScalar(s);
    trunk.castShadow = true;
    root.add(trunk);
    const crown = new THREE.Mesh(crownGeo, mats.foliage);
    crown.position.set(x, 3.3 * s, z);
    crown.scale.setScalar(s);
    crown.castShadow = true;
    root.add(crown);
    // Layer 7: second offset canopy for richer silhouette
    if (doubleCrown) {
      const crown2 = new THREE.Mesh(crownGeo, mats.foliage);
      crown2.position.set(x + 0.55 * s, 3.55 * s, z - 0.42 * s);
      crown2.scale.setScalar(s * 0.72);
      crown2.rotation.y = 0.7;
      crown2.castShadow = true;
      root.add(crown2);
    }
    addBlocker(x, z, 0.9 * s);
  }

  [
    [-28, 8, 1.25, 1], [-26, -10, 1.05, 0], [30, 6, 1.35, 1], [27, -14, 1.0, 0],
    [-22, 22, 1.15, 1], [20, 24, 0.95, 0], [-18, -28, 1.2, 1], [16, -30, 1.1, 0],
    [-32, -2, 1.0, 1], [32, -4, 1.15, 0], [0, 34, 0.9, 1], [-8, -34, 1.05, 0],
  ].forEach(([x, z, s, dc]) => tree(x, z, s, !!dc));

  // ── Fireflies (island-wide + summit cluster) ──────────────────────
  const flyCount = 148;
  const flyGeo = new THREE.BufferGeometry();
  const flyPos = new Float32Array(flyCount * 3);
  const flyPhase = new Float32Array(flyCount);
  for (let i = 0; i < flyCount; i++) {
    const summitBias = i < 52; // denser near 星井
    let x, y, z;
    if (summitBias) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 9;
      x = Math.cos(a) * r;
      z = -24 + Math.sin(a) * r;
      y = 2.8 + Math.random() * 5.5;
    } else {
      const a = Math.random() * Math.PI * 2;
      const r = 6 + Math.random() * (WALK_RADIUS - 3);
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = 1.2 + Math.random() * 5.5;
    }
    flyPos[i * 3] = x;
    flyPos[i * 3 + 1] = y;
    flyPos[i * 3 + 2] = z;
    flyPhase[i] = Math.random() * Math.PI * 2;
  }
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  // Layer 8: zone-tint fireflies — cool cyan harbor / gold courtyard / amber summit
  const flyCol = new Float32Array(flyCount * 3);
  for (let i = 0; i < flyCount; i++) {
    const z = flyPos[i * 3 + 2];
    let r, g, b;
    if (z > 12) {
      // 港湾 — cool cyan
      r = 0.45; g = 0.88; b = 1.0;
    } else if (z < -12) {
      // 高台 — amber
      r = 1.0; g = 0.68; b = 0.32;
    } else {
      // 庭院 — warm gold
      r = 1.0; g = 0.88; b = 0.45;
    }
    // slight jitter so they don't look uniform
    const j = 0.92 + (i % 7) * 0.015;
    flyCol[i * 3] = r * j;
    flyCol[i * 3 + 1] = g * j;
    flyCol[i * 3 + 2] = b * j;
  }
  flyGeo.setAttribute('color', new THREE.BufferAttribute(flyCol, 3));
  const flyMat = mats.firefly.clone();
  flyMat.vertexColors = true;
  flyMat.color.setHex(0xffffff);
  const flies = new THREE.Points(flyGeo, flyMat);
  root.add(flies);

  // Soft ground mist (~80, low y, island-wide with harbor bias)
  const mistCount = 80;
  const mistGeo = new THREE.BufferGeometry();
  const mistPos = new Float32Array(mistCount * 3);
  const mistPhase = new Float32Array(mistCount);
  for (let i = 0; i < mistCount; i++) {
    if (i < 40) {
      mistPos[i * 3] = (Math.random() - 0.5) * 28;
      mistPos[i * 3 + 1] = 0.5 + Math.random() * 1.8;
      mistPos[i * 3 + 2] = 14 + Math.random() * 18;
    } else {
      const a = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * (ISLAND_RADIUS - 4);
      mistPos[i * 3] = Math.cos(a) * r;
      mistPos[i * 3 + 1] = 0.35 + Math.random() * 1.5;
      mistPos[i * 3 + 2] = Math.sin(a) * r;
    }
    mistPhase[i] = Math.random() * Math.PI * 2;
  }
  mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
  const mistPts = new THREE.Points(mistGeo, mats.mist);
  root.add(mistPts);

  // Layer 4: courtyard gold dust motes (dense plaza drift)
  const goldDustCount = 78;
  const goldDustGeo = new THREE.BufferGeometry();
  const goldDustPos = new Float32Array(goldDustCount * 3);
  const goldDustPhase = new Float32Array(goldDustCount);
  const goldDustMat = mats.stars.clone();
  goldDustMat.color.setHex(0xffe2a0);
  goldDustMat.size = 0.06;
  goldDustMat.opacity = 0.58;
  for (let i = 0; i < goldDustCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.8 + Math.random() * 7.2;
    goldDustPos[i * 3] = Math.cos(a) * r;
    goldDustPos[i * 3 + 1] = 1.0 + Math.random() * 4.2;
    goldDustPos[i * 3 + 2] = Math.sin(a) * r * 0.9;
    goldDustPhase[i] = Math.random() * Math.PI * 2;
  }
  goldDustGeo.setAttribute('position', new THREE.BufferAttribute(goldDustPos, 3));
  const goldDustPts = new THREE.Points(goldDustGeo, goldDustMat);
  root.add(goldDustPts);

  // Layer 4: harbor low cool fog band (dense near-water drift)
  const harborFogCount = 86;
  const harborFogGeo = new THREE.BufferGeometry();
  const harborFogPos = new Float32Array(harborFogCount * 3);
  const harborFogPhase = new Float32Array(harborFogCount);
  const harborFogMat = mats.mist.clone();
  harborFogMat.color.setHex(0x88b8d0);
  harborFogMat.size = 0.82;
  harborFogMat.opacity = 0.18;
  for (let i = 0; i < harborFogCount; i++) {
    harborFogPos[i * 3] = (Math.random() - 0.5) * 34;
    harborFogPos[i * 3 + 1] = 0.12 + Math.random() * 1.05;
    harborFogPos[i * 3 + 2] = 16 + Math.random() * 20;
    harborFogPhase[i] = Math.random() * Math.PI * 2;
  }
  harborFogGeo.setAttribute('position', new THREE.BufferAttribute(harborFogPos, 3));
  const harborFogPts = new THREE.Points(harborFogGeo, harborFogMat);
  root.add(harborFogPts);

  // Distant sky stars (~120)
  const skyStarCount = 120;
  const skyStarGeo = new THREE.BufferGeometry();
  const skyStarPos = new Float32Array(skyStarCount * 3);
  for (let i = 0; i < skyStarCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 55 + Math.random() * 75;
    skyStarPos[i * 3] = Math.cos(a) * r;
    skyStarPos[i * 3 + 1] = 16 + Math.random() * 42;
    skyStarPos[i * 3 + 2] = Math.sin(a) * r;
  }
  skyStarGeo.setAttribute('position', new THREE.BufferAttribute(skyStarPos, 3));
  const skyStars = new THREE.Points(skyStarGeo, mats.stars);
  root.add(skyStars);

  // ── Layer 5: zone atmosphere, tide foam, guide path, ripples, props ──
  // Zone mood wash lights (large range, weak; breathe in update). PL budget: ~42 (L6 adds 0).
  const zoneMoodLights = [];
  function zoneMood(x, y, z, color, intensity, dist) {
    const pl = new THREE.PointLight(color, intensity, dist);
    pl.position.set(x, y, z);
    root.add(pl);
    zoneMoodLights.push({ pl, base: intensity });
  }
  // Harbor cool-teal ×2
  zoneMood(-4, 4.5, 24, 0x6ec8d8, 0.28, 26);
  zoneMood(6, 4.2, 28, 0x5ab8c8, 0.24, 24);
  // Courtyard warm-gold ×1
  zoneMood(0, 5.0, 2, 0xffd090, 0.26, 22);
  // Summit amber ×1
  zoneMood(0, 6.5, -24, 0xffc878, 0.3, 24);

  // Harbor low-tide foam ring (shallow translucent; opacity breathes)
  const tideFoamMat = mats.shallowWater.clone();
  tideFoamMat.color.setHex(0xb8e0ec);
  tideFoamMat.opacity = 0.18;
  tideFoamMat.emissive.setHex(0x204858);
  tideFoamMat.emissiveIntensity = 0.08;
  const tideFoam = mesh(
    new THREE.TorusGeometry(36.5, 0.55, 6, 64),
    tideFoamMat,
    0, -0.55, 6,
    { rotX: Math.PI / 2, castShadow: false, receiveShadow: false }
  );
  // Extra shallow foam under pier apron (thin cylinder ring)
  const pierFoamMat = mats.shallowWater.clone();
  pierFoamMat.color.setHex(0xa8d8e4);
  pierFoamMat.opacity = 0.14;
  const pierFoam = mesh(
    new THREE.CylinderGeometry(14.5, 15.2, 0.08, 40, 1, true),
    pierFoamMat,
    0, -0.62, 26,
    { castShadow: false, receiveShadow: false }
  );
  pierFoam.material.side = THREE.DoubleSide;

  // Portal guide light path — courtyard approach (south → portal); grows with setPortalPower
  const guidePathMats = [];
  const guidePathMeshes = [];
  const guideSlabGeo = new THREE.PlaneGeometry(1.15, 0.85);
  for (let i = 0; i < 7; i++) {
    const gmat = mats.portalGlow.clone();
    gmat.opacity = 0.02;
    gmat.color.setHex(0x88e8ff);
    const z = 6.8 - i * 0.85;
    const slab = mesh(guideSlabGeo, gmat, ((i % 3) - 1) * 0.06, 0.92, z, {
      rotX: -Math.PI / 2, castShadow: false, receiveShadow: false,
    });
    guidePathMats.push(gmat);
    guidePathMeshes.push(slab);
  }
  // Soft center runner strip
  const guideRunnerMat = mats.portalHaloMat.clone();
  guideRunnerMat.opacity = 0.015;
  guideRunnerMat.color.setHex(0x66d0ee);
  const guideRunner = mesh(
    new THREE.PlaneGeometry(0.55, 6.2),
    guideRunnerMat,
    0, 0.905, 3.6,
    { rotX: -Math.PI / 2, castShadow: false, receiveShadow: false }
  );

  // Summit well-mouth ripples (thin rings; slow scale in update)
  const wellRipples = [];
  for (let i = 0; i < 3; i++) {
    const rmat = mats.portalRing.clone();
    rmat.opacity = 0.18 - i * 0.04;
    rmat.color.setHex(0xffe8b0);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55 + i * 0.35, 0.022, 6, 36),
      rmat
    );
    ring.position.set(0, 3.02 + i * 0.02, -24);
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = false;
    ring.receiveShadow = false;
    root.add(ring);
    wellRipples.push({ mesh: ring, baseR: 0.55 + i * 0.35, mat: rmat, phase: i * 1.7 });
  }

  // ── Layer 5 props (reuse mats; blockers; clear of 9 anchors + portal) ──
  // Harbor: 2 drying nets (pole + thin net plane)
  const netPoleThinGeo = new THREE.CylinderGeometry(0.06, 0.08, 1, 5);
  const netPlaneGeo = new THREE.PlaneGeometry(2.4, 1.6);
  function dryingNet(px, pz, rotY, lean = 0.12) {
    const pole = new THREE.Mesh(netPoleThinGeo, mats.weatheredWood);
    pole.position.set(px, 2.4, pz);
    pole.scale.y = 3.6;
    pole.rotation.z = lean;
    pole.castShadow = true;
    root.add(pole);
    const net = new THREE.Mesh(netPlaneGeo, mats.tealStone.clone());
    net.material.transparent = true;
    net.material.opacity = 0.45;
    net.material.side = THREE.DoubleSide;
    net.material.depthWrite = false;
    net.position.set(px + Math.sin(rotY) * 0.9, 2.6, pz + Math.cos(rotY) * 0.15);
    net.rotation.y = rotY;
    net.rotation.x = 0.15;
    net.rotation.z = lean * 0.6;
    net.castShadow = false;
    root.add(net);
    // Cross-bar
    mesh(new THREE.BoxGeometry(2.2, 0.08, 0.08), mats.wood, px, 4.0, pz, { rotY, castShadow: false });
    addBlocker(px, pz, 0.4);
    return { mesh: net, baseX: 0.15, baseZ: lean * 0.6 };
  }
  const dryingNets = [
    dryingNet(-11.5, 31.5, 0.55, 0.1),   // clear of anchors (-9.5,22.5)/(0,30.5)/(10,24)
    dryingNet(12.8, 31.0, -0.65, -0.08),
  ];

  // Courtyard: 1 stone bench (seat + legs)
  const benchX = -6.8, benchZ = 3.2; // clear of portal (0,0) and anchors
  mesh(new THREE.BoxGeometry(2.2, 0.22, 0.7), mats.stone, benchX, 1.25, benchZ, { rotY: 0.35 });
  mesh(new THREE.BoxGeometry(0.22, 0.55, 0.55), mats.darkStone, benchX - 0.85, 0.95, benchZ + 0.15, { rotY: 0.35 });
  mesh(new THREE.BoxGeometry(0.22, 0.55, 0.55), mats.darkStone, benchX + 0.85, 0.95, benchZ - 0.15, { rotY: 0.35 });
  mesh(new THREE.BoxGeometry(2.0, 0.12, 0.18), mats.darkStone, benchX, 1.55, benchZ - 0.28, { rotY: 0.35, castShadow: false });
  addBlocker(benchX, benchZ, 0.95);

  // Summit: 2 tattered banners (pole + thin plane)
  const bannerPoleGeo = new THREE.CylinderGeometry(0.07, 0.09, 1, 6);
  const bannerGeo = new THREE.PlaneGeometry(1.3, 2.4);
  function tatteredBanner(px, pz, rotY, matKey = 'amberStone') {
    const pole = new THREE.Mesh(bannerPoleGeo, mats.weatheredWood);
    pole.position.set(px, 4.4, pz);
    pole.scale.y = 5.2;
    pole.castShadow = true;
    root.add(pole);
    const cloth = new THREE.Mesh(bannerGeo, mats[matKey].clone());
    cloth.material.transparent = true;
    cloth.material.opacity = 0.72;
    cloth.material.side = THREE.DoubleSide;
    cloth.material.emissiveIntensity = (cloth.material.emissiveIntensity || 0) * 0.6;
    cloth.position.set(px + Math.sin(rotY) * 0.55, 4.6, pz + Math.cos(rotY) * 0.05);
    cloth.rotation.y = rotY;
    cloth.castShadow = false;
    root.add(cloth);
    mesh(new THREE.BoxGeometry(0.15, 0.15, 1.5), mats.wood, px, 6.9, pz, { rotY: rotY + Math.PI / 2, castShadow: false });
    addBlocker(px, pz, 0.4);
    return cloth;
  }
  const bannerCloths = [
    tatteredBanner(-12.5, -27.5, 0.4, 'amberStone'),  // clear of (-9,-20.5)/(0,-29.5)/(10,-22)
    tatteredBanner(12.0, -26.5, -0.55, 'warmStone'),
  ];


  // ── Layer 6: architectural depth — wreck, colonnades, stairs, reflection, silhouettes ──
  // No new PointLights (budget ~42); atmosphere via emissive / opacity breath only.

  // 1) Harbor wrecked ship (南岸浅水, clear of anchors 0/30.5 · -9.5/22.5 · 10/24)
  const wreckX = -14.2, wreckZ = 33.8;
  const wreckGroup = new THREE.Group();
  wreckGroup.name = 'harbor-wreck';
  wreckGroup.position.set(wreckX, -0.15, wreckZ);
  wreckGroup.rotation.set(0.22, 0.55, 0.48); // side-tilted
  root.add(wreckGroup);
  // Hull: elongated half-cylinder + box keel
  {
    const hull = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.15, 5.6, 10, 1, false, 0, Math.PI),
      mats.weatheredWood
    );
    hull.rotation.z = Math.PI / 2;
    hull.rotation.x = Math.PI;
    hull.position.set(0, 0.55, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    wreckGroup.add(hull);
  }
  mesh(new THREE.BoxGeometry(5.4, 0.35, 1.5), mats.wood, 0, 0.25, 0, {
    parent: wreckGroup, castShadow: true,
  });
  // Gunwale remnants + broken deck plank
  mesh(new THREE.BoxGeometry(4.8, 0.12, 0.18), mats.weatheredWood, 0, 1.05, 0.55, {
    parent: wreckGroup, castShadow: false,
  });
  mesh(new THREE.BoxGeometry(1.8, 0.1, 0.7), mats.wood, 0.6, 0.85, -0.15, {
    parent: wreckGroup, rotZ: 0.15, castShadow: false,
  });
  // Broken mast (snapped, leaning)
  {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 1, 6),
      mats.weatheredWood
    );
    mast.position.set(-0.4, 2.2, 0.1);
    mast.scale.y = 3.4;
    mast.rotation.z = 0.55;
    mast.rotation.x = -0.2;
    mast.castShadow = true;
    wreckGroup.add(mast);
  }
  mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.8, 5), mats.wood, 1.4, 0.35, 0.6, {
    parent: wreckGroup, rotZ: Math.PI / 2.3, rotY: 0.4, castShadow: false,
  });
  // Shallow wash under hull
  mesh(
    new THREE.CircleGeometry(3.4, 20),
    mats.shallowWater.clone(),
    wreckX + 0.4, -0.68, wreckZ + 0.3,
    { rotX: -Math.PI / 2, castShadow: false, receiveShadow: false }
  );
  addBlocker(wreckX, wreckZ, 2.2);
  addBlocker(wreckX + 1.6, wreckZ + 1.1, 0.7);

  // Floating driftwood (2–3 logs near wreck)
  const driftLogGeo = new THREE.CylinderGeometry(0.12, 0.16, 1, 6);
  const driftLogs = [];
  [
    [-12.0, -0.45, 35.2, 1.9, 0.9, 0.3],
    [-15.8, -0.48, 35.6, 1.5, 1.2, -0.4],
    [-13.5, -0.42, 32.2, 2.2, 0.35, 0.7],
  ].forEach(([x, y, z, len, rotY, rotZ], i) => {
    const log = new THREE.Mesh(driftLogGeo, i === 1 ? mats.wood : mats.weatheredWood);
    log.position.set(x, y, z);
    log.scale.set(1, len, 1);
    log.rotation.set(Math.PI / 2.05, rotY, rotZ);
    log.castShadow = false;
    log.receiveShadow = true;
    root.add(log);
    driftLogs.push({ mesh: log, baseY: y, phase: i * 1.4 });
    if (i !== 1) addBlocker(x, z, 0.55);
  });

  // 2) Courtyard colonnade remnants (E/W incomplete galleries; pillar gaps walkable)
  const colonnadeColGeo = new THREE.CylinderGeometry(0.32, 0.4, 1, 8);
  const colonnadeBaseGeo = new THREE.CylinderGeometry(0.48, 0.5, 0.22, 8);
  function colonnadePillar(x, z, h, mat) {
    const shaft = new THREE.Mesh(colonnadeColGeo, mat);
    shaft.position.set(x, 0.95 + h / 2, z);
    shaft.scale.y = h;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    root.add(shaft);
    const base = new THREE.Mesh(colonnadeBaseGeo, mats.darkStone);
    base.position.set(x, 0.92, z);
    base.castShadow = true;
    root.add(base);
    addBlocker(x, z, 0.7);
  }
  // West gallery — 4 columns along z; x=-18 clears pillar(-16,2) & stele(-14.5,0.5)
  const westCols = [
    [-18.0, 8.0, 3.6], [-18.0, 5.5, 4.0], [-18.0, 3.0, 3.4], [-18.0, 0.5, 3.8],
  ];
  westCols.forEach(([x, z, h], i) => colonnadePillar(x, z, h, i % 2 ? mats.stone : mats.darkStone));
  // Broken lintel fragments (missing mid span)
  mesh(new THREE.BoxGeometry(0.5, 0.35, 2.4), mats.darkStone, -18.0, 4.85, 6.9, { rotZ: 0.08 });
  mesh(new THREE.BoxGeometry(0.45, 0.32, 2.1), mats.stone, -18.0, 4.55, 1.6, { rotZ: -0.12, rotY: 0.05 });
  mesh(new THREE.BoxGeometry(0.4, 0.28, 1.3), mats.rubble, -17.2, 1.15, 4.0, {
    rotZ: 0.55, rotY: 0.3, castShadow: false,
  });
  // East gallery — 3 columns; clear of pillar(15,3) & anchors (11.5,-4)/(4.5,9)
  const eastCols = [
    [17.2, 5.5, 3.8], [17.2, 2.8, 4.2], [17.2, 0.1, 3.5],
  ];
  eastCols.forEach(([x, z, h], i) => colonnadePillar(x, z, h, i % 2 ? mats.darkStone : mats.stone));
  mesh(new THREE.BoxGeometry(0.5, 0.35, 2.6), mats.darkStone, 17.2, 4.95, 4.3, { rotZ: -0.06 });
  mesh(new THREE.BoxGeometry(0.42, 0.3, 1.6), mats.rubble, 17.2, 4.4, 1.2, { rotZ: 0.18 });
  mesh(new THREE.BoxGeometry(1.4, 0.28, 0.4), mats.stone, 16.3, 1.1, 1.6, {
    rotY: 0.4, rotZ: 0.35, castShadow: false,
  });

  // 3) Summit ceremonial stair wing (courtyard N rim → star-well; height aligns ~2.2–2.8)
  const grandStepGeo = new THREE.BoxGeometry(4.6, 0.16, 0.95);
  const grandSteps = [];
  for (let i = 0; i < 8; i++) {
    const z = -16.8 - i * 0.85;
    const y = 1.35 + i * 0.16;
    const wobble = ((i % 3) - 1) * 0.04;
    const s = mesh(grandStepGeo, i % 2 ? mats.warmStone : mats.amberStone, wobble, y, z, {
      castShadow: false,
    });
    grandSteps.push(s);
  }
  // Side wing flare (wider lower treads)
  mesh(new THREE.BoxGeometry(5.4, 0.14, 0.9), mats.warmStone, 0, 1.28, -16.2, { castShadow: false });
  mesh(new THREE.BoxGeometry(5.1, 0.14, 0.85), mats.amberStone, 0.05, 1.44, -17.0, { castShadow: false });
  // Low handrail remnant (east side, broken)
  mesh(new THREE.BoxGeometry(0.18, 0.55, 2.8), mats.darkStone, 2.55, 2.15, -19.5, { rotZ: 0.08 });
  mesh(new THREE.BoxGeometry(0.16, 0.45, 1.6), mats.warmStone, 2.6, 2.55, -21.4, { rotZ: -0.12 });
  mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), mats.darkStone, 2.55, 1.85, -18.4);
  mesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), mats.darkStone, 2.58, 2.35, -20.6);
  mesh(new THREE.BoxGeometry(0.18, 0.35, 0.9), mats.rubble, 2.7, 1.55, -22.2, {
    rotZ: 0.5, rotY: 0.2, castShadow: false,
  });
  addBlocker(2.55, -19.5, 0.45);
  addBlocker(2.6, -21.4, 0.4);
  // West stub rail (shorter ruin)
  mesh(new THREE.BoxGeometry(0.16, 0.4, 1.4), mats.darkStone, -2.5, 2.0, -18.8, { rotZ: -0.15 });
  mesh(new THREE.BoxGeometry(0.2, 0.55, 0.2), mats.warmStone, -2.5, 1.7, -18.2);
  addBlocker(-2.5, -18.8, 0.35);

  // 4) Near-shore fake reflection (bright pale strip under wreck / pier projection)
  const fakeReflMat = mats.shallowWater.clone();
  fakeReflMat.color.setHex(0xc8eef8);
  fakeReflMat.opacity = 0.16;
  fakeReflMat.emissive.setHex(0x306878);
  fakeReflMat.emissiveIntensity = 0.18;
  fakeReflMat.roughness = 0.12;
  fakeReflMat.metalness = 0.55;
  const fakeReflection = mesh(
    new THREE.PlaneGeometry(7.5, 1.35),
    fakeReflMat,
    wreckX + 1.2, -0.58, wreckZ + 0.8,
    { rotX: -Math.PI / 2, rotZ: -0.55, castShadow: false, receiveShadow: false }
  );
  // Secondary thinner strip toward east pier shadow
  const fakeReflMat2 = fakeReflMat.clone();
  fakeReflMat2.opacity = 0.1;
  const fakeReflection2 = mesh(
    new THREE.PlaneGeometry(5.2, 0.7),
    fakeReflMat2,
    5.5, -0.6, 31.5,
    { rotX: -Math.PI / 2, rotZ: 0.2, castShadow: false, receiveShadow: false }
  );

  // 5) Distant horizon silhouettes (SE / SW; far outside island; no blockers)
  function distantIslet(x, z, s, lean = 0.05) {
    mesh(new THREE.DodecahedronGeometry(1.6, 0), mats.darkStone, x, -0.6, z, {
      scale: { x: s * 1.8, y: s * 0.55, z: s * 1.2 }, rotY: lean, castShadow: false, receiveShadow: false,
    });
    mesh(new THREE.DodecahedronGeometry(1.0, 0), mats.darkStone, x + s * 1.2, -0.35, z + s * 0.4, {
      scale: { x: s * 0.9, y: s * 0.4, z: s * 0.7 }, rotY: lean + 0.5, castShadow: false, receiveShadow: false,
    });
    mesh(new THREE.CylinderGeometry(s * 1.4, s * 1.7, 0.35, 10), mats.darkStone, x, -0.95, z, {
      castShadow: false, receiveShadow: false,
    });
  }
  distantIslet(58, 42, 2.4, 0.3);   // southeast
  distantIslet(-56, 38, 2.1, -0.25); // southwest


  // ── Layer 7: moss vines, wind sway hooks, divine beams, wear paths, canopy ──
  // PointLight +0 (budget ~42); atmosphere via emissive / additive mesh only.

  // 1) Climbing moss / vine strips on courtyard & colonnade pillars + ruined walls
  const mossVineGeo = new THREE.BoxGeometry(0.11, 1.85, 0.035);
  const mossVineMats = [];
  [
    // courtyard pillars (surface offset from shaft)
    [-10.58, 2.15, 8.05, 0.18, 1.05],
    [10.58, 2.45, 7.05, -0.22, 1.15],
    [-12.58, 2.7, -5.95, 0.28, 1.25],
    [11.58, 2.05, -8.95, -0.16, 0.95],
    [-6.55, 1.95, 12.05, 0.32, 0.9],
    [7.55, 2.35, 11.05, -0.26, 1.0],
    // colonnade shafts
    [-18.38, 2.35, 5.55, 0.14, 1.1],
    [17.58, 2.55, 2.85, -0.18, 1.2],
    // ruined walls (summit)
    [-13.55, 3.15, -17.65, 0.52, 1.35],
    [12.65, 2.95, -25.65, -0.42, 1.15],
    [2.38, 3.85, -29.65, 0.12, 1.4],
    // courtyard fallen wall
    [-13.2, 1.85, -2.35, 0.35, 0.85],
  ].forEach(([x, y, z, rotZ, sy], i) => {
    const vmat = mats.mossLit.clone();
    vmat.emissiveIntensity = 0.18 + (i % 4) * 0.04;
    vmat.transparent = true;
    vmat.opacity = 0.78 + (i % 3) * 0.05;
    const vine = new THREE.Mesh(mossVineGeo, vmat);
    vine.position.set(x, y, z);
    vine.scale.set(1, sy, 1);
    vine.rotation.set(0.06 * ((i % 3) - 1), i * 0.37, rotZ);
    vine.castShadow = false;
    vine.receiveShadow = false;
    root.add(vine);
    mossVineMats.push(vmat);
  });

  // 4) Inter-zone wear strip — thin center band on harbor↔courtyard & courtyard↔summit paths
  const wearStripGeo = new THREE.BoxGeometry(0.26, 0.035, 0.98);
  for (let i = 0; i < 11; i++) {
    const z = 18.5 - i * 1.05;
    const wobble = ((i % 3) - 1) * 0.12;
    layPathSlab(wobble, 0.878, z, i % 2 ? mats.rubble : mats.tile, i * 0.04, wearStripGeo);
  }
  for (let i = 0; i < 10; i++) {
    const z = -7.2 - i * 1.0;
    const y = 0.918 + i * 0.045;
    const wobble = ((i % 3) - 1) * 0.1;
    layPathSlab(wobble, y, z, i % 2 ? mats.tile : mats.rubble, i * -0.03, wearStripGeo);
  }

  // 3) High-platform fake divine light (tall additive planes above 星井; no PointLight)
  const divineBeams = [];
  const divineBeamGeo = new THREE.PlaneGeometry(0.48, 8.2);
  for (let i = 0; i < 3; i++) {
    const bmat = mats.portalHaloMat.clone();
    bmat.opacity = 0.055 + i * 0.018;
    bmat.side = THREE.DoubleSide;
    bmat.depthWrite = false;
    const beam = new THREE.Mesh(divineBeamGeo, bmat);
    beam.position.set((i - 1) * 0.32, 7.4, -24);
    beam.rotation.y = (i / 3) * Math.PI * 0.6;
    beam.scale.set(0.65 + i * 0.18, 1, 1);
    beam.castShadow = false;
    beam.receiveShadow = false;
    root.add(beam);
    divineBeams.push({ mesh: beam, mat: bmat, baseOp: bmat.opacity, phase: i * 2.15 });
  }

  // 2/5 wind-sway targets already collected: bannerCloths, dryingNets; canopy via tree(doubleCrown)

  // ── Layer 8: courtyard leaves, harbor buoys, well steam, firefly tints ──
  // PointLight +0; leaf+steam points ≤120.

  // 1) Courtyard falling leaves (~60, warm, courtyard radius only)
  const leafCount = 60;
  const leafGeo = new THREE.BufferGeometry();
  const leafPos = new Float32Array(leafCount * 3);
  const leafPhase = new Float32Array(leafCount);
  const leafCol = new Float32Array(leafCount * 3);
  const leafGroundY = 0.95;
  const leafCeilY = 5.2;
  const courtyardLeafR = 11.5;
  for (let i = 0; i < leafCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * courtyardLeafR;
    leafPos[i * 3] = Math.cos(a) * r;
    leafPos[i * 3 + 1] = leafGroundY + Math.random() * (leafCeilY - leafGroundY);
    leafPos[i * 3 + 2] = Math.sin(a) * r * 0.95;
    leafPhase[i] = Math.random() * Math.PI * 2;
    // warm amber / ochre / soft brown
    const warm = i % 3;
    if (warm === 0) { leafCol[i * 3] = 0.95; leafCol[i * 3 + 1] = 0.62; leafCol[i * 3 + 2] = 0.28; }
    else if (warm === 1) { leafCol[i * 3] = 0.88; leafCol[i * 3 + 1] = 0.48; leafCol[i * 3 + 2] = 0.22; }
    else { leafCol[i * 3] = 0.78; leafCol[i * 3 + 1] = 0.55; leafCol[i * 3 + 2] = 0.30; }
  }
  leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPos, 3));
  leafGeo.setAttribute('color', new THREE.BufferAttribute(leafCol, 3));
  const leafPts = new THREE.Points(leafGeo, mats.leaves);
  root.add(leafPts);

  // 2) Harbor buoys (2–3) near wreck / pier apron — float + micro-spin in update
  const buoyPoleGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.5, 5);
  const buoyBodyGeo = new THREE.SphereGeometry(0.2, 8, 6);
  const buoyCapGeo = new THREE.SphereGeometry(0.08, 6, 5);
  const buoys = [];
  [
    [-11.2, 34.6, 0.0],   // near wreck / driftwood
    [-16.5, 32.8, 1.2],   // west of wreck
    [7.5, 28.4, 2.4],     // east pier apron water
  ].forEach(([bx, bz, phase], i) => {
    const g = new THREE.Group();
    g.name = 'harbor-buoy-' + i;
    const baseY = -0.52;
    g.position.set(bx, baseY, bz);
    const body = new THREE.Mesh(buoyBodyGeo, i === 2 ? mats.amberStone : mats.tealStone);
    body.position.y = 0.06;
    body.castShadow = false;
    body.receiveShadow = false;
    const pole = new THREE.Mesh(buoyPoleGeo, mats.weatheredWood);
    pole.position.y = 0.38;
    pole.castShadow = false;
    const cap = new THREE.Mesh(buoyCapGeo, i === 1 ? mats.warmStone : mats.gold);
    cap.position.y = 0.66;
    cap.castShadow = false;
    g.add(body, pole, cap);
    root.add(g);
    buoys.push({ group: g, baseY, phase: phase + i * 0.9 });
    // no walk blocker — water props
  });

  // 3) Starwell steam mist (~40 above well mouth; rise → fade-reset)
  const steamCount = 40;
  const steamGeo = new THREE.BufferGeometry();
  const steamPos = new Float32Array(steamCount * 3);
  const steamPhase = new Float32Array(steamCount);
  const steamBaseY = 3.15;
  const steamMaxY = 7.8;
  for (let i = 0; i < steamCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.55;
    steamPos[i * 3] = Math.cos(a) * r;
    steamPos[i * 3 + 1] = steamBaseY + Math.random() * 3.2;
    steamPos[i * 3 + 2] = -24 + Math.sin(a) * r;
    steamPhase[i] = Math.random() * Math.PI * 2;
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  const steamPts = new THREE.Points(steamGeo, mats.steam);
  root.add(steamPts);

  // ── Layer 9: zone hero anchors (收束) — 1 per zone; PointLight +0; no Points ──

  // 1) Harbor: lighthouse roof wind vane (emissive thin sheet, slow spin)
  const vaneMat = mats.portalHaloMat.clone();
  vaneMat.opacity = 0.42;
  vaneMat.color.setHex(0x88e8ff);
  const windVane = new THREE.Group();
  windVane.name = 'harbor-wind-vane';
  windVane.position.set(-19.5, 11.15, 14.5);
  const vaneStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.55, 5), mats.gold);
  vaneStem.position.y = -0.15;
  vaneStem.castShadow = false;
  const vaneBlade = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.22), vaneMat);
  vaneBlade.position.set(0.28, 0, 0);
  vaneBlade.castShadow = false;
  vaneBlade.receiveShadow = false;
  const vaneFin = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.16), vaneMat);
  vaneFin.position.set(-0.22, 0.02, 0);
  vaneFin.rotation.y = Math.PI;
  vaneFin.castShadow = false;
  windVane.add(vaneStem, vaneBlade, vaneFin);
  root.add(windVane);

  // 2) Courtyard: star-disk dais (tile + gold ring); offset clear of portal/guide/anchors (>2.5m)
  const starDiskX = -4.5;
  const starDiskZ = -2.8;
  mesh(new THREE.CylinderGeometry(1.55, 1.65, 0.22, 24), mats.tile, starDiskX, 1.02, starDiskZ, { castShadow: true });
  mesh(new THREE.CylinderGeometry(1.15, 1.2, 0.12, 20), mats.stone, starDiskX, 1.16, starDiskZ, { castShadow: false });
  const starGoldRing = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.035, 6, 40), mats.gold);
  starGoldRing.position.set(starDiskX, 1.14, starDiskZ);
  starGoldRing.rotation.x = Math.PI / 2;
  starGoldRing.castShadow = false;
  root.add(starGoldRing);
  mesh(new THREE.BoxGeometry(1.8, 0.04, 0.08), mats.gold, starDiskX, 1.22, starDiskZ, { castShadow: false });
  mesh(new THREE.BoxGeometry(0.08, 0.04, 1.8), mats.gold, starDiskX, 1.22, starDiskZ, { castShadow: false });
  mesh(new THREE.BoxGeometry(1.3, 0.035, 0.06), mats.gold, starDiskX, 1.225, starDiskZ, { rotY: Math.PI / 4, castShadow: false });
  mesh(new THREE.BoxGeometry(1.3, 0.035, 0.06), mats.gold, starDiskX, 1.225, starDiskZ, { rotY: -Math.PI / 4, castShadow: false });
  addBlocker(starDiskX, starDiskZ, 1.25);

  // 3) Summit: emissive crown feather/ring on obelisk tip — slow bob in update
  const crownMat = mats.portalRing.clone();
  crownMat.opacity = 0.55;
  crownMat.color.setHex(0xffe2a0);
  const obeliskCrown = new THREE.Group();
  obeliskCrown.name = 'summit-obelisk-crown';
  const crownBaseY = 10.55;
  obeliskCrown.position.set(6.8, crownBaseY, -30.5);
  const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.028, 6, 24), crownMat);
  crownRing.rotation.x = Math.PI / 2;
  crownRing.castShadow = false;
  const crownFeather = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.7), crownMat);
  crownFeather.position.y = 0.4;
  crownFeather.castShadow = false;
  const crownFeather2 = crownFeather.clone();
  crownFeather2.rotation.y = Math.PI / 2;
  obeliskCrown.add(crownRing, crownFeather, crownFeather2);
  root.add(obeliskCrown);

  // ── Shard anchors: exactly 9 (3 per zone), y≈1.6 ──────────────────
  const shardAnchors = [
    // 晨雾港湾 (south)
    new THREE.Vector3(-9.5, 1.6, 22.5),
    new THREE.Vector3(10.0, 1.6, 24.0),
    new THREE.Vector3(0.0, 1.6, 30.5),
    // 残碑庭院 (center)
    new THREE.Vector3(-11.0, 1.6, 5.5),
    new THREE.Vector3(13.2, 1.6, -3.2), // nudged toward 苔径回廊 east rim
    new THREE.Vector3(4.5, 1.6, 9.0),
    // 星井高台 (north)
    new THREE.Vector3(-9.0, 1.6, -20.5),
    new THREE.Vector3(10.0, 1.6, -22.0),
    new THREE.Vector3(0.0, 1.6, -29.5),
  ];

  let portalPower = 0;

  function setPortalPower(p) {
    portalPower = Math.max(0, Math.min(1, Number(p) || 0));
    // Ease-in climax curve: soft until ~0.55, then bloom/rings/dust surge toward 1
    const climax = portalPower * portalPower * (3 - 2 * portalPower); // smoothstep-ish 0→1
    const surge = Math.max(0, (portalPower - 0.55) / 0.45); // 0 below 0.55, 1 at full
    const surge2 = surge * surge;
    mats.portalGlow.opacity = 0.08 + portalPower * 0.77 + surge2 * 0.12;
    mats.portalHaloMat.opacity = 0.03 + portalPower * 0.28 + surge2 * 0.22;
    mats.portalRing.opacity = 0.2 + portalPower * 0.65 + surge * 0.2;
    mats.portalDust.opacity = 0.12 + portalPower * 0.7 + surge2 * 0.25;
    mats.portalDust.size = 0.06 + surge2 * 0.05;
    portalLight.intensity = 0.4 + portalPower * 2.8 + surge2 * 2.2;
    portalHalo.intensity = portalPower * 1.6 + surge2 * 2.4;
    mats.portalGlow.color.set(portalPower >= 0.5 ? 0x9ef0ff : 0x66ccff);
    // Climax: beam rises + outer halo expands + ground runes fade in
    portalBeamMat.opacity = portalPower * 0.14 + surge2 * 0.12;
    portalBeam.scale.y = 7.5 + portalPower * 4.5 + surge * 3.5;
    portalBeam.position.y = 4.2 + portalPower * 1.8 + surge * 1.2;
    portalRuneMat.opacity = portalPower * 0.45 + surge * 0.25;
    portalRuneOuterMat.opacity = portalPower * 0.55 + surge * 0.3;
    portalHaloPlane.scale.setScalar(1 + portalPower * 0.35 + surge2 * 0.45);
    // Extra rings + bloom flash + outer dust (API unchanged)
    climaxRingMat.opacity = climax * surge * 0.7;
    climaxRing2Mat.opacity = surge2 * 0.45;
    climaxRing.scale.setScalar(1 + surge * 0.25);
    climaxRing2.scale.setScalar(1 + surge2 * 0.4);
    climaxBloomMat.opacity = surge2 * 0.22;
    climaxBloom.scale.setScalar(1 + surge2 * 0.55);
    climaxFlash.intensity = surge2 * 3.2;
    climaxDustMat.opacity = surge2 * 0.75;
    climaxDustPts.scale.setScalar(1 + surge * 0.35);
    // Layer 5: portal approach guide path brightens with power
    for (let i = 0; i < guidePathMats.length; i++) {
      const edge = 1 - Math.abs(i - 3) / 4;
      guidePathMats[i].opacity = 0.02 + portalPower * (0.12 + edge * 0.18) + surge2 * 0.1;
    }
    guideRunnerMat.opacity = 0.015 + portalPower * 0.14 + surge2 * 0.12;
  }

  function update(t, _dt) {
    mats.water.opacity = 0.75 + Math.sin(t * 0.7) * 0.06;
    water.position.y = -0.9 + Math.sin(t * 0.5) * 0.035;

    for (let i = 0; i < lanterns.length; i++) {
      const L = lanterns[i];
      L.pl.intensity = L.base * (0.85 + Math.sin(t * 2.2 + i) * 0.15);
    }

    const arr = flies.geometry.attributes.position.array;
    for (let i = 0; i < flyCount; i++) {
      const ph = flyPhase[i];
      arr[i * 3 + 1] += Math.sin(t + ph) * 0.003;
      arr[i * 3] += Math.cos(t * 0.4 + ph) * 0.002;
      arr[i * 3 + 2] += Math.sin(t * 0.35 + ph * 0.7) * 0.0015;
    }
    flies.geometry.attributes.position.needsUpdate = true;

    const marr = mistPts.geometry.attributes.position.array;
    for (let i = 0; i < mistCount; i++) {
      const ph = mistPhase[i];
      marr[i * 3] += Math.sin(t * 0.15 + ph) * 0.0045;
      marr[i * 3 + 2] += Math.cos(t * 0.12 + ph * 0.8) * 0.003;
      marr[i * 3 + 1] = 0.55 + Math.sin(t * 0.28 + ph) * 0.38 + mistPhase[i] * 0.05;
    }
    mistPts.geometry.attributes.position.needsUpdate = true;

    // Star-well ring pulse / spin
    for (let i = 0; i < wellRings.length; i++) {
      const ring = wellRings[i];
      ring.rotation.z = t * (0.18 + i * 0.07) * (i % 2 === 0 ? 1 : -1);
      ring.material.opacity = (0.22 - i * 0.05) * (0.85 + Math.sin(t * 1.4 + i) * 0.15);
    }
    wellGlow.intensity = 1.05 + Math.sin(t * 1.6) * 0.2;
    wellHalo.intensity = 0.4 + Math.sin(t * 1.1) * 0.12;
    wellPool.material.opacity = 0.28 + Math.sin(t * 1.3) * 0.08;
    wellShaft.material.opacity = 0.05 + Math.sin(t * 0.9) * 0.015;

    const sarr = wellSparks.geometry.attributes.position.array;
    for (let i = 0; i < wellSparkCount; i++) {
      const ph = wellSparkPhase[i];
      sarr[i * 3 + 1] = 3.0 + ((t * 0.55 + ph) % 5.5);
    }
    wellSparks.geometry.attributes.position.needsUpdate = true;

    // Courtyard gold dust drift
    const gdarr = goldDustPts.geometry.attributes.position.array;
    for (let i = 0; i < goldDustCount; i++) {
      const ph = goldDustPhase[i];
      gdarr[i * 3 + 1] += Math.sin(t * 0.6 + ph) * 0.0025;
      gdarr[i * 3] += Math.cos(t * 0.25 + ph) * 0.0018;
      gdarr[i * 3 + 2] += Math.sin(t * 0.22 + ph * 0.6) * 0.0012;
    }
    goldDustPts.geometry.attributes.position.needsUpdate = true;

    // Harbor low cool fog band
    const hfarr = harborFogPts.geometry.attributes.position.array;
    for (let i = 0; i < harborFogCount; i++) {
      const ph = harborFogPhase[i];
      hfarr[i * 3] += Math.sin(t * 0.1 + ph) * 0.006;
      hfarr[i * 3 + 2] += Math.cos(t * 0.08 + ph * 0.7) * 0.004;
      hfarr[i * 3 + 1] = 0.2 + Math.sin(t * 0.2 + ph) * 0.22 + harborFogPhase[i] * 0.03;
    }
    harborFogPts.geometry.attributes.position.needsUpdate = true;

    // Layer 5: zone mood breath (very slow)
    for (let i = 0; i < zoneMoodLights.length; i++) {
      const M = zoneMoodLights[i];
      M.pl.intensity = M.base * (0.82 + Math.sin(t * 0.35 + i * 1.3) * 0.18);
    }
    // Tide foam opacity breath
    tideFoamMat.opacity = 0.14 + Math.sin(t * 0.45) * 0.06;
    pierFoamMat.opacity = 0.1 + Math.sin(t * 0.38 + 1.2) * 0.05;
    // Well-mouth ripples — slow radial scale
    for (let i = 0; i < wellRipples.length; i++) {
      const R = wellRipples[i];
      const wave = 1 + Math.sin(t * 0.55 + R.phase) * 0.12 + i * 0.02;
      R.mesh.scale.setScalar(wave);
      R.mat.opacity = (0.16 - i * 0.035) * (0.75 + Math.sin(t * 0.7 + R.phase) * 0.25);
    }
    // Banner cloth sway (Layer 5/7 wind)
    for (let i = 0; i < bannerCloths.length; i++) {
      bannerCloths[i].rotation.z = Math.sin(t * 0.8 + i) * 0.1;
      bannerCloths[i].rotation.x = Math.sin(t * 0.55 + i * 0.7) * 0.05;
    }
    // Layer 7: drying-net wind sway
    for (let i = 0; i < dryingNets.length; i++) {
      const N = dryingNets[i];
      N.mesh.rotation.z = N.baseZ + Math.sin(t * 0.7 + i * 1.3) * 0.06;
      N.mesh.rotation.x = N.baseX + Math.sin(t * 0.5 + i * 0.9) * 0.035;
    }
    // Layer 7: divine beam slow spin + opacity breath
    for (let i = 0; i < divineBeams.length; i++) {
      const B = divineBeams[i];
      B.mesh.rotation.y += 0.0022 * (i % 2 === 0 ? 1 : -1);
      B.mat.opacity = B.baseOp * (0.75 + Math.sin(t * 0.55 + B.phase) * 0.35);
    }
    // Layer 7: moss vine soft emissive breath
    for (let i = 0; i < mossVineMats.length; i++) {
      mossVineMats[i].emissiveIntensity = 0.16 + Math.sin(t * 0.4 + i * 0.5) * 0.05;
    }
    // Layer 8: courtyard leaves — slow fall + drift, reset at ground within radius
    const larr = leafPts.geometry.attributes.position.array;
    for (let i = 0; i < leafCount; i++) {
      const ph = leafPhase[i];
      larr[i * 3 + 1] -= 0.006 + (ph % 1) * 0.003;
      larr[i * 3] += Math.sin(t * 0.35 + ph) * 0.004;
      larr[i * 3 + 2] += Math.cos(t * 0.28 + ph * 0.8) * 0.0035;
      // keep inside courtyard disk
      const lx = larr[i * 3];
      const lz = larr[i * 3 + 2];
      const lr = Math.hypot(lx, lz);
      if (lr > courtyardLeafR) {
        const s = courtyardLeafR * 0.92 / lr;
        larr[i * 3] = lx * s;
        larr[i * 3 + 2] = lz * s;
      }
      if (larr[i * 3 + 1] < leafGroundY) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * courtyardLeafR * 0.95;
        larr[i * 3] = Math.cos(a) * r;
        larr[i * 3 + 1] = leafCeilY - Math.random() * 0.6;
        larr[i * 3 + 2] = Math.sin(a) * r * 0.95;
      }
    }
    leafPts.geometry.attributes.position.needsUpdate = true;
    // Layer 8: harbor buoy bob + micro-spin
    for (let i = 0; i < buoys.length; i++) {
      const B = buoys[i];
      B.group.position.y = B.baseY + Math.sin(t * 0.85 + B.phase) * 0.055;
      B.group.rotation.y = Math.sin(t * 0.4 + B.phase) * 0.12;
      B.group.rotation.z = Math.sin(t * 0.55 + B.phase * 0.7) * 0.06;
    }
    // Layer 8: starwell steam rise → reset (soft opacity breath)
    const starr = steamPts.geometry.attributes.position.array;
    for (let i = 0; i < steamCount; i++) {
      const ph = steamPhase[i];
      starr[i * 3 + 1] += 0.01 + (ph % 1) * 0.006;
      starr[i * 3] += Math.sin(t * 0.2 + ph) * 0.003;
      starr[i * 3 + 2] += Math.cos(t * 0.18 + ph * 0.6) * 0.003;
      if (starr[i * 3 + 1] > steamMaxY) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 1.45;
        starr[i * 3] = Math.cos(a) * r;
        starr[i * 3 + 1] = steamBaseY + Math.random() * 0.4;
        starr[i * 3 + 2] = -24 + Math.sin(a) * r;
      }
    }
    steamPts.geometry.attributes.position.needsUpdate = true;
    mats.steam.opacity = 0.08 + Math.sin(t * 0.5) * 0.035;
    // Layer 6: wreck driftwood bob + fake reflection slow flash
    for (let i = 0; i < driftLogs.length; i++) {
      const D = driftLogs[i];
      D.mesh.position.y = D.baseY + Math.sin(t * 0.65 + D.phase) * 0.045;
    }
    driftLogs[0].mesh.rotation.set(Math.PI / 2.05, 0.9, 0.3 + Math.sin(t * 0.4) * 0.04);
    driftLogs[1].mesh.rotation.set(Math.PI / 2.05, 1.2, -0.4 + Math.sin(t * 0.35 + 1.4) * 0.03);
    driftLogs[2].mesh.rotation.set(Math.PI / 2.05, 0.35, 0.7 + Math.sin(t * 0.45 + 2.8) * 0.035);
    wreckGroup.position.y = -0.15 + Math.sin(t * 0.5) * 0.03;
    fakeReflMat.opacity = 0.12 + Math.sin(t * 0.55) * 0.07;
    fakeReflMat.emissiveIntensity = 0.14 + Math.sin(t * 0.55 + 0.5) * 0.06;
    fakeReflMat2.opacity = 0.07 + Math.sin(t * 0.48 + 1.1) * 0.05;

    // Layer 9: hero anchors — vane spin, crown bob
    windVane.rotation.y = t * 0.35;
    vaneMat.opacity = 0.35 + Math.sin(t * 0.9) * 0.1;
    obeliskCrown.position.y = crownBaseY + Math.sin(t * 0.55) * 0.22;
    obeliskCrown.rotation.y = t * 0.2;
    crownMat.opacity = 0.45 + Math.sin(t * 0.7) * 0.12;

    // Guide path soft pulse when powered
    if (portalPower > 0.01) {
      const gp = 0.9 + Math.sin(t * 1.5) * 0.1 * portalPower;
      for (let i = 0; i < guidePathMeshes.length; i++) {
        guidePathMeshes[i].scale.setScalar(gp);
      }
      guideRunner.scale.x = gp;
    }

    if (portalPower > 0.01) {
      const surge = Math.max(0, (portalPower - 0.55) / 0.45);
      const surge2 = surge * surge;
      const pulse = 1 + Math.sin(t * 1.8) * (0.08 + surge2 * 0.1) * portalPower;
      const haloBase = 1 + portalPower * 0.35 + surge2 * 0.45;
      portalGlow.scale.setScalar(pulse);
      portalHaloPlane.scale.setScalar(haloBase * pulse * 1.03);
      filigree.rotation.z = t * 0.25;
      portalGoldRing.rotation.z = -t * 0.35;
      // Dust accelerates as power nears 1
      portalDustPts.rotation.y = t * (0.4 + portalPower * 1.6 + surge2 * 1.8);
      climaxDustPts.rotation.y = -t * (0.55 + surge2 * 2.2);
      climaxDustPts.rotation.z = Math.sin(t * 0.7) * 0.08 * surge;
      portalBeam.rotation.y = t * 0.15;
      portalRune.rotation.z = t * 0.12 * portalPower;
      portalRuneOuter.rotation.z = -t * 0.08 * portalPower;
      climaxRing.rotation.z = t * (0.4 + surge * 0.8);
      climaxRing2.rotation.z = -t * (0.25 + surge2 * 0.6);
      climaxRing2.rotation.x = 0.18 + Math.sin(t * 1.2) * 0.06 * surge;
      portalBeamMat.opacity = portalPower * (0.12 + Math.sin(t * 2.0) * 0.025) + surge2 * (0.1 + Math.sin(t * 3.2) * 0.04);
      climaxBloomMat.opacity = surge2 * (0.18 + Math.sin(t * 2.6) * 0.05);
      climaxFlash.intensity = surge2 * (2.8 + Math.sin(t * 3.0) * 0.55);
      climaxRingMat.opacity = portalPower * surge * (0.55 + Math.sin(t * 2.4) * 0.12);
    }
  }

  portal.userData.walkRadius = WALK_RADIUS;
  portal.userData.islandRadius = ISLAND_RADIUS;

  return {
    blockers,
    shardAnchors,
    zones,
    portal,
    water,
    update,
    setPortalPower,
    walkRadius: WALK_RADIUS,
    islandRadius: ISLAND_RADIUS,
  };
}
