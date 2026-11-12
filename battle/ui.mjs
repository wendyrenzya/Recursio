// Layar battle di DOM, di atas dunia 3D. Logika aturan seluruhnya di engine.mjs.
import { DATA } from "./data.mjs";
import { createBattle, startRound, beginTurn, act, ulangi, dengar, allowed, alive, party, enemies, byId, tingkat } from "./engine.mjs";

const CSS = `
#bt { position: absolute; inset: 0; z-index: 5; color: #f2f2ff; display: flex; flex-direction: column; gap: 0.5em; padding: 0.7em 0.7em 0.9em; box-sizing: border-box;
      background: radial-gradient(ellipse at 50% 30%, rgba(40,30,80,0.82), rgba(8,8,20,0.94)); user-select: none; -webkit-user-select: none; touch-action: manipulation; }
#bt * { box-sizing: border-box; }
#bt .queue { display: flex; gap: 0.3em; justify-content: center; flex-wrap: wrap; font-size: 0.7em; min-height: 1.7em; }
#bt .chip { padding: 0.15em 0.6em; border-radius: 99px; background: rgba(255,255,255,0.1); }
#bt .chip.p { background: rgba(110,170,255,0.25); } #bt .chip.m { background: rgba(255,90,140,0.22); }
#bt .chip.now { outline: 2px solid #ffd76a; }
#bt .foes { flex: 1; display: flex; gap: 0.6em; justify-content: center; align-items: center; }
#bt .card { position: relative; border-radius: 0.8em; padding: 0.5em; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.14); transition: transform 0.15s; }
#bt .foe { width: 46%; max-width: 9em; text-align: center; }
#bt .card.pick { border-color: #ffd76a; box-shadow: 0 0 0.8em rgba(255,215,106,0.6); cursor: pointer; animation: btPulse 0.9s infinite; }
#bt .card.down { opacity: 0.3; }
#bt .card.hit { animation: btShake 0.3s; }
#bt .blob { height: 4.6em; margin: 0 auto 0.3em; width: 4.6em; border-radius: 50%; position: relative;
            background: radial-gradient(circle at 40% 35%, #fff 0 6%, #7af 14%, #536 55%, transparent 70%); filter: drop-shadow(0 0 0.6em #8cf); animation: btGlitch 1.2s steps(6) infinite; }
#bt .blob::before, #bt .blob::after { content: ""; position: absolute; inset: 0; border-radius: 50%; mix-blend-mode: screen; }
#bt .blob::before { background: radial-gradient(circle, rgba(255,0,170,0.7), transparent 60%); transform: translateX(-6%); }
#bt .blob::after { background: radial-gradient(circle, rgba(0,255,230,0.6), transparent 60%); transform: translateX(6%); }
#bt .blob.boss { width: 6.4em; height: 6.4em; }
#bt .nm { font-weight: 800; font-size: 0.78em; }
#bt .bar { height: 0.45em; border-radius: 99px; background: rgba(0,0,0,0.45); overflow: hidden; margin-top: 0.25em; }
#bt .bar i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #5be37d, #b9f56a); transition: width 0.3s; }
#bt .bar.k i { background: linear-gradient(90deg, #8a7bff, #c5a8ff); }
#bt .bar.e i { background: linear-gradient(90deg, #40c4ff, #8ae7ff); }
#bt .sm { font-size: 0.66em; opacity: 0.85; }
#bt .pips { letter-spacing: 0.1em; color: #ff8fb0; font-size: 0.75em; }
#bt .intent { font-size: 0.68em; margin-top: 0.2em; min-height: 1.3em; color: #ffe08a; }
#bt .intent.dist { color: #c7a8ff; filter: blur(0.4px); letter-spacing: 0.08em; }
#bt .pop { position: absolute; left: 50%; top: 20%; transform: translateX(-50%); font-weight: 800; font-size: 1.3em; color: #fff; text-shadow: 0 0.1em 0.3em #000;
           animation: btPop 0.9s forwards; pointer-events: none; }
#bt .pop.heal { color: #8ff5a8; }
#bt .msg { min-height: 2.6em; text-align: center; font-size: 0.8em; line-height: 1.3; padding: 0 0.4em; }
#bt .party { display: flex; gap: 0.5em; }
#bt .pc { flex: 1; }
#bt .pc.now { border-color: #ffd76a; background: rgba(255,215,106,0.12); }
#bt .pc .row { display: flex; justify-content: space-between; align-items: baseline; }
#bt .lvl { font-size: 0.62em; padding: 0.05em 0.5em; border-radius: 99px; background: rgba(255,255,255,0.12); }
#bt .lvl.goyah { background: #8a5a20; } #bt .lvl.kritis { background: #9a2a3a; } #bt .lvl.diambil { background: #4a1060; }
#bt .cmds { display: grid; grid-template-columns: 1fr 1fr; gap: 0.45em; min-height: 8.6em; align-content: end; position: relative; }
#bt button { font: inherit; font-weight: 800; color: #1d1830; border: 0; border-radius: 0.7em; padding: 0.7em 0.4em; background: linear-gradient(#fff3c9, #f2c95a);
             box-shadow: 0 0.2em 0 #a5781e; touch-action: manipulation; }
#bt button:active { transform: translateY(0.15em); box-shadow: none; }
#bt button:disabled { opacity: 0.35; }
#bt button.alt { background: linear-gradient(#e2e6ff, #a9b2e8); box-shadow: 0 0.2em 0 #5a6198; }
#bt button.wide { grid-column: 1 / -1; }
#bt button .c { font-size: 0.72em; opacity: 0.75; margin-left: 0.3em; }
#bt .dengar { position: absolute; right: 0.7em; top: 2.6em; font-size: 0.72em; padding: 0.5em 0.8em; background: linear-gradient(#e7dcff, #a891f0); box-shadow: 0 0.2em 0 #5b47a6; }
#bt .depth { grid-column: 1 / -1; text-align: center; }
#bt .depth b { font-size: 1.9em; display: block; line-height: 1.1; }
#bt .hack { grid-column: 1 / -1; text-align: center; font-size: 0.72em; color: #ff8fb0; font-weight: 800; }
#bt .timer { grid-column: 1 / -1; height: 0.35em; border-radius: 99px; background: rgba(255,255,255,0.15); overflow: hidden; }
#bt .timer i { display: block; height: 100%; background: #ff5c8a; }
#bt .cmds.hacked { filter: hue-rotate(-30deg) saturate(1.4); }
#bt .big { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.8em; background: rgba(6,6,16,0.75); z-index: 2; }
#bt .big h2 { margin: 0; font-size: 1.8em; }
#bt .flash { position: absolute; left: 0; right: 0; top: 42%; text-align: center; font-size: 1.6em; font-weight: 800; color: #ff5c8a; text-shadow: 0 0 0.5em #f06; animation: btPop 0.9s forwards; pointer-events: none; z-index: 3; }
@keyframes btPulse { 50% { transform: scale(1.04); } }
@keyframes btShake { 25% { transform: translateX(-0.3em); } 75% { transform: translateX(0.3em); } }
@keyframes btPop { 0% { opacity: 0; transform: translate(-50%, 0.4em); } 20% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -1.6em); } }
#bt .flash { animation-name: btFlash; } @keyframes btFlash { 0% { opacity: 0; transform: scale(0.8); } 20% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0; } }
@keyframes btGlitch { 0%,100% { transform: translate(0,0); } 20% { transform: translate(-3%,1%) skewX(4deg); } 40% { transform: translate(2%,-1%); } 60% { transform: translate(-1%,0) skewX(-6deg); } 80% { transform: translate(3%,2%); } }
`;

