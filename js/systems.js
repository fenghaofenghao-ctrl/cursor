const SAVE_KEY = 'aether-ruins-save-v1';

/** Zone flavour names for journal entries (cycled by shard index). */
const ZONE_FLAVORS = [
  '晨雾港湾',
  '残碑庭院',
  '星井高台',
  '苔径回廊',
  '沉钟回音',
  '雾廊断桥',
  '银叶神龛',
  '潮汐石阶',
  '虚空裂隙',
];

/** First-visit zone toasts (flag = zone_enter_<id>). */
const ZONE_ENTER = {
  harbor: {
    name: '晨雾港湾',
    toast: '晨雾港湾 —— 潮声未散，渡口灯火仍在守望。',
    journal: '你踏入晨雾港湾。潮声低语，仿佛记得每一位归航的旅人。',
  },
  courtyard: {
    name: '残碑庭院',
    toast: '残碑庭院 —— 石纹微亮，九道裂痕等待共鸣。',
    journal: '你踏入残碑庭院。石纹隐约成环，中心拱门在薄雾里呼吸。',
  },
  summit: {
    name: '星井高台',
    toast: '星井高台 —— 井承天隙，航标在雾上闪烁。',
    journal: '你登上星井高台。井口映着不属于此地的星光。',
  },
  mosswalk: {
    name: '苔径回廊',
    toast: '苔径回廊 —— 石柱生苔，暖雾与青霭在拱廊下交汇。',
    journal: '你踏入苔径回廊。柱廊夹着一条潮湿的石径，远处提灯的轮廓若隐若现。',
  },
};

/**
 * Quest / collect / save systems for 星尘遗迹.
 * @param {{ TOTAL: number }} opts
 */
