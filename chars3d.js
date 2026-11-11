// chars3d.js | karakter 3D low-poly bersegi Recursio
// Gaya: bidang datar tegas, badan dipahat dari potongan bersegi delapan, tangan dan kaki besar,
// rambut bongkahan runcing, mata putih dengan pupil. Lutut dan siku bersendi.
// Langkah diikat ke jarak tempuh agar kaki yang menapak tidak meluncur
// (rumus langkah dan IK dua ruas diadaptasi dari kit biped-walker, viettranx/3dviz-pro-max, MIT).
import * as THREE from "./lib/three.module.min.js";

const mats = {};
const mat = (color, o = {}) => {
  const k = color + JSON.stringify(o);
  return (mats[k] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true, ...o }));
};
function add(parent, geo, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, typeof material === "string" ? mat(material) : material);
  m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Pahatan: kulit yang menghubungkan cincin-cincin bersegi N. Tiap cincin [y, setengah lebar, setengah tebal, geser x, geser z].
// Sisi depan dan belakang berupa bidang datar. u = keliling (tengah depan di UC), v = bawah ke atas.
const N = 8, UC = 0.5 - 0.5 / N;
function loft(rings, capTop = true, capBottom = true) {
  const rs = rings.slice().sort((a, b) => a[0] - b[0]);
  const P = rs.map(([y, rx, rz, cx = 0, cz = 0]) => {
    const row = [];
    for (let i = 0; i <= N; i++) {
      const a = -Math.PI + (i + 0.5) * 2 * Math.PI / N;
      row.push([cx + Math.sin(a) * rx * 1.08, y, cz + Math.cos(a) * rz * 1.08]);
    }
    return row;
  });
  const pos = [], uv = [], y0 = rs[0][0], y1 = rs[rs.length - 1][0];
  const v = (y) => (y - y0) / (y1 - y0 || 1);
  const tri = (a, b, c, ua, ub, uc) => { pos.push(...a, ...b, ...c); uv.push(ua, v(a[1]), ub, v(b[1]), uc, v(c[1])); };
  for (let j = 0; j < P.length - 1; j++) for (let i = 0; i < N; i++) {
    const A = P[j][i], B = P[j][i + 1], C = P[j + 1][i + 1], D = P[j + 1][i], u0 = i / N, u1 = (i + 1) / N;
    tri(A, B, C, u0, u1, u1); tri(A, C, D, u0, u1, u0);
  }
  const cap = (row, up) => {
    const c = [row.reduce((s, p) => s + p[0], 0) / row.length, row[0][1], row.reduce((s, p) => s + p[2], 0) / row.length];
    for (let i = 0; i < N; i++) up ? tri(c, row[i], row[i + 1], 0.5, i / N, (i + 1) / N) : tri(c, row[i + 1], row[i], 0.5, (i + 1) / N, i / N);
  };
  if (capTop) cap(P[P.length - 1], true);
  if (capBottom) cap(P[0], false);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const spike = (r, len, sides = 4) => { const g = new THREE.ConeGeometry(r, len, sides); g.translate(0, len / 2, 0); return g; };   // bongkahan rambut, pangkal di titik asal

// tekstur kain: u = keliling badan dengan tengah depan di UC, v = bawah ke atas
function cloth(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h, UC * w);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

// ---------------------------------------------------------------- matematika langkah
function twoBoneIk(dz, dy, upper, lower, bend) {
  const reach = Math.min(Math.hypot(dz, dy), upper + lower - 0.004);
  const cl = (v) => Math.max(-1, Math.min(1, v));
  const a = Math.acos(cl((reach * reach + upper * upper - lower * lower) / (2 * reach * upper)));
  const b = Math.acos(cl((upper * upper + lower * lower - reach * reach) / (2 * upper * lower)));
  return [Math.atan2(-dz, -dy) + bend * a, -bend * (Math.PI - b)];
}
function footCycle(cycle, span, duty = 0.6, lift = 0.1) {
  const u = cycle - Math.floor(cycle);
  if (u < duty) return [span * (0.5 - u / duty), 0];
  const t = (u - duty) / (1 - duty);
  return [span * (t - 0.5), lift * Math.sin(Math.PI * t)];
}

// ---------------------------------------------------------------- bagian tubuh
const THIGH = 0.27, SHIN = 0.27, FOOT = 0.08, HIP = THIGH + SHIN + FOOT, UPPER = 0.22, FORE = 0.2;

function buildLeg(hips, side, o) {
  const hip = new THREE.Group(), knee = new THREE.Group(), foot = new THREE.Group();
  hip.position.set(side * 0.105, 0, 0); knee.position.y = -THIGH; foot.position.y = -SHIN;
  hips.add(hip); hip.add(knee); knee.add(foot);
  const m = o.bareLegs ? o.skin : o.pants;
  add(hip, loft([[0.03, 0.108, 0.118], [-0.12, 0.106, 0.114], [-THIGH, 0.086, 0.092]]), m);
  add(knee, loft([[0.01, 0.088, 0.094], [-0.1, 0.098, 0.106, 0, -0.012], [-SHIN + 0.03, 0.074, 0.078], [-SHIN, o.cuffFlare ? 0.094 : 0.072, o.cuffFlare ? 0.098 : 0.076]]), m);
  if (o.cuff) add(knee, loft([[-SHIN + 0.05, 0.082, 0.086], [-SHIN, 0.082, 0.086]]), o.cuff);
  // sepatu atau kaki besar bersegi
  add(foot, loft([[-FOOT + 0.025, 0.09, 0.155, 0, 0.055], [-0.01, 0.082, 0.14, 0, 0.05], [0.03, 0.068, 0.085, 0, 0.0]]), o.shoe);
  add(foot, loft([[-FOOT, 0.097, 0.165, 0, 0.055], [-FOOT + 0.028, 0.097, 0.165, 0, 0.055]]), o.sole);
  return { hip, knee, foot };
}

function buildArm(torso, side, o) {
  const shoulder = new THREE.Group(), elbow = new THREE.Group();
  shoulder.position.set(side * (0.235 + (o.bulk || 0)), 0.385, 0); elbow.position.y = -UPPER;
  shoulder.rotation.z = side * 0.13;
  torso.add(shoulder); shoulder.add(elbow);
  const b = o.bulk || 0;
  add(shoulder, loft([[0.045, 0.062 + b, 0.07 + b], [-0.02, 0.08 + b, 0.085 + b], [-0.12, 0.074 + b, 0.078 + b], [-UPPER, 0.06 + b, 0.064 + b]]), o.sleeve);
  add(elbow, loft([[0.01, 0.06 + b, 0.064 + b], [-0.07, 0.072 + b, 0.076 + b], [-FORE, 0.056 + b, 0.058 + b]]), o.shortSleeve ? o.skin : o.sleeve);
  if (o.armBand) add(shoulder, loft([[-0.1, 0.079 + b, 0.084 + b], [-0.135, 0.077 + b, 0.082 + b]], false, false), o.armBand);
  if (o.wristBand) add(elbow, loft([[-FORE + 0.045, 0.062 + b, 0.066 + b], [-FORE - 0.005, 0.062 + b, 0.066 + b]]), o.wristBand);
  add(elbow, loft([[-FORE + 0.01, 0.05, 0.05], [-FORE - 0.045, 0.07, 0.064], [-FORE - 0.105, 0.064, 0.058], [-FORE - 0.13, 0.036, 0.036]]), o.skin);   // kepalan tangan besar
  return { shoulder, elbow };
}

// kepala dipahat: dagu, rahang, pipi, pelipis, ubun-ubun
const HEAD_RINGS = [[0, 0.07, 0.085, 0, 0.035], [0.05, 0.135, 0.145, 0, 0.018], [0.14, 0.172, 0.178], [0.26, 0.182, 0.188], [0.36, 0.166, 0.176], [0.42, 0.112, 0.124], [0.445, 0.03, 0.04]];
function buildFace(head, o) {
  const dark = mat("#2a1d2e", { roughness: 0.4 }), shine = mat("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.5 });
  const blush = mat("#f08a84", { transparent: true, opacity: 0.5 });
  const eyes = [], Z = 0.2;
  for (const side of [-1, 1]) {
    const e = new THREE.Group();
    e.position.set(side * 0.086, 0.172, Z);
    head.add(e);
    // mata gelap besar tanpa putih di sekelilingnya, dengan kilau besar dan garis kelopak atas
    add(e, new THREE.CircleGeometry(0.046, 8), dark, [0, 0, 0], [0, 0, Math.PI / 8], [0.9, o.sleepy ? 0.7 : 1.18, 1]);
    add(e, new THREE.CircleGeometry(0.017, 6), shine, [-0.014, o.sleepy ? 0.004 : 0.022, 0.004]);
    add(e, new THREE.CircleGeometry(0.008, 6), shine, [0.014, o.sleepy ? -0.014 : -0.02, 0.004]);
    add(e, box(0.1, 0.014, 0.012), dark, [side * 0.004, o.sleepy ? 0.006 : 0.05, 0.004], [0, 0, side * -0.12]);
    if (o.sleepy) add(e, box(0.11, 0.05, 0.01), o.skin, [0, 0.037, 0.003]);                          // kelopak setengah menutup
    if (o.lashes) add(e, box(0.04, 0.012, 0.01), dark, [side * 0.056, 0.058, 0.004], [0, 0, side * 0.7]);
    add(head, box(0.07, 0.018, 0.02), o.hair2, [side * 0.088, o.sleepy ? 0.25 : 0.262, Z + 0.002], [0, 0, side * (o.sleepy ? 0.1 : -0.1)]);   // alis lembut
    add(head, new THREE.CircleGeometry(0.03, 8), blush, [side * 0.112, 0.112, Z - 0.014]);          // pipi merona
    add(head, loft([[0.15, 0.03, 0.045], [0.21, 0.04, 0.05], [0.25, 0.028, 0.04]]), o.skin, [side * 0.188, 0, -0.02]);   // telinga
    eyes.push(e);
  }
  add(head, box(0.03, 0.028, 0.03), o.skin2, [0, 0.122, Z - 0.008], [0.4, 0, 0]);                  // hidung kecil
  add(head, box(0.042, 0.011, 0.012), "#8a3f38", [0, 0.07, Z - 0.014]);                           // senyum
  for (const side of [-1, 1]) add(head, box(0.012, 0.012, 0.012), "#8a3f38", [side * 0.027, 0.078, Z - 0.016]);
  return eyes;
}

// ---------------------------------------------------------------- rambut bersegi
// tiap bongkah: [x, y, z, putar x, putar z, radius, panjang]
function tufts(head, color, list) { for (const [x, y, z, rx, rz, r, len] of list) add(head, spike(r * 1.5, len * 0.85), color, [x, y, z], [rx, 0, rz], [1, 1, 0.6]); }
const HAIR = {
  spiky(head, o) {
    add(head, loft([[0.275, 0.196, 0.2, 0, -0.012], [0.34, 0.2, 0.205, 0, -0.012], [0.42, 0.15, 0.16, 0, -0.012], [0.47, 0.05, 0.06, 0, -0.012]]), o.hair);   // tutup kepala
    add(head, loft([[0.1, 0.16, 0.09, 0, -0.118], [0.2, 0.19, 0.1, 0, -0.118], [0.3, 0.195, 0.105, 0, -0.112]]), o.hair);                               // belakang kepala
    tufts(head, o.hair, [
      [0, 0.44, 0.02, 0.5, 0, 0.085, 0.2], [-0.1, 0.43, 0.02, 0.3, 0.6, 0.08, 0.19], [0.1, 0.43, 0.02, 0.3, -0.6, 0.08, 0.19],
      [-0.16, 0.36, -0.02, 0, 1.1, 0.08, 0.18], [0.16, 0.36, -0.02, 0, -1.1, 0.08, 0.18], [0, 0.43, -0.1, -0.7, 0, 0.09, 0.2],
      [-0.12, 0.38, -0.14, -0.9, 0.7, 0.08, 0.18], [0.12, 0.38, -0.14, -0.9, -0.7, 0.08, 0.18], [0, 0.3, -0.2, -1.5, 0, 0.09, 0.16],
      [-0.13, 0.33, 0.15, 2.5, 0.5, 0.06, 0.13], [-0.05, 0.345, 0.17, 2.6, 0.15, 0.065, 0.15], [0.04, 0.345, 0.17, 2.6, -0.15, 0.065, 0.14], [0.13, 0.33, 0.15, 2.5, -0.5, 0.06, 0.12],   // poni
    ]);
  },
  mop(head, o) {
    add(head, loft([[0.26, 0.2, 0.205, 0, -0.012], [0.35, 0.212, 0.215, 0, -0.012], [0.44, 0.16, 0.17, 0, -0.012], [0.49, 0.06, 0.07, 0, -0.012]]), o.hair);
    add(head, loft([[0.06, 0.17, 0.095, 0, -0.118], [0.18, 0.2, 0.11, 0, -0.118], [0.3, 0.205, 0.115, 0, -0.112]]), o.hair);
    tufts(head, o.hair, [
      [0, 0.45, 0.0, 0.2, 0.3, 0.1, 0.16], [-0.12, 0.43, 0.02, 0.2, 0.9, 0.095, 0.17], [0.12, 0.43, 0.02, 0.2, -0.9, 0.095, 0.17],
      [-0.19, 0.33, -0.02, 0, 1.5, 0.09, 0.15], [0.19, 0.33, -0.02, 0, -1.5, 0.09, 0.15], [0, 0.42, -0.12, -0.9, 0.2, 0.1, 0.17],
      [-0.19, 0.2, -0.04, 0.2, 2.6, 0.07, 0.14], [0.19, 0.2, -0.04, 0.2, -2.6, 0.07, 0.14],                                                 // menutup telinga
      [-0.12, 0.345, 0.16, 2.4, 0.9, 0.075, 0.17], [-0.01, 0.36, 0.18, 2.5, 0.7, 0.08, 0.2], [0.1, 0.35, 0.17, 2.5, 0.4, 0.075, 0.17], [0.16, 0.33, 0.13, 2.4, -0.2, 0.06, 0.12],   // poni menyamping
    ]);
  },
  bun(head, o) {
    add(head, loft([[0.275, 0.194, 0.198, 0, -0.012], [0.34, 0.198, 0.202, 0, -0.012], [0.42, 0.148, 0.158, 0, -0.012], [0.462, 0.04, 0.05, 0, -0.012]]), o.hair);
    add(head, loft([[0.1, 0.16, 0.09, 0, -0.118], [0.2, 0.188, 0.1, 0, -0.118], [0.3, 0.193, 0.105, 0, -0.112]]), o.hair);
    for (const side of [-1, 1]) add(head, loft([[0.27, 0.05, 0.02], [0.32, 0.085, 0.03], [0.36, 0.07, 0.025]]), o.hair, [side * 0.09, 0, 0.19], [0, 0, side * -0.3]);   // belahan tengah
    add(head, new THREE.IcosahedronGeometry(0.105, 0), o.hair, [0, 0.47, -0.1], [0.4, 0.3, 0]);                 // sanggul bersegi
    add(head, new THREE.CylinderGeometry(0.01, 0.01, 0.34, 5), mat("#d8a840", { roughness: 0.4, metalness: 0.4 }), [0.02, 0.48, -0.1], [0, 0, 1.2]);   // tusuk konde
  },
};

// ---------------------------------------------------------------- data karakter
const batik = (base, motif, dot) => cloth(256, 256, (c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
    const x = i * 32 + (j % 2) * 16 + 8, y = j * 32 + 14;
    c.fillStyle = motif;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x + Math.cos(k * Math.PI / 2) * 6, y + Math.sin(k * Math.PI / 2) * 6, 5, 3, k * Math.PI / 2, 0, 7); c.fill(); }
    c.fillStyle = dot; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill();
  }
});
const TORSO = [[-0.02, 0.165, 0.115], [0.1, 0.17, 0.118], [0.22, 0.2, 0.13], [0.33, 0.218, 0.136], [0.41, 0.2, 0.124], [0.455, 0.1, 0.085]];
const CHARS = {
  nino: {
    name: "Nino", scale: 1, skin: "#d99a6c", skin2: "#c2845a", hair: "#33283c", hair2: "#231b2c", hairFn: "spiky",
    pants: "#3f5fae", shoe: "#f4f4f8", sole: "#f07a2a", sleeve: "#ee7a2c", armBand: "#ffffff", wristBand: "#c2581c", cuffFlare: true,
    body: () => mat("#ffffff", { map: cloth(512, 256, (c, w, h, x0) => {   // jaket balap terbuka di atas kaos gelap
      c.fillStyle = "#ee7a2c"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#2a3050"; c.fillRect(x0 - 26, 0, 52, h);
      c.fillStyle = "#ffd9a0"; c.fillRect(x0 - 32, 0, 6, h); c.fillRect(x0 + 26, 0, 6, h);
      c.fillStyle = "#ffffff"; c.fillRect(x0 - 62, 0, 12, h); c.fillRect(x0 + 50, 0, 12, h);
      c.fillStyle = "#c2581c"; c.fillRect(0, h - 22, w, 22);
    }) }),
    extra(p) {
      for (const s of [-1, 1]) add(p.torso, box(0.085, 0.07, 0.02), "#ff9a4a", [s * 0.062, 0.43, 0.108], [-0.5, s * 0.5, s * 0.45]);   // kerah
      add(p.hips, loft([[0.0, 0.172, 0.122], [0.045, 0.172, 0.122]], false, false), "#4a3226");   // sabuk
      add(p.hips, box(0.05, 0.04, 0.02), "#e8c050", [0, 0.022, 0.13]);
      add(p.head, box(0.03, 0.055, 0.045), "#f8e4cc", [0.215, 0.185, 0.0]);                        // alat bantu dengar
    },
  },
  kael: {
    name: "Kael", scale: 1.03, skin: "#e6b088", skin2: "#cc9670", hair: "#7a4e32", hair2: "#56341f", hairFn: "mop", sleepy: true, bulk: 0.012,
    pants: "#4a4a5c", cuff: "#34343e", shoe: "#5a5a70", sole: "#2e2e3a", sleeve: "#8a96aa", wristBand: "#6c788c",
    torso: [[-0.05, 0.19, 0.135], [0.08, 0.2, 0.142], [0.22, 0.22, 0.148], [0.33, 0.23, 0.15], [0.41, 0.21, 0.135], [0.455, 0.105, 0.09]],
    body: () => mat("#ffffff", { map: cloth(512, 256, (c, w, h, x0) => {   // hoodie kebesaran
      c.fillStyle = "#8a96aa"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#6c788c"; c.fillRect(0, h - 20, w, 20);
      c.fillStyle = "#76829a"; c.beginPath(); c.roundRect(x0 - 62, h * 0.5, 124, h * 0.28, 6); c.fill();   // kantong
      c.fillStyle = "#ffffff"; c.fillRect(x0 - 14, 0, 4, h * 0.34); c.fillRect(x0 + 10, 0, 4, h * 0.34);   // tali
    }) }),
    extra(p) {
      add(p.torso, loft([[0.36, 0.17, 0.06], [0.44, 0.19, 0.09], [0.5, 0.15, 0.07]]), "#7c889e", [0, 0, -0.1], [-0.35, 0, 0]);   // tudung
      add(p.torso, new THREE.TorusGeometry(0.13, 0.024, 4, 8), "#2a2a38", [0, 0.455, 0.0], [Math.PI / 2 - 0.2, 0, Math.PI / 8]);   // headset di leher
      for (const s of [-1, 1]) {
        add(p.torso, new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8), "#2a2a38", [s * 0.135, 0.44, 0.03], [0, 0, Math.PI / 2]);
        add(p.torso, new THREE.CylinderGeometry(0.035, 0.035, 0.012, 8), mat("#40f0d8", { emissive: "#40f0d8", emissiveIntensity: 1.4 }), [s * 0.163, 0.44, 0.03], [0, 0, Math.PI / 2]);
      }
    },
  },
  ibu: {
    name: "Ibu Nino", scale: 0.97, skin: "#d19468", skin2: "#b87e56", hair: "#2e2430", hair2: "#1c1620", hairFn: "bun", lashes: true,
    pants: "#d19468", bareLegs: true, shoe: "#8a5a3a", sole: "#5e3a22", sleeve: "#cc4466", shortSleeve: true,
    torso: [[-0.02, 0.16, 0.112], [0.1, 0.158, 0.11], [0.22, 0.185, 0.124], [0.33, 0.2, 0.128], [0.41, 0.18, 0.116], [0.455, 0.09, 0.08]],
    dress: () => mat("#ffffff", { map: batik("#cc4466", "#ffd878", "#7a1e38") }),
    body: () => mat("#ffffff", { map: batik("#cc4466", "#ffd878", "#7a1e38") }),
    extra(p) {
      for (const s of [-1, 1]) add(p.head, new THREE.IcosahedronGeometry(0.024, 0), mat("#ffd040", { roughness: 0.4, metalness: 0.5 }), [s * 0.2, 0.13, -0.01]);   // anting
    },
  },
  nenek: {
    name: "Nenek Kael", scale: 0.9, skin: "#d7a07a", skin2: "#be8862", hair: "#c8c8d8", hair2: "#9a9ab0", hairFn: "bun", hunch: 0.2,
    pants: "#d7a07a", bareLegs: true, shoe: "#6a4a3a", sole: "#4a3022", sleeve: "#74ac8c", wristBand: "#ffffff",
    torso: [[-0.02, 0.165, 0.118], [0.1, 0.168, 0.12], [0.22, 0.188, 0.128], [0.33, 0.196, 0.13], [0.41, 0.176, 0.118], [0.455, 0.09, 0.08]],
    dress: () => mat("#ffffff", { map: cloth(256, 256, (c, w, h) => {   // sarung batik bergaris
      c.fillStyle = "#7a5030"; c.fillRect(0, 0, w, h);
      for (let y = 10; y < h; y += 44) { c.fillStyle = "#e0b050"; c.fillRect(0, y, w, 7); c.fillStyle = "#4e2e16"; c.fillRect(0, y + 11, w, 3); }
      c.fillStyle = "#e0b050";
      for (let j = 0; j < 6; j++) for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(i * 16 + (j % 2) * 8, j * 44 + 32, 2.6, 0, 7); c.fill(); }
    }) }),
    body: () => mat("#ffffff", { map: cloth(512, 256, (c, w, h, x0) => {   // kebaya dengan renda
      c.fillStyle = "#74ac8c"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#4e8466"; c.fillRect(x0 - 4, 0, 8, h);
      c.fillStyle = "#ffffff"; c.fillRect(0, h - 16, w, 16);
    }) }),
    extra(p) {
      add(p.torso, new THREE.IcosahedronGeometry(0.028, 0), mat("#ffd040", { roughness: 0.4, metalness: 0.5 }), [0, 0.36, 0.148]);   // bros
      const frame = mat("#7a5238", { roughness: 0.5 });
      for (const s of [-1, 1]) add(p.head, new THREE.TorusGeometry(0.056, 0.01, 4, 8), frame, [s * 0.078, 0.2, 0.212], [0, 0, Math.PI / 8]);   // kacamata segi delapan
      add(p.head, box(0.05, 0.012, 0.012), frame, [0, 0.205, 0.214]);
    },
  },
};

