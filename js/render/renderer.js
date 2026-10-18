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
    cam: { x: 0, y: 0 },

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

      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, W, H);
      if (horizon > 0) drawSky(ctx, ox, oy, horizon, W, H, T);

      // ---- terrain ----
      ores.length = 0;
      const c0 = Math.floor(-ox / T), c1 = Math.ceil((W - ox) / T);
      const r0 = Math.max(S, Math.floor(-oy / T)), r1 = Math.min(World.rows - 1, Math.ceil((H - oy) / T));
      for (let r = r0; r <= r1; r++) {
        const layer = World.layerAt(r);
        for (let c = c0; c <= c1; c++) {
          const x = c * T + ox, y = r * T + oy;
          if (c < 0 || c >= World.cols) { ctx.drawImage(Tx.tile(Mat.byKey.bedrock.id, (c + r) & 3), x, y); continue; }
          const id = World.get(c, r), v = World.variantAt(c, r);
          if (id === 0) { ctx.drawImage(Tx.wall(layer.id, v), x, y); continue; }
          ctx.drawImage(Tx.tile(id, v), x, y);
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
        ctx.strokeStyle = 'rgba(255,224,138,0.95)';
        ctx.lineWidth = lw;
        ctx.strokeRect(x + lw / 2, y + lw / 2, T - lw, T - lw);
        const dmg = U.clamp(World.damageAt(tg.col, tg.row), 0, 1);
        if (dmg > 0.04) {
          const bw = T * 0.8, bh = Math.max(4, Math.round(T * 0.12));
          const bx = x + (T - bw) / 2, by = y - bh - Math.round(T * 0.1);
          ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
          ctx.fillStyle = tg.def.ore ? tg.def.glow : '#ffd166';
          ctx.fillRect(bx, by, Math.round(bw * dmg), bh);
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
    const g = ctx.createLinearGradient(0, oy, 0, horizon);
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
    // pohon pinus
    World.trees.forEach((tr) => {
      const x = tr.c * T + ox;
      if (x < -T || x > W + T) return;
      const trunk = Math.round(T * 0.5);
      ctx.fillStyle = '#5b3d23';
      ctx.fillRect(x + Math.round(T * 0.4), horizon - trunk, Math.round(T * 0.2), trunk);
      for (let i = 0; i < tr.h; i++) {
        const w = T * (1.25 - i * 0.28), hh = T * 0.6;
        const y = horizon - trunk - hh * (i + 1) + T * 0.2 * i;
        ctx.fillStyle = '#25583a'; ctx.fillRect(Math.round(x + (T - w) / 2), Math.round(y), Math.round(w), Math.round(hh));
        ctx.fillStyle = '#34794b'; ctx.fillRect(Math.round(x + (T - w) / 2), Math.round(y), Math.round(w * 0.45), Math.round(hh));
      }
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
    ctx.fillStyle = '#c9d1d9'; ctx.fillRect(Math.round(5 * u), -Math.round(u * 2), Math.max(2, Math.round(u * 1.3)), Math.round(4 * u));
    ctx.fillStyle = '#8b96a3'; ctx.fillRect(Math.round(5 * u), -Math.round(u * 2), Math.max(1, Math.round(u * 0.5)), Math.round(4 * u));
    ctx.restore();
  }

  M.Renderer = R;
})(window.MTC = window.MTC || {});
