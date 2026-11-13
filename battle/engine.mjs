// Mesin battle Recursio: logika murni tanpa gambar. Dipakai UI dan simulasi.
// Alur: createBattle -> startRound -> (beginTurn -> [ulangi...] -> act)* -> startRound ... sampai s.over.
import { DATA } from "./data.mjs";

export function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function statAt(key, level) {
  const c = DATA.karakter[key];
  const g = (k) => c.base[k] + (c.growth[k] || 0) * (level - 1);
  return { hp: g("hp"), atk: g("atk"), def: g("def"), spd: g("spd") };
}

export function createBattle({ bab = 1, musuh, party = {}, items = {}, rng = Math.random, d = DATA }) {
  const s = { d, rng, bab, round: 0, queue: [], log: [], over: null, items: { ...items }, fighters: [] };
  for (const key of ["nino", "kael"]) {
    const p = party[key] || {}, level = p.level || 1, st = p.stats || statAt(key, level);
    s.fighters.push({
      id: key, key, side: "party", nama: d.karakter[key].nama, level, ...st, maxHp: st.hp, efek: p.efek || [],
      hp: Math.min(p.hp ?? st.hp, st.hp), en: p.en ?? d.en.start, kesadaran: key === "kael" ? (p.kesadaran ?? d.kesadaran.max) : null, st: {},
    });
  }
  const count = {};
  musuh.forEach((key, i) => {
    const m = d.musuh[key];
    count[key] = (count[key] || 0) + 1;
    s.fighters.push({
      id: "m" + i, key, side: "musuh", nama: m.nama + (musuh.filter((k) => k === key).length > 1 ? " " + "ABCD"[count[key] - 1] : ""),
      tipe: m.tipe, bos: !!m.bos, hp: m.hp, maxHp: m.hp, atk: m.atk, def: m.def, spd: m.spd, xp: m.xp,
      depth: 1, polaI: 0, intent: null, st: {}, terkendali: m.tipe === "manusia",
    });
  });
  return s;
}

const log = (s, t) => s.log.push(t);
export const alive = (f) => f.hp > 0 && !f.bebas;
export const party = (s) => s.fighters.filter((f) => f.side === "party");
export const enemies = (s) => s.fighters.filter((f) => f.side === "musuh");
export const byId = (s, id) => s.fighters.find((f) => f.id === id);
const pick = (s, arr) => arr[Math.floor(s.rng() * arr.length)];
const emAlive = (s) => enemies(s).some((e) => alive(e) && e.tipe === "em");

export function tingkat(k) {
  return k > 50 ? "stabil" : k > 20 ? "goyah" : k > 0 ? "kritis" : "diambil";
}

function defOf(f) {
  let def = f.def;
  if (f.st.defTurun) def = Math.max(0, def - f.st.defTurun.n);
  if (f.st.bertahan) def *= 2;
  return def;
}

export function damage(s, att, tgt, mult) {
  let atk = att.atk;
  if (att.key === "kael" && tingkat(att.kesadaran) === "goyah") atk *= s.d.kesadaran.goyahAtk;
  const v = 0.9 + s.rng() * 0.2;
  return Math.max(1, Math.round(atk * mult * v) - Math.floor(defOf(tgt) / 2));
}

function checkOver(s) {
  if (!enemies(s).some(alive)) s.over = "menang";
  else if (!party(s).some(alive)) s.over = "kalah";
  return s.over;
}

function hit(s, att, tgt, mult, depth) {
  const dmg = damage(s, att, tgt, mult);
  tgt.hp = Math.max(0, tgt.hp - dmg);
  log(s, `${att.nama} -> ${tgt.nama}: ${dmg}`);
  if (tgt.side === "musuh" && tgt.depth > 1 && depth >= tgt.depth) {
    tgt.depth = 1; tgt.st.hang = true; tgt.intent = null;
    log(s, `Sela! Stack ${tgt.nama} runtuh, Hang`);
  }
  if (tgt.side === "party" && att.tipe === "em" && tgt.key === "kael") addKes(s, tgt, -s.d.kesadaran.kenaEM);
  if (tgt.hp === 0) log(s, tgt.side === "party" ? `${tgt.nama} pingsan` : tgt.tipe === "manusia" ? `${tgt.nama} lumpuh` : `${tgt.nama} hilang`);
  return dmg;
}

