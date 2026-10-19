/*
 * Input terpadu: keyboard, tombol layar, dan tahan-sentuh/klik di area game.
 * Semua sumber menghasilkan "arah yang sedang ditahan"; arah yang terakhir ditekan menang.
 */
(function (M) {
  'use strict';
  const DIRS = {
    left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 },
    up: { dx: 0, dy: -1 },   down: { dx: 0, dy: 1 }
  };
  const KEYMAP = {
    arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
    arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down'
  };
  let held = [];
  let hover = null;        // posisi kursor terakhir (px klien), untuk bayangan item
  let ptr = null;          // { x, y } posisi pointer yang sedang ditahan di area game
  let getPlayerScreen = null;

  function release(src, dir) { held = held.filter((h) => !(h.src === src && h.dir === dir)); }
  function releaseSource(src) { held = held.filter((h) => h.src !== src); }
  function press(src, dir) { release(src, dir); held.push({ src: src, dir: dir }); }

  // Hitung arah dari posisi pointer relatif terhadap pemain (dipanggil tiap frame,
  // supaya pemain berhenti saat sudah sampai di jari/kursor).
  function aim() {
    releaseSource('ptr');
    if (!ptr || !getPlayerScreen) return;
    const view = document.getElementById('view');
    const r = view.getBoundingClientRect();
    const p = getPlayerScreen();
    const dx = ptr.x - r.left - p.x, dy = ptr.y - r.top - p.y;
    if (Math.hypot(dx, dy) < p.tile * 0.45) return;
    press('ptr', Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
  }

  M.Input = {
    clear() { held = []; ptr = null; },
    get hover() { return hover; },
    update() { aim(); },
    direction() { const h = held[held.length - 1]; return h ? DIRS[h.dir] : null; },

    /* opts: { onPause, onMute, getPlayerScreen } */
    init(opts) {
      getPlayerScreen = opts.getPlayerScreen;

      window.addEventListener('keydown', (e) => {
        M.Audio.init();
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key.toLowerCase();
        if (KEYMAP[k]) e.preventDefault();
        if (e.repeat) return;
        if (KEYMAP[k]) press('key:' + k, KEYMAP[k]);
        else if (k === 'escape' || k === 'p') opts.onPause();
        else if (k === 'm') opts.onMute();
      }, { passive: false });

      window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (KEYMAP[k]) release('key:' + k, KEYMAP[k]);
      });
      window.addEventListener('blur', M.Input.clear);

      // Tombol arah di layar
      document.querySelectorAll('#controls [data-dir]').forEach((btn) => {
        const dir = btn.dataset.dir;
        const src = 'btn:' + dir;
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          M.Audio.init();
          try { btn.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
          btn.classList.add('on');
          press(src, dir);
        });
        const up = () => { btn.classList.remove('on'); release(src, dir); };
        btn.addEventListener('pointerup', up);
        btn.addEventListener('pointercancel', up);
        btn.addEventListener('lostpointercapture', up);
      });

      // Tahan di area game: pemain bergerak/menggali ke arah jari
      const view = document.getElementById('view');
      const stop = () => { ptr = null; releaseSource('ptr'); };
      view.addEventListener('pointerdown', (e) => {
        M.Audio.init();
        hover = { x: e.clientX, y: e.clientY };
        if (e.button !== 0) return;
        if (M.Build.active()) { M.Build.placeAt(e.clientX, e.clientY); return; }   // mode meletakkan item
        try { view.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
        ptr = { x: e.clientX, y: e.clientY };
      });
      view.addEventListener('pointermove', (e) => { hover = { x: e.clientX, y: e.clientY }; if (ptr) ptr = { x: e.clientX, y: e.clientY }; });
      view.addEventListener('pointerleave', () => { hover = null; });
      view.addEventListener('pointerup', stop);
      view.addEventListener('pointercancel', stop);
      view.addEventListener('lostpointercapture', stop);
      view.addEventListener('contextmenu', (e) => { e.preventDefault(); M.Build.pickupAt(e.clientX, e.clientY); });
    }
  };
})(window.MTC = window.MTC || {});