// ---------------------------------------------------------------- rakit dan gerakkan
export const CHAR_KEYS = Object.keys(CHARS);
export const charName = (key) => CHARS[key].name;

export function buildChar(key) {
  const o = CHARS[key];
  const root = new THREE.Group(), body = new THREE.Group(), hips = new THREE.Group(), torso = new THREE.Group(), head = new THREE.Group();
  root.add(body); body.add(hips); hips.add(torso); torso.add(head);
  body.scale.setScalar(o.scale);
  hips.position.y = HIP;
  torso.position.y = 0.04;
  add(hips, loft([[-0.07, 0.15, 0.108], [0.0, 0.17, 0.118], [0.06, 0.166, 0.116]]), o.dress ? o.dress() : o.pants);   // panggul
  add(torso, loft(o.torso || TORSO), o.body());
  if (o.dress) add(hips, loft([[0.05, 0.168, 0.118], [-0.12, 0.2, 0.15], [-0.34, 0.25, 0.19], [-0.42, 0.262, 0.2]], false, true), o.dress());
  add(torso, loft([[0.43, 0.062, 0.062], [0.53, 0.056, 0.058]]), o.skin2);   // leher
  torso.rotation.x = o.hunch || 0;
  head.position.set(0, 0.5, o.hunch ? 0.02 : 0);
  head.rotation.x = -(o.hunch || 0) * 0.7;
  head.scale.setScalar(1.3);
  add(head, loft(HEAD_RINGS), o.skin);
  const eyes = buildFace(head, o);
  HAIR[o.hairFn](head, o);
  const legs = [buildLeg(hips, -1, o), buildLeg(hips, 1, o)];
  const arms = [buildArm(torso, -1, o), buildArm(torso, 1, o)];
  if (o.extra) o.extra({ torso, head, hips });

  const st = { phase: 0, blink: 1 + Math.random() * 3, t: Math.random() * 10, walk: 0 };
  const STRIDE = 1.15, SPAN = 0.36;
  // dist: jarak tempuh frame ini (satuan tile). moving: sedang berjalan.
  function update(dt, dist = 0, moving = false) {
    st.t += dt;
    st.walk += ((moving ? 1 : 0) - st.walk) * Math.min(1, dt * 10);   // peralihan halus antara diam dan jalan
    st.phase += dist / (STRIDE * o.scale);
    const w = st.walk, L = THIGH + SHIN;
    legs.forEach((leg, i) => {
      const [fz, lift] = footCycle(st.phase + i * 0.5, SPAN * w, 0.6, 0.1 * w);
      const [a, b] = twoBoneIk(fz, -(L - 0.012 - 0.025 * w) + lift, THIGH, SHIN, -1);
      leg.hip.rotation.x = a; leg.knee.rotation.x = b; leg.foot.rotation.x = -(a + b);
    });
    arms.forEach((arm, i) => {
      const s = Math.sin((st.phase + i * 0.5) * Math.PI * 2);
      arm.shoulder.rotation.x = s * 0.7 * w + Math.sin(st.t * 1.3 + i) * 0.03 * (1 - w);
      arm.elbow.rotation.x = -(0.3 + Math.max(0, -s) * 0.5) * w - 0.12;
    });
    const bob = Math.abs(Math.sin(st.phase * Math.PI * 2));
    hips.position.y = HIP - 0.025 * w + bob * 0.035 * w + Math.sin(st.t * 1.6) * 0.004 * (1 - w);
    hips.rotation.x = 0.09 * w;                                       // condong ke depan saat jalan
    hips.rotation.y = Math.sin(st.phase * Math.PI * 2) * 0.1 * w;     // pinggul ikut berputar
    torso.scale.y = 1 + Math.sin(st.t * 1.6) * 0.012 * (1 - w);       // napas
    head.rotation.z = Math.sin(st.t * 0.7) * 0.03 * (1 - w);
    head.rotation.y = -hips.rotation.y * 0.8;
    st.blink -= dt;                                                    // kedip
    const k = st.blink < 0.12 ? 0.1 : 1;
    eyes.forEach((e) => { e.scale.y = k; });
    if (st.blink < 0) st.blink = 2.2 + Math.random() * 3;
  }
  update(0);
  return { root, update, key };
}
