/*
 * Renderer canvas: langit, terrain, pemain, efek, pencahayaan (makin gelap makin dalam).
 * Semua koordinat gambar dalam piksel perangkat; T = ukuran blok dalam piksel perangkat.
 */
(function (M) {
  'use strict';
  const C = M.CONFIG, U = M.Utils, Mat = M.Materials, Layers = M.Layers;
  const World = M.World, Player = M.Player, FX = M.Effects, Tx = M.Textures;
  const FONT = '"Courier New", ui-monospace, monospace';
  const S = C.SURFACE_ROW;
  const ores = []; // ore yang terlihat frame ini (untuk kilau)

  const R = {
    canvas: null, ctx: null, dpr: 1, T: 32, W: 0, H: 0,
    cam: { x: 0, y: 0 }, ox: 0, oy: 0,

    init(canvas) {
      R.canvas = canvas;
      R.ctx = canvas.getContext('2d');
      const box = canvas.parentElement;
      if (window.ResizeObserver) new ResizeObserver(R.resize).observe(box);
      window.addEventListener('resize', R.resize);
      R.resize();
    },

    resize() {
      const box = R.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(1, box.width), cssH = Math.max(1, box.height);
      const tileCss = U.clamp(Math.floor(Math.min(cssW / 15, cssH / 13)), C.TILE_MIN, C.TILE_MAX);
      R.dpr = dpr;
      R.T = Math.round(tileCss * dpr);
      R.W = Math.round(cssW * dpr);
      R.H = Math.round(cssH * dpr);
      R.canvas.width = R.W; R.canvas.height = R.H;
      R.ctx.imageSmoothingEnabled = false; // reset oleh perubahan ukuran canvas
      Tx.build(R.T);
      R.snapCamera();
    },

    camTarget() {
      const T = R.T;
      let tx = (Player.px + 0.5) * T - R.W / 2;
      let ty = (Player.py + 0.5) * T - R.H * 0.45;
      const ww = World.cols * T, wh = World.rows * T;
      tx = ww <= R.W ? (ww - R.W) / 2 : U.clamp(tx, 0, ww - R.W);
      ty = U.clamp(ty, 0, Math.max(0, wh - R.H));
      return { x: tx, y: ty };
    },
    snapCamera() { const t = R.camTarget(); R.cam.x = t.x; R.cam.y = t.y; },
    update(dt) {
      const t = R.camTarget(), k = 1 - Math.exp(-dt * 9);
      R.cam.x += (t.x - R.cam.x) * k;
      R.cam.y += (t.y - R.cam.y) * k;
    },

    // sel dunia di bawah koordinat layar (px CSS klien); memakai offset gambar terakhir
    cellAt(cx, cy) {
      const b = R.canvas.getBoundingClientRect();
      return { c: Math.floor(((cx - b.left) * R.dpr - R.ox) / R.T), r: Math.floor(((cy - b.top) * R.dpr - R.oy) / R.T) };
    },

    // posisi pemain di layar dalam px CSS relatif ke area game (dipakai input sentuh)
    playerScreen() {
      const T = R.T;
      return {
        x: ((Player.px + 0.5) * T - R.cam.x) / R.dpr,
        y: ((Player.py + 0.5) * T - R.cam.y) / R.dpr,
        tile: T / R.dpr
      };
    },

    draw(time) {
      const ctx = R.ctx, T = R.T, W = R.W, H = R.H;
      const sh = FX.shakeOffset();
      const ox = -Math.round(R.cam.x + sh.x * T), oy = -Math.round(R.cam.y + sh.y * T);
      const horizon = oy + S * T;
      R.ox = ox; R.oy = oy;

      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, W, H);
      if (horizon > 0) drawSky(ctx, ox, oy, horizon, W, H, T);

      // ---- terrain ----
      ores.length = 0;
      const c0 = Math.floor(-ox / T), c1 = Math.ceil((W - ox) / T);
      const r0 = Math.max(0, Math.floor(-oy / T)), r1 = Math.min(World.rows - 1, Math.ceil((H - oy) / T));
      for (let r = r0; r <= r1; r++) {
        const layer = World.layerAt(r);
        for (let c = c0; c <= c1; c++) {
          const x = c * T + ox, y = r * T + oy;
          if (c < 0 || c >= World.cols) { if (r >= S) ctx.drawImage(Tx.tile(Mat.byKey.bedrock.id, (c + r) & 3), x, y); continue; }
          const id = World.get(c, r), v = World.variantAt(c, r);
          const def0 = id ? Mat.get(id) : null;
          if (!id || def0.solid === false) { if (r >= S) ctx.drawImage(Tx.wall(layer.id, v), x, y); if (!id) continue; }
          ctx.drawImage(Tx.tile(id, v), x, y);
          if (def0.solid === false) continue;
          const dmg = World.damageAt(c, r);
          if (dmg > 0.02) ctx.drawImage(Tx.crack(Math.floor(dmg * 4)), x, y);
          const def = Mat.get(id);
          if (def.ore) ores.push({ x: x, y: y, def: def, seed: c * 7.3 + r * 13.1 });
        }
      }

      // ---- target gali ----
      const tg = Player.target;
      if (tg) {
        const x = tg.col * T + ox, y = tg.row * T + oy;
        const lw = Math.max(2, Math.round(T / 14));
        ctx.strokeStyle = tg.locked ? 'rgba(255,100,90,0.95)' : 'rgba(255,224,138,0.95)';
        ctx.lineWidth = lw;
        ctx.strokeRect(x + lw / 2, y + lw / 2, T - lw, T - lw);
        const dmg = U.clamp(World.damageAt(tg.col, tg.row), 0, 1);
        if (!tg.locked && dmg > 0.04) {
          const bw = T * 0.8, bh = Math.max(4, Math.round(T * 0.12));
          const bx = x + (T - bw) / 2, by = y - bh - Math.round(T * 0.1);
          ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
          ctx.fillStyle = tg.def.ore ? tg.def.glow : '#ffd166';
          ctx.fillRect(bx, by, Math.round(bw * dmg), bh);
        }
      }

      // ---- bayangan item yang akan diletakkan ----
      const held = M.Build.held();
      if (held) {
        const h = M.Input.hover;
        if (h) {
          const p = R.cellAt(h.x, h.y), ok = M.Build.canPlace(p.c, p.r, held);
          const gx = p.c * T + ox, gy = p.r * T + oy, lw = Math.max(2, Math.round(T / 14));
          ctx.globalAlpha = 0.6; ctx.drawImage(Tx.tile(held.id, 0), gx, gy); ctx.globalAlpha = 1;
          ctx.fillStyle = ok ? 'rgba(90,255,130,0.22)' : 'rgba(255,70,70,0.38)'; ctx.fillRect(gx, gy, T, T);
          ctx.strokeStyle = ok ? '#7dff9a' : '#ff6a6a'; ctx.lineWidth = lw;
          ctx.strokeRect(gx + lw / 2, gy + lw / 2, T - lw, T - lw);
        }
      }

      // ---- partikel ----
      for (const p of FX.particles) {
        const a = 1 - p.age / p.life;
        const s = Math.max(2, Math.round(p.size * T * (0.5 + a * 0.5)));
        ctx.globalAlpha = Math.min(1, a * 1.4);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x * T + ox - s / 2), Math.round(p.y * T + oy - s / 2), s, s);
      }
      ctx.globalAlpha = 1;

      drawPlayer(ctx, Math.round(Player.px * T + ox), Math.round(Player.py * T + oy), T, time);

      // ---- pencahayaan ----
      const depthF = Player.py - S;
      const ramp = U.clamp((depthF + 1) / 6, 0, 1);
      const t = U.clamp(depthF / C.CORE_DEPTH, 0, 1);
      const amb = ramp * (0.38 + 0.5 * t);
      const pcx = (Player.px + 0.5) * T + ox, pcy = (Player.py + 0.5) * T + oy;
      const lr = T * (9 - 3.5 * t);
      if (amb > 0.01) {
        const g = ctx.createRadialGradient(pcx, pcy, lr * 0.25, pcx, pcy, lr);
        g.addColorStop(0, 'rgba(8,6,12,0)');
        g.addColorStop(1, 'rgba(8,6,12,' + amb.toFixed(3) + ')');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      if (t > 0.8) {
        ctx.fillStyle = 'rgba(220,60,10,' + (((t - 0.8) / 0.2) * 0.2).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
      }

      // ---- kilau ore (tetap terlihat samar di area gelap) ----
      const sz = Math.max(2, Math.round(T * 0.09));
      for (const o of ores) {
        const ph = (Math.sin(time * 3 + o.seed) + 1) / 2;
        const cx = Math.round(o.x + T * 0.5), cy = Math.round(o.y + T * 0.5);
        ctx.globalAlpha = (o.def.rare ? 0.5 : 0.3) + ph * 0.6;
        ctx.fillStyle = o.def.glow;
        const a = o.def.rare ? sz * 2 : sz;
        ctx.fillRect(cx - sz / 2, cy - a - sz / 2, sz, a * 2 + sz);
        ctx.fillRect(cx - a - sz / 2, cy - sz / 2, a * 2 + sz, sz);
      }
      ctx.globalAlpha = 1;

      // ---- teks melayang "+1 Platinum" ----
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      for (const f of FX.floaters) {
        const k = f.age / f.life;
        const pop = k < 0.12 ? 0.6 + (k / 0.12) * 0.5 : 1.1 - Math.min(0.1, (k - 0.12));
        const fs = Math.round(T * (f.big ? 0.62 : 0.5) * pop);
        ctx.font = 'bold ' + fs + 'px ' + FONT;
        ctx.globalAlpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
        const x = Math.round(f.x * T + ox), y = Math.round(f.y * T + oy);
        ctx.lineWidth = Math.max(3, Math.round(T * 0.14));
        ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(f.text, x, y);
        ctx.fillStyle = f.color; ctx.fillText(f.text, x, y);
      }
      ctx.globalAlpha = 1;
    }
  };

  function drawSky(ctx, ox, oy, horizon, W, H, T) {
    const g = ctx.createLinearGradient(0, horizon - T * 16, 0, horizon);
    g.addColorStop(0, '#1d2650'); g.addColorStop(0.55, '#6a4b7d'); g.addColorStop(1, '#f2a863');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, Math.min(H, horizon));
    // matahari
    const sx = W * 0.72 - R.cam.x * 0.05, sy = horizon - T * 2.4;
    ctx.fillStyle = 'rgba(255,226,154,0.22)';
    ctx.beginPath(); ctx.arc(sx, sy, T * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe29a';
    ctx.beginPath(); ctx.arc(sx, sy, T * 0.8, 0, Math.PI * 2); ctx.fill();
    // bukit berlapis
    const layers = [{ f: 0.15, base: 1.3, amp: 0.55, wl: 5, col: '#3a3566' }, { f: 0.35, base: 0.7, amp: 0.4, wl: 3.2, col: '#26294a' }];
    layers.forEach((l) => {
      ctx.fillStyle = l.col;
      ctx.beginPath(); ctx.moveTo(0, horizon);
      for (let x = 0; x <= W + T; x += Math.max(4, T / 3)) {
        const u = (x + R.cam.x * l.f) / (T * l.wl);
        ctx.lineTo(x, horizon - T * (l.base + Math.sin(u) * l.amp + Math.sin(u * 2.3 + 1) * l.amp * 0.4));
      }
      ctx.lineTo(W + T, horizon); ctx.closePath(); ctx.fill();
    });
    // pohon (bisa ditebang)
    World.trees.forEach((tr) => {
      const x = tr.c * T + ox;
      if (x < -T * 3 || x > W + T * 2) return;
      if (tr.chopped) {                     // sapling + progres tumbuh
        const k = Math.min(1, tr.growT / C.TREE_REGROW);
        const sh = Math.round(T * (0.25 + 0.2 * k)), sw = Math.max(2, Math.round(T * 0.08)), mx = Math.round(x + T / 2);
        ctx.fillStyle = '#6b4524'; ctx.fillRect(mx - Math.round(sw / 2), horizon - sh, sw, sh);
        ctx.fillStyle = '#42904f';
        ctx.fillRect(mx - Math.round(T * 0.18), horizon - sh - Math.round(T * 0.1), Math.round(T * 0.36), Math.round(T * 0.14));
        ctx.fillRect(mx - Math.round(T * 0.08), horizon - sh - Math.round(T * 0.22), Math.round(T * 0.16), Math.round(T * 0.12));
        const bw = Math.round(T * 0.6), bh = Math.max(3, Math.round(T * 0.08)), bx = Math.round(x + (T - bw) / 2), by = horizon - Math.round(T * 0.8);
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
        ctx.fillStyle = '#9be37a'; ctx.fillRect(bx, by, Math.round(bw * k), bh);
        return;
      }
      const tw = Math.round(T * 0.36), tx = Math.round(x + (T - tw) / 2), th = Math.round(tr.h * T), top = horizon - th;
      ctx.fillStyle = '#6b4524'; ctx.fillRect(tx, top, tw, th);
      ctx.fillStyle = '#8a5b32'; ctx.fillRect(tx, top, Math.max(1, Math.round(tw * 0.4)), th);
      ctx.fillStyle = '#4e3219'; ctx.fillRect(tx - Math.round(T * 0.06), horizon - Math.round(T * 0.18), tw + Math.round(T * 0.12), Math.round(T * 0.18));
      [[2.0, -1.9], [3.2, -1.2], [3.4, -0.5], [2.4, 0.15]].forEach((q) => {
        const w = Math.round(T * q[0]), hh = Math.round(T * 0.8), lx = Math.round(x + T / 2 - w / 2), ly = Math.round(top + T * q[1]);
        ctx.fillStyle = '#2f6b3a'; ctx.fillRect(lx, ly, w, hh);
        ctx.fillStyle = '#42904f'; ctx.fillRect(lx, ly, Math.round(w * 0.4), hh);
      });
      const dm = World.damageAt(tr.c, S - 1);
      if (dm > 0.02) { ctx.fillStyle = 'rgba(0,0,0,' + (Math.min(dm, 1) * 0.4).toFixed(2) + ')'; ctx.fillRect(tx, top, tw, th); }
    });
  }

  function drawPlayer(ctx, x, y, T, time) {
    const u = T / 12;
    const f = Player.facing >= 0 ? 1 : -1;
    const bob = Player.moving ? Math.round(Math.sin(Player.anim * 22) * u * 0.5) : 0;
    const R2 = (a, b, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x + a * u), Math.round(y + b * u + bob), Math.round(w * u) || 1, Math.round(h * u) || 1); };
    const fx = (a, w) => (f > 0 ? a : 12 - a - w); // cermin horizontal

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(Math.round(x + 2 * u), Math.round(y + 11.2 * u), Math.round(8 * u), Math.round(0.8 * u) || 1);

    const step = Player.moving ? (Math.sin(Player.anim * 22) > 0 ? 1 : 0) : 0;
    R2(3, 9 + step * 0.0, 2, 3 - step * 0.6, '#27395f');
    R2(7, 9, 2, 3 - (1 - step) * 0.6, '#27395f');
    R2(2.5, 5, 7, 4.6, '#3d6ea8');
    R2(2.5, 5, 2, 4.6, '#5b8fc9');
    R2(2.5, 8.2, 7, 1, '#2c4a78');
    R2(4, 3, 4, 3, '#f0c9a0');
    R2(fx(7, 1), 4, 1, 1, '#1a1a1a');
    R2(3, 1, 6, 2.6, '#e8b04a');
    R2(3, 1, 6, 0.9, '#f6cf6e');
    R2(fx(7.4, 2), 1.6, 2, 1.4, '#fff3b0'); // lampu helm

    // item terpilih menggantikan pickaxe
    const sel = M.Inventory.selected;
    if (sel) {
      const s = Math.round(5 * u);
      ctx.drawImage(Tx.tile(Mat.byKey[sel].id, 0), Math.round(x + (f > 0 ? 7 : 0) * u), Math.round(y + 5.2 * u + bob), s, s);
      return;
    }

    // pickaxe: berayun ke arah gali
    const a = Player.aim;
    let base = f > 0 ? -0.9 : Math.PI + 0.9;
    let swing = 0;
    if (Player.digging) {
      base = Math.atan2(a.dy, a.dx);
      swing = Math.sin(Player.anim * 17) * 0.6;
    }
    ctx.save();
    ctx.translate(Math.round(x + 6 * u), Math.round(y + 7 * u + bob));
    ctx.rotate(base + swing);
    ctx.fillStyle = '#8b6b4b'; ctx.fillRect(0, -Math.round(u * 0.4), Math.round(6 * u), Math.max(1, Math.round(u * 0.9)));
    const pc = M.Tools.list[Player.pick].color;
    ctx.fillStyle = pc; ctx.fillRect(Math.round(5 * u), -Math.round(u * 2), Math.max(2, Math.round(u * 1.3)), Math.round(4 * u));
    ctx.fillStyle = U.shade(pc, -50); ctx.fillRect(Math.round(5 * u), -Math.round(u * 2), Math.max(1, Math.round(u * 0.5)), Math.round(4 * u));
    ctx.restore();
  }

  M.Renderer = R;
})(window.MTC = window.MTC || {});
