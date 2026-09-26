/**
 * 星尘遗迹 — lore tablets (Chinese inscriptions near each zone)
 * Original IP-free fiction. createLore(THREE, scene) — no three import.
 */

const READ_RADIUS = 2.6;
/** Cooldown (seconds) before the same tablet can re-trigger tryRead text. */
const REREAD_COOLDOWN = 8;

/**
 * @param {typeof import('three')} THREE
 * @param {import('three').Scene} scene
 */
export function createLore(THREE, scene) {
  const root = new THREE.Group();
  root.name = 'lore-tablets';
  scene.add(root);

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x5a6574,
    roughness: 0.82,
    metalness: 0.06,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x3a4250,
    roughness: 0.88,
    metalness: 0.04,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf0d48a,
    roughness: 0.4,
    metalness: 0.5,
    emissive: 0x554010,
    emissiveIntensity: 0.4,
  });
  const glyphMat = new THREE.MeshBasicMaterial({
    color: 0x88dde8,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  /** @type {Array<{
   *   id: string,
   *   zone: string,
   *   title: string,
   *   body: string,
   *   group: import('three').Group,
   *   light: import('three').PointLight,
   *   glyph: import('three').Mesh,
   *   read: boolean,
   *   lastReadAt: number,
   * }>} */
  const tablets = [];
  /** Soft collision discs so players don't clip through slabs. */
  const blockers = [];

  const DEFINITIONS = [
    {
      id: 'harbor-tablet',
      zone: '晨雾港湾',
      title: '港湾铭石',
      x: -11.5,
      y: 0.9,
      z: 19.5,
      rotY: 0.55,
      body:
        '【港湾铭石】\n' +
        '晨雾未曾散尽的年代，渡船靠岸于此。\n' +
        '水手说：潮声里藏着星屑的叹息，\n' +
        '拾起第一枚碎片的人，会听见遗迹苏醒。\n' +
        '—— 往北走，残碑庭院在等你。',
    },
    {
      id: 'courtyard-tablet',
      zone: '残碑庭院',
      title: '庭院残碑',
      x: -8.2,
      y: 0.95,
      z: -2.5,
      rotY: -0.35,
      body:
        '【庭院残碑】\n' +
        '石纹记着九道裂痕，对应九枚星尘。\n' +
        '中心拱门曾通向群星之外的航线，\n' +
        '如今只剩淡蓝微光，等待完整的共鸣。\n' +
        '—— 再北上，星井高台俯瞰全岛。',
    },
    {
      id: 'summit-tablet',
      zone: '星井高台',
      title: '星井碑记',
      x: 7.5,
      y: 2.55,
      z: -21.5,
      rotY: -0.6,
      body:
        '【星井碑记】\n' +
        '井非掘地，乃承天之隙。\n' +
        '当九枚星尘归位，井口会映出归途的航标。\n' +
        '遗迹从不驱逐旅人——它只记住脚步。\n' +
        '—— 你已站在故事的顶点。',
    },
    {
      id: 'gate-tablet',
      zone: '雾廊断桥',
      title: '雾廊短笺',
      x: 4.0,
      y: 0.95,
      z: 12.4,
      rotY: 0.15,
      body:
        '【雾廊短笺】\n' +
        '三枚星尘可启雾障。\n' +
        '障非石墙，乃遗忘织成的纱——\n' +
        '集齐港湾的碎片，纱便自行退开。\n' +
        '—— 莫强闯；遗迹喜欢耐心的人。',
    },
  ];

  function buildTablet(def) {
    const g = new THREE.Group();
    g.name = def.id;
    g.position.set(def.x, def.y, def.z);
    g.rotation.y = def.rotY ?? 0;

    // Slanted slab
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 1.85, 0.22),
      stoneMat
    );
    slab.position.y = 0.95;
    slab.castShadow = true;
    slab.receiveShadow = true;
    g.add(slab);

    // Base plinth
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.28, 0.7),
      darkMat
    );
    base.position.y = 0.14;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);

    // Cap
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.12, 0.35),
      darkMat
    );
    cap.position.y = 1.92;
    cap.castShadow = true;
    g.add(cap);

    // Gold edge trim
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.04, 0.04),
      goldMat
    );
    trim.position.set(0, 1.55, 0.12);
    g.add(trim);

    // Soft glyph glow on face
    const glyph = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 1.1),
      glyphMat.clone()
    );
    glyph.position.set(0, 0.95, 0.13);
    g.add(glyph);

    const light = new THREE.PointLight(0x88dde8, 0.55, 6);
    light.position.set(0, 1.2, 0.4);
    g.add(light);

    root.add(g);
    blockers.push({ x: def.x, z: def.z, r: 0.75, tag: 'lore-' + def.id });

    const entry = {
      id: def.id,
      zone: def.zone,
      title: def.title,
      body: def.body,
      group: g,
      light,
      glyph,
      read: false,
      lastReadAt: -Infinity,
      phase: Math.random() * Math.PI * 2,
    };
    tablets.push(entry);
    return entry;
  }

  DEFINITIONS.forEach(buildTablet);

  let elapsed = 0;

  /**
   * Idle bob / pulse for unread tablets.
   * @param {number} t  elapsed seconds
   * @param {number} [dt]
   */
  function update(t, dt = 0) {
    elapsed = t;
    for (const tab of tablets) {
      const pulse = 0.45 + Math.sin(t * 2.1 + tab.phase) * 0.2;
      tab.light.intensity = tab.read ? 0.28 : pulse;
      if (tab.glyph.material) {
        tab.glyph.material.opacity = tab.read
          ? 0.28
          : 0.4 + Math.sin(t * 1.7 + tab.phase) * 0.2;
      }
      // Subtle float on unread
      const baseY = DEFINITIONS.find((d) => d.id === tab.id)?.y ?? 0.9;
      tab.group.position.y =
        baseY + (tab.read ? 0 : Math.sin(t * 1.4 + tab.phase) * 0.03);
    }
  }

  /**
   * If player is near an unread (or re-readable) tablet, mark it read and
   * return Chinese inscription text; otherwise null.
   * @param {{x:number,y?:number,z:number}|import('three').Vector3} playerPos
   * @returns {string|null}
   */
  function tryRead(playerPos) {
    if (!playerPos) return null;
    const px = playerPos.x;
    const pz = playerPos.z;

    let best = null;
    let bestD = READ_RADIUS;

    for (const tab of tablets) {
      const dx = tab.group.position.x - px;
      const dz = tab.group.position.z - pz;
      const d = Math.hypot(dx, dz);
      if (d < bestD) {
        bestD = d;
        best = tab;
      }
    }

    if (!best) return null;

    const canReread =
      best.read && elapsed - best.lastReadAt >= REREAD_COOLDOWN;
    if (best.read && !canReread) return null;

    best.read = true;
    best.lastReadAt = elapsed;
    // Warm the gold trim glow via light color shift
    best.light.color.setHex(0xf0d48a);
    return best.body;
  }

  /**
   * Nearby tablet title for HUD prompt, or null.
   * @param {{x:number,z:number}} playerPos
   * @returns {string|null}
   */
  function nearbyPrompt(playerPos) {
    if (!playerPos) return null;
    for (const tab of tablets) {
      const d = Math.hypot(
        tab.group.position.x - playerPos.x,
        tab.group.position.z - playerPos.z
      );
      if (d < READ_RADIUS) {
        return tab.read
          ? `再读「${tab.title}」…`
          : `靠近铭文：「${tab.title}」`;
      }
    }
    return null;
  }

  function getReadIds() {
    return tablets.filter((t) => t.read).map((t) => t.id);
  }

  function resetReads() {
    for (const tab of tablets) {
      tab.read = false;
      tab.lastReadAt = -Infinity;
      tab.light.color.setHex(0x88dde8);
    }
  }

  /**
   * Restore read state from save flags / ids.
   * @param {Iterable<string>} ids
   */
  function applyReadIds(ids) {
    const set = new Set(ids || []);
    for (const tab of tablets) {
      if (set.has(tab.id)) {
        tab.read = true;
        tab.light.color.setHex(0xf0d48a);
      } else {
        tab.read = false;
        tab.lastReadAt = -Infinity;
        tab.light.color.setHex(0x88dde8);
      }
    }
  }

  return {
    root,
    tablets,
    blockers,
    update,
    tryRead,
    nearbyPrompt,
    getReadIds,
    resetReads,
    applyReadIds,
    READ_RADIUS,
  };
}
