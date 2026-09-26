/**
 * 星尘遗迹 — soft fog-gate between 晨雾港湾 and 残碑庭院.
 * Opens after 3 shards. createGate(THREE, scene, opts?) — no three import.
 *
 * Blocker sits on the south→center path (~z=11). While closed, player is
 * gently pushed back; setOpen(true) collapses blocker radius to 0 and
 * fades the veil.
 */

const DEFAULT = {
  x: 0,
  z: 11,
  /** Horizontal half-width of the veil (world units). */
  width: 5.2,
  /** Closed blocker radius — soft cylinder in the path center. */
  closedRadius: 3.4,
  openRadius: 0,
  /** Optional scene / blocker identity (second gate etc.). */
  name: 'soft-gate',
  tag: 'soft-gate',
};

/**
 * @param {typeof import('three')} THREE
 * @param {import('three').Scene} scene
 * @param {{ x?: number, z?: number, width?: number, closedRadius?: number, openRadius?: number }} [opts]
 */
export function createGate(THREE, scene, opts = {}) {
  const cfg = { ...DEFAULT, ...opts };

  const root = new THREE.Group();
  root.name = cfg.name || 'soft-gate';
  root.position.set(cfg.x, 0, cfg.z);
  scene.add(root);

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x3a4555,
    roughness: 0.78,
    metalness: 0.08,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf0d48a,
    roughness: 0.38,
    metalness: 0.55,
    emissive: 0x554010,
    emissiveIntensity: 0.3,
  });
  const tealMat = new THREE.MeshStandardMaterial({
    color: 0x5a8a92,
    roughness: 0.65,
    metalness: 0.15,
    emissive: 0x163840,
    emissiveIntensity: 0.25,
  });

  // Twin pillars flanking the path
  const halfW = cfg.width * 0.5;
  function pillar(side) {
    const g = new THREE.Group();
    g.position.x = side * halfW;

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.42, 4.2, 8),
      darkMat
    );
    shaft.position.y = 2.3;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    g.add(shaft);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.6, 0.35, 8),
      darkMat
    );
    base.position.y = 0.95;
    base.castShadow = true;
    g.add(base);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.45, 0.28, 8),
      tealMat
    );
    cap.position.y = 4.5;
    cap.castShadow = true;
    g.add(cap);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      goldMat
    );
    orb.position.y = 4.85;
    orb.castShadow = false;
    g.add(orb);

    const pl = new THREE.PointLight(0x88dde8, 0.7, 8);
    pl.position.y = 4.85;
    g.add(pl);

    root.add(g);
    return { g, orb, pl };
  }

  const left = pillar(-1);
  const right = pillar(1);

  // Soft energy veil (double-sided translucent plane)
  const veilMat = new THREE.MeshBasicMaterial({
    color: 0x66ccee,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const veil = new THREE.Mesh(
    new THREE.PlaneGeometry(cfg.width - 0.6, 3.6),
    veilMat
  );
  veil.position.y = 2.6;
  root.add(veil);

  // Secondary mist sheet slightly offset
  const mistMat = new THREE.MeshBasicMaterial({
    color: 0xa8e8ff,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mist = new THREE.Mesh(
    new THREE.PlaneGeometry(cfg.width - 0.2, 3.2),
    mistMat
  );
  mist.position.set(0, 2.5, 0.15);
  root.add(mist);

  // Lintels / arch hint
  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width + 0.4, 0.28, 0.4),
    darkMat
  );
  lintel.position.y = 4.55;
  lintel.castShadow = true;
  root.add(lintel);

  const goldBand = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.width - 0.4, 0.06, 0.12),
    goldMat
  );
  goldBand.position.set(0, 4.35, 0.22);
  root.add(goldBand);

  // Floating rune rings in the veil
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf0d48a,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.035, 8, 40), ringMat);
  ring.position.y = 2.6;
  root.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 8, 32), ringMat.clone());
  ring2.position.y = 2.6;
  ring2.rotation.x = Math.PI / 5;
  root.add(ring2);

  const veilLight = new THREE.PointLight(0x66ccee, 1.1, 14);
  veilLight.position.set(0, 2.8, 0);
  root.add(veilLight);

  /** Mutable blocker shared with player collision (same object reference). */
  const blocker = {
    x: cfg.x,
    z: cfg.z,
    r: cfg.closedRadius,
    /** Tag so other systems can identify the gate blocker. */
    tag: cfg.tag || cfg.name || 'soft-gate',
  };

  let open = false;
  /** Target opacity for veil when closed / open. */
  const CLOSED_OPACITY = 0.42;
  const OPEN_OPACITY = 0.02;
  let veilOpacity = CLOSED_OPACITY;

  /**
   * Open or close the soft gate.
   * @param {boolean} bool
   */
  // Dedicated orb mats so setOpen never re-clones every call
  const leftOrbMat = goldMat.clone();
  const rightOrbMat = goldMat.clone();
  left.orb.material = leftOrbMat;
  right.orb.material = rightOrbMat;

  function setOpen(bool) {
    open = !!bool;
    blocker.r = open ? cfg.openRadius : cfg.closedRadius;
    const orbColor = open ? 0xf0d48a : 0x88dde8;
    const em = open ? 0x664410 : 0x0a3038;
    leftOrbMat.color.setHex(orbColor);
    rightOrbMat.color.setHex(orbColor);
    leftOrbMat.emissive.setHex(em);
    rightOrbMat.emissive.setHex(em);
    leftOrbMat.emissiveIntensity = open ? 0.55 : 0.35;
    rightOrbMat.emissiveIntensity = open ? 0.55 : 0.35;
    left.pl.color.setHex(open ? 0xf0d48a : 0x88dde8);
    right.pl.color.setHex(open ? 0xf0d48a : 0x88dde8);
  }

  function isOpen() {
    return open;
  }

  /** Current blocker radius (0 when open). */
  function getBlockerRadius() {
    return blocker.r;
  }

  /**
   * Animate veil / rings. Call every frame.
   * @param {number} t
   * @param {number} [dt]
   */
  function update(t, dt = 0.016) {
    const target = open ? OPEN_OPACITY : CLOSED_OPACITY;
    const k = 1 - Math.exp(-(dt || 0.016) * 3.5);
    veilOpacity += (target - veilOpacity) * k;
    veilMat.opacity = veilOpacity + (!open ? Math.sin(t * 2.4) * 0.04 : 0);
    mistMat.opacity = open ? 0.02 : 0.14 + Math.sin(t * 1.6) * 0.04;
    ringMat.opacity = open ? 0.08 : 0.28 + Math.sin(t * 3) * 0.08;
    if (ring2.material) {
      ring2.material.opacity = ringMat.opacity * 0.85;
    }

    ring.rotation.z = t * 0.6;
    ring2.rotation.z = -t * 0.85;
    ring.visible = veilOpacity > 0.05;
    ring2.visible = ring.visible;
    veil.visible = veilOpacity > 0.03;
    mist.visible = mistMat.opacity > 0.03;

    veilLight.intensity = open
      ? 0.25 + Math.sin(t * 1.5) * 0.05
      : 0.9 + Math.sin(t * 2.2) * 0.2;

    left.pl.intensity = 0.55 + Math.sin(t * 2 + 0.5) * 0.15;
    right.pl.intensity = 0.55 + Math.sin(t * 2 + 1.2) * 0.15;

    // Slight veil shimmer scale when closed
    if (!open) {
      const pulse = 1 + Math.sin(t * 1.8) * 0.03;
      veil.scale.set(pulse, pulse, 1);
    } else {
      veil.scale.set(1, 1, 1);
    }
  }

  // Start closed
  setOpen(false);

  return {
    root,
    /** Array with one mutable blocker — push into world.blockers. */
    blockers: [blocker],
    blocker,
    setOpen,
    isOpen,
    getBlockerRadius,
    update,
    /** Config snapshot for docs / debug. */
    config: { ...cfg },
  };
}
