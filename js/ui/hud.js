/*
 * UI berbasis DOM: sidebar hasil tambang, chip kedalaman, gauge lapisan, banner, overlay.
 * Hanya mendengarkan event; tidak mengubah state game (kecuali lewat hooks).
 */
(function (M) {
  'use strict';
  const C = M.CONFIG, E = M.Events, Mat = M.Materials, Layers = M.Layers, U = M.Utils;
  const $ = (id) => document.getElementById(id);
  let el = {}, rows = {}, hooks = {}, bannerTimer = 0;

  const ICON = {
    pause: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M4 2h3v12H4zM9 2h3v12H9z"/></svg>',
    soundOn: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 6h3l4-3v10l-4-3H2z"/><path fill="none" stroke="currentColor" stroke-width="1.6" d="M11.5 5.5q1.5 2.5 0 5M13.5 4q2.5 4 0 8"/></svg>',
    soundOff: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 6h3l4-3v10l-4-3H2z"/><path stroke="currentColor" stroke-width="1.8" d="M11 6l4 4M15 6l-4 4"/></svg>'
  };

  function makeRow(key, kind) {
    const def = Mat.byKey[key];
    const li = document.createElement('li');
    li.className = 'row ' + kind + (kind === 'ore' ? ' zero' : '');
    li.dataset.key = key;
    li.title = def.name;
    if (kind === 'mat') li.hidden = true;
    const ic = M.Textures.icon(key);
    ic.className = 'ico';
    const name = document.createElement('span'); name.className = 'name'; name.textContent = def.name;
    const cnt = document.createElement('span'); cnt.className = 'cnt'; cnt.textContent = '0';
    li.append(ic, name, cnt);
    rows[key] = { li: li, cnt: cnt };
    return li;
  }

  function buildSidebar() {
    const mats = [];
    Mat.list.forEach((d) => {
      if (!d || d.ore || d.unbreakable) return;
      const k = d.drop || d.key;
      if (mats.indexOf(k) < 0) mats.push(k);
    });
    Mat.list.forEach((d) => { if (d && d.ore) el.oreList.appendChild(makeRow(d.key, 'ore')); });
    mats.forEach((k) => el.matList.appendChild(makeRow(k, 'mat')));
  }

  function buildGauge() {
    el.gaugeBar.innerHTML = '';
    Layers.list.forEach((l) => {
      const seg = document.createElement('div');
      seg.className = 'seg';
      seg.style.flexGrow = Math.max(0.6, l.to - l.from + 1);
      seg.style.background = l.color;
      seg.title = l.name + ' (' + l.from + '–' + l.to + ' m)';
      el.gaugeBar.appendChild(seg);
    });
  }

  function pop(node) { node.classList.remove('pop'); void node.offsetWidth; node.classList.add('pop'); }

  function setSound() {
    const muted = M.Audio.isMuted();
    el.btnMute.innerHTML = muted ? ICON.soundOff : ICON.soundOn;
    el.btnMute.setAttribute('aria-pressed', muted ? 'true' : 'false');
    el.btnMute.title = muted ? 'Nyalakan suara (M)' : 'Matikan suara (M)';
  }

  const HUD = {
    init(h) {
      hooks = h;
      ['sidebar', 'oreList', 'matList', 'oreTotal', 'depthVal', 'layerName', 'bestVal', 'gaugeBar',
        'marker', 'bestMark', 'banner', 'bannerTitle', 'bannerSub', 'overlay', 'panel', 'btnMute', 'btnPause'
      ].forEach((id) => { el[id] = $(id); });
      buildSidebar(); buildGauge(); setSound();
      el.btnPause.innerHTML = ICON.pause;
      el.btnPause.addEventListener('click', () => hooks.onPause());
      el.btnMute.addEventListener('click', () => HUD.toggleMute());

      E.on('inventory', (e) => {
        const r = rows[e.def.key]; if (!r) return;
        r.cnt.textContent = e.count;
        r.li.hidden = false;
        r.li.classList.remove('zero');
        pop(r.li);
        el.oreTotal.textContent = e.oreTotal;
      });
      E.on('inventoryReset', () => {
        Object.keys(rows).forEach((k) => {
          const r = rows[k]; r.cnt.textContent = '0';
          if (r.li.classList.contains('mat')) r.li.hidden = true; else r.li.classList.add('zero');
        });
        el.oreTotal.textContent = '0';
      });
      E.on('depth', (e) => {
        el.depthVal.textContent = e.depth;
        el.layerName.textContent = e.layer.name;
        el.bestVal.textContent = e.best;
        el.marker.style.top = (U.clamp(e.depth / C.CORE_DEPTH, 0, 1) * 100) + '%';
        el.bestMark.style.top = (U.clamp(e.best / C.CORE_DEPTH, 0, 1) * 100) + '%';
      });
      E.on('layer', (l) => {
        el.bannerTitle.textContent = l.name;
        el.bannerSub.textContent = 'mulai ' + l.from + ' m';
        el.banner.classList.remove('show'); void el.banner.offsetWidth; el.banner.classList.add('show');
        clearTimeout(bannerTimer);
        bannerTimer = setTimeout(() => el.banner.classList.remove('show'), 2800);
      });
    },

    toggleMute() {
      M.Audio.setMuted(!M.Audio.isMuted());
      M.Storage.data.muted = M.Audio.isMuted(); M.Storage.save();
      setSound();
    },

    setPaused(p) { el.btnPause.disabled = false; el.btnPause.setAttribute('aria-pressed', p ? 'true' : 'false'); },

    overlay(type, d) {
      let html = '';
      if (type === 'start') {
        html = '<h1 class="title">Mining till<br>Earth Core</h1>' + strata() +
          '<p class="lead">Gali dari permukaan sampai inti bumi, ' + C.CORE_DEPTH + ' m ke bawah. Kumpulkan ore di sepanjang jalan.</p>' +
          '<dl class="help"><dt>Gerak dan gali</dt><dd>WASD atau tombol panah. Tahan untuk jalan atau gali terus.</dd>' +
          '<dt>Sentuh</dt><dd>Tahan jari ke arah yang dituju, atau pakai tombol arah.</dd>' +
          '<dt>Jeda dan suara</dt><dd>P atau Esc untuk jeda, M untuk suara.</dd></dl>' +
          (d.best ? '<p class="best">Rekor kedalaman: <b>' + d.best + ' m</b></p>' : '') +
          '<button class="btn primary" data-act="start">Mulai menambang</button>';
      } else if (type === 'pause') {
        html = '<h2 class="title sm">Jeda</h2>' +
          '<p class="lead">' + d.depth + ' m · ' + d.ores + ' ore · ' + U.formatTime(d.time) + '</p>' +
          '<button class="btn primary" data-act="resume">Lanjut</button>' +
          '<button class="btn" data-act="restart">Mulai ulang</button>';
      } else if (type === 'win') {
        const list = Mat.list.filter((x) => x && x.ore && d.counts[x.key]).map((x) => '<li><span>' + x.name + '</span><b>' + d.counts[x.key] + '</b></li>').join('');
        html = '<h2 class="title sm">Inti bumi tercapai</h2>' +
          '<p class="lead">' + C.CORE_DEPTH + ' m dalam ' + U.formatTime(d.time) + (d.newBest ? ' — waktu tercepat baru.' : '.') + '</p>' +
          '<ul class="tally">' + (list || '<li><span>Tanpa ore</span><b>0</b></li>') + '</ul>' +
          '<button class="btn primary" data-act="restart">Main lagi</button>';
      }
      el.panel.innerHTML = html;
      el.overlay.hidden = false;
      el.panel.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        M.Audio.init();
        const a = b.dataset.act;
        if (a === 'start') hooks.onStart(); else if (a === 'resume') hooks.onResume(); else hooks.onRestart();
      }));
      const first = el.panel.querySelector('.primary'); if (first) first.focus();
    },
    hideOverlay() { el.overlay.hidden = true; }
  };

  function strata() {
    return '<div class="strata" aria-hidden="true">' + Layers.list.map((l) =>
      '<i style="background:' + l.color + ';flex-grow:' + Math.max(1, Math.sqrt(l.to - l.from + 1)) + '"></i>').join('') + '</div>';
  }

  M.HUD = HUD;
})(window.MTC = window.MTC || {});
