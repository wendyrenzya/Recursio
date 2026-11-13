// Simulasi keseimbangan: node tools/sim.mjs [jumlah] [seed]
// Strategi pemain sederhana: berhenti di kedalaman 2, tanpa Dengar, tanpa Balapan.
import { DATA } from "../battle/data.mjs";
import { createBattle, startRound, beginTurn, act, balapan, ulangi, alive, party, enemies, byId, tingkat, mulberry32 } from "../battle/engine.mjs";

const N = +process.argv[2] || 1000, SEED = +process.argv[3] || 1;
const SALAH_RETAS = 0.1; // peluang pemain salah tap saat layar diretas (giliran jadi Bertahan)
const MENANG_BALAPAN = 0.8; // pemain menang 80 persen Balapan (kriteria uji di HP), Salip tidak dipakai
const MAX_RONDE = 40;

function stack(s, want) {
  let depth = 1;
  while (depth < want) { const r = ulangi(s, depth); depth = r.depth; if (!r.ok) return { depth, overflow: true }; }
  return { depth, overflow: false };
}

function decide(s, f) {
  const foes = enemies(s).filter(alive);
  const nino = byId(s, "nino"), kael = byId(s, "kael");
  // Sela: musuh yang Mengisi di kedalaman 2 diincar duluan; selain itu HP terendah.
  const target = foes.find((e) => e.depth === 2) || foes.reduce((a, b) => (a.hp <= b.hp ? a : b));
  const low = party(s).filter(alive).find((p) => p.hp < p.maxHp * 0.4);
  if (f.st.retas && s.rng() < SALAH_RETAS) return { cmd: "bertahan" };
  if (f.key === "kael") {
    const lvl = tingkat(f.kesadaran);
    if (low && f.en >= 3 && lvl !== "kritis") return { cmd: "skill", skill: "jangkar", target: low.id, ...stack(s, 1) };
    if (lvl !== "stabil" && f.en >= 2) return { cmd: "skill", skill: "tahan_diri" };
    if (lvl === "kritis") return { cmd: "bertahan" };
    if (low && s.items.kopi_kaleng > 0) return { cmd: "barang", item: "kopi_kaleng", target: low.id };
    return { cmd: "serang", target: target.id, ...stack(s, 2) };
  }
  if (low && f.hp < f.maxHp * 0.3 && s.items.kopi_kaleng > 0) return { cmd: "barang", item: "kopi_kaleng", target: f.id };
  if (f.st.retas && f.en >= 2 && target.tipe === "em" && foes.length > 1) return { cmd: "skill", skill: "patch" };
  if (f.en >= 4) return { cmd: "skill", skill: "putus_sinyal", target: target.id, ...stack(s, 2) };
  return { cmd: "serang", target: target.id, ...stack(s, 2) };
}

export function run(bab, keys, items, seed) {
  const cfg = DATA.bab[bab];
  const s = createBattle({ bab, musuh: keys, party: { nino: { level: cfg.level }, kael: { level: cfg.level } }, items, rng: mulberry32(seed) });
  while (!s.over && s.round < MAX_RONDE) {
    startRound(s);
    let t;
    while (!s.over && (t = beginTurn(s))) {
      if (t.balapan && !balapan(s, s.rng() < MENANG_BALAPAN)) continue;   // kalah Balapan: giliran Nino batal
      act(s, t.actor, t.auto ? null : decide(s, t.actor));
    }
  }
  return { win: s.over === "menang", rounds: s.round, hpLeft: party(s).reduce((a, p) => a + p.hp, 0) / party(s).reduce((a, p) => a + p.maxHp, 0) };
}

if (import.meta.url === `file://${process.argv[1]}`) main();
function main() {
const target = { biasa: [70, 90], bos: [50, 70] };
const rows = [];
let pass = true;
for (const bab of Object.keys(DATA.bab).map(Number)) {
  for (const jenis of ["biasa", "bos"]) {
    const items = jenis === "bos" ? { kopi_kaleng: 2 } : {};
    let w = 0, r = 0, hp = 0;
    for (let i = 0; i < N; i++) { const o = run(bab, DATA.bab[bab][jenis], items, SEED * 100003 + bab * 7919 + i * 31 + (jenis === "bos" ? 17 : 0)); w += o.win; r += o.rounds; hp += o.hpLeft; }
    const pct = (100 * w) / N, [lo, hi] = target[jenis], ok = pct >= lo && pct <= hi;
    pass &&= ok;
    rows.push(`Bab ${bab} ${jenis.padEnd(5)} | menang ${pct.toFixed(1).padStart(5)}% (target ${lo}-${hi}) ${ok ? "LULUS" : "GAGAL"} | ronde ${(r / N).toFixed(1)} | sisa HP ${(100 * hp / N).toFixed(0)}%`);
  }
}
console.log(rows.join("\n"));
console.log(pass ? "\nSemua lulus" : "\nAda yang gagal");
process.exitCode = pass ? 0 : 1;
}