export function createGameSystems({ TOTAL = 9 } = {}) {
  /** @type {{ id: string, title: string, desc: string, isDone: (s: any) => boolean }[]} */
  const quests = [
    {
      id: 'read_harbor',
      title: '阅读港湾石碑',
      desc: '在晨雾港湾找到港湾铭石，按 E 阅读铭文，开启寻星之路。',
      isDone: (s) => !!s.flags.harbor_stele,
    },
    {
      id: 'collect_3',
      title: '收集三枚星尘',
      desc: '在薄雾中拾取至少三枚星尘，唤醒雾廊软门与庭院记忆。',
      isDone: (s) => s.collected >= 3,
    },
    {
      id: 'read_courtyard',
      title: '解读残碑庭院铭文',
      desc: '集齐三枚后前往残碑庭院，按 E 解读石纹铭文。',
      isDone: (s) => !!s.flags.courtyard_stele,
    },
    {
      id: 'stele_join',
      title: '拼合庭院残碑纹路',
      desc: '庭院内找到三处残片点，按 E 依次触碰，拼合完整石纹。',
      isDone: (s) =>
        !!s.flags.stele_join ||
        (!!s.flags.stele_frag_a && !!s.flags.stele_frag_b && !!s.flags.stele_frag_c),
    },
    {
      id: 'fog_echo',
      optional: true,
      title: '聆听雾廊回音石',
      desc: '雾廊已开且读过港湾碑后，在回音石旁按 E，听见隐藏碎片的方位低语。',
      isDone: (s) => !!s.flags.fog_echo,
    },
    {
      id: 'collect_6',
      title: '再集三枚星尘',
      desc: '再拾三枚共六枚——高台软门将退开，通往星井之路。',
      isDone: (s) => s.collected >= 6,
    },
    {
      id: 'star_align',
      optional: true,
      title: '星井三踏印',
      desc: '登上星井高台，在星井旁三枚发光踏印上驻足（任意顺序，约十二息内完成）。',
      isDone: (s) => !!s.flags.star_align,
    },
    {
      id: 'rites',
      optional: true,
      title: '沉钟与银叶神龛',
      desc: '敲响沉钟，再向银叶神龛献上碎片记忆，揭示归途指引。',
      isDone: (s) => !!s.flags.sunk_bell && !!s.flags.silver_shrine,
    },
    {
      id: 'void_rift',
      optional: true,
      title: '凝视虚空裂隙',
      desc: '在星井高台岛缘找到虚空裂隙，按 E 凝视一次（风味，非通关条件）。',
      isDone: (s) => !!s.flags.void_rift,
    },
    {
      id: 'lanterns_all',
      optional: true,
      title: '点亮全部提灯',
      desc: '在港湾、庭院、高台各点亮一盏提灯；全部点亮后雾会薄一寸。',
      isDone: (s) =>
        !!s.flags.lanterns_all ||
        (!!s.flags.lantern_harbor &&
          !!s.flags.lantern_court &&
          !!s.flags.lantern_summit),
    },
    {
      id: 'explore_ring',
      optional: true,
      title: '环岛四处触达',
      desc: '踏足晨雾港湾、残碑庭院、星井高台，并凝视虚空裂隙。',
      isDone: (s) =>
        !!s.flags.zone_enter_harbor &&
        !!s.flags.zone_enter_courtyard &&
        !!s.flags.zone_enter_summit &&
        !!s.flags.void_rift,
    },
    {
      id: 'explore_lore',
      optional: true,
      title: '读完全部铭碑',
      desc: '读过港湾、庭院、星井、雾廊四座铭文碑（含交互碑与可选再读）。',
      isDone: (s) => {
        const reads = new Set(s.loreReads || []);
        if (s.flags.harbor_stele) reads.add('harbor-tablet');
        if (s.flags.courtyard_stele) reads.add('courtyard-tablet');
        if (s.flags.lore_summit) reads.add('summit-tablet');
        if (s.flags.lore_gate) reads.add('gate-tablet');
        return (
          reads.has('harbor-tablet') &&
          reads.has('courtyard-tablet') &&
          reads.has('summit-tablet') &&
          reads.has('gate-tablet')
        );
      },
    },
    {
      id: 'echo_range',
      optional: true,
      title: '回声测距',
      desc: '雾廊开启后，在测距点按 E；日志暗示最近未拾碎片的大致方位（东/南/西/北）。',
      isDone: (s) => !!s.flags.echo_range,
    },
    {
      id: 'silent_sit',
      optional: true,
      title: '静默坐禅',
      desc: '在庭院静听点按 E，静听两息——风味安宁，非通关条件。',
      isDone: (s) => !!s.flags.silent_sit,
    },
    {
      id: 'collect_9',
      title: '集齐九枚星尘',
      desc: '寻遍港湾、庭院与星井高台，集齐全部九枚星尘。',
      isDone: (s) => s.collected >= TOTAL,
    },
    {
      id: 'portal',
      title: '点亮中心传送门',
      desc: '集齐九枚后回到岛心传送门，按 E 点亮——唯一通关条件。',
      isDone: (s) => !!s.won,
    },
  ];

  const state = {
    collected: 0,
    /** @type {number[]} */
    taken: [],
    questStep: 0,
    won: false,
    /** @type {string[]} */
    journal: [],
    /** Interaction once-flags and misc booleans */
    flags: /** @type {Record<string, boolean>} */ ({}),
    /** Last known player pose for resume */
    player: /** @type {{ x: number, z: number, yaw?: number } | null} */ (null),
    /** Lore tablet ids already read */
    loreReads: /** @type {string[]} */ ([]),
  };

  function currentQuest() {
    if (state.questStep >= quests.length) return quests[quests.length - 1] || null;
    return quests[state.questStep] || null;
  }

  function pushJournal(line) {
    if (!line) return;
    state.journal.push(line);
  }

  /** Count completed optional quests (flavour only — never gates the portal). */
  function countOptionalDone() {
    let n = 0;
    for (const q of quests) {
      if (q.optional && q.isDone(state)) n++;
    }
    return n;
  }

  /**
   * Stardust notebook: journal achievements at 5 / 8 optional completions.
   * Does not touch onPortalLight / win conditions.
   * @returns {{ note5?: boolean, note8?: boolean, count: number }}
   */
  function checkStardustNotes() {
    const n = countOptionalDone();
    const out = { count: n };
    if (n >= 5 && !state.flags.stardust_note_5) {
      state.flags.stardust_note_5 = true;
      pushJournal(
        '星尘笔记·五：五道可选足迹已落入日志——遗迹多记住你一寸，门仍只认九枚。'
      );
      out.note5 = true;
    }
    if (n >= 8 && !state.flags.stardust_note_8) {
      state.flags.stardust_note_8 = true;
      pushJournal(
        '星尘笔记·八：八道可选足迹叠成星尘笔记。归途之门依旧只候九枚与点亮。'
      );
      out.note8 = true;
    }
    return out;
  }

  function syncQuestStep() {
    let step = 0;
    while (step < quests.length) {
      const q = quests[step];
      if (q.isDone(state) || q.optional) {
        step++;
        continue;
      }
      break;
    }
    const prev = state.questStep;
    state.questStep = step;
    return step > prev;
  }

  function announceQuestAdvance(prevStep) {
    if (state.questStep > prevStep && state.questStep < quests.length) {
      const q = quests[state.questStep];
      if (q) pushJournal(`新目标：${q.title}——${q.desc}`);
    }
  }

  /**
   * First-time zone entry toast + journal; flag persists in save.
   * @param {string} zoneId  harbor | courtyard | summit | mosswalk
   * @returns {{ toast: string, journal: string } | null}
   */
  function onZoneEnter(zoneId) {
    if (!zoneId || !ZONE_ENTER[zoneId]) return null;
    const flag = `zone_enter_${zoneId}`;
    if (state.flags[flag]) return null;
    const def = ZONE_ENTER[zoneId];
    state.flags[flag] = true;
    pushJournal(def.journal);
    checkStardustNotes();
    save();
    return { toast: def.toast, journal: def.journal, name: def.name };
  }

  /**
   * Record a shard pickup. Does NOT trigger win — portal lighting does.
   * @param {number} i
   * @param {string} [zoneName]
   */
  function onCollect(i, zoneName) {
    if (state.won) return { advanced: false, threshold: null };
    if (state.taken.includes(i)) return { advanced: false, threshold: null };

    state.taken.push(i);
    state.collected = state.taken.length;

    const zone = zoneName || ZONE_FLAVORS[i % ZONE_FLAVORS.length];
    pushJournal(`在「${zone}」拾取了第 ${state.collected} 枚星尘碎片。`);

    // Optional: consecutive pickups <2s → once-per-run「星尘共鸣」
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let resonance = false;
    if (
      !state.flags.stardust_resonance &&
      typeof state._lastCollectAt === 'number' &&
      now - state._lastCollectAt < 2000
    ) {
      state.flags.stardust_resonance = true;
      resonance = true;
      pushJournal('星尘共鸣：连续拾取间，碎片在掌心轻轻相吸。');
    }
    state._lastCollectAt = now;

    // Collection milestones (flavour only — do not change win conditions)
    if (state.collected === 1) {
      pushJournal('第一枚星尘落入掌心，像一滴尚未蒸发的晨露。');
    } else if (state.collected === 5) {
      pushJournal('五枚共鸣：薄雾里隐约传来踏印与潮汐的叠音。');
    } else if (state.collected === 8) {
      pushJournal('八枚将近圆满——岛心的门环已在无声地颤动。');
    }

    const prev = state.questStep;
    const advanced = syncQuestStep();
    if (advanced) announceQuestAdvance(prev);

    let threshold = null;
    if (state.collected === 3) {
      pushJournal('雾廊软门应声退开。残碑庭院的石纹微微发光——铭文在等待解读。');
      threshold = 3;
    }
    if (state.collected === 6) {
      pushJournal('六枚星尘共鸣。通往星井高台的纱障退开；星井旁的踏印石开始微微发光。');
      threshold = 6;
    }
    if (state.collected >= TOTAL) {
      pushJournal('九枚星尘尽数归位。靠近岛心传送门，按 E 点亮归途之门。');
      threshold = TOTAL;
      syncQuestStep();
    }

    const notes = checkStardustNotes();
    save();
    return { advanced, threshold, resonance, notes };
  }

  /**
   * Mark an interaction flag and advance quests / journal.
   * @param {string} id
   * @param {{ journal?: string, toast?: string }} [meta]
   */
  function onInteract(id, meta = {}) {
    if (state.flags[id]) {
      return { ok: false, reason: 'already', advanced: false };
    }
    state.flags[id] = true;
    if (meta.journal) pushJournal(meta.journal);

    const prev = state.questStep;
    const advanced = syncQuestStep();
    if (advanced) announceQuestAdvance(prev);

    const notes = checkStardustNotes();
    save();
    return { ok: true, advanced, toast: meta.toast || null, notes };
  }

  function hasFlag(id) {
    return !!state.flags[id];
  }

  /**
   * Light the central portal — sole win path.
   * Requires 9 shards only; rites are optional flavour.
   */
  function onPortalLight() {
    if (state.won) return false;
    if (state.collected < TOTAL) return false;
    // Optional rites (star_align / sunk_bell / silver_shrine) are flavour only.
    state.flags.portal_lit = true;
    state.won = true;
    pushJournal('传送门被点亮。星尘织成航线，遗迹记住了你的足迹。');
    syncQuestStep();
    save();
    return true;
  }

  /** @deprecated use onPortalLight — kept for index compatibility */
  function checkWin() {
    return state.won;
  }

  function setPlayerPose(pose) {
    if (!pose || typeof pose.x !== 'number' || typeof pose.z !== 'number') return;
    state.player = {
      x: pose.x,
      z: pose.z,
      yaw: typeof pose.yaw === 'number' ? pose.yaw : state.player?.yaw,
    };
  }

  /** @param {string[]} ids */
  function setLoreReads(ids) {
    state.loreReads = Array.isArray(ids)
      ? ids.filter((id) => typeof id === 'string')
      : [];
  }

  function save() {
    try {
      const payload = {
        collected: state.collected,
        taken: state.taken.slice(),
        questStep: state.questStep,
        won: state.won,
        journal: state.journal.slice(),
        flags: { ...state.flags },
        player: state.player ? { ...state.player } : null,
        loreReads: state.loreReads.slice(),
        gateOpen: state.collected >= 3,
        summitGateOpen: state.collected >= 6,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (_) {
      /* ignore quota / private mode */
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      state.taken = Array.isArray(data.taken)
        ? data.taken.filter((n) => typeof n === 'number')
        : [];
      state.collected =
        typeof data.collected === 'number' ? data.collected : state.taken.length;
      state.won = !!data.won;
      state.journal = Array.isArray(data.journal) ? data.journal : [];
      state.flags =
        data.flags && typeof data.flags === 'object' && !Array.isArray(data.flags)
          ? { ...data.flags }
          : {};
      if (data.player && typeof data.player.x === 'number' && typeof data.player.z === 'number') {
        state.player = {
          x: data.player.x,
          z: data.player.z,
          yaw: typeof data.player.yaw === 'number' ? data.player.yaw : undefined,
        };
      } else {
        state.player = null;
      }
      state.loreReads = Array.isArray(data.loreReads)
        ? data.loreReads.filter((id) => typeof id === 'string')
        : [];
      // Legacy saves may have won=true from auto-collect; keep as-is.
      if (typeof data.questStep === 'number') state.questStep = data.questStep;
      syncQuestStep();
      return true;
    } catch (_) {
      return false;
    }
  }

  function reset() {
    state.collected = 0;
    state.taken = [];
    state.questStep = 0;
    state.won = false;
    state.journal = [];
    state.flags = {};
    state.player = null;
    state.loreReads = [];
    pushJournal('探索开始。晨雾尚未散尽，港湾的石碑在呼唤星尘。');
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  // Seed opening journal line
  pushJournal('探索开始。晨雾尚未散尽，港湾的石碑在呼唤星尘。');

  return {
    state,
    quests,
    SAVE_KEY,
    ZONE_ENTER,
    currentQuest,
    onCollect,
    onInteract,
    onZoneEnter,
    onPortalLight,
    hasFlag,
    checkWin,
    setPlayerPose,
    setLoreReads,
    syncQuestStep,
    pushJournal,
    countOptionalDone,
    checkStardustNotes,
    save,
    load,
    reset,
  };
}