const ACT = { serang: "Serang", mengisi: "Mengisi", lepas: "Lepas", retas: "Retas" };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const fmt = (x) => String(x).replace(".", ",");

// opts: { bab, musuh, party, items, speed }. Hasil Promise: "menang" | "kalah" | "mundur".
export function openBattle(host, opts) {
  if (!document.getElementById("btCss")) { const st = el("style"); st.id = "btCss"; st.textContent = CSS; document.head.appendChild(st); }
  const speed = opts.speed ?? 1;
  const root = el("div"); root.id = "bt";
  const qEl = el("div", "queue"), foesEl = el("div", "foes"), msgEl = el("div", "msg"), partyEl = el("div", "party"), cmdEl = el("div", "cmds");
  const dengarBtn = el("button", "dengar", "Dengar");
  root.append(qEl, foesEl, msgEl, partyEl, cmdEl, dengarBtn);
  host.appendChild(root);

  let s, cards = {}, logI = 0, current = null, picking = null;
  const pause = (ms) => wait(ms * speed);

  function build() {
    s = createBattle({ bab: opts.bab, musuh: opts.musuh, party: opts.party, items: opts.items });
    foesEl.innerHTML = ""; partyEl.innerHTML = ""; cards = {}; logI = 0;
    for (const f of s.fighters) {
      const c = el("div", "card " + (f.side === "musuh" ? "foe" : "pc"));
      c.dataset.id = f.id;
      if (f.side === "musuh") c.innerHTML = `<div class="blob${f.bos ? " boss" : ""}"></div><div class="nm"></div><div class="bar"><i></i></div><div class="pips"></div><div class="intent"></div>`;
      else c.innerHTML = `<div class="row"><span class="nm"></span><span class="sm hp"></span></div><div class="bar"><i></i></div>
        <div class="row" style="margin-top:0.3em"><span class="sm">EN <b class="en"></b></span>${f.key === "kael" ? '<span class="lvl"></span>' : ""}</div>
        ${f.key === "kael" ? '<div class="bar k"><i></i></div>' : '<div class="bar e"><i></i></div>'}`;
      c.addEventListener("pointerdown", (e) => { e.stopPropagation(); if (picking && c.classList.contains("pick")) { const p = picking; picking = null; p(f.id); } });
      (f.side === "musuh" ? foesEl : partyEl).appendChild(c);
      cards[f.id] = c;
    }
  }

  function refresh() {
    for (const f of s.fighters) {
      const c = cards[f.id];
      c.querySelector(".nm").textContent = f.nama;
      c.querySelector(".bar i").style.width = (100 * f.hp / f.maxHp) + "%";
      c.classList.toggle("down", !alive(f));
      if (f.side === "musuh") {
        c.querySelector(".pips").textContent = "●".repeat(f.depth) + "○".repeat(4 - f.depth);
        const it = c.querySelector(".intent"), seen = s.dengar?.find((d) => d.id === f.id);
        it.className = "intent" + (seen?.distorsi ? " dist" : "");
        it.textContent = !alive(f) ? (f.bebas ? "Dibebaskan" : "") : seen ? `${ACT[seen.act]}${seen.target ? " > " + byId(s, seen.target).nama : ""}` : "?";
      } else {
        c.querySelector(".hp").textContent = `${f.hp}/${f.maxHp}`;
        c.querySelector(".en").textContent = f.en;
        c.classList.toggle("now", current === f);
        if (f.key === "kael") {
          const t = tingkat(f.kesadaran), lv = c.querySelector(".lvl");
          lv.className = "lvl " + t; lv.textContent = `${{ stabil: "Stabil", goyah: "Goyah", kritis: "Kritis", diambil: "Diambil alih" }[t]} ${f.kesadaran}`;
          c.querySelector(".bar.k i").style.width = f.kesadaran + "%";
        } else c.querySelector(".bar.e i").style.width = (10 * f.en) + "%";
      }
    }
    qEl.innerHTML = "";
    const order = [current?.id, ...s.queue].filter(Boolean);
    order.forEach((id, i) => { const f = byId(s, id); if (f && alive(f)) qEl.appendChild(el("span", `chip ${f.side === "party" ? "p" : "m"}${i === 0 && current ? " now" : ""}`, f.nama)); });
    const k = byId(s, "kael");
    dengarBtn.disabled = !!s.dengar || !alive(k) || tingkat(k.kesadaran) === "diambil" || !!s.over;
  }

  function flushLog() {
    const lines = s.log.slice(logI); logI = s.log.length;
    if (lines.length) msgEl.textContent = lines.join(" | ");
    for (const l of lines) if (l.startsWith("Overflow")) { const f = el("div", "flash", "OVERFLOW!"); root.appendChild(f); setTimeout(() => f.remove(), 900); }
  }

  // jalankan aksi lalu tampilkan angka damage atau pulih di kartu yang berubah
  function doAct(f, action) {
    const before = Object.fromEntries(s.fighters.map((x) => [x.id, x.hp]));
    act(s, f, action);
    for (const x of s.fighters) {
      const d = x.hp - before[x.id];
      if (!d) continue;
      const c = cards[x.id], p = el("div", "pop" + (d > 0 ? " heal" : ""), (d > 0 ? "+" : "") + d);
      c.appendChild(p); setTimeout(() => p.remove(), 900);
      if (d < 0) { c.classList.remove("hit"); void c.offsetWidth; c.classList.add("hit"); }
    }
    flushLog(); refresh();
  }

  function pick(filter) {
    for (const f of s.fighters) cards[f.id].classList.toggle("pick", filter(f));
    return new Promise((res) => { picking = (id) => { for (const c of Object.values(cards)) c.classList.remove("pick"); res(id); }; });
  }
  const clearPick = () => { picking = null; for (const c of Object.values(cards)) c.classList.remove("pick"); };

  function buttons(list, hacked) {
    cmdEl.innerHTML = ""; cmdEl.classList.toggle("hacked", !!hacked);
    return new Promise((res) => {
      for (const b of list) {
        if (b.html) { cmdEl.appendChild(el("div", b.cls, b.html)); continue; }
        const btn = el("button", b.cls || "", b.label + (b.cost != null ? `<span class="c">${b.cost}</span>` : ""));
        btn.disabled = !!b.disabled; btn.dataset.v = b.v;
        btn.addEventListener("pointerdown", (e) => { e.stopPropagation(); if (!btn.disabled) res(b.v); });
        cmdEl.appendChild(btn);
      }
    });
  }

  // Stack: Ulangi naik satu kedalaman dengan undian Overflow, Selesai melepas aksi
  async function stackPhase() {
    let depth = 1;
    for (;;) {
      const next = depth + 1, chance = DATA.stack.overflow[next - 1];
      const v = await buttons([
        { html: `<span class="sm">Kedalaman</span><b>${depth} | x${fmt(DATA.stack.mult[depth - 1])}</b>`, cls: "depth" },
        { label: depth < 4 ? `Ulangi` : "Maksimum", cost: depth < 4 ? `${Math.round(chance * 100)}%` : null, v: "u", disabled: depth >= 4, cls: "alt" },
        { label: "Selesai", v: "s" },
      ]);
      if (v === "s") return { depth, overflow: false };
      const r = ulangi(s, depth);
      if (!r.ok) return { depth: r.depth, overflow: true };
      depth = r.depth;
    }
  }

  async function playerTurn(f, glitch) {
    const ok = allowed(s, f), foes = (x) => x.side === "musuh" && alive(x), allies = (x) => x.side === "party" && alive(x);
    const bos = enemies(s).some((e) => e.bos);
    let timer = null, timedOut = false;
    const stopTimer = () => { if (timer) { clearInterval(timer.id); timer = null; } };
    if (glitch) {
      const t0 = performance.now();
      timer = { id: setInterval(() => {
        const left = 1 - (performance.now() - t0) / 6000, bar = cmdEl.querySelector(".timer i");
        if (bar) bar.style.width = Math.max(0, left * 100) + "%";
        if (left <= 0) { stopTimer(); timedOut = true; clearPick(); cmdEl.dispatchEvent(new Event("timeout")); }
      }, 50) };
    }
    const timeoutP = new Promise((res) => cmdEl.addEventListener("timeout", () => res("timeout"), { once: true }));
    const race = (p) => Promise.race([p, timeoutP]);

    for (;;) {
      let main = [
        { label: "Serang", v: "serang", disabled: !ok.includes("serang") },
        { label: "Skill", v: "skill", disabled: !ok.includes("skill") && !ok.some((x) => x.startsWith("skill:")) },
        { label: "Barang", v: "barang", disabled: !ok.includes("barang") || !Object.values(s.items).some((n) => n > 0) },
        { label: "Bertahan", v: "bertahan" },
        { label: "Mundur", v: "mundur", disabled: bos || !ok.includes("mundur"), cls: "wide alt" },
      ];
      if (glitch === "tukar") {   // dua tombol bertukar posisi, label tetap benar
        const a = Math.floor(s.rng() * 4); let b = Math.floor(s.rng() * 3); if (b >= a) b++;
        [main[a], main[b]] = [main[b], main[a]];
      }
      const head = glitch ? [{ html: "LAYAR DIRETAS | Tukar", cls: "hack" }, { html: "<i></i>", cls: "timer" }] : [];
      const v = await race(buttons([...head, ...main], glitch));
      if (v === "timeout") return doAct(f, { cmd: "bertahan" });
      if (v === "bertahan" || v === "mundur") { stopTimer(); return doAct(f, { cmd: v }); }
      if (v === "serang") {
        msgEl.textContent = "Pilih musuh";
        const back = buttons([{ label: "Kembali", v: "back", cls: "wide alt" }]);
        const t = await race(Promise.race([pick(foes), back]));
        clearPick();
        if (t === "timeout") return doAct(f, { cmd: "bertahan" });
        if (t === "back") continue;
        stopTimer();
        const st = await stackPhase();
        return doAct(f, { cmd: "serang", target: t, ...st });
      }
      if (v === "skill") {
        const list = DATA.karakter[f.key].skills.map((id) => {
          const sk = DATA.skill[id];
          return { label: sk.nama, cost: `EN ${sk.en}`, v: id, disabled: f.en < sk.en || (!ok.includes("skill") && !ok.includes("skill:" + id)) };
        });
        const id = await race(buttons([...list, { label: "Kembali", v: "back", cls: "wide alt" }]));
        if (id === "timeout") return doAct(f, { cmd: "bertahan" });
        if (id === "back") continue;
        const sk = DATA.skill[id];
        let target = null;
        if (sk.target === "musuh" || sk.target === "sekutu") {
          msgEl.textContent = sk.target === "musuh" ? "Pilih musuh" : "Pilih sekutu";
          const back = buttons([{ label: "Kembali", v: "back", cls: "wide alt" }]);
          target = await race(Promise.race([pick(sk.target === "musuh" ? foes : allies), back]));
          clearPick();
          if (target === "timeout") return doAct(f, { cmd: "bertahan" });
          if (target === "back") continue;
        }
        stopTimer();
        const st = sk.stack ? await stackPhase() : {};
        return doAct(f, { cmd: "skill", skill: id, target, ...st });
      }
      if (v === "barang") {
        const list = Object.entries(DATA.item).filter(([id]) => s.items[id] > 0)
          .map(([id, it]) => ({ label: it.nama, cost: `x${s.items[id]}`, v: id }));
        const id = await race(buttons([...list, { label: "Kembali", v: "back", cls: "wide alt" }]));
        if (id === "timeout") return doAct(f, { cmd: "bertahan" });
        if (id === "back") continue;
        let target = DATA.item[id].target === "kael" ? "kael" : null;
        if (!target) {
          msgEl.textContent = "Pilih sekutu";
          const back = buttons([{ label: "Kembali", v: "back", cls: "wide alt" }]);
          target = await race(Promise.race([pick(allies), back]));
          clearPick();
          if (target === "timeout") return doAct(f, { cmd: "bertahan" });
          if (target === "back") continue;
        }
        stopTimer();
        return doAct(f, { cmd: "barang", item: id, target });
      }
    }
  }

  dengarBtn.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    if (dengarBtn.disabled) return;
    if (dengar(s)) { flushLog(); msgEl.textContent = "Kael mendengar bisikan..."; refresh(); }
  });

  async function loop() {
    build(); refresh();
    msgEl.textContent = enemies(s).map((e) => e.nama).join(" dan ") + " muncul!";
    await pause(900);
    while (!s.over) {
      startRound(s); current = null; refresh();
      let t;
      while (!s.over && (t = beginTurn(s))) {
        current = t.actor; flushLog(); refresh();
        if (t.auto) { cmdEl.innerHTML = ""; await pause(650); doAct(t.actor, null); await pause(700); }
        else await playerTurn(t.actor, t.glitch);
        if (!s.over) await pause(250);
      }
      flushLog();
    }
    current = null; refresh(); cmdEl.innerHTML = "";
    await pause(500);
    const big = el("div", "big");
    if (s.over === "menang") {
      const xp = enemies(s).reduce((a, e) => a + e.xp, 0);
      big.innerHTML = `<h2>Menang!</h2><div>XP +${xp}</div>`;
    } else big.innerHTML = s.over === "kalah" ? `<h2>Kalah...</h2><div class="sm">Nino dan Kael pingsan</div>` : `<h2>Kabur</h2>`;
    root.appendChild(big);
    const choices = s.over === "kalah" ? [["Coba lagi", "retry"], ["Kembali", "back"]] : [["Lanjut", "back"]];
    const v = await new Promise((res) => choices.forEach(([label, v]) => {
      const b = el("button", v === "back" && choices.length > 1 ? "alt" : "", label); b.style.minWidth = "9em"; b.dataset.v = v;
      b.addEventListener("pointerdown", (e) => { e.stopPropagation(); res(v); }); big.appendChild(b);
    }));
    big.remove();
    if (v === "retry") return loop();
    root.remove();
    return s.over;
  }
  const result = loop();
  result.state = () => s;
  return result;
}