function addKes(s, kael, n) {
  const before = kael.kesadaran;
  kael.kesadaran = Math.max(0, Math.min(s.d.kesadaran.max, kael.kesadaran + n));
  if (before > 0 && kael.kesadaran === 0) { kael.st.diambil = 2; log(s, "Kael diambil alih"); }
}

// Rencana musuh dibuat di awal ronde supaya Dengar bisa menampilkannya.
function planIntent(s, e) {
  const m = s.d.musuh[e.key];
  let act;
  if (e.depth >= m.lepas) act = "lepas";
  else if (m.pola) { act = m.pola[e.polaI % m.pola.length]; e.polaI++; }
  else {
    const r = s.rng();
    act = r < (m.ai.retas || 0) ? "retas" : r < (m.ai.retas || 0) + m.ai.mengisi ? "mengisi" : "serang";
  }
  const targets = party(s).filter(alive);
  e.intent = { act, target: act === "mengisi" ? null : pick(s, targets)?.id };
}

export function startRound(s) {
  s.round++;
  s.dengar = null;
  for (const e of enemies(s)) if (alive(e)) planIntent(s, e);
  s.queue = s.fighters.filter(alive).map((f, i) => ({ f, i }))
    .sort((a, b) => b.f.spd - a.f.spd || (a.f.side === "party" ? -1 : 0) - (b.f.side === "party" ? -1 : 0) || a.i - b.i)
    .map((x) => x.f.id);
  // Musuh dengan aksi lebih dari satu (bos) beraksi lagi di akhir ronde.
  for (const e of enemies(s)) for (let i = 1; i < (s.d.musuh[e.key].aksi || 1); i++) if (alive(e)) s.queue.push(e.id);
  // Serbu: bos memindahkan kartunya ke slot Nino, Balapan terjadi saat giliran Nino tiba.
  s.salip = false;
  s.serbu = bosDiBelakangNino(s) && s.rng() < s.d.balapan.serbu;
  if (s.serbu) log(s, `${bosHidup(s).nama} Serbu ke slot Nino`);
  return s.queue;
}

const bosHidup = (s) => enemies(s).find((e) => e.bos && alive(e));
// Balapan hanya mungkin jika kartu bos masih ada di antrian setelah giliran Nino.
function bosDiBelakangNino(s) {
  const b = bosHidup(s), n = byId(s, "nino");
  return !!b && alive(n) && !n.st.hang && s.queue.includes(b.id);
}

// Salip: skill Nino, sekali per ronde, tidak memakai giliran. Dipanggil saat giliran Nino, sebelum Balapan.
export const bisaSalip = (s) => !s.salip && !s.serbu && bosDiBelakangNino(s) && byId(s, "nino").en >= s.d.balapan.salipEn;
export function salip(s) {
  if (!bisaSalip(s)) return false;
  byId(s, "nino").en -= s.d.balapan.salipEn; s.salip = true;
  log(s, "Nino Salip ke slot bos");
  return true;
}

// Hasil Balapan. Menang: aksi bos di slot itu batal dan Nino lanjut beraksi (hasil true).
// Kalah: bos beraksi sekarang dan giliran Nino batal (hasil false).
export function balapan(s, menang) {
  const b = bosHidup(s), n = byId(s, "nino");
  s.serbu = false;
  const i = s.queue.indexOf(b.id);
  if (i >= 0) s.queue.splice(i, 1);
  if (menang) { log(s, `Nino menang Balapan, aksi ${b.nama} batal`); return true; }
  log(s, "Nino kalah Balapan, aksinya batal");
  n.st.retas = null;
  act(s, b);
  return false;
}
export const batasBalapan = (s) => s.d.balapan.batasMs[s.bab - 1] ?? 450;

