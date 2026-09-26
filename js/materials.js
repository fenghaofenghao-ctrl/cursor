/**
 * Shared ACES-friendly materials for 星尘遗迹 / Aether Ruins
 * Factory takes THREE so modules stay free of direct three imports.
 * Keep emissive/opacity modest — scene uses ACESFilmicToneMapping.
 */
export function createMaterials(THREE) {
  const stone = new THREE.MeshStandardMaterial({
    color: 0x7d8796,
    roughness: 0.74,
    metalness: 0.08,
    emissive: 0x101418,
    emissiveIntensity: 0.08,
  });

  const darkStone = new THREE.MeshStandardMaterial({
    color: 0x3e4654,
    roughness: 0.82,
    metalness: 0.06,
    emissive: 0x080a10,
    emissiveIntensity: 0.06,
  });

  const moss = new THREE.MeshStandardMaterial({
    color: 0x3a634c,
    roughness: 0.96,
    metalness: 0.0,
    emissive: 0x0a2214,
    emissiveIntensity: 0.12,
  });

  /** Soft moss highlight patches (lantern-adjacent / ruin edges) */
  const mossLit = new THREE.MeshStandardMaterial({
    color: 0x4a7a5c,
    roughness: 0.88,
    metalness: 0.02,
    emissive: 0x1a4030,
    emissiveIntensity: 0.22,
  });

  const tealStone = new THREE.MeshStandardMaterial({
    color: 0x5a7a82,
    roughness: 0.68,
    metalness: 0.14,
    emissive: 0x0a2030,
    emissiveIntensity: 0.1,
  });

  const warmStone = new THREE.MeshStandardMaterial({
    color: 0x8a7a68,
    roughness: 0.74,
    metalness: 0.1,
    emissive: 0x201808,
    emissiveIntensity: 0.1,
  });

  /** Amber gate / star-well masonry */
  const amberStone = new THREE.MeshStandardMaterial({
    color: 0x9a8060,
    roughness: 0.7,
    metalness: 0.12,
    emissive: 0x3a2810,
    emissiveIntensity: 0.18,
  });

  const gold = new THREE.MeshStandardMaterial({
    color: 0xf0d48a,
    roughness: 0.35,
    metalness: 0.55,
    emissive: 0x664410,
    emissiveIntensity: 0.32,
  });

  const wood = new THREE.MeshStandardMaterial({
    color: 0x3a2a1c,
    roughness: 1.0,
    metalness: 0.0,
  });

  const weatheredWood = new THREE.MeshStandardMaterial({
    color: 0x4a3828,
    roughness: 0.95,
    metalness: 0.0,
    emissive: 0x0a0804,
    emissiveIntensity: 0.05,
  });

  const foliage = new THREE.MeshStandardMaterial({
    color: 0x2f5a44,
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0x061810,
    emissiveIntensity: 0.08,
  });

  /** Deep outer water — cool teal bias, ACES-safe metal */
  const water = new THREE.MeshStandardMaterial({
    color: 0x164868,
    roughness: 0.16,
    metalness: 0.62,
    transparent: true,
    opacity: 0.78,
    emissive: 0x041828,
    emissiveIntensity: 0.15,
  });

  /** Island-edge shallow ring */
  const shallowWater = new THREE.MeshStandardMaterial({
    color: 0x3a7a8a,
    roughness: 0.22,
    metalness: 0.45,
    transparent: true,
    opacity: 0.42,
    emissive: 0x0a3040,
    emissiveIntensity: 0.12,
    depthWrite: false,
  });

  /** Courtyard / plaza tile inlays */
  const tile = new THREE.MeshStandardMaterial({
    color: 0x6a7484,
    roughness: 0.55,
    metalness: 0.18,
    emissive: 0x121820,
    emissiveIntensity: 0.1,
  });

  /** Broken rubble / stele faces */
  const rubble = new THREE.MeshStandardMaterial({
    color: 0x6a6e78,
    roughness: 0.88,
    metalness: 0.04,
    emissive: 0x0c0e12,
    emissiveIntensity: 0.06,
  });

  /** Portal plane — inner core (modulated by setPortalPower) */
  const portalGlow = new THREE.MeshBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  /** Portal outer soft halo */
  const portalHaloMat = new THREE.MeshBasicMaterial({
    color: 0x4488cc,
    transparent: true,
    opacity: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  /** Thin gold ring / filigree additive accent */
  const portalRing = new THREE.MeshBasicMaterial({
    color: 0xffe2a0,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const firefly = new THREE.PointsMaterial({
    color: 0xc8f0ff,
    size: 0.08,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const mist = new THREE.PointsMaterial({
    color: 0xa8c8e0,
    size: 0.55,
    transparent: true,
    opacity: 0.12,
    blending: THREE.NormalBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const stars = new THREE.PointsMaterial({
    color: 0xd8e8ff,
    size: 0.12,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const portalDust = new THREE.PointsMaterial({
    color: 0xa0e8ff,
    size: 0.06,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  // Layer 8: courtyard falling leaves + starwell steam
  const leaves = new THREE.PointsMaterial({
    color: 0xe8a868,
    size: 0.11,
    transparent: true,
    opacity: 0.72,
    blending: THREE.NormalBlending,
    depthWrite: false,
    sizeAttenuation: true,
    vertexColors: true,
  });

  const steam = new THREE.PointsMaterial({
    color: 0xd8c8b0,
    size: 0.42,
    transparent: true,
    opacity: 0.1,
    blending: THREE.NormalBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return {
    stone,
    darkStone,
    moss,
    mossLit,
    tealStone,
    warmStone,
    amberStone,
    gold,
    wood,
    weatheredWood,
    foliage,
    water,
    shallowWater,
    tile,
    rubble,
    portalGlow,
    portalHaloMat,
    portalRing,
    firefly,
    mist,
    stars,
    portalDust,
    leaves,
    steam,
  };
}
