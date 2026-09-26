/**
 * 星尘遗迹 — start/end overlays, HUD, journal, minimap, toasts
 */

const DEFAULT_JOURNAL = [
  { id: 'awaken', text: '踏上遗迹岛，感受星尘的低语', done: false },
  { id: 'first', text: '拾取第一枚星尘碎片', done: false },
  { id: 'plaza', text: '探访中央广场的传送门', done: false },
  { id: 'half', text: '收集至少 5 枚碎片', done: false },
  { id: 'shore', text: '沿着水岸环岛一圈', done: false },
  { id: 'all', text: '集齐全部 9 枚星尘碎片', done: false },
  { id: 'portal', text: '靠近中心传送门按 E 点亮', done: false },
];

/**
 * Build DOM overlays into document.body (idempotent if markup already present).
 * @returns {object} UI controller
 */
export function createUI({ total = 9, journalSteps = DEFAULT_JOURNAL } = {}) {
  ensureMarkup(total);
  const els = {
    start: document.getElementById('start-overlay'),
    end: document.getElementById('end-overlay'),
    hud: document.getElementById('hud'),
    cross: document.getElementById('crosshair'),
    toast: document.getElementById('toast'),
    shardCount: document.getElementById('shard-count'),
    shardBar: document.getElementById('shard-bar'),
    shardBarTrack: document.getElementById('shard-bar-track'),
    zoneName: document.getElementById('zone-name'),
    journal: document.getElementById('journal'),
    journalBackdrop: document.getElementById('journal-backdrop'),
    journalList: document.getElementById('journal-list'),
    minimapWrap: document.getElementById('minimap-wrap'),
    minimap: document.getElementById('minimap'),
    btnStart: document.getElementById('btn-start'),
    btnContinue: document.getElementById('btn-continue'),
    btnReplay: document.getElementById('btn-replay'),
    btnMute: document.getElementById('btn-mute'),
    winStat: document.getElementById('win-stat'),
    interactHint: document.getElementById('interact-hint'),
    resumeHint: document.getElementById('resume-hint'),
  };

  const mmCtx = els.minimap.getContext('2d');
  let journalOpen = false;
  let toastTimer = null;
  let toastHideTimer = null;
  let hintHideTimer = null;
  let steps = journalSteps.map((s) => ({ ...s }));
  let prevDone = new Set();
  let lastZone = '';
  let zoneFadeTimer = null;
  let hasSaveVisible = false;
  let lastShardN = -1;
  let startStaggerUsed = false;
  let tipDimTimer = null;
  let tipAwakeTimer = null;
  let tipIdleArmed = false;

  function syncOverlayPointer() {
    const startVis = els.start && !els.start.classList.contains('hidden');
    const endVis = els.end && !els.end.classList.contains('hidden');
    if (startVis || endVis) {
      document.body.classList.add('overlay-blocking');
    } else {
      document.body.classList.remove('overlay-blocking');
    }
  }

  function showStart({ hasSave = false } = {}) {
    hasSaveVisible = !!hasSave;
    els.start.classList.remove('hidden');
    els.end.classList.add('hidden');
    // First visit only: card children stagger fade-in
    if (!startStaggerUsed) {
      startStaggerUsed = true;
      els.start.classList.remove('start-stagger');
      void els.start.offsetWidth;
      els.start.classList.add('start-stagger');
    } else {
      els.start.classList.remove('start-stagger');
    }
    if (els.btnContinue) {
      els.btnContinue.style.display = hasSave ? '' : 'none';
      els.btnContinue.disabled = !hasSave;
      els.btnContinue.classList.toggle('cta-continue-hot', !!hasSave);
      els.btnContinue.classList.toggle('secondary', !hasSave);
    }
    if (els.btnStart) {
      // With save, 「继续」 is the standing CTA; 「开始」 steps back
      els.btnStart.classList.toggle('cta-start-quiet', !!hasSave);
      els.btnStart.classList.toggle('secondary', !!hasSave);
    }
    hideResumeHint();
    syncOverlayPointer();
  }

  function hideStart() {
    els.start.classList.add('hidden');
    syncOverlayPointer();
  }

  function showEnd({ collected = total, message } = {}) {
    els.end.classList.remove('hidden');
    // retrigger enter animation
    els.end.classList.remove('end-enter');
    void els.end.offsetWidth;
    els.end.classList.add('end-enter');
    ensureWinSparks(els.end);
    if (els.winStat) {
      const line1 = `星尘归位 ${collected} / ${total}`;
      const line2 = message || '按 E 点亮了传送门';
      els.winStat.innerHTML =
        `${escapeHtml(line1)}<br/><span class="win-epilogue">${escapeHtml(line2)}</span>`;
    }
    hideHud();
    syncOverlayPointer();
  }

  function hideEnd() {
    els.end.classList.add('hidden');
    els.end.classList.remove('end-enter');
    syncOverlayPointer();
  }

  function getHudTip() {
    return els.hud ? els.hud.querySelector('.hud-tip') : document.querySelector('.hud-tip');
  }

  function clearTipTimers() {
    clearTimeout(tipDimTimer);
    clearTimeout(tipAwakeTimer);
    tipDimTimer = null;
    tipAwakeTimer = null;
  }

  function resetTipOpacity() {
    const tip = getHudTip();
    if (!tip) return;
    tip.classList.remove('tip-dim', 'tip-awake');
  }

  /** Pointer lock: wall-clock 8s then dim (look does not reset). Input while dim wakes briefly. */
  function armTipIdle() {
    tipIdleArmed = true;
    clearTipTimers();
    resetTipOpacity();
    tipDimTimer = setTimeout(() => {
      if (!tipIdleArmed) return;
      const tip = getHudTip();
      if (!tip) return;
      tip.classList.remove('tip-awake');
      tip.classList.add('tip-dim');
    }, 8000);
  }

  function disarmTipIdle() {
    tipIdleArmed = false;
    clearTipTimers();
    resetTipOpacity();
  }

  function wakeHudTip() {
    if (!tipIdleArmed) return;
    const tip = getHudTip();
    if (!tip) return;
    // Only when dimmed — look/keys wake once, then another quiet 8s before dim again
    if (!tip.classList.contains('tip-dim')) return;
    tip.classList.remove('tip-dim');
    tip.classList.add('tip-awake');
    clearTimeout(tipDimTimer);
    clearTimeout(tipAwakeTimer);
    tipAwakeTimer = setTimeout(() => {
      if (!tipIdleArmed) return;
      tip.classList.remove('tip-awake');
      tipDimTimer = setTimeout(() => {
        if (!tipIdleArmed) return;
        tip.classList.add('tip-dim');
      }, 8000);
    }, 1800);
  }

  function showHud() {
    els.hud.classList.add('visible');
    els.cross.classList.add('visible');
    els.minimapWrap.classList.add('visible');
    setCrosshairMode('default');
    // Tip idle follows pointer lock (see pointerlockchange below)
    if (document.pointerLockElement) armTipIdle();
  }

  function hideHud() {
    els.hud.classList.remove('visible');
    els.cross.classList.remove('visible');
    els.minimapWrap.classList.remove('visible');
    disarmTipIdle();
    closeJournal();
    setInteractHint(null);
    hideResumeHint();
  }

  function updateShardCount(n, tot = total) {
    if (els.shardCount) {
      els.shardCount.innerHTML = `星尘碎片 <span class="accent">${n}</span> / ${tot}`;
    }
    if (els.shardBar) {
      const pct = tot > 0 ? Math.max(0, Math.min(1, n / tot)) * 100 : 0;
      els.shardBar.style.width = `${pct}%`;
      const track = els.shardBarTrack || document.getElementById('shard-bar-track');
      if (n >= tot && tot > 0) {
        els.shardBar.classList.add('full');
        // One-beat gold flash when the bar first fills
        if (lastShardN < tot && track) {
          track.classList.remove('bar-full-flash');
          void track.offsetWidth;
          track.classList.add('bar-full-flash');
        }
      } else {
        els.shardBar.classList.remove('full');
        if (track) track.classList.remove('bar-full-flash');
      }
    }
    lastShardN = n;
  }

  function setZoneName(name) {
    const next = name || '未知地带';
    if (!els.zoneName) return;
    if (next === lastZone) return;
    lastZone = next;
    els.zoneName.classList.remove('zone-fade');
    void els.zoneName.offsetWidth;
    els.zoneName.textContent = next;
    els.zoneName.classList.add('zone-fade');
    clearTimeout(zoneFadeTimer);
    zoneFadeTimer = setTimeout(() => els.zoneName.classList.remove('zone-fade'), 480);
    // Minimap frame micro-flash on zone change
    if (els.minimapWrap) {
      els.minimapWrap.classList.remove('mm-zone-flash');
      void els.minimapWrap.offsetWidth;
      els.minimapWrap.classList.add('mm-zone-flash');
    }
  }

  function showToast(msg, { gold = false, ms = 2200 } = {}) {
    // Reset timers so rapid toasts don't flicker mid-fade
    clearTimeout(toastTimer);
    clearTimeout(toastHideTimer);
    const wasShowing = els.toast.classList.contains('show');
    els.toast.classList.remove('toast-pop', 'toast-swap');
    if (wasShowing) {
      // Short crossfade: keep visible, swap content with soft pulse (no opacity crash)
      void els.toast.offsetWidth;
      els.toast.textContent = msg;
      els.toast.classList.toggle('gold', !!gold);
      els.toast.classList.add('show', 'toast-swap');
    } else {
      els.toast.classList.remove('show');
      void els.toast.offsetWidth;
      els.toast.textContent = msg;
      els.toast.classList.toggle('gold', !!gold);
      els.toast.classList.add('show', 'toast-pop');
    }
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('show', 'toast-pop', 'toast-swap');
      toastHideTimer = setTimeout(() => {
        if (!els.toast.classList.contains('show')) els.toast.textContent = '';
      }, 320);
    }, ms);
  }

  function setMuteLabel(muted) {
    if (!els.btnMute) return;
    const on = !muted;
    els.btnMute.textContent = muted ? '音效 关 (M)' : '音效 开 (M)';
    els.btnMute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    els.btnMute.setAttribute('aria-label', muted ? '音效已关闭，按 M 开启' : '音效已开启，按 M 关闭');
    els.btnMute.classList.toggle('is-muted', !!muted);
    // Brief visual tick on toggle
    els.btnMute.classList.remove('mute-tick');
    void els.btnMute.offsetWidth;
    els.btnMute.classList.add('mute-tick');
  }

  /** Crosshair visual: default teal cross, or gold ring when near interactable. */
  function setCrosshairMode(mode = 'default') {
    if (!els.cross) return;
    const interact = mode === 'interact';
    els.cross.classList.toggle('mode-interact', interact);
    els.cross.setAttribute('data-mode', interact ? 'interact' : 'default');
  }

  /** Proximity interact line under crosshair; pass null to hide (fades out). */
  function setInteractHint(text) {
    if (!els.interactHint) return;
    clearTimeout(hintHideTimer);
    if (text == null || text === '') {
      els.interactHint.classList.remove('show');
      setCrosshairMode('default');
      hintHideTimer = setTimeout(() => {
        if (!els.interactHint.classList.contains('show')) {
          els.interactHint.textContent = '';
        }
      }, 280);
      return;
    }
    // Highlight standalone E key with existing .hint-key chip when present
    const safe = escapeHtml(text).replace(
      /(?<![\w])E(?![\w])/g,
      '<span class="hint-key">E</span>'
    );
    els.interactHint.innerHTML = safe;
    els.interactHint.classList.add('show');
    setCrosshairMode('interact');
  }

  /** Lightweight centered bar when pointer lock is lost mid-play (Esc). */
  function showResumeHint(msg = '点击画面继续') {
    ensureResumeHintEl();
    if (!els.resumeHint) return;
    // Never surface over start/end overlays (even if caller forgets)
    const startVis = els.start && !els.start.classList.contains('hidden');
    const endVis = els.end && !els.end.classList.contains('hidden');
    if (startVis || endVis) {
      hideResumeHint();
      return;
    }
    els.resumeHint.textContent = msg || '点击画面继续';
    els.resumeHint.classList.add('show');
    els.resumeHint.setAttribute('aria-hidden', 'false');
  }

  function hideResumeHint() {
    if (!els.resumeHint) return;
    els.resumeHint.classList.remove('show');
    els.resumeHint.setAttribute('aria-hidden', 'true');
  }

  /** Alias: true → show, false/null → hide; string → show with custom copy. */
  function setPointerHint(onOrMsg) {
    if (onOrMsg == null || onOrMsg === false) {
      hideResumeHint();
      return;
    }
    if (onOrMsg === true) {
      showResumeHint();
      return;
    }
    showResumeHint(String(onOrMsg));
  }

  function ensureResumeHintEl() {
    if (els.resumeHint) return;
    let el = document.getElementById('resume-hint');
    if (!el) {
      el = document.createElement('div');
      el.id = 'resume-hint';
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    els.resumeHint = el;
  }

  function toggleJournal() {
    if (journalOpen) closeJournal();
    else openJournal();
    return journalOpen;
  }

  function openJournal() {
    journalOpen = true;
    els.journal.classList.remove('journal-stagger');
    void els.journal.offsetWidth;
    els.journal.classList.add('open', 'journal-stagger');
    if (els.journalBackdrop) els.journalBackdrop.classList.add('open');
    document.body.classList.add('journal-open');
  }

  function closeJournal() {
    journalOpen = false;
    els.journal.classList.remove('open', 'journal-stagger');
    if (els.journalBackdrop) els.journalBackdrop.classList.remove('open');
    document.body.classList.remove('journal-open');
  }

  function setJournalSteps(next) {
    steps = next.map((s) => ({ ...s }));
    renderJournal();
  }

  function markJournal(idOrIndex, done = true) {
    if (typeof idOrIndex === 'number') {
      if (steps[idOrIndex]) steps[idOrIndex].done = done;
    } else {
      const s = steps.find((x) => x.id === idOrIndex);
      if (s) s.done = done;
    }
    renderJournal();
  }

  function getJournalSteps() {
    return steps.map((s) => ({ ...s }));
  }

  function renderJournal() {
    if (!els.journalList) return;
    els.journalList.innerHTML = '';
    steps.forEach((s) => {
      const li = document.createElement('li');
      const wasDone = prevDone.has(s.id);
      if (s.done) {
        li.classList.add('done');
        if (!wasDone) li.classList.add('just-done');
        prevDone.add(s.id);
      } else {
        prevDone.delete(s.id);
      }
      li.innerHTML = `<span class="check">${s.done ? '✓' : ''}</span><span>${escapeHtml(s.text)}</span>`;
      els.journalList.appendChild(li);
    });
  }

  /**
   * Draw minimap: zone tints, shard dots, portal mark, player marker.
   * @param {object} opts
   * @param {{x:number,z:number,yaw?:number}} opts.player
   * @param {Array<{x:number,z:number,taken?:boolean}>} opts.shards
   * @param {Array<{name:string,cx:number,cz:number,r:number,color?:string}>} [opts.zones]
   * @param {{x:number,z:number}} [opts.portal] defaults to {0,0}
   * @param {number} [opts.worldRadius=28]
   */
  function drawMinimap({ player, shards = [], zones = [], portal, worldRadius = 28 } = {}) {
    const canvas = els.minimap;
    const ctx = mmCtx;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const scale = (Math.min(W, H) * 0.42) / worldRadius;
    const portalPos = portal || { x: 0, z: 0 };
    const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

    ctx.clearRect(0, 0, W, H);

    // water / void
    ctx.fillStyle = '#041018';
    ctx.fillRect(0, 0, W, H);

    // island disk
    ctx.beginPath();
    ctx.arc(cx, cy, worldRadius * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#0a2a28';
    ctx.fill();
    ctx.strokeStyle = 'rgba(45,212,191,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // zone tints
    zones.forEach((z) => {
      const zx = cx + z.cx * scale;
      const zy = cy + z.cz * scale;
      const zr = (z.r || 6) * scale;
      ctx.beginPath();
      ctx.arc(zx, zy, zr, 0, Math.PI * 2);
      ctx.fillStyle = z.color || 'rgba(45,212,191,0.12)';
      ctx.fill();
    });

    // portal marker (always, even with empty shards)
    {
      const px = cx + (portalPos.x || 0) * scale;
      const py = cy + (portalPos.z || 0) * scale;
      // outer ring
      ctx.beginPath();
      ctx.arc(px, py, 5.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(240,212,138,0.85)';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = 'rgba(240,212,138,0.7)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      // diamond
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px + 3.2, py);
      ctx.lineTo(px, py + 4);
      ctx.lineTo(px - 3.2, py);
      ctx.closePath();
      ctx.fillStyle = '#f0d48a';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // shards — uncollected micro-pulse; collected as dim residual marks
    shards.forEach((s) => {
      const sx = cx + s.x * scale;
      const sy = cy + s.z * scale;
      if (s.taken) {
        ctx.beginPath();
        ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(45,212,191,0.2)';
        ctx.fill();
        return;
      }
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.8 + s.x * 0.35 + s.z * 0.2);
      const alpha = 0.55 + 0.45 * pulse;
      const r = 2.2 + pulse * 0.7;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240,212,138,${alpha.toFixed(3)})`;
      ctx.shadowColor = `rgba(240,212,138,${(0.35 + 0.45 * pulse).toFixed(3)})`;
      ctx.shadowBlur = 4 + pulse * 5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // player — high-contrast ring + core + facing chevron
    if (player) {
      const px = cx + player.x * scale;
      const py = cy + player.z * scale;
      // outer dark halo for contrast on any zone tint
      ctx.beginPath();
      ctx.arc(px, py, 6.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2,8,14,0.55)';
      ctx.fill();
      // soft glow ring
      ctx.beginPath();
      ctx.arc(px, py, 5.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(232,244,242,0.85)';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = 'rgba(45,212,191,0.95)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      // teal core
      ctx.beginPath();
      ctx.arc(px, py, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = '#2dd4bf';
      ctx.shadowColor = 'rgba(45,212,191,1)';
      ctx.shadowBlur = 8;
      ctx.fill();
      // bright center pin
      ctx.beginPath();
      ctx.arc(px, py, 1.35, 0, Math.PI * 2);
      ctx.fillStyle = '#f5fffd';
      ctx.shadowBlur = 0;
      ctx.fill();
      // facing arrow — thicker & clearer with dark outline
      if (typeof player.yaw === 'number') {
        const len = 11;
        const ax = px + Math.sin(player.yaw) * len;
        const ay = py - Math.cos(player.yaw) * len;
        const ang = player.yaw;
        const ah = 4.6;
        // outline
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = 'rgba(2,8,14,0.85)';
        ctx.lineWidth = 4.2;
        ctx.lineCap = 'round';
        ctx.stroke();
        // shaft
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ax, ay);
        ctx.strokeStyle = '#e8f4f2';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.stroke();
        // arrowhead
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(
          ax - Math.sin(ang - 0.48) * ah,
          ay + Math.cos(ang - 0.48) * ah
        );
        ctx.lineTo(
          ax - Math.sin(ang + 0.48) * ah,
          ay + Math.cos(ang + 0.48) * ah
        );
        ctx.closePath();
        ctx.fillStyle = '#e8f4f2';
        ctx.strokeStyle = 'rgba(2,8,14,0.7)';
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();
      }
    }

    // inner vignette / edge shadow to match CSS border
    const grad = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.32, cx, cy, Math.min(W, H) * 0.55);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(45,212,191,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  }

  /** Primary CTA for Enter/Space: continue if save shown, else start; end → replay */
  function getPrimaryAction() {
    if (els.end && !els.end.classList.contains('hidden')) {
      return () => els.btnReplay?.click();
    }
    if (els.start && !els.start.classList.contains('hidden')) {
      if (hasSaveVisible && els.btnContinue && els.btnContinue.style.display !== 'none' && !els.btnContinue.disabled) {
        return () => els.btnContinue.click();
      }
      return () => els.btnStart?.click();
    }
    return null;
  }

  // backdrop click closes journal
  if (els.journalBackdrop) {
    els.journalBackdrop.addEventListener('click', () => closeJournal());
  }

  // Enter / Space → primary CTA when overlay visible (start → CTA, end → replay)
  addEventListener('keydown', (e) => {
    if (e.code !== 'Enter' && e.code !== 'Space') return;
    if (e.repeat) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
    const startVis = els.start && !els.start.classList.contains('hidden');
    const endVis = els.end && !els.end.classList.contains('hidden');
    if (!startVis && !endVis) return;
    e.preventDefault();
    const act = getPrimaryAction();
    if (act) act();
  });

  // Esc: close journal if open; on start/end overlays never dismiss the screen
  addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const startVis = els.start && !els.start.classList.contains('hidden');
    const endVis = els.end && !els.end.classList.contains('hidden');
    if (startVis || endVis) {
      if (journalOpen) {
        e.preventDefault();
        closeJournal();
      }
      // else: no-op — do not dismiss start/victory
      return;
    }
    if (journalOpen) {
      closeJournal();
    }
  });

  // Pointer lock → tip auto-dim after 8s; mouse/key wakes briefly
  document.addEventListener('pointerlockchange', () => {
    const locked = !!document.pointerLockElement;
    const hudOn = els.hud && els.hud.classList.contains('visible');
    if (locked && hudOn) armTipIdle();
    else disarmTipIdle();
  });
  addEventListener('mousemove', () => {
    if (tipIdleArmed) wakeHudTip();
  });
  addEventListener('keydown', () => {
    if (tipIdleArmed) wakeHudTip();
  });

  // wire defaults
  renderJournal();
  updateShardCount(0, total);
  setZoneName('晨雾港湾');
  syncOverlayPointer();

  return {
    els,
    showStart,
    hideStart,
    showEnd,
    hideEnd,
    showHud,
    hideHud,
    updateShardCount,
    setZoneName,
    showToast,
    setMuteLabel,
    setInteractHint,
    setCrosshairMode,
    showResumeHint,
    hideResumeHint,
    setPointerHint,
    toggleJournal,
    openJournal,
    closeJournal,
    isJournalOpen: () => journalOpen,
    setJournalSteps,
    markJournal,
    getJournalSteps,
    drawMinimap,
    getPrimaryAction,
    DEFAULT_JOURNAL,
  };
}

function hideBootPreload() {
  const el = document.getElementById('boot-preload');
  if (!el) return;
  el.classList.add('boot-preload-done');
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 420);
}

/** Sparse CSS gold motes for victory card (pure CSS animation). */
function ensureWinSparks(endEl) {
  if (!endEl) return;
  const card = endEl.querySelector('.card');
  if (!card) return;
  if (card.querySelector('.win-sparks')) return;
  const wrap = document.createElement('div');
  wrap.className = 'win-sparks';
  wrap.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 8; i++) {
    const s = document.createElement('span');
    s.className = 'win-spark';
    s.style.setProperty('--i', String(i));
    wrap.appendChild(s);
  }
  card.insertBefore(wrap, card.firstChild);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureMarkup(total) {
  if (document.getElementById('start-overlay')) {
    // Ensure progress bar + hint exist even if static HTML is partial
    if (!document.getElementById('shard-bar-track')) {
      const pill = document.getElementById('shard-count');
      if (pill && pill.parentElement) {
        const track = document.createElement('div');
        track.className = 'shard-bar-track';
        track.id = 'shard-bar-track';
        track.innerHTML = '<div class="shard-bar-fill" id="shard-bar"></div>';
        pill.parentElement.insertBefore(track, pill.nextSibling);
      }
    }
    if (!document.getElementById('interact-hint')) {
      const hint = document.createElement('div');
      hint.id = 'interact-hint';
      document.body.appendChild(hint);
    }
    if (!document.getElementById('journal-backdrop')) {
      const bd = document.createElement('div');
      bd.id = 'journal-backdrop';
      document.body.appendChild(bd);
    }
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn && !muteBtn.hasAttribute('aria-pressed')) {
      muteBtn.setAttribute('aria-pressed', 'false');
      muteBtn.setAttribute('aria-label', '音效已开启，按 M 关闭');
    }
    const endEl = document.getElementById('end-overlay');
    if (endEl) {
      ensureWinSparks(endEl);
      // Wire dead .end-hint CSS to real DOM if static markup lacked it
      if (!endEl.querySelector('.end-hint')) {
        const winStat = endEl.querySelector('#win-stat, .win-stat');
        const hint = document.createElement('p');
        hint.className = 'end-hint';
        hint.textContent = 'Enter / 空格 · 再走一遍';
        if (winStat && winStat.parentNode) {
          winStat.parentNode.insertBefore(hint, winStat.nextSibling);
        } else {
          const card = endEl.querySelector('.card');
          if (card) card.appendChild(hint);
        }
      }
    }
    hideBootPreload();
    // Keep static copy aligned with win condition if markup pre-exists
    const tip = document.querySelector('.hud-tip');
    if (tip) {
      tip.innerHTML =
        '<span class="tip-full">WASD 移动 · 鼠标视角 · Esc 释放<br/>E 交互 · J 日志 · M 静音 · 满 9 后靠近门按 E</span><span class="tip-short">WASD · 鼠标 · E 交互<br/>J 日志 · 满9靠近门按E</span>';
    }
    if (!document.getElementById('resume-hint')) {
      const rh = document.createElement('div');
      rh.id = 'resume-hint';
      rh.setAttribute('aria-hidden', 'true');
      rh.setAttribute('role', 'status');
      document.body.appendChild(rh);
    }
    const startSub = document.querySelector('#start-overlay .subtitle');
    if (startSub) {
      startSub.innerHTML =
        '薄雾遗迹岛上沉睡着九枚星尘。<br/>集齐全部碎片后，靠近中心传送门按 <strong>E</strong> 点亮归途。';
    }
    const startHint = document.querySelector('#start-overlay .hint');
    if (startHint) {
      startHint.textContent = 'WASD 移动 · 鼠标视角 · E 交互 · J 日志 · Enter 开始';
    }
    return;
  }

  const root = document.createElement('div');
  root.id = 'ui-root';
  root.innerHTML = `
    <div id="crosshair" aria-hidden="true"></div>
    <div id="interact-hint"></div>
    <div id="resume-hint" aria-hidden="true" role="status"></div>

    <div id="hud">
      <div class="hud-top">
        <div>
          <div class="hud-pill" id="shard-count">星尘碎片 <span class="accent">0</span> / ${total}</div>
          <div class="shard-bar-track" id="shard-bar-track"><div class="shard-bar-fill" id="shard-bar"></div></div>
          <div class="hud-zone" id="zone-name">晨雾港湾</div>
        </div>
        <div class="hud-tip"><span class="tip-full">WASD 移动 · 鼠标视角 · Esc 释放<br/>E 交互 · J 日志 · M 静音 · 满 9 后靠近门按 E</span><span class="tip-short">WASD · 鼠标 · E 交互<br/>J 日志 · 满9靠近门按E</span></div>
      </div>
      <button type="button" class="hud-mute" id="btn-mute" aria-pressed="false" aria-label="音效已开启，按 M 关闭">音效 开 (M)</button>
    </div>

    <div id="journal-backdrop"></div>
    <div id="journal" role="dialog" aria-label="探索日志">
      <h2>探索日志</h2>
      <ul id="journal-list"></ul>
      <div class="journal-foot">按 J 或点空白处关闭</div>
    </div>

    <div id="minimap-wrap">
      <canvas id="minimap" width="148" height="148"></canvas>
      <div class="minimap-label">遗迹全图</div>
    </div>

    <div id="toast" role="status"></div>

    <div class="overlay" id="start-overlay">
      <div class="card">
        <div class="badge">AETHER RUINS</div>
        <h1>星尘遗迹</h1>
        <p class="subtitle">薄雾遗迹岛上沉睡着九枚星尘。<br/>集齐全部碎片后，靠近中心传送门按 <strong>E</strong> 点亮归途。</p>
        <p class="hint">WASD 移动 · 鼠标视角 · E 交互 · J 日志 · Enter 开始</p>
        <div class="btn-row">
          <button type="button" class="cta" id="btn-start">开始探索</button>
          <button type="button" class="cta secondary" id="btn-continue" style="display:none">继续</button>
        </div>
      </div>
    </div>

    <div class="overlay hidden" id="end-overlay">
      <div class="card">
        <div class="badge">PORTAL LIT</div>
        <h1>门已点亮</h1>
        <p class="subtitle">九枚星尘归位。薄雾退开一寸，<br/>遗迹记住了你的足迹。</p>
        <p class="win-stat" id="win-stat"></p>
        <p class="end-hint">Enter / 空格 · 再走一遍</p>
        <div class="btn-row">
          <button type="button" class="cta" id="btn-replay">再走一遍</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  const endEl = document.getElementById('end-overlay');
  if (endEl) ensureWinSparks(endEl);
  hideBootPreload();
}

export { DEFAULT_JOURNAL };