// Ambil petarung berikutnya yang bisa beraksi. Null berarti ronde selesai.
// Hasil: { actor, auto } — auto true berarti act() tanpa aksi (musuh, Kael diambil alih).
export function beginTurn(s) {
  while (s.queue.length && !s.over) {
    const f = byId(s, s.queue.shift());
    if (!alive(f)) continue;
    if (f.st.defTurun && --f.st.defTurun.t <= 0) delete f.st.defTurun;
    f.st.bertahan = false;
    if (f.st.hang) { f.st.hang = false; log(s, `${f.nama} Hang, giliran lewat`); continue; }
    if (f.side === "musuh") return { actor: f, auto: true };
    f.en = Math.min(s.d.en.max, f.en + s.d.en.regen);
    if (f.st.kebalRetas) f.st.kebalRetas--;
    if (f.key === "kael") {
      if (emAlive(s)) addKes(s, f, -s.d.kesadaran.perGiliranEM);
      if (f.st.diambil) return { actor: f, auto: true };
      if (tingkat(f.kesadaran) === "goyah" && s.rng() < s.d.kesadaran.goyahSkip) { log(s, "Kael goyah, giliran lewat"); f.st.retas = null; continue; }
    }
    return { actor: f, auto: false, glitch: f.st.retas || null, balapan: f.key === "nino" && s.serbu && bosDiBelakangNino(s) ? "serbu" : null };
  }
  return null;
}

// Peluang Overflow saat naik ke kedalaman `next`, dikurangi efek equipment pemakai.
export function overflowChance(s, next, f) {
  const base = s.d.stack.overflow[next - 1] || 0;
  return Math.max(0, base - (f?.efek?.includes("overflow_ringan") ? 0.05 : 0));
}

// Satu tap Ulangi. Hasil { ok, depth }. ok false berarti Overflow.
export function ulangi(s, depth, f) {
  const next = depth + 1;
  if (next > 4) return { ok: true, depth };
  return s.rng() < overflowChance(s, next, f) ? { ok: false, depth: next } : { ok: true, depth: next };
}

// Aksi yang dibatasi saat Kael kritis.
export function allowed(s, f) {
  const all = ["serang", "skill", "barang", "bertahan", "mundur"];
  if (f.key === "kael" && tingkat(f.kesadaran) === "kritis") return ["bertahan", "barang", "skill:tahan_diri"];
  return all;
}

// action: { cmd: serang|skill|barang|bertahan|mundur, skill, item, target, depth, overflow }
export function act(s, f, action) {
  if (s.over) return;
  if (f.side === "musuh") enemyAct(s, f);
  else if (f.st.diambil) {
    const ally = party(s).find((p) => p !== f && alive(p)) || f;
    hit(s, f, ally, 0.5, 1);
    if (--f.st.diambil === 0) { f.kesadaran = s.d.kesadaran.pulihSetelahAmbil; log(s, "Kael sadar kembali"); }
  } else partyAct(s, f, action);
  checkOver(s);
}

