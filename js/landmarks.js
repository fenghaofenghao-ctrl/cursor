/**
 * Interact landmarks + 苔径回廊 colonnade for 星尘遗迹.
 * createLandmarks(THREE, scene, mats?) — low-poly markers at E-interact points.
 * PointLights kept minimal; prefer emissive / additive meshes.
 */
import { createMaterials } from './materials.js';

const GY = 0.95; // default ground y (island plaza / path band)

/**
 * @param {typeof import('three')} THREE
 * @param {import('three').Scene} scene
 * @param {ReturnType<typeof createMaterials>} [matsIn]
 */
export function createLandmarks(THREE, scene, matsIn) {
  const mats = matsIn || createMaterials(THREE);
  const root = new THREE.Group();
  root.name = 'landmarks';
  scene.add(root);

  /** @type {{x:number,z:number,r:number}[]} */
  const blockers = [];
  /** @type {Map<string, {group:import('three').Group, light?:import('three').PointLight, flame?:import('three').Mesh, lit:boolean}>} */
  const litMap = new Map();
  /** @type {Array<{mesh:import('three').Object3D, kind:string, base?:number, phase?:number}>} */
  const anims = [];

  const reduceMotion =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  const silver = new THREE.MeshStandardMaterial({
    color: 0xb8c8d0,
    roughness: 0.42,
    metalness: 0.55,
    emissive: 0x203040,
    emissiveIntensity: 0.22,
  });
  const bellMetal = new THREE.MeshStandardMaterial({
    color: 0x8a9a6a,
    roughness: 0.38,
    metalness: 0.62,
    emissive: 0x1a2810,
    emissiveIntensity: 0.18,
  });
  const riftGlow = new THREE.MeshBasicMaterial({
    color: 0x66aaff,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const riftCore = new THREE.MeshBasicMaterial({
    color: 0xa0e0ff,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffc878,
    roughness: 0.45,
    metalness: 0.05,
    emissive: 0xff9020,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.85,
  });
  const mossMist = mats.mist.clone();
  mossMist.color.setHex(0x88c8a0);
  mossMist.size = 0.48;
  mossMist.opacity = 0.14;

  function addBlk(x, z, r) {
    blockers.push({ x, z, r });
  }

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

  function groupAt(x, z, name) {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, 0, z);
    root.add(g);
    return g;
  }

  // ── sunk_bell (13.5, 7) — timber frame + hanging bell ─────────────
  {
    const g = groupAt(13.5, 7.0, 'lm-sunk_bell');
    mesh(new THREE.BoxGeometry(0.28, 3.4, 0.28), mats.weatheredWood, -0.85, GY + 1.7, 0, { parent: g });
    mesh(new THREE.BoxGeometry(0.28, 3.4, 0.28), mats.weatheredWood, 0.85, GY + 1.7, 0, { parent: g });
    mesh(new THREE.BoxGeometry(2.2, 0.22, 0.32), mats.wood, 0, GY + 3.35, 0, { parent: g });
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 5), mats.wood, 0, GY + 2.7, 0, { parent: g });
    const bell = mesh(
      new THREE.CylinderGeometry(0.55, 0.72, 0.85, 10),
      bellMetal,
      0,
      GY + 2.15,
      0,
      { parent: g, castShadow: true }
    );
    mesh(new THREE.SphereGeometry(0.12, 6, 6), mats.gold, 0, GY + 1.65, 0, {
      parent: g,
      castShadow: false,
    });
    mesh(new THREE.CylinderGeometry(0.7, 0.75, 0.18, 8), mats.moss, 0, GY + 0.1, 0, {
      parent: g,
      castShadow: false,
    });
    anims.push({ mesh: bell, kind: 'sway', phase: 0.4 });
    addBlk(13.5, 7.0, 0.85);
  }

  // ── silver_shrine (-12, -12) — leaf-crown stone niche ─────────────
  {
    const g = groupAt(-12.0, -12.0, 'lm-silver_shrine');
    mesh(new THREE.BoxGeometry(1.6, 0.25, 1.4), mats.tealStone, 0, GY + 0.12, 0, { parent: g });
    mesh(new THREE.BoxGeometry(1.1, 1.8, 0.35), mats.darkStone, 0, GY + 1.05, -0.35, { parent: g });
    mesh(new THREE.BoxGeometry(0.35, 1.5, 0.9), mats.stone, -0.55, GY + 0.9, 0.1, { parent: g, rotY: 0.08 });
    mesh(new THREE.BoxGeometry(0.35, 1.5, 0.9), mats.stone, 0.55, GY + 0.9, 0.1, { parent: g, rotY: -0.08 });
    // leaf crown
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      mesh(new THREE.ConeGeometry(0.28, 0.7, 5), silver, Math.cos(a) * 0.45, GY + 2.15, Math.sin(a) * 0.35 - 0.2, {
        parent: g,
        rotZ: Math.cos(a) * 0.35,
        rotX: Math.sin(a) * 0.25,
        castShadow: false,
      });
    }
    mesh(new THREE.SphereGeometry(0.18, 8, 8), mats.gold, 0, GY + 1.35, 0.05, {
      parent: g,
      castShadow: false,
    });
    mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.12, 8), mats.mossLit, 0, GY + 0.35, 0.25, {
      parent: g,
      castShadow: false,
    });
    addBlk(-12.0, -12.0, 0.95);
  }

  // ── void_rift (18.5, -26.5) — glowing crack, walkable ─────────────
  {
    const g = groupAt(18.5, -26.5, 'lm-void_rift');
    // jagged rim stones (low, not blocking)
    mesh(new THREE.BoxGeometry(1.8, 0.22, 0.35), mats.darkStone, 0.2, GY + 0.08, -0.4, {
      parent: g,
      rotY: 0.4,
      castShadow: false,
    });
    mesh(new THREE.BoxGeometry(1.4, 0.18, 0.3), mats.stone, -0.35, GY + 0.06, 0.45, {
      parent: g,
      rotY: -0.55,
      castShadow: false,
    });
    const crack = mesh(new THREE.PlaneGeometry(2.4, 0.55), riftGlow, 0, GY + 0.12, 0, {
      parent: g,
      rotX: -Math.PI / 2,
      rotZ: 0.65,
      castShadow: false,
      receiveShadow: false,
    });
    const core = mesh(new THREE.PlaneGeometry(1.5, 0.22), riftCore, 0, GY + 0.14, 0, {
      parent: g,
      rotX: -Math.PI / 2,
      rotZ: 0.65,
      castShadow: false,
      receiveShadow: false,
    });
    // vertical veil (thin, offset so path east stays clear)
    const veil = mesh(new THREE.PlaneGeometry(1.1, 1.6), riftGlow, 0.15, GY + 0.95, -0.1, {
      parent: g,
      rotY: 0.9,
      castShadow: false,
      receiveShadow: false,
    });
    const pl = new THREE.PointLight(0x6699ff, 0.35, 7);
    pl.position.set(0, GY + 0.8, 0);
    g.add(pl);
    anims.push({ mesh: crack, kind: 'pulseOp', base: 0.42, phase: 0.2 });
    anims.push({ mesh: core, kind: 'pulseOp', base: 0.55, phase: 1.1 });
    anims.push({ mesh: veil, kind: 'pulseOp', base: 0.28, phase: 2.0 });
    // no blocker — must not trap player
  }

  // ── Interactive lantern posts (distinct from path lanterns) ───────
  function makeLantern(id, x, z, tint) {
    const g = groupAt(x, z, 'lm-' + id);
    mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.4, 7), mats.weatheredWood, 0, GY + 1.2, 0, { parent: g });
    mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.12, 8), mats.darkStone, 0, GY + 0.12, 0, {
      parent: g,
      castShadow: false,
    });
    mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), mats.tealStone, 0, GY + 2.45, 0, { parent: g });
    // cage
    mesh(new THREE.BoxGeometry(0.42, 0.5, 0.08), mats.gold, 0, GY + 2.75, 0.2, {
      parent: g,
      castShadow: false,
    });
    mesh(new THREE.BoxGeometry(0.42, 0.5, 0.08), mats.gold, 0, GY + 2.75, -0.2, {
      parent: g,
      castShadow: false,
    });
    mesh(new THREE.BoxGeometry(0.08, 0.5, 0.42), mats.gold, 0.2, GY + 2.75, 0, {
      parent: g,
      castShadow: false,
    });
    mesh(new THREE.BoxGeometry(0.08, 0.5, 0.42), mats.gold, -0.2, GY + 2.75, 0, {
      parent: g,
      castShadow: false,
    });
    const flame = mesh(new THREE.SphereGeometry(0.14, 6, 6), flameMat.clone(), 0, GY + 2.7, 0, {
      parent: g,
      castShadow: false,
    });
    flame.material.emissiveIntensity = 0.12;
    const pl = new THREE.PointLight(tint, 0.12, 6);
    pl.position.set(0, GY + 2.7, 0);
    g.add(pl);
    litMap.set(id, { group: g, light: pl, flame, lit: false });
    anims.push({ mesh: flame, kind: 'flicker', phase: Math.random() * 6 });
    addBlk(x, z, 0.45);
  }
  makeLantern('lantern_harbor', 7.2, 22.8, 0xffc090);
  makeLantern('lantern_court', 15.5, -5.5, 0xffd0a0);
  makeLantern('lantern_summit', -13.5, -17.5, 0xffe0b0);

  // ── stele fragments ───────────────────────────────────────────────
  function steleFrag(id, x, z, rotY) {
    const g = groupAt(x, z, 'lm-' + id);
    mesh(new THREE.BoxGeometry(0.55, 0.95, 0.16), mats.rubble, 0, GY + 0.48, 0, {
      parent: g,
      rotY,
      rotZ: 0.18,
    });
    mesh(new THREE.BoxGeometry(0.35, 0.4, 0.12), mats.darkStone, 0.2, GY + 0.22, 0.15, {
      parent: g,
      rotY: rotY + 0.4,
      rotX: 0.5,
    });
    mesh(new THREE.BoxGeometry(0.2, 0.08, 0.35), mats.gold, 0, GY + 0.72, 0.02, {
      parent: g,
      rotY,
      castShadow: false,
    });
    addBlk(x, z, 0.4);
  }
  steleFrag('stele_frag_a', -6.0, -4.8, 0.3);
  steleFrag('stele_frag_b', -10.5, -0.8, -0.5);
  steleFrag('stele_frag_c', -5.2, -0.5, 0.9);

  // ── fog_echo (-5.2, 10.2) — hollow echo stone ─────────────────────
  {
    const g = groupAt(-5.2, 10.2, 'lm-fog_echo');
    mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.8, 8), mats.tealStone, 0, GY + 0.9, 0, { parent: g });
    mesh(new THREE.TorusGeometry(0.42, 0.08, 5, 12), mats.gold, 0, GY + 1.55, 0.35, {
      parent: g,
      castShadow: false,
    });
    mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.35, 8), mats.darkStone, 0, GY + 1.95, 0, {
      parent: g,
      castShadow: false,
    });
    const ring = mesh(new THREE.TorusGeometry(0.7, 0.04, 4, 16), riftGlow, 0, GY + 1.1, 0, {
      parent: g,
      rotX: Math.PI / 2,
      castShadow: false,
      receiveShadow: false,
    });
    anims.push({ mesh: ring, kind: 'spinY', phase: 0 });
    addBlk(-5.2, 10.2, 0.7);
  }

  // ── echo_range (5.2, 9.6) — ranging stake ─────────────────────────
  {
    const g = groupAt(5.2, 9.6, 'lm-echo_range');
    mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.2, 6), mats.stone, 0, GY + 1.1, 0, { parent: g });
    mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), mats.darkStone, 0, GY + 0.1, 0, {
      parent: g,
      castShadow: false,
    });
    for (let i = 0; i < 3; i++) {
      mesh(new THREE.TorusGeometry(0.28 + i * 0.12, 0.03, 4, 12), mats.gold, 0, GY + 1.4 + i * 0.25, 0, {
        parent: g,
        rotX: Math.PI / 2,
        castShadow: false,
      });
    }
    addBlk(5.2, 9.6, 0.4);
  }

  // ── silent_sit (-1.8, -7.2) — stone seat / cushion ────────────────
  {
    const g = groupAt(-1.8, -7.2, 'lm-silent_sit');
    mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.35, 10), mats.stone, 0, GY + 0.18, 0, {
      parent: g,
      castShadow: false,
    });
    mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.14, 10), mats.mossLit, 0, GY + 0.4, 0, {
      parent: g,
      castShadow: false,
    });
    mesh(new THREE.BoxGeometry(0.15, 0.7, 0.5), mats.darkStone, -0.55, GY + 0.55, -0.15, {
      parent: g,
      rotY: 0.3,
    });
    addBlk(-1.8, -7.2, 0.65);
  }

  // ── tide_step (15.2, 21.5) — tidal stone steps ────────────────────
  {
    const g = groupAt(15.2, 21.5, 'lm-tide_step');
    for (let i = 0; i < 4; i++) {
      mesh(
        new THREE.BoxGeometry(1.6 - i * 0.15, 0.18, 0.7),
        i % 2 ? mats.tealStone : mats.stone,
        0,
        GY + 0.1 + i * 0.16,
        -i * 0.45,
        { parent: g, castShadow: false }
      );
    }
    mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.5, 6), mats.moss, 0.7, GY + 0.3, 0.3, {
      parent: g,
      castShadow: false,
    });
    const wash = mesh(new THREE.PlaneGeometry(1.8, 1.2), riftGlow.clone(), 0, GY + 0.08, 0.2, {
      parent: g,
      rotX: -Math.PI / 2,
      castShadow: false,
      receiveShadow: false,
    });
    wash.material.color.setHex(0x66c8d8);
    wash.material.opacity = 0.18;
    anims.push({ mesh: wash, kind: 'pulseOp', base: 0.18, phase: 3.3 });
    addBlk(15.2, 21.5, 0.55);
  }

  // ── 苔径回廊 colonnade (east, x≈16–20, z≈-6..6) ──────────────────
  {
    const arcade = new THREE.Group();
    arcade.name = 'lm-mosswalk';
    root.add(arcade);

    // floor strip
    mesh(new THREE.BoxGeometry(5.5, 0.14, 14), mats.moss, 17.2, 0.88, 1.0, {
      parent: arcade,
      castShadow: false,
    });
    mesh(new THREE.BoxGeometry(3.2, 0.1, 12), mats.tile, 17.2, 0.94, 1.0, {
      parent: arcade,
      castShadow: false,
    });

    const pillarGeo = new THREE.CylinderGeometry(0.32, 0.38, 3.2, 7);
    const capGeo = new THREE.BoxGeometry(0.7, 0.18, 0.7);
    const zs = [-5.5, -2.5, 0.5, 3.5, 6.5];
    for (let i = 0; i < zs.length; i++) {
      const z = zs[i];
      // west + east pillar pair
      for (const dx of [-1.6, 1.6]) {
        mesh(pillarGeo, i % 2 ? mats.moss : mats.tealStone, 17.2 + dx, 0.95 + 1.6, z, {
          parent: arcade,
        });
        mesh(capGeo, mats.darkStone, 17.2 + dx, 0.95 + 3.25, z, {
          parent: arcade,
          castShadow: false,
        });
        // moss vine strip
        mesh(new THREE.BoxGeometry(0.12, 1.4, 0.08), mats.mossLit, 17.2 + dx + 0.28, 1.8, z, {
          parent: arcade,
          castShadow: false,
        });
        addBlk(17.2 + dx, z, 0.48);
      }
      // arch lintel
      mesh(new THREE.BoxGeometry(3.6, 0.28, 0.4), mats.stone, 17.2, 0.95 + 3.45, z, {
        parent: arcade,
      });
      // soft arch glow plane
      if (i % 2 === 0) {
        const arch = mesh(
          new THREE.PlaneGeometry(2.4, 2.2),
          riftGlow.clone(),
          17.2,
          2.2,
          z,
          { parent: arcade, castShadow: false, receiveShadow: false }
        );
        arch.material.color.setHex(0x70c8a8);
        arch.material.opacity = 0.12;
        anims.push({ mesh: arch, kind: 'pulseOp', base: 0.12, phase: i * 0.7 });
      }
    }

    // warm / teal fog points along corridor
    const fogN = 36;
    const fogGeo = new THREE.BufferGeometry();
    const fogPos = new Float32Array(fogN * 3);
    const fogPhase = new Float32Array(fogN);
    for (let i = 0; i < fogN; i++) {
      fogPos[i * 3] = 15.5 + Math.random() * 4.5;
      fogPos[i * 3 + 1] = 1.0 + Math.random() * 1.8;
      fogPos[i * 3 + 2] = -6 + Math.random() * 13;
      fogPhase[i] = Math.random() * Math.PI * 2;
    }
    fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPos, 3));
    const fogPts = new THREE.Points(fogGeo, mossMist);
    fogPts.name = 'mosswalk-mist';
    arcade.add(fogPts);
    anims.push({ mesh: fogPts, kind: 'mist', phase: 0, _phases: fogPhase, _count: fogN });

    // one soft teal fill (budget +1)
    const walkLight = new THREE.PointLight(0x88d0b0, 0.4, 10);
    walkLight.position.set(17.2, 2.8, 1.0);
    arcade.add(walkLight);

    // entrance markers
    mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), mats.amberStone, 14.8, 1.9, -6.8, {
      parent: arcade,
      rotY: 0.2,
    });
    mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), mats.amberStone, 14.8, 1.9, 7.2, {
      parent: arcade,
      rotY: -0.15,
    });
    addBlk(14.8, -6.8, 0.55);
    addBlk(14.8, 7.2, 0.55);
  }

  /**
   * Boost lantern emissive / light when player lights it.
   * @param {string} id
   * @param {boolean} on
   */
  function setLit(id, on) {
    const rec = litMap.get(id);
    if (!rec) return;
    rec.lit = !!on;
    if (rec.light) rec.light.intensity = on ? 1.15 : 0.12;
    if (rec.flame?.material) {
      rec.flame.material.emissiveIntensity = on ? 0.85 : 0.12;
      rec.flame.material.opacity = on ? 1.0 : 0.7;
    }
  }

  /**
   * @param {number} t
   * @param {number} dt
   */
  function update(t, dt) {
    if (reduceMotion) return;
    for (const a of anims) {
      if (a.kind === 'sway') {
        a.mesh.rotation.z = Math.sin(t * 1.2 + (a.phase || 0)) * 0.06;
      } else if (a.kind === 'pulseOp' && a.mesh.material) {
        const base = a.base ?? 0.3;
        a.mesh.material.opacity = base * (0.75 + 0.35 * Math.sin(t * 1.6 + (a.phase || 0)));
      } else if (a.kind === 'spinY') {
        a.mesh.rotation.z = t * 0.4;
      } else if (a.kind === 'flicker' && a.mesh.material) {
        const rec = [...litMap.values()].find((r) => r.flame === a.mesh);
        if (rec?.lit) {
          a.mesh.material.emissiveIntensity = 0.7 + Math.sin(t * 9 + (a.phase || 0)) * 0.2;
          a.mesh.scale.setScalar(0.95 + Math.sin(t * 11 + (a.phase || 0)) * 0.08);
        }
      } else if (a.kind === 'mist' && a.mesh.geometry) {
        const arr = a.mesh.geometry.attributes.position.array;
        const ph = a._phases;
        const n = a._count || 0;
        for (let i = 0; i < n; i++) {
          arr[i * 3 + 1] = 1.05 + Math.sin(t * 0.35 + ph[i]) * 0.25 + ph[i] * 0.02;
        }
        a.mesh.geometry.attributes.position.needsUpdate = true;
      }
    }
    // unused dt kept for API symmetry
    void dt;
  }

  return { update, blockers, setLit, root };
}
