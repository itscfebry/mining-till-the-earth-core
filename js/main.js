/* Titik masuk: muat PNG dulu (aman bila tidak ada), lalu sambungkan semua modul. Modul baru? Daftarkan scriptnya di index.html. */
(function (M) {
  'use strict';
  function boot() {
    M.Storage.load();
    M.Audio.setMuted(M.Storage.data.muted);
    M.Renderer.init(document.getElementById('game'));
    M.HUD.init({
      onStart: () => M.Game.start(),
      onResume: () => M.Game.resume(),
      onRestart: () => M.Game.restart(),
      onPause: () => M.Game.togglePause()
    });
    M.Input.init({
      onPause: () => M.Game.togglePause(),
      onMute: () => M.HUD.toggleMute(),
      getPlayerScreen: () => M.Renderer.playerScreen()
    });
    M.Game.init();
  }
  M.Assets.load().then(boot);
})(window.MTC);
