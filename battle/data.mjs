// Semua angka battle sebagai data (Game System v1 + Battle System v1). Ubah angka di sini, bukan di engine.
export const DATA = {
  stack: {
    mult: [1, 1.5, 2.5, 4],          // pengali kedalaman 1..4
    overflow: [0, 0.15, 0.35, 0.6],  // peluang Overflow saat naik ke kedalaman itu
  },
  en: { max: 10, start: 5, regen: 2, bertahan: 2 },
  kesadaran: { max: 100, perGiliranEM: 5, kenaEM: 10, dengar: 15, pulihSetelahAmbil: 30, goyahAtk: 0.75, goyahSkip: 0.2 },
  mundur: 0.6,
  retas: { durasi: 1, damage: 0.5 },

  karakter: {
    nino: { nama: "Nino", base: { hp: 40, atk: 8, def: 4, spd: 7 }, growth: { hp: 8, atk: 2, def: 1 }, skills: ["pindai", "putus_sinyal", "patch"] },
    kael: { nama: "Kael", base: { hp: 50, atk: 6, def: 5, spd: 5 }, growth: { hp: 10, atk: 1, def: 2 }, skills: ["jangkar", "tahan_diri"] },
  },

  skill: {
    pindai: { nama: "Pindai", en: 2, target: "musuh", defTurun: 3, durasi: 3 },
    putus_sinyal: { nama: "Putus Sinyal", en: 4, target: "musuh", stack: true, mult: 1.5, multPerTipe: { em: 2.0 }, bebasDiBawah: 0.3, takMempan: ["sekte"] },
    patch: { nama: "Patch", en: 2, target: "party", kebalRetas: 2 },
    jangkar: { nama: "Jangkar", en: 3, target: "sekutu", stack: true, heal: 20, healPerLevel: 2 },
    tahan_diri: { nama: "Tahan Diri", en: 2, target: "diri", kesadaran: 25 },
  },

  item: {
    kopi_kaleng: { nama: "Kopi Kaleng", target: "sekutu", hp: 30 },
    baterai: { nama: "Baterai", target: "sekutu", en: 5 },
    headset_gaming: { nama: "Headset Gaming", target: "kael", kesadaran: 30 },
  },

  // HP dan ATK hasil tuning simulasi 12 Nov 2026 (tools/sim.mjs), angka dokumen awal terlalu lemah.
  // ai: peluang tiap giliran (musuh biasa). pola: urutan tetap (bos). Mengisi dilepas di kedalaman `lepas`.
  musuh: {
    anomali_statis: { nama: "Anomali Statis", tipe: "em", bab: 1, hp: 55, atk: 22, def: 2, spd: 4, xp: 12, ai: { mengisi: 0.4, retas: 0.2 }, lepas: 3 },
    lonjakan_sinyal: { nama: "Lonjakan Sinyal", tipe: "em", bab: 1, bos: true, aksi: 2, hp: 165, atk: 20, def: 3, spd: 5, xp: 40, pola: ["serang", "mengisi", "retas", "mengisi", "serang"], lepas: 3 },
    anomali_berdengung: { nama: "Anomali Berdengung", tipe: "em", bab: 2, hp: 95, atk: 31, def: 4, spd: 6, xp: 20, ai: { mengisi: 0.4, retas: 0.2 }, lepas: 3 },
    warga_terkendali: { nama: "Warga Terkendali", tipe: "manusia", bab: 2, hp: 120, atk: 28, def: 3, spd: 5, xp: 18, ai: { mengisi: 0.4 }, lepas: 3 },
    gema_jaringan: { nama: "Gema Jaringan", tipe: "em", bab: 2, bos: true, aksi: 2, hp: 245, atk: 28, def: 5, spd: 6, xp: 60, pola: ["serang", "mengisi", "retas", "mengisi", "serang"], lepas: 3 },
    anomali_siaran: { nama: "Anomali Siaran", tipe: "em", bab: 3, hp: 85, atk: 35, def: 6, spd: 7, xp: 28, ai: { mengisi: 0.4, retas: 0.2 }, lepas: 3 },
    peretas_terkendali: { nama: "Peretas Terkendali", tipe: "manusia", bab: 3, hp: 110, atk: 33, def: 5, spd: 7, xp: 30, ai: { mengisi: 0.4 }, lepas: 3 },
    rekan_hilang: { nama: "Rekan yang Hilang", tipe: "manusia", bab: 3, bos: true, aksi: 2, hp: 190, atk: 25, def: 8, spd: 7, xp: 90, pola: ["serang", "mengisi", "mengisi", "serang"], lepas: 3 },
    warga_terkendali_kuat: { nama: "Warga Terkendali Kuat", tipe: "manusia", bab: 4, hp: 100, atk: 38, def: 8, spd: 7, xp: 40, ai: { mengisi: 0.4 }, lepas: 3 },
    anomali_pusaran: { nama: "Anomali Pusaran", tipe: "em", bab: 4, hp: 115, atk: 44, def: 10, spd: 9, xp: 45, ai: { mengisi: 0.4, retas: 0.2 }, lepas: 3 },
    orang_dekat: { nama: "Orang Dekat Terkendali", tipe: "manusia", bab: 4, bos: true, aksi: 2, hp: 140, atk: 28, def: 12, spd: 8, xp: 140, pola: ["serang", "mengisi", "mengisi", "serang"], lepas: 3 },
  },

  // Rombongan battle per bab (asumsi build: battle biasa 2 musuh, bos sendiri).
  bab: {
    1: { level: 1, biasa: ["anomali_statis", "anomali_statis"], bos: ["lonjakan_sinyal"], glitch: ["tukar"] },
    2: { level: 3, biasa: ["anomali_berdengung", "warga_terkendali"], bos: ["gema_jaringan"], glitch: ["tukar", "spam"] },
    3: { level: 4, biasa: ["anomali_siaran", "peretas_terkendali"], bos: ["rekan_hilang"], glitch: ["tukar", "palsu", "spam"] },
    4: { level: 6, biasa: ["warga_terkendali_kuat", "anomali_pusaran"], bos: ["orang_dekat"], glitch: ["tukar", "palsu", "spam"] },
  },
};