function partyAct(s, f, a) {
  f.st.retas = null;
  const depth = a.depth || 1, mult = s.d.stack.mult[depth - 1];
  const tgt = a.target ? byId(s, a.target) : null;
  if (a.cmd === "serang") {
    if (a.overflow) return overflow(s, f, depth);
    hit(s, f, tgt, mult, depth);
  } else if (a.cmd === "bertahan") {
    f.st.bertahan = true; f.en = Math.min(s.d.en.max, f.en + s.d.en.bertahan); log(s, `${f.nama} Bertahan`);
  } else if (a.cmd === "mundur") {
    if (enemies(s).some((e) => e.bos)) return log(s, "Tidak bisa mundur dari bos");
    if (s.rng() < s.d.mundur) { s.over = "mundur"; log(s, "Berhasil mundur"); } else log(s, "Gagal mundur");
  } else if (a.cmd === "barang") {
    const it = s.d.item[a.item];
    if (!it || !(s.items[a.item] > 0)) return log(s, "Barang habis");
    s.items[a.item]--;
    const t = tgt || f;
    if (it.hp) t.hp = Math.min(t.maxHp, t.hp + it.hp);
    if (it.en) t.en = Math.min(s.d.en.max, t.en + it.en);
    if (it.kesadaran) addKes(s, byId(s, "kael"), it.kesadaran);
    log(s, `${f.nama} pakai ${it.nama}`);
  } else if (a.cmd === "skill") {
    const sk = s.d.skill[a.skill];
    if (!sk || f.en < sk.en) return log(s, "EN kurang");
    f.en -= sk.en;
    if (a.overflow && sk.stack) return overflow(s, f, depth);
    const m = sk.stack ? mult : 1;
    if (a.skill === "putus_sinyal") {
      hit(s, f, tgt, m * (sk.multPerTipe[tgt.tipe] || sk.mult), depth);
      if (tgt.terkendali && tgt.hp > 0 && tgt.hp < tgt.maxHp * sk.bebasDiBawah) { tgt.bebas = true; log(s, `${tgt.nama} dibebaskan`); }
    } else if (a.skill === "pindai") { tgt.st.defTurun = { n: sk.defTurun, t: sk.durasi }; log(s, `${tgt.nama} dipindai, DEF turun`); }
    else if (a.skill === "patch") { for (const p of party(s)) { p.st.retas = null; p.st.kebalRetas = sk.kebalRetas; } log(s, "Patch: layar bersih"); }
    else if (a.skill === "jangkar") { const t = tgt || f; if (alive(t)) { const h = Math.round((sk.heal + sk.healPerLevel * f.level) * m); t.hp = Math.min(t.maxHp, t.hp + h); log(s, `Jangkar ${t.nama} +${h}`); } }
    else if (a.skill === "tahan_diri") { addKes(s, f, sk.kesadaran); log(s, "Kael menahan diri"); }
  }
}

function overflow(s, f, depth) {
  log(s, `Overflow! Aksi ${f.nama} batal`);
  if (depth >= 4) { f.st.hang = true; log(s, `${f.nama} Hang`); }
}

function enemyAct(s, e) {
  if (!e.intent) planIntent(s, e);
  const { act: a, target } = e.intent;
  e.intent = null;
  if (a === "mengisi") { e.depth++; log(s, `${e.nama} Mengisi (kedalaman ${e.depth})`); return; }
  const targets = party(s).filter(alive);
  const t = targets.find((p) => p.id === target) || pick(s, targets);
  if (!t) return;
  if (a === "lepas") { const d = e.depth; e.depth = 1; hit(s, e, t, s.d.stack.mult[d - 1], d); return; }
  if (a === "retas") {
    hit(s, e, t, s.d.retas.damage, 1);
    if (!t.st.kebalRetas && t.hp > 0) { t.st.retas = pick(s, s.d.bab[s.bab]?.glitch || ["tukar"]); log(s, `Layar ${t.nama} diretas (${t.st.retas})`); }
    return;
  }
  hit(s, e, t, 1, 1);
}

// Dengar: aksi gratis Kael, sekali per ronde. Mengembalikan rencana musuh yang tampil di kartu.
export function dengar(s) {
  const k = byId(s, "kael"), lvl = tingkat(k.kesadaran);
  if (!alive(k) || lvl === "diambil" || s.dengar) return null;
  addKes(s, k, -s.d.kesadaran.dengar);
  const acts = ["serang", "mengisi", "lepas", "retas"];
  s.dengar = enemies(s).filter(alive).map((e) => {
    let { act: a, target } = e.intent || {};
    if (lvl === "kritis" && s.rng() < 0.3) { a = pick(s, acts.filter((x) => x !== a)); target = pick(s, party(s)).id; }
    return { id: e.id, act: a, target, distorsi: lvl !== "stabil" };
  });
  return s.dengar;
}
