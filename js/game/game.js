/* Orkestrator: state (menu/playing/paused/won), game loop tunggal, dan penghubung antar modul. */
(function (M) {
  'use strict';
  const C = M.CONFIG, E = M.Events, World = M.World, Player = M.Player, Inv = M.Inventory,
    FX = M.Effects, R = M.Renderer, Audio = M.Audio, Mat = M.Materials, L = M.Layers, Input = M.Input;

  const Game = {
    state: 'menu', elapsed: 0, depth: 0, best: 0, seen: {}, layerName: '', last: 0, started: false,

    init() {
      Game.best = M.Storage.data.bestDepth || 0;
      E.on('blockBroken', Game.onBroken);
      E.on('treeChopped', Game.onTree);
      E.on('moved', Game.checkDepth);
      document.addEventListener('visibilitychange', () => { if (document.hidden) Game.pause(); });
      window.addEventListener('pagehide', () => M.Storage.save());
      Game.prepare();
      M.HUD.overlay('start', { best: Game.best });
      requestAnimationFrame(Game.loop);   // satu-satunya game loop (tidak pernah dobel)
    },

    prepare() {
      const seed = C.SEED != null ? C.SEED : (Math.random() * 4294967296) >>> 0;
      World.generate(seed);
      Player.reset(); Inv.reset(); FX.clear(); Input.clear();
      R.snapCamera();
      Game.elapsed = 0; Game.depth = 0; Game.seen = { surface: true };
      Game.layerName = L.at(0).name;
      E.emit('depth', { depth: 0, best: Game.best, layer: L.at(0) });
    },

    start() {
      Audio.init(); Game.prepare();
      Game.state = 'playing'; M.HUD.hideOverlay(); M.HUD.setPaused(false);
    },
    restart() { Game.start(); },
    pause() {
      if (Game.state !== 'playing') return;
      Game.state = 'paused'; Input.clear(); M.Storage.save(); M.HUD.setPaused(true);
      M.HUD.overlay('pause', { depth: Game.depth, ores: Inv.oreTotal, time: Game.elapsed });
    },
    resume() {
      if (Game.state !== 'paused') return;
      Game.state = 'playing'; Input.clear(); M.HUD.hideOverlay(); M.HUD.setPaused(false);
    },
    togglePause() { if (Game.state === 'playing') Game.pause(); else if (Game.state === 'paused') Game.resume(); },

    onBroken(e) {
      const def = e.def, drop = def.drop || def.key;
      Inv.add(drop, 1);
      FX.breakBurst(e.col, e.row, def);
      if (def.ore) {
        FX.floatText(e.col, e.row, '+1 ' + Mat.byKey[drop].name, def.glow, def.rare);
        Audio.ore(def);
        if (def.rare) FX.shake(0.1, 0.22);
      }
    },

    onTree(e) {
      const n = 3 + ((Math.random() * 8) | 0);          // 3-10 kayu
      Inv.add('wood', n);
      FX.breakBurst(e.col, e.row, Mat.byKey.wood);
      FX.floatText(e.col, e.row - 1, '+' + n + ' Wood', '#e0a867', true);
      Audio.ore(null);
    },

    checkDepth() {
      const d = World.depthOf(Player.row);
      if (d === Game.depth) return;
      Game.depth = d;
      if (d > Game.best) { Game.best = d; M.Storage.data.bestDepth = d; }
      const layer = L.at(d);
      E.emit('depth', { depth: d, best: Game.best, layer: layer });
      if (layer.name !== Game.layerName) {
        Game.layerName = layer.name;
        if (!Game.seen[layer.id]) {          // banner hanya saat pertama kali masuk lapisan
          Game.seen[layer.id] = true;
          E.emit('layer', layer); Audio.layer(); M.Storage.save();
        }
      }
      if (d >= C.CORE_DEPTH && Game.state === 'playing') Game.win();
    },

    win() {
      Game.state = 'won'; Input.clear(); Audio.win();
      const t = M.Storage.data.bestTime;
      const newBest = !t || Game.elapsed < t;
      if (newBest) M.Storage.data.bestTime = Game.elapsed;
      M.Storage.save();
      FX.shake(0.2, 0.6);
      M.HUD.overlay('win', { time: Game.elapsed, counts: Inv.counts, newBest: newBest });
    },

    loop(ts) {
      requestAnimationFrame(Game.loop);
      if (!Game.last) Game.last = ts;
      const dt = Math.min((ts - Game.last) / 1000, 0.05);
      Game.last = ts;
      if (Game.state === 'playing') {
        Game.elapsed += dt;
        Input.update();
        Player.update(dt);
        World.updateTrees(dt);
      }
      if (Game.state !== 'paused') FX.update(dt);
      R.update(dt);
      R.draw(ts / 1000);
    }
  };
  M.Game = Game;
})(window.MTC = window.MTC || {});
