/**
 * E-key interaction points for 星尘遗迹.
 * Pure logic + proximity; optional loreId hooks into createLore tablets.
 */

/**
 * @typedef {{
 *   id: string,
 *   x: number,
 *   z: number,
 *   r?: number,
 *   label: string,
 *   once?: boolean,
 *   loreId?: string,
 *   requires?: {
 *     collected?: number,
 *     flags?: string[],
 *     allFlags?: string[],
 *   },
 * }} InteractPoint
 */

/** Default interactables near existing zone geometry (no new world meshes). */
export const DEFAULT_INTERACTS = [
  {
    id: 'harbor_stele',
    x: -11.5,
    z: 19.5,
    r: 2.6,
    label: '阅读港湾铭石',
    once: true,
    loreId: 'harbor-tablet',
  },
  {
    id: 'courtyard_stele',
    x: -8.2,
    z: -2.5,
    r: 2.6,
    label: '解读庭院残碑',
    once: true,
    loreId: 'courtyard-tablet',
    requires: { collected: 3 },
  },
  {
    id: 'tide_step',
    x: 15.2,
    z: 21.5,
    r: 2.5,
    label: '倾听潮汐石阶',
    once: true,
    optional: true,
  },
  {
    id: 'stele_frag_a',
    x: -6.0,
    z: -4.8,
    r: 2.2,
    label: '触碰残碑碎片（一）',
    once: true,
    requires: { flags: ['courtyard_stele'] },
  },
  {
    id: 'stele_frag_b',
    x: -10.5,
    z: -0.8,
    r: 2.2,
    label: '触碰残碑碎片（二）',
    once: true,
    requires: { flags: ['courtyard_stele'] },
  },
  {
    id: 'stele_frag_c',
    x: -5.2,
    z: -0.5,
    r: 2.2,
    label: '触碰残碑碎片（三）',
    once: true,
    requires: { flags: ['courtyard_stele'] },
  },
  {
    id: 'fog_echo',
    x: -5.2,
    z: 10.2,
    r: 2.4,
    label: '聆听雾廊回音石',
    once: true,
    optional: true,
    requires: { collected: 3, flags: ['harbor_stele'] },
  },
  {
    id: 'sunk_bell',
    x: 13.5,
    z: 7.0,
    r: 2.5,
    label: '敲响沉钟',
    once: true,
    optional: true,
    requires: { collected: 6, flags: ['courtyard_stele'] },
  },
  {
    id: 'silver_shrine',
    x: -12.0,
    z: -12.0,
    r: 2.5,
    label: '银叶神龛献祭',
    once: true,
    optional: true,
    requires: { collected: 6, flags: ['courtyard_stele'] },
  },
  {
    id: 'void_rift',
    x: 18.5,
    z: -26.5,
    r: 2.6,
    label: '凝视虚空裂隙',
    once: true,
    optional: true,
  },
  {
    id: 'lantern_harbor',
    x: 7.2,
    z: 22.8,
    r: 2.3,
    label: '点亮港湾提灯',
    once: true,
    optional: true,
  },
  {
    id: 'lantern_court',
    x: 15.5,
    z: -5.5,
    r: 2.3,
    label: '点亮庭院提灯',
    once: true,
    optional: true,
  },
  {
    id: 'lantern_summit',
    x: -13.5,
    z: -17.5,
    r: 2.3,
    label: '点亮高台提灯',
    once: true,
    optional: true,
  },
  {
    id: 'echo_range',
    x: 5.2,
    z: 9.6,
    r: 2.4,
    label: '回声测距',
    once: false,
    optional: true,
    requires: { collected: 3 },
  },
  {
    id: 'silent_sit',
    x: -1.8,
    z: -7.2,
    r: 2.5,
    label: '静听',
    once: true,
    optional: true,
  },
  {
    id: 'portal',
    x: 0,
    z: 0,
    r: 3.0,
    label: '点亮传送门',
    once: true,
    requires: {
      collected: 9,
    },
  },
];

/**
 * @param {{
 *   points?: InteractPoint[],
 *   getState: () => { collected: number, flags: Record<string, boolean>, won?: boolean },
 * }} opts
 */
