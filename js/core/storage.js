/* Penyimpanan lokal (rekor kedalaman, waktu tercepat, suara). */
(function (M) {
  'use strict';
  const Storage = {
    data: { bestDepth: 0, bestTime: 0, muted: false },
    load() {
      try {
        const raw = window.localStorage.getItem(M.CONFIG.SAVE_KEY);
        if (raw) Object.assign(Storage.data, JSON.parse(raw));
      } catch (e) { /* storage diblokir: abaikan */ }
      return Storage.data;
    },
    save() {
      try { window.localStorage.setItem(M.CONFIG.SAVE_KEY, JSON.stringify(Storage.data)); } catch (e) { /* abaikan */ }
    }
  };
  M.Storage = Storage;
})(window.MTC = window.MTC || {});
