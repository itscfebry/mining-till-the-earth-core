/*
 * Pemain: gerak per-blok (tahan tombol = jalan terus) dan menggali.
 * Progres gali disimpan di blok, jadi ganti arah tidak menghilangkan progres.
 */
(function (M) {
  'use strict';
  const C = M.CONFIG, World = M.World, Mat = M.Materials, Input = M.Input, Audio = M.Audio;

  const Player = {
    col: 0, row: 0,
    px: 0, py: 0,          // posisi visual (satuan blok, mengikuti col/row dengan halus)
    facing: 1,
    aim: { dx: 1, dy: 0 }, // arah gali terakhir
    target: null,          // { col, row, def } saat sedang menggali
    cooldown: 0,
    anim: 0,
    digTick: 0,

    reset() {
      Player.col = C.SPAWN_COL; Player.row = C.MIN_ROW;
      Player.px = Player.col; Player.py = Player.row;
      Player.facing = 1; Player.aim = { dx: 1, dy: 0 };
      Player.target = null; Player.cooldown = 0; Player.anim = 0; Player.digTick = 0;
    },

    get moving() { return Math.abs(Player.px - Player.col) + Math.abs(Player.py - Player.row) > 0.08; },
    get digging() { return Player.target !== null; },

    update(dt) {
      Player.anim += dt;
      Player.cooldown = Math.max(0, Player.cooldown - dt);
      Player.target = null;

      const d = Input.direction();
      if (d) {
        if (d.dx) Player.facing = d.dx;
        Player.aim = d;
        const nc = Player.col + d.dx, nr = Player.row + d.dy;

        if (nr < C.MIN_ROW) {
          // batas langit: tidak bisa terbang
        } else if (World.isSolid(nc, nr)) {
          const def = Mat.get(World.get(nc, nr));
          if (!def.unbreakable) {
            Player.target = { col: nc, row: nr, def: def };
            Player.digTick -= dt;
            if (Player.digTick <= 0) { Audio.dig(def.hardness); Player.digTick = 0.11; }
            const dmg = World.addDamage(nc, nr, dt * C.PICK_POWER / def.hardness);
            if (dmg >= 1) {
              World.clear(nc, nr);
              Player.cooldown = C.BREAK_COOLDOWN;
              Player.target = null;
              M.Events.emit('blockBroken', { col: nc, row: nr, def: def });
            }
          }
        } else if (Player.cooldown <= 0) {
          Player.col = nc; Player.row = nr;
          Player.cooldown = C.MOVE_INTERVAL;
          M.Events.emit('moved', { col: nc, row: nr });
        }
      } else {
        Player.digTick = 0;
      }

      // Gerak visual halus, tidak tergantung frame rate
      const k = 1 - Math.exp(-dt * 24);
      Player.px += (Player.col - Player.px) * k;
      Player.py += (Player.row - Player.py) * k;
    }
  };
  M.Player = Player;
})(window.MTC = window.MTC || {});