export function createInteract({ points = DEFAULT_INTERACTS, getState }) {
  const list = points.map((p) => ({
    r: 2.5,
    once: true,
    ...p,
  }));

  function meetsRequires(p, st) {
    const req = p.requires;
    if (!req) return true;
    if (typeof req.collected === 'number' && st.collected < req.collected) return false;
    if (Array.isArray(req.flags)) {
      for (const f of req.flags) {
        if (!st.flags[f]) return false;
      }
    }
    if (Array.isArray(req.allFlags)) {
      for (const f of req.allFlags) {
        if (!st.flags[f]) return false;
      }
    }
    return true;
  }

  function isSpent(p, st) {
    if (p.id === 'portal') return !!st.won || !!st.flags.portal_lit;
    if (p.once && st.flags[p.id]) return true;
    return false;
  }

  function flagHint(f) {
    if (f === 'courtyard_stele') return '需先解读残碑庭院铭文';
    if (f === 'stele_join') return '需先拼合庭院残碑纹路';
    if (f === 'harbor_stele') return '需先阅读港湾石碑';
    if (f === 'sunk_bell') return '需先敲响沉钟';
    if (f === 'silver_shrine') return '需先完成银叶神龛献祭';
    if (f === 'fog_echo') return '需先聆听雾廊回音石';
    if (f === 'star_align') return '需先完成星井三踏印仪式';
    return '尚有仪式未完成';
  }

  function failHint(p, st) {
    const req = p.requires;
    if (!req) return null;
    if (typeof req.collected === 'number' && st.collected < req.collected) {
      if (p.id === 'portal') return `传送门未醒：还需 ${9 - st.collected} 枚星尘（${st.collected}/9）`;
      if (p.id === 'courtyard_stele') return `需先拾取至少三枚星尘（${st.collected}/3）`;
      if (p.id === 'fog_echo') return `雾廊未开（${st.collected}/3）`;
      if (p.id === 'echo_range') return `雾廊未开，回声测距尚不可用（${st.collected}/3）`;
      if (p.id === 'star_align') return `需六枚星尘后方可校准（${st.collected}/6）`;
      return `星尘不足（${st.collected}/${req.collected}）`;
    }
    if (Array.isArray(req.flags)) {
      for (const f of req.flags) {
        if (!st.flags[f]) return flagHint(f);
      }
    }
    if (Array.isArray(req.allFlags)) {
      for (const f of req.allFlags) {
        if (!st.flags[f]) return flagHint(f);
      }
    }
    return null;
  }

  /**
   * Nearest available (or blocked-but-near) interactable.
   * @param {{x:number,z:number}} pos
   * @returns {{ point: InteractPoint, dist: number, available: boolean, blockedReason: string|null } | null}
   */
  function queryNearby(pos) {
    if (!pos) return null;
    const st = getState();
    let best = null;
    let bestD = Infinity;

    for (const p of list) {
      const d = Math.hypot(pos.x - p.x, pos.z - p.z);
      const r = p.r ?? 2.5;
      if (d > r) continue;
      if (isSpent(p, st)) continue;
      if (d < bestD) {
        bestD = d;
        const available = meetsRequires(p, st);
        best = {
          point: p,
          dist: d,
          available,
          blockedReason: available ? null : failHint(p, st),
        };
      }
    }
    return best;
  }

  /**
   * HUD prompt text, or null.
   * @param {{x:number,z:number}} pos
   */
  function nearbyPrompt(pos) {
    const hit = queryNearby(pos);
    if (!hit) return null;
    if (!hit.available) return hit.blockedReason;
    const prefix = hit.point.optional ? '（可选）按 E · ' : '按 E · ';
    return `${prefix}${hit.point.label}`;
  }

  /**
   * Attempt E interact. Returns action descriptor for index to apply.
   * @param {{x:number,z:number}} pos
   */
  function tryInteract(pos) {
    const hit = queryNearby(pos);
    if (!hit) return { ok: false, reason: 'none' };
    if (!hit.available) {
      return { ok: false, reason: 'blocked', message: hit.blockedReason, point: hit.point };
    }
    return { ok: true, point: hit.point };
  }

  return {
    points: list,
    queryNearby,
    nearbyPrompt,
    tryInteract,
  };
}


/** Soft summit puzzle: 3 floor pads around the star-well (0, −24). */
export const SUMMIT_PADS = [
  { id: 'pad_east', x: 5.2, z: -23.0, r: 1.45 },
  { id: 'pad_nw', x: -4.6, z: -21.6, r: 1.45 },
  { id: 'pad_sw', x: -2.0, z: -28.0, r: 1.45 },
];

export const PAD_WINDOW_SEC = 12;

/**
 * Glowing floor pads + stand-on logic (any order, ~12s window).
 * Completing sets optional flavour flag `star_align` via caller (does NOT gate win).
 * @param {typeof import('three')} THREE
 * @param {import('three').Scene} scene
 * @param {{ pads?: typeof SUMMIT_PADS, windowSec?: number, y?: number }} [opts]
 */
