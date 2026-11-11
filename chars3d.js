// chars3d.js | karakter 3D imut Recursio
// Proporsi mainan: kepala besar bulat, badan pendek, tangan dan kaki gemuk membulat.
// Lutut dan siku bersendi. Langkah diikat ke jarak tempuh agar kaki yang menapak tidak meluncur
// (rumus langkah dan IK dua ruas diadaptasi dari kit biped-walker, viettranx/3dviz-pro-max, MIT).
import * as THREE from "./lib/three.module.min.js";

const mats = {};
const mat = (color, o = {}) => {
  const k = color + JSON.stringify(o);
  return (mats[k] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...o }));
};
function add(parent, geo, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, typeof material === "string" ? mat(material) : material);
  m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
const ball = (r, w = 22, h = 16) => new THREE.SphereGeometry(r, w, h);
const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// helai rambut: bentuk tetes, pangkal di titik asal, ujung ke arah +Y
const tuft = (r, len) => lathe([[0.001, 0], [r * 0.7, len * 0.08], [r * 0.95, len * 0.24], [r, len * 0.42], [r * 0.8, len * 0.64], [r * 0.48, len * 0.84], [r * 0.2, len * 0.96], [0.001, len]], 18);

// tekstur kain digambar di kanvas: u = keliling badan (0 dan 1 di depan tengah), v = bawah ke atas
function cloth(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
const front = (c, w, x0, x1, fn) => { fn(x0 * w, (x1 - x0) * w); fn((1 - x1) * w, (x1 - x0) * w); };   // gambar simetris di kiri dan kanan garis depan

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
const HIP = 0.46, THIGH = 0.2, SHIN = 0.2, UPPER = 0.17, FORE = 0.16;

function buildLeg(hips, side, o) {
  const hip = new THREE.Group(), knee = new THREE.Group(), foot = new THREE.Group();
  hip.position.set(side * 0.105, 0, 0); knee.position.y = -THIGH; foot.position.y = -SHIN;
  hips.add(hip); hip.add(knee); knee.add(foot);
  const legMat = o.bareLegs ? o.skin : o.pants;
  add(hip, new THREE.CapsuleGeometry(0.085, THIGH - 0.06, 6, 14), legMat, [0, -THIGH / 2, 0]);
  add(knee, new THREE.CapsuleGeometry(0.078, SHIN - 0.06, 6, 14), legMat, [0, -SHIN / 2, 0]);
  if (o.cuff) add(knee, new THREE.TorusGeometry(0.08, 0.022, 8, 16), o.cuff, [0, -SHIN + 0.045, 0], [Math.PI / 2, 0, 0]);
  // sepatu gemuk dengan sol terpisah
  add(foot, ball(0.12), o.shoe, [0, 0.005, 0.045], [0, 0, 0], [0.95, 0.66, 1.42]);
  add(foot, ball(0.12), o.sole || "#3a3038", [0, -0.045, 0.045], [0, 0, 0], [1.0, 0.24, 1.48]);
  if (o.shoeStripe) add(foot, new THREE.TorusGeometry(0.09, 0.012, 6, 16, Math.PI), o.shoeStripe, [0, 0.03, 0.09], [-0.3, 0, 0]);
  return { hip, knee, foot };
}

function buildArm(torso, side, o) {
  const shoulder = new THREE.Group(), elbow = new THREE.Group();
  shoulder.position.set(side * 0.225, 0.4, 0); elbow.position.y = -UPPER;
  shoulder.rotation.z = side * 0.2;
  torso.add(shoulder); shoulder.add(elbow);
  add(shoulder, new THREE.CapsuleGeometry(0.07, UPPER - 0.04, 6, 14), o.sleeve, [0, -UPPER / 2, 0]);
  add(elbow, new THREE.CapsuleGeometry(0.063, FORE - 0.04, 6, 14), o.shortSleeve ? o.skin : o.sleeve, [0, -FORE / 2, 0]);
  if (o.armBand) add(shoulder, new THREE.TorusGeometry(0.071, 0.014, 6, 16), o.armBand, [0, -UPPER * 0.55, 0], [Math.PI / 2, 0, 0]);
  if (o.wristBand) add(elbow, new THREE.TorusGeometry(0.066, 0.016, 6, 16), o.wristBand, [0, -FORE + 0.03, 0], [Math.PI / 2, 0, 0]);
  add(elbow, ball(0.078), o.skin, [0, -FORE - 0.035, 0], [0, 0, 0], [1, 1.05, 0.95]);   // tangan sarung bulat
  return { shoulder, elbow };
}

function buildFace(head, o) {
  const eyeMat = mat("#2a1d2e", { roughness: 0.12 }), white = mat("#ffffff", { roughness: 0.3, emissive: "#ffffff", emissiveIntensity: 0.25 });
  const eyes = [];
  for (const side of [-1, 1]) {
    const e = new THREE.Group();
    e.position.set(side * 0.128, -0.045, 0.312); e.rotation.y = side * 0.36;
    head.add(e);
    add(e, ball(0.06, 18, 14), eyeMat, [0, 0, 0], [0, 0, 0], [0.95, o.sleepy ? 0.72 : 1.28, 0.42]);
    add(e, ball(0.02, 10, 8), white, [-0.018, o.sleepy ? 0.012 : 0.032, 0.022]);
    add(e, ball(0.009, 8, 6), white, [0.02, -0.02, 0.024]);
    if (o.sleepy) add(e, new THREE.CapsuleGeometry(0.03, 0.075, 6, 12), o.skin, [0, 0.043, 0.012], [0, 0, Math.PI / 2], [1, 1, 0.6]);   // kelopak setengah menutup
    if (o.lashes) add(e, new THREE.CapsuleGeometry(0.008, 0.05, 4, 8), "#2a1d2e", [side * 0.052, 0.07, 0.006], [0, 0, side * -0.9]);
    add(head, new THREE.CapsuleGeometry(0.011, 0.055, 4, 8), o.hair2, [side * 0.128, o.sleepy ? 0.1 : 0.088, 0.322], [0, side * 0.36, Math.PI / 2 + side * (o.sleepy ? -0.28 : -0.14)]);   // alis
    add(head, new THREE.CircleGeometry(0.05, 20), mat("#ff9a9a", { transparent: true, opacity: 0.55, roughness: 1 }), [side * 0.215, -0.125, 0.268], [0.1, side * 0.66, 0]);   // pipi merona
    add(head, ball(0.062, 14, 10), o.skin, [side * 0.345, -0.03, 0], [0, 0, 0], [0.6, 1, 0.8]);   // telinga
    eyes.push(e);
  }
  add(head, new THREE.TorusGeometry(0.03, 0.009, 6, 14, Math.PI), "#a8483e", [0, -0.135, 0.338], [0.2, 0, Math.PI]);   // senyum kecil
  return eyes;
}

// ---------------------------------------------------------------- rambut
const HAIR = {
  spiky(head, o) {
    add(head, new THREE.SphereGeometry(0.4, 32, 20, 0, Math.PI * 2, 0, 1.8), o.hair, [0, 0.02, -0.045], [-0.5, 0, 0], [1.02, 0.97, 1]);
    const spikes = [[0, 0.33, 0.02, -0.15, 0, 0.3], [-0.17, 0.29, 0.04, -0.1, 0.55, 0.27], [0.17, 0.29, 0.04, -0.1, -0.55, 0.27],
      [-0.29, 0.17, -0.02, -0.2, 1.1, 0.24], [0.29, 0.17, -0.02, -0.2, -1.1, 0.24], [0, 0.27, -0.2, -0.9, 0, 0.28],
      [-0.2, 0.2, -0.22, -0.9, 0.7, 0.25], [0.2, 0.2, -0.22, -0.9, -0.7, 0.25], [0, 0.08, -0.34, -1.5, 0, 0.22]];
    for (const [x, y, z, rx, rz, len] of spikes) add(head, tuft(0.1, len), o.hair, [x, y, z], [rx, 0, rz]);
    for (const [x, rz, len] of [[-0.24, 0.55, 0.16], [-0.12, 0.25, 0.19], [0.0, 0.0, 0.2], [0.12, -0.25, 0.19], [0.24, -0.55, 0.16]])   // poni
      add(head, tuft(0.07, len), o.hair, [x, 0.245 - Math.abs(x) * 0.25, 0.32 - Math.abs(x) * 0.22], [Math.PI - 0.38, 0, rz]);
    add(head, new THREE.CapsuleGeometry(0.012, 0.11, 4, 8), o.hair3, [-0.1, 0.33, 0.14], [-0.5, 0, 1.2]);   // kilau
  },
  mop(head, o) {
    add(head, new THREE.SphereGeometry(0.405, 32, 20, 0, Math.PI * 2, 0, 1.9), o.hair, [0, 0.02, -0.05], [-0.46, 0, 0], [1.03, 0.97, 1]);
    const clumps = [[0, 0.34, 0.02, 0.15], [-0.2, 0.3, 0.06, 0.15], [0.2, 0.3, 0.06, 0.15], [-0.33, 0.14, 0.0, 0.14], [0.33, 0.14, 0.0, 0.14],
      [-0.34, -0.06, -0.06, 0.12], [0.34, -0.06, -0.06, 0.12], [0, 0.28, -0.22, 0.16], [-0.22, 0.18, -0.26, 0.15], [0.22, 0.18, -0.26, 0.15],
      [0, 0.02, -0.38, 0.14], [-0.2, -0.1, -0.32, 0.13], [0.2, -0.1, -0.32, 0.13]];
    for (const [x, y, z, r] of clumps) add(head, ball(r, 14, 10), o.hair, [x, y, z], [0, 0, 0], [1, 0.9, 1]);
    for (const [x, rz, len] of [[-0.2, 0.8, 0.2], [-0.06, 0.6, 0.23], [0.1, 0.4, 0.21], [0.23, 0.1, 0.16]])   // poni menyamping
      add(head, tuft(0.08, len), o.hair, [x, 0.25 - Math.abs(x) * 0.2, 0.32 - Math.abs(x) * 0.2], [Math.PI - 0.36, 0, rz]);
    add(head, new THREE.CapsuleGeometry(0.012, 0.1, 4, 8), o.hair3, [-0.12, 0.35, 0.12], [-0.5, 0, 1.2]);
  },
  bun(head, o) {
    add(head, new THREE.SphereGeometry(0.395, 32, 20, 0, Math.PI * 2, 0, 1.78), o.hair, [0, 0.02, -0.045], [-0.52, 0, 0], [1.02, 0.97, 1]);
    for (const side of [-1, 1]) add(head, ball(0.2, 18, 12), o.hair, [side * 0.17, 0.2, 0.17], [0, 0, side * 0.5], [1.15, 0.55, 0.85]);   // belahan tengah
    add(head, ball(0.15, 18, 14), o.hair, [0, 0.36, -0.14]);                                    // sanggul
    add(head, new THREE.TorusGeometry(0.09, 0.022, 8, 16), o.hair2, [0, 0.3, -0.12], [1.2, 0, 0]);
    add(head, new THREE.CylinderGeometry(0.011, 0.011, 0.42, 8), mat("#d8a840", { roughness: 0.35, metalness: 0.5 }), [0.02, 0.37, -0.14], [0, 0, 1.25]);   // tusuk konde
    add(head, new THREE.CapsuleGeometry(0.012, 0.09, 4, 8), o.hair3, [-0.13, 0.31, 0.12], [-0.5, 0, 1.2]);
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
    c.beginPath(); c.arc(x + 16, y + 16, 1.6, 0, 7); c.fill();
  }
});
const CHARS = {
  nino: {
    name: "Nino", scale: 1, skin: "#f2c094", hair: "#3a3048", hair2: "#2a2234", hair3: "#7a6e96", hairFn: "spiky",
    pants: "#3f5fae", shoe: "#f6f6fa", sole: "#f07a2a", sleeve: "#f07a2a", armBand: "#ffffff", wristBand: "#c2581c",
    body: () => mat("#ffffff", { map: cloth(512, 256, (c, w, h) => {   // jaket balap terbuka di atas kaos
      c.fillStyle = "#f07a2a"; c.fillRect(0, 0, w, h);
      front(c, w, 0, 0.075, (x, ww) => { c.fillStyle = "#2a3050"; c.fillRect(x, 0, ww, h); });
      front(c, w, 0.075, 0.09, (x, ww) => { c.fillStyle = "#ffd9a0"; c.fillRect(x, 0, ww, h); });
      front(c, w, 0.13, 0.16, (x, ww) => { c.fillStyle = "#ffffff"; c.fillRect(x, 0, ww, h); });
      c.fillStyle = "#c2581c"; c.fillRect(0, h - 26, w, 26);
      front(c, w, 0, 0.075, (x, ww) => { c.fillStyle = "#3a2a24"; c.fillRect(x, h - 26, ww, 26); });
    }) }),
    extra(p) {
      add(p.torso, new THREE.TorusGeometry(0.115, 0.04, 10, 20), "#ff9a4a", [0, 0.5, 0.0], [Math.PI / 2 - 0.15, 0, 0], [1, 0.9, 1]);   // kerah
      add(p.head, ball(0.03, 10, 8), "#f8e4cc", [0.362, -0.01, 0.03], [0, 0, 0], [0.8, 1.4, 1]);   // alat bantu dengar
    },
  },
  kael: {
    name: "Kael", scale: 1.03, skin: "#f6cfa6", hair: "#8a5a3a", hair2: "#6a4228", hair3: "#c09468", hairFn: "mop", sleepy: true,
    pants: "#4a4a5c", cuff: "#34343e", shoe: "#5a5a70", sole: "#2e2e3a", sleeve: "#8a96aa", wristBand: "#6c788c", bodyScale: 1.1,
    body: () => mat("#ffffff", { map: cloth(512, 256, (c, w, h) => {   // hoodie kebesaran
      c.fillStyle = "#8a96aa"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#6c788c"; c.fillRect(0, h - 22, w, 22);
      front(c, w, 0, 0.11, (x, ww) => { c.fillStyle = "#76829a"; c.beginPath(); c.roundRect(x - 8, h * 0.52, ww + 16, h * 0.27, 14); c.fill(); });   // kantong
      front(c, w, 0.018, 0.026, (x, ww) => { c.fillStyle = "#ffffff"; c.fillRect(x, 0, ww, h * 0.36); });   // tali
    }) }),
    extra(p) {
      add(p.torso, new THREE.SphereGeometry(0.2, 18, 12, 0, Math.PI * 2, 0, 1.7), "#7c889e", [0, 0.47, -0.13], [1.9, 0, 0], [1.1, 0.75, 1]);   // tudung
      add(p.torso, new THREE.TorusGeometry(0.15, 0.028, 8, 22), "#2a2a38", [0, 0.53, 0.01], [Math.PI / 2 - 0.25, 0, 0]);   // headset di leher
      for (const s of [-1, 1]) {
        add(p.torso, new THREE.CylinderGeometry(0.068, 0.068, 0.05, 16), "#2a2a38", [s * 0.155, 0.5, 0.05], [0, 0, Math.PI / 2]);
        add(p.torso, new THREE.CylinderGeometry(0.04, 0.04, 0.012, 16), mat("#40f0d8", { emissive: "#40f0d8", emissiveIntensity: 1.6 }), [s * 0.184, 0.5, 0.05], [0, 0, Math.PI / 2]);
      }
    },
  },
  ibu: {
    name: "Ibu Nino", scale: 1.0, skin: "#e6ae84", hair: "#2e2430", hair2: "#1a141e", hair3: "#6a5a72", hairFn: "bun", lashes: true,
    pants: "#e6ae84", bareLegs: true, shoe: "#8a5a3a", sole: "#5e3a22", sleeve: "#d0486a", shortSleeve: true,
    dress: () => mat("#ffffff", { map: batik("#cc4466", "#ffd878", "#7a1e38") }),
    body: () => mat("#ffffff", { map: batik("#cc4466", "#ffd878", "#7a1e38") }),
    extra(p) {
      for (const s of [-1, 1]) add(p.head, ball(0.026, 10, 8), mat("#ffd040", { roughness: 0.3, metalness: 0.6 }), [s * 0.352, -0.11, 0.02]);   // anting
      add(p.torso, new THREE.TorusGeometry(0.1, 0.022, 8, 20), "#f6d8a8", [0, 0.5, 0.01], [Math.PI / 2 - 0.2, 0, 0]);   // garis leher
    },
  },
  nenek: {
    name: "Nenek Kael", scale: 0.93, skin: "#e8b692", hair: "#d0d0de", hair2: "#a0a0b6", hair3: "#ffffff", hairFn: "bun", hunch: 0.16,
    pants: "#e8b692", bareLegs: true, shoe: "#6a4a3a", sole: "#4a3022", sleeve: "#74ac8c", wristBand: "#ffffff",
    dress: () => mat("#ffffff", { map: cloth(256, 256, (c, w, h) => {   // sarung batik bergaris
      c.fillStyle = "#7a5030"; c.fillRect(0, 0, w, h);
      for (let y = 10; y < h; y += 44) { c.fillStyle = "#e0b050"; c.fillRect(0, y, w, 6); c.fillStyle = "#4e2e16"; c.fillRect(0, y + 10, w, 3); }
      c.fillStyle = "#e0b050";
      for (let j = 0; j < 6; j++) for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(i * 16 + (j % 2) * 8, j * 44 + 32, 2.4, 0, 7); c.fill(); }
    }) }),
    body: () => mat("#ffffff", { map: cloth(512, 256, (c, w, h) => {   // kebaya dengan renda
      c.fillStyle = "#74ac8c"; c.fillRect(0, 0, w, h);
      front(c, w, 0, 0.012, (x, ww) => { c.fillStyle = "#4e8466"; c.fillRect(x, 0, ww, h); });
      c.fillStyle = "#ffffff";
      for (let x = 6; x < w; x += 14) { c.beginPath(); c.arc(x, h - 10, 6, 0, 7); c.fill(); }
    }) }),
    extra(p) {
      add(p.torso, ball(0.03, 10, 8), mat("#ffd040", { roughness: 0.3, metalness: 0.6 }), [0, 0.4, 0.165]);   // bros
      const frame = mat("#7a5238", { roughness: 0.4 });
      for (const s of [-1, 1]) add(p.head, new THREE.TorusGeometry(0.082, 0.011, 6, 22), frame, [s * 0.128, -0.045, 0.335], [0, s * 0.36, 0]);   // kacamata
      add(p.head, new THREE.CapsuleGeometry(0.008, 0.07, 4, 6), frame, [0, -0.035, 0.36], [0, 0, Math.PI / 2]);
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
  const bs = o.bodyScale || 1;
  // badan: bentuk kacang, diputar dari profil
  add(torso, lathe([[0.001, -0.06], [0.15, -0.05], [0.205, 0.03], [0.222, 0.14], [0.205, 0.3], [0.16, 0.42], [0.1, 0.475], [0.001, 0.49]]), o.body(), [0, 0, 0], [0, 0, 0], [bs, 1, 0.86 * bs]);
  if (o.dress) add(hips, lathe([[0.001, -0.3], [0.3, -0.3], [0.31, -0.27], [0.275, -0.14], [0.235, 0.0], [0.2, 0.1], [0.001, 0.12]]), o.dress(), [0, 0, 0], [0, 0, 0], [1, 1, 0.9]);
  torso.rotation.x = o.hunch || 0;
  head.position.set(0, 0.76, o.hunch ? 0.03 : 0);
  head.rotation.x = -(o.hunch || 0) * 0.6;
  add(head, ball(0.36, 32, 24), o.skin, [0, 0, 0], [0, 0, 0], [1, 0.94, 0.95]);
  const eyes = buildFace(head, o);
  HAIR[o.hairFn](head, o);
  const legs = [buildLeg(hips, -1, o), buildLeg(hips, 1, o)];
  const arms = [buildArm(torso, -1, o), buildArm(torso, 1, o)];
  if (o.extra) o.extra({ torso, head, hips });

  const st = { phase: 0, blink: 1 + Math.random() * 3, t: Math.random() * 10, walk: 0 };
  const STRIDE = 0.95, SPAN = 0.3;
  // dist: jarak tempuh frame ini (satuan tile). moving: sedang berjalan.
  function update(dt, dist = 0, moving = false) {
    st.t += dt;
    st.walk += ((moving ? 1 : 0) - st.walk) * Math.min(1, dt * 10);   // peralihan halus antara diam dan jalan
    st.phase += dist / (STRIDE * o.scale);
    const w = st.walk, L = THIGH + SHIN;
    legs.forEach((leg, i) => {
      const [fz, lift] = footCycle(st.phase + i * 0.5, SPAN * w, 0.6, 0.09 * w);
      const [a, b] = twoBoneIk(fz, -(L - 0.012 - 0.02 * w) + lift, THIGH, SHIN, -1);
      leg.hip.rotation.x = a; leg.knee.rotation.x = b; leg.foot.rotation.x = -(a + b);
    });
    arms.forEach((arm, i) => {
      const s = Math.sin((st.phase + i * 0.5) * Math.PI * 2);
      arm.shoulder.rotation.x = s * 0.75 * w + Math.sin(st.t * 1.3 + i) * 0.03 * (1 - w);
      arm.elbow.rotation.x = -(0.25 + Math.max(0, -s) * 0.5) * w - 0.08;
    });
    const bob = Math.abs(Math.sin(st.phase * Math.PI * 2));
    hips.position.y = HIP - 0.02 * w + bob * 0.03 * w + Math.sin(st.t * 1.6) * 0.004 * (1 - w);
    hips.rotation.x = 0.1 * w;                                        // condong ke depan saat jalan
    hips.rotation.y = Math.sin(st.phase * Math.PI * 2) * 0.1 * w;     // pinggul ikut berputar
    torso.scale.y = 1 + Math.sin(st.t * 1.6) * 0.012 * (1 - w);       // napas
    head.rotation.z = Math.sin(st.t * 0.7) * 0.03 * (1 - w);
    head.rotation.y = -hips.rotation.y * 0.8;
    st.blink -= dt;                                                    // kedip
    const k = st.blink < 0.12 ? 0.12 : 1;
    eyes.forEach((e) => { e.scale.y = k; });
    if (st.blink < 0) st.blink = 2.2 + Math.random() * 3;
  }
  update(0);
  return { root, update, key };
}
