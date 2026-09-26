/**
 * Collectible star-dust shard field — crystal octahedron + gold torus + point light.
 * @param {typeof import('three')} THREE
 * @param {import('three').Scene} scene
 * @param {import('three').Vector3[]} anchors  length 9
 */
export function createShardField(THREE, scene, anchors) {
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xa8e0ff,
    roughness: 0.15,
    metalness: 0.05,
    transmission: 0.55,
    transparent: true,
    opacity: 0.95,
    thickness: 0.6,
    emissive: 0x226688,
    emissiveIntensity: 0.55,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf0d48a,
    roughness: 0.35,
    metalness: 0.55,
    emissive: 0x664410,
    emissiveIntensity: 0.35,
  });

  const shards = [];

  anchors.forEach((anchor, i) => {
    const g = new THREE.Group();

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), crystalMat.clone());
    core.castShadow = true;
    g.add(core);

    // Inner sparkle facet
    const facet = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshBasicMaterial({
        color: 0xdff6ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    g.add(facet);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 8, 32), goldMat.clone());
    ring.rotation.x = Math.PI / 2;
    g.add(ring);

    // Secondary tilted ring for extra beauty
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 8, 28), goldMat.clone());
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.z = Math.PI / 5;
    g.add(ring2);

    const light = new THREE.PointLight(0x88e0ff, 1.2, 8);
    g.add(light);

    const baseY = anchor.y;
    g.position.copy(anchor);
    g.userData = {
      index: i,
      taken: false,
      bob: Math.random() * Math.PI * 2,
      baseY,
      core,
      ring,
      ring2,
      light,
    };
    scene.add(g);
    shards.push(g);
  });

  /**
   * Bob + rotate living shards.
   * @param {number} t  elapsed seconds
   */
  let _elapsed = 0;

  function update(t) {
    _elapsed = t;
    for (const s of shards) {
      if (s.userData.taken) continue;
      const pulsing =
        typeof s.userData.pulseUntil === 'number' && t < s.userData.pulseUntil;
      const bobAmp = pulsing ? 0.32 : 0.18;
      const spin = pulsing ? 2.4 : 1.2;
      s.rotation.y = t * spin + s.userData.bob;
      s.position.y = s.userData.baseY + Math.sin(t * 2 + s.userData.bob) * bobAmp;
      if (s.userData.ring2) {
        s.userData.ring2.rotation.y = t * (pulsing ? 1.8 : 0.9);
      }
      if (s.userData.light) {
        const base = pulsing ? 2.2 : 1.05;
        const wobble = pulsing ? 0.7 : 0.25;
        s.userData.light.intensity = base + Math.sin(t * 5 + s.userData.bob) * wobble;
      }
      if (pulsing && s.userData.core?.material) {
        s.userData.core.material.emissiveIntensity =
          0.9 + Math.sin(t * 6 + s.userData.bob) * 0.35;
      }
    }
  }

  /**
   * Briefly pulse an untaken shard as a directional hint.
   * @param {number} [index]  preferred index; falls back to first untaken
   * @param {number} [durationSec=7]
   * @returns {number|null} pulsed index or null
   */
  function pulseHint(index, durationSec = 7) {
    let target = null;
    if (typeof index === 'number' && shards[index] && !shards[index].userData.taken) {
      target = shards[index];
    } else {
      for (const s of shards) {
        if (!s.userData.taken) {
          target = s;
          break;
        }
      }
    }
    if (!target) return null;
    target.userData.pulseUntil = _elapsed + (durationSec || 7);
    return target.userData.index;
  }

  /**
   * Hide nearest untaken shard within radius.
   * @param {{x:number,y:number,z:number}} pos
   * @param {number} radius
   * @returns {number|null} shard index if taken, else null
   */
  function takeNearby(pos, radius) {
    let best = null;
    let bestDist = radius;
    for (const s of shards) {
      if (s.userData.taken) continue;
      const d = s.position.distanceTo(pos);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    if (!best) return null;
    best.userData.taken = true;
    best.visible = false;
    if (best.userData.light) best.userData.light.intensity = 0;
    return best.userData.index;
  }

  /**
   * Nearest untaken shard relative to a world xz position (no precise coords leaked).
   * @param {{x:number,z:number}} pos
   * @returns {{ index: number, dx: number, dz: number, dist: number } | null}
   */
  function nearestUntaken(pos) {
    if (!pos) return null;
    let best = null;
    let bestD = Infinity;
    for (const s of shards) {
      if (s.userData.taken) continue;
      const dx = s.position.x - pos.x;
      const dz = s.position.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d < bestD) {
        bestD = d;
        best = { index: s.userData.index, dx, dz, dist: d };
      }
    }
    return best;
  }

  return { shards, update, takeNearby, pulseHint, nearestUntaken };
}