export function createSummitPads(THREE, scene, opts = {}) {
  const defs = (opts.pads || SUMMIT_PADS).map((p) => ({ r: 1.45, ...p }));
  const windowSec = opts.windowSec ?? PAD_WINDOW_SEC;
  const y = opts.y ?? 2.08;

  const root = new THREE.Group();
  root.name = 'summit-pads';
  scene.add(root);

  const idleMat = new THREE.MeshBasicMaterial({
    color: 0x4a7a9a,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const ringIdle = new THREE.MeshBasicMaterial({
    color: 0x88dde8,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  /** @type {Array<{ id: string, x: number, z: number, r: number, disc: any, ring: any, light: any }>} */
  const pads = [];

  for (const def of defs) {
    const g = new THREE.Group();
    g.position.set(def.x, y, def.z);
    g.name = def.id;

    const disc = new THREE.Mesh(new THREE.CircleGeometry(def.r * 0.72, 28), idleMat.clone());
    disc.rotation.x = -Math.PI / 2;
    g.add(disc);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(def.r * 0.78, def.r * 0.95, 36),
      ringIdle.clone()
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    g.add(ring);

    const light = new THREE.PointLight(0x88dde8, 0.25, 5);
    light.position.set(0, 0.35, 0);
    g.add(light);

    root.add(g);
    pads.push({ ...def, group: g, disc, ring, light, lit: false });
  }

  let armed = false;
  let startedAt = 0;
  let completed = false;
  /** @type {Set<string>} */
  const stepped = new Set();

  function applyLitVisual(pad, on) {
    pad.lit = on;
    pad.disc.material.color.set(on ? 0xf0d48a : 0x4a7a9a);
    pad.disc.material.opacity = on ? 0.78 : 0.42;
    pad.ring.material.color.set(on ? 0xffe2a0 : 0x88dde8);
    pad.ring.material.opacity = on ? 0.7 : 0.35;
    pad.light.color.set(on ? 0xffe2a0 : 0x88dde8);
    pad.light.intensity = on ? 0.85 : 0.25;
  }

  function resetAttempt() {
    if (completed) return;
    armed = false;
    startedAt = 0;
    stepped.clear();
    for (const p of pads) applyLitVisual(p, false);
  }

  function setCompleted(done) {
    completed = !!done;
    if (completed) {
      armed = false;
      stepped.clear();
      for (const p of defs) stepped.add(p.id);
      for (const p of pads) applyLitVisual(p, true);
    } else {
      resetAttempt();
    }
  }

  /**
   * @param {{x:number,z:number}} pos
   * @param {number} t  elapsed seconds
   * @returns {{ type: string, count?: number, total?: number, remaining?: number } | null}
   */
  function update(pos, t) {
    if (completed) {
      // gentle pulse when done
      for (const p of pads) {
        const pulse = 0.72 + Math.sin(t * 2.2 + p.x) * 0.08;
        p.disc.material.opacity = pulse;
        p.ring.material.opacity = pulse * 0.9;
      }
      return null;
    }

    // Idle shimmer
    for (const p of pads) {
      if (p.lit) continue;
      const shimmer = 0.38 + Math.sin(t * 1.6 + p.x * 0.4) * 0.08;
      p.disc.material.opacity = shimmer;
      p.ring.material.opacity = shimmer * 0.85;
    }

    if (!pos) return null;

    let event = null;

    for (const p of pads) {
      const d = Math.hypot(pos.x - p.x, pos.z - p.z);
      if (d > p.r) continue;
      if (stepped.has(p.id)) continue;

      stepped.add(p.id);
      applyLitVisual(p, true);

      if (!armed) {
        armed = true;
        startedAt = t;
        event = { type: 'arm', count: stepped.size, total: pads.length, remaining: windowSec };
      } else {
        event = {
          type: 'step',
          count: stepped.size,
          total: pads.length,
          remaining: Math.max(0, windowSec - (t - startedAt)),
        };
      }

      if (stepped.size >= pads.length) {
        completed = true;
        return { type: 'complete', count: pads.length, total: pads.length };
      }
      return event;
    }

    if (armed && t - startedAt > windowSec) {
      resetAttempt();
      return { type: 'fail' };
    }

    return null;
  }

  function nearbyPrompt(pos, t = 0) {
    if (completed || !pos) return null;
    let nearPad = false;
    for (const p of pads) {
      if (Math.hypot(pos.x - p.x, pos.z - p.z) <= p.r + 0.8) {
        nearPad = true;
        break;
      }
    }
    if (!nearPad) {
      // soft approach hint within ~6u of cluster center (0,-24)
      const dWell = Math.hypot(pos.x - 0, pos.z + 24);
      if (dWell > 7.5) return null;
      if (armed) return `星井踏印进行中 ${stepped.size}/${pads.length}`;
      return '星井旁有三枚发光踏印';
    }
    if (armed) {
      const rem = Math.max(0, windowSec - (t - startedAt));
      return `踏印 ${stepped.size}/${pads.length} · 余 ${rem.toFixed(0)} 息`;
    }
    return '踏上发光石印 · 任意顺序 · 约十二息内完成';
  }

  return {
    root,
    pads,
    windowSec,
    update,
    nearbyPrompt,
    setCompleted,
    resetAttempt,
    isCompleted: () => completed,
  };
}
