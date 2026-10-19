# Mining till Earth Core

Game gali bumi dari permukaan sampai inti (900 m). Buka `index.html` langsung di browser, tanpa server atau build.

## Struktur

```
index.html            urutan <script> = urutan dependensi
css/style.css         seluruh tampilan (token warna di :root)
js/
  config.js           semua angka tuning (ukuran dunia, kecepatan, seed, dll)
  utils.js            helper + event bus (MTC.Events)
  data/materials.js   daftar blok & ore  ← tambah ore di sini
  data/layers.js      lapisan bumi, isi blok & peluang ore per kedalaman
  core/               storage (rekor), audio (WebAudio), input (keyboard/sentuh)
  game/               world (generator), player (gerak+gali), inventory, effects, game (state + loop)
  render/             textures (pixel-art via kode), renderer (canvas)
  ui/hud.js           sidebar, chip kedalaman, gauge, banner, overlay
  main.js             menyambungkan semua modul
```

Komunikasi antar modul lewat event (`MTC.Events`): `blockBroken`, `moved`, `inventory`,
`inventoryReset`, `depth`, `layer`. Fitur baru cukup mendengarkan event ini.

## Resep menambah fitur

**Ore baru** (mis. Gold)
1. `data/materials.js`: `register({ key:'gold', name:'Gold', ore:true, host:'granite', hardness:1.5, color:'#ffd24a', glow:'#fff08a' })`
2. `data/layers.js`: tambahkan `['gold', 0.01]` ke `ores` lapisan yang diinginkan.
Sidebar, tekstur, teks melayang "+1 Gold", dan kilau otomatis ikut.

**Lapisan baru**: tambah objek di `data/layers.js` (`from`, `to`, `blocks`, `ores`, `color`).

**Upgrade pickaxe**: naikkan `CONFIG.PICK_POWER` (dipakai di `game/player.js`) saat event tertentu.

**Jual / toko**: dengarkan `inventory` di modul baru `game/shop.js`, tambah script-nya di `index.html` sebelum `game.js`.

**Save dunia**: `world.js` hanya menyimpan 3 typed array (tiles, damage, variant) + `seed`; mudah diserialisasi di `core/storage.js`.

**Dunia yang sama tiap main**: isi `CONFIG.SEED` dengan angka.

## Kayu, pohon, letakkan, crafting
- Pohon (`world.js` `trees`) ditebang dengan menabrak pangkalnya: 3–10 `wood`. Workbench awal di tengah dunia.
- Klik item di sidebar = pilih (menggantikan pickaxe di tangan). Material bisa diletakkan di radius `CONFIG.BUILD_RADIUS` (bayangan hijau = valid, merah = tidak). Blok harus menempel pada blok solid; objek (`solid:false`, mis. workbench) harus berdiri di atas tanah. Klik kanan mengambil objek.
- Resep ada di `game/crafting.js` (hanya bisa dibuat dekat workbench). Logika meletakkan ada di `game/build.js`.

- Pohon yang ditebang meninggalkan sapling (bar progres kecil) dan tumbuh lagi setelah `CONFIG.TREE_REGROW` detik.
- Batas bangun ke atas `CONFIG.BUILD_HEIGHT` (128). Di atas permukaan pemain hanya bisa naik bila menempel pada blok solid (panjat bangunan).

## Pickaxe bertingkat & ore
- `data/tools.js`: pickaxe mengikuti urutan `tier` ore (wooden, copper, tin, iron, gold, tungsten, platinum, cobalt, titanium, osmium). Level L menambang ore tier <= L+2; ore di tier L+2 lebih berat (`Tools.HEAVY`). Kecepatan per level di `POWER`.
- Pickaxe dibuat di crafting bench: 5 wood + 20 ore (hanya level berikutnya). Ore baru: tambahkan `tier` di `materials.js`, pickaxe & resepnya otomatis ikut.
- Tekstur ore bergaya `style: 'crystal'` (cobalt, osmium) dan `'metal'` (titanium) ada di `render/textures.js`.

## Kontrol
WASD / panah (tahan = jalan & gali terus) · P/Esc jeda · M suara · Sentuh: tahan jari ke arah tujuan, atau pakai tombol arah.
