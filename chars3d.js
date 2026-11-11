// chars3d.js | karakter 3D chibi Recursio
// Gaya: kepala besar membulat, badan mungil berbentuk lonceng, lengan baju menggembung, tangan dan kaki kecil,
// rambut dari helai tebal melengkung, mata anime dilukis di tekstur wajah. Permukaan halus, bukan bersegi.
// Langkah diikat ke jarak tempuh agar kaki yang menapak tidak meluncur
// (rumus langkah dan IK dua ruas diadaptasi dari kit biped-walker, viettranx/3dviz-pro-max, MIT).
import * as THREE from "./lib/three.module.min.js";

const mats = {};
// warna polos diberi gradasi lukis: sedikit terang di atas, lebih gelap dan keunguan di bawah (v = bawah ke atas)
function gradTex(color, sh = "#4a2f66", k = 0.3) {
  const cv = document.createElement("canvas"); cv.width = 4; cv.height = 64;
  const c = cv.getContext("2d"), g = c.createLinearGradient(0, 0, 0, 64), base = new THREE.Color(color);
  g.addColorStop(0, "#" + base.clone().lerp(new THREE.Color("#ffffff"), 0.08).getHexString());
  g.addColorStop(0.55, "#" + base.getHexString());
  g.addColorStop(1, "#" + base.clone().lerp(new THREE.Color(sh), k).getHexString());
  c.fillStyle = g; c.fillRect(0, 0, 4, 64);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const mat = (color, o = {}) => {
  const k = color + JSON.stringify(o);
  if (mats[k]) return mats[k];
  const { flat, sh, ...rest } = o;
  return (mats[k] = flat ? new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...rest })
    : new THREE.MeshStandardMaterial({ map: gradTex(color, sh, sh ? 0.14 : 0.3), roughness: 1, ...rest }));
};
function add(parent, geo, material, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, typeof material === "string" ? mat(material) : material);
  m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Kulit halus yang menghubungkan cincin lonjong. Tiap cincin [y, setengah lebar, setengah tebal, geser x, geser z].
// u = keliling (tengah depan di 0.5), v = bawah ke atas.
const N = 20;
function loft(rings, capTop = true, capBottom = true) {
  const rs = rings.slice().sort((a, b) => a[0] - b[0]);
  const pos = [], uv = [], idx = [], y0 = rs[0][0], y1 = rs[rs.length - 1][0], W = N + 1;
  rs.forEach(([y, rx, rz = rx, cx = 0, cz = 0]) => {
    for (let i = 0; i <= N; i++) {
      const a = -Math.PI + i * 2 * Math.PI / N;
      pos.push(cx + Math.sin(a) * rx, y, cz + Math.cos(a) * rz);
      uv.push(i / N, (y - y0) / (y1 - y0 || 1));
    }
  });
  for (let j = 0; j < rs.length - 1; j++) for (let i = 0; i < N; i++) {
    const A = j * W + i, B = A + 1, C = A + W + 1, D = A + W;
    idx.push(A, B, C, A, C, D);
  }
  const cap = (j, up) => {
    const c = pos.length / 3, r = rs[j];
    pos.push(r[3] || 0, r[0] + (up ? 1 : -1) * Math.min(r[1], r[2] ?? r[1]) * 0.25, r[4] || 0); uv.push(0.5, up ? 1 : 0);
    for (let i = 0; i < N; i++) up ? idx.push(c, j * W + i, j * W + i + 1) : idx.push(c, j * W + i + 1, j * W + i);
  };
  if (capTop) cap(rs.length - 1, true);
  if (capBottom) cap(0, false);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.attributes.normal;                       // samakan normal di jahitan agar tidak tampak garis
  for (let j = 0; j < rs.length; j++) {
    const a = j * W, b = a + N, v = new THREE.Vector3(n.getX(a) + n.getX(b), n.getY(a) + n.getY(b), n.getZ(a) + n.getZ(b)).normalize();
    n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(b, v.x, v.y, v.z);
  }
  return g;
}
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const ball = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);

// tekstur kain: u = keliling badan dengan tengah depan di x0, v = bawah ke atas
function cloth(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h, w / 2);
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
const THIGH = 0.15, SHIN = 0.15, FOOT = 0.06, HIP = THIGH + SHIN + FOOT, UPPER = 0.13, FORE = 0.12, R = 0.3, K = 1.2;

function shoeGeo() {
  const g = ball(1, 20, 14), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i), y = Math.max(p.getY(i), -0.75);
    p.setXYZ(i, p.getX(i) * 0.064 * (1 + 0.12 * z), y * 0.056 * (z < 0 ? 1 : 1 - 0.3 * z), z * 0.098);   // tumit membulat, ujung melandai
  }
  g.computeVertexNormals();
  return g;
}
function buildLeg(hips, side, o) {
  const hip = new THREE.Group(), knee = new THREE.Group(), foot = new THREE.Group();
  hip.position.set(side * 0.08, 0, 0); knee.position.y = -THIGH; foot.position.y = -SHIN;
  hips.add(hip); hip.add(knee); knee.add(foot);
  const m = o.bareLegs ? o.skin : o.pants, t = o.bareLegs ? 0.75 : 1;
  add(hip, loft([[0.03, 0.086 * t, 0.092 * t], [-0.08, 0.086 * t, 0.092 * t], [-THIGH, 0.08 * t, 0.084 * t]]), m);
  add(knee, loft([[0.02, 0.08 * t, 0.084 * t], [-0.07, 0.082 * t, 0.086 * t], [-0.115, 0.076 * t, 0.08 * t]]), m);
  if (o.cuff) add(knee, loft([[-0.085, 0.088, 0.092], [-0.125, 0.088, 0.092]]), o.cuff);       // gulungan celana
  add(knee, loft([[-0.1, 0.05, 0.052], [-SHIN - 0.01, 0.046, 0.05]], false, false), o.sock || o.skin);
  add(foot, shoeGeo(), o.shoe, [0, -FOOT + 0.042, 0.03]);
  add(foot, loft([[-FOOT, 0.062, 0.096, 0, 0.032], [-FOOT + 0.014, 0.066, 0.1, 0, 0.032]]), o.sole);
  return { hip, knee, foot };
}

function buildArm(torso, side, o) {
  const shoulder = new THREE.Group(), elbow = new THREE.Group();
  shoulder.position.set(side * (0.128 + (o.bulk || 0)), 0.255, 0); elbow.position.y = -UPPER;
  shoulder.rotation.z = side * 0.32;
  torso.add(shoulder); shoulder.add(elbow);
  const b = o.bulk || 0;
  add(shoulder, loft([[0.04, 0.04 + b, 0.044 + b], [-0.02, 0.06 + b, 0.062 + b], [-0.09, 0.066 + b, 0.068 + b], [-UPPER, 0.06 + b, 0.062 + b]]), o.sleeve);
  if (o.armBand) add(shoulder, loft([[-0.05, 0.066 + b, 0.068 + b], [-0.08, 0.068 + b, 0.07 + b]], false, false), o.armBand);
  if (o.shortSleeve) {
    add(elbow, loft([[0.02, 0.046, 0.046], [-FORE, 0.04, 0.04]]), o.skin);
  } else {
    add(elbow, loft([[0.015, 0.06 + b, 0.062 + b], [-0.05, 0.067 + b, 0.069 + b], [-0.095, 0.054 + b, 0.056 + b], [-FORE, 0.04, 0.042]]), o.sleeve);   // lengan baju menggembung
    if (o.wristBand) add(elbow, loft([[-FORE + 0.026, 0.046, 0.048], [-FORE - 0.004, 0.043, 0.045]]), o.wristBand);
  }
  add(elbow, ball(0.042), o.skin, [0, -FORE - 0.03, 0.004], [0, 0, 0], [0.86, 1.12, 0.72]);     // tangan kecil
  add(elbow, ball(0.017, 10, 8), o.skin, [side * -0.018, -FORE - 0.022, 0.03]);                   // ibu jari
  return { shoulder, elbow };
}

// kepala: bola yang dilebarkan di pipi dan dipendekkan di dagu. Fungsi yang sama dipakai untuk tempelan wajah.
function shapeHead(g, k = 1) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), ny = y / R, t = Math.max(0, -ny);
    const cheek = Math.exp(-(((ny + 0.3) / 0.36) ** 2));
    const taper = 1 - 0.34 * t ** 1.6;                       // rahang menyempit ke dagu
    p.setXYZ(i, x * (0.96 + 0.05 * cheek) * taper * k, y * (ny < 0 ? 1.0 : 0.98) * k, (z * (1 - 0.2 * t * t) + 0.055 * t ** 1.5) * k);
  }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- wajah dilukis
// tempelan wajah = potongan bola di depan kepala. Kanvas 1024 x 800, 640 px per radian.
const FW = 1024, FH = 800, RAD = 640, S = RAD / R, F_PHI = FW / RAD, F_UP = 0.55, F_TH = FH / RAD;
function fp(x, y) {
  const lat = Math.asin(y / R), lon = Math.asin(Math.max(-1, Math.min(1, x / (R * Math.cos(lat)))));
  return [FW / 2 + lon * RAD, F_UP * RAD - lat * RAD];
}
function faceTex(o, closed) {
  const cv = document.createElement("canvas"); cv.width = FW; cv.height = FH;
  const c = cv.getContext("2d");
  const ex = o.eyeX || 0.104, ey = o.eyeY || -0.062, rx = (o.eyeW || 0.045) * S, ry = (o.eyeH || 0.066) * S, ink = "#2b1a20";
  c.lineCap = "round"; c.lineJoin = "round";
  const fs = c.createLinearGradient(0, FH * 0.1, 0, FH * 0.44);                  // bayangan poni di dahi
  fs.addColorStop(0, "rgba(190,110,90,0.26)"); fs.addColorStop(1, "rgba(170,90,80,0)");
  c.fillStyle = fs; c.fillRect(0, 0, FW, FH * 0.44);
  for (const s of [-1, 1]) {
    const [bx, by] = fp(s * 0.14, ey - 0.08), br = 0.05 * S;                 // pipi merona
    const bl = c.createRadialGradient(bx, by, 0, bx, by, br);
    bl.addColorStop(0, "rgba(242,120,110,0.5)"); bl.addColorStop(1, "rgba(242,120,110,0)");
    c.fillStyle = bl; c.fillRect(bx - br, by - br, br * 2, br * 2);

    const [px, py] = fp(s * ex, ey);
    c.save(); c.translate(px, py);
    if (closed) {                                                               // mata terpejam
      c.strokeStyle = ink; c.lineWidth = ry * 0.17;
      c.beginPath(); c.ellipse(0, ry * 0.1, rx * 0.95, ry * 0.4, 0, Math.PI * 0.08, Math.PI * 0.92); c.stroke();
    } else {
      const top = o.sleepy ? -ry * 0.12 : -ry * 1.3;                            // kelopak setengah turun untuk yang mengantuk
      c.save();
      c.beginPath(); c.rect(-rx * 1.4, top, rx * 2.8, ry * 2.6); c.clip();
      c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 7); c.clip();
      c.fillStyle = "#fff9f0"; c.fillRect(-rx, -ry, rx * 2, ry * 2);
      const g = c.createLinearGradient(0, -ry, 0, ry);                          // iris besar, gelap di atas dan terang di bawah
      g.addColorStop(0, o.iris[0]); g.addColorStop(0.5, o.iris[1]); g.addColorStop(1, o.iris[2]);
      c.fillStyle = g; c.beginPath(); c.ellipse(-s * rx * 0.05, ry * 0.05, rx * 0.88, ry * 1.04, 0, 0, 7); c.fill();
      c.fillStyle = "rgba(26,12,14,0.72)"; c.beginPath(); c.ellipse(-s * rx * 0.05, -ry * 0.02, rx * 0.38, ry * 0.46, 0, 0, 7); c.fill();
      const sh = c.createLinearGradient(0, top < -ry ? -ry : top, 0, -ry * 0.05);
      sh.addColorStop(0, "rgba(20,8,12,0.6)"); sh.addColorStop(1, "rgba(20,8,12,0)");
      c.fillStyle = sh; c.fillRect(-rx, -ry, rx * 2, ry * 1.2);
      c.fillStyle = "#ffffff";
      c.beginPath(); c.ellipse(-rx * 0.34, o.sleepy ? ry * 0.2 : -ry * 0.36, rx * 0.3, rx * 0.34, 0, 0, 7); c.fill();
      c.beginPath(); c.arc(rx * 0.32, ry * 0.5, rx * 0.14, 0, 7); c.fill();
      c.restore();
      c.strokeStyle = ink;                                                      // garis bulu mata atas yang tebal
      if (o.sleepy) {
        c.lineWidth = ry * 0.2;
        c.beginPath(); c.moveTo(-rx * 1.02, top + ry * 0.04); c.quadraticCurveTo(0, top - ry * 0.1, rx * 1.02, top + ry * 0.04); c.stroke();
      } else {
        c.lineWidth = ry * 0.19;
        c.beginPath(); c.ellipse(0, 0, rx * 1.01, ry * 1.0, 0, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
        c.lineWidth = ry * 0.1;
        c.beginPath(); c.ellipse(0, 0, rx * 1.01, ry, 0, s > 0 ? -0.1 : Math.PI * 0.92, s > 0 ? Math.PI * 0.08 : Math.PI + 0.1); c.stroke();
      }
      if (o.lashes) { c.lineWidth = ry * 0.13; c.beginPath(); c.moveTo(s * rx * 0.9, -ry * 0.62); c.lineTo(s * rx * 1.3, -ry * 0.98); c.stroke(); }
      c.globalAlpha = 0.45; c.lineWidth = ry * 0.06;
      c.beginPath(); c.ellipse(0, 0, rx, ry, 0, Math.PI * 0.3, Math.PI * 0.7); c.stroke();
      c.globalAlpha = 1;
    }
    c.strokeStyle = o.hair2; c.lineWidth = ry * 0.15;                           // alis tipis
    const by0 = -ry * (o.sleepy ? 1.3 : 1.42);
    c.beginPath(); c.moveTo(-s * rx * 0.75, by0 + ry * (o.sleepy ? -0.06 : 0.1)); c.quadraticCurveTo(0, by0 - ry * 0.1, s * rx * 0.85, by0 + ry * 0.04); c.stroke();
    c.restore();
  }
  const [mx, my] = fp(0, ey - 0.108);
  c.strokeStyle = "#9a4a42"; c.lineWidth = 7;
  c.beginPath();
  if (o.mouth === "flat") { c.moveTo(mx - 16, my); c.quadraticCurveTo(mx, my + 4, mx + 16, my); }
  else { c.moveTo(mx - 22, my - 4); c.quadraticCurveTo(mx, my + 14, mx + 22, my - 4); }
  c.stroke();
  const [nx, ny] = fp(0, ey - 0.062);
  c.strokeStyle = "rgba(150,80,60,0.5)"; c.lineWidth = 5; c.beginPath(); c.moveTo(nx - 3, ny); c.lineTo(nx + 3, ny + 2); c.stroke();
  if (o.wrinkle) {                                                              // garis senyum nenek
    c.strokeStyle = "rgba(140,84,60,0.5)"; c.lineWidth = 4;
    for (const s of [-1, 1]) { const [wx, wy] = fp(s * 0.062, ey - 0.098); c.beginPath(); c.moveTo(wx, wy - 14); c.quadraticCurveTo(wx + s * 8, wy, wx, wy + 14); c.stroke(); }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function buildHead(head, o) {
  add(head, shapeHead(ball(R, 40, 28)), o.skin);
  const patch = shapeHead(new THREE.SphereGeometry(R, 28, 20, Math.PI / 2 - F_PHI / 2, F_PHI, Math.PI / 2 - F_UP, F_TH), 1.004);
  const open = faceTex(o, false), shut = faceTex(o, true);
  const fm = new THREE.MeshStandardMaterial({ map: open, transparent: true, depthWrite: false, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 });
  const face = new THREE.Mesh(patch, fm); head.add(face);
  for (const s of [-1, 1]) add(head, ball(0.055, 14, 10), o.skin, [s * 0.292, -0.05, -0.02], [0, 0, 0], [0.5, 1, 0.8]);   // telinga
  return (closed) => { fm.map = closed ? shut : open; };
}

// ---------------------------------------------------------------- rambut berlapis
// Massa rambut membulat ditutup helai-helai yang mengalir dari ubun-ubun, menempel mengikuti bentuk kepala,
// bertumpuk seperti sirap. Hanya ujung helai yang sedikit mencuat. Tekstur helai dilukis.
const dir = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)); };
const MC = new THREE.Vector3(0, 0.07, -0.08);
const seed = (n) => () => { n = (n + 0x6d2b79f5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function hairTex(o) {
  const cv = document.createElement("canvas"); cv.width = 64; cv.height = 256;
  const c = cv.getContext("2d"), g = c.createLinearGradient(0, 256, 0, 0), rnd = seed(3);
  g.addColorStop(0, o.hair2); g.addColorStop(0.3, o.hair); g.addColorStop(0.62, o.hair3); g.addColorStop(0.8, o.hair); g.addColorStop(1, o.hair);
  c.fillStyle = g; c.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 16; i++) {                                  // alur helai
    c.fillStyle = i % 3 ? o.hair2 : o.hair3; c.globalAlpha = 0.12 + rnd() * 0.16;
    c.fillRect(rnd() * 64, 0, 1 + rnd() * 2.5, 256);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  return t;
}
// tiap helai: [az pangkal, el pangkal, az ujung, el ujung, setengah lebar, cuat ujung, angkat]
function strands(head, o, r, list) {
  const pos = [], uv = [], idx = [], L = 12, M = 8;
  const d = new THREE.Vector3(), p = new THREE.Vector3(), q = new THREE.Vector3(), tan = new THREE.Vector3(), side = new THREE.Vector3(), nr = new THREE.Vector3();
  const at = (d0, d1, om, t, flick, lift, out) => {
    out.set(0, 0, 0).addScaledVector(d0, Math.sin((1 - t) * om)).addScaledVector(d1, Math.sin(t * om)).normalize();
    const b = MC.dot(out), ride = Math.max(b + Math.sqrt(b * b - MC.lengthSq() + r * r) + 0.004, 0.316);
    const f = Math.max(0, (t - 0.62) / 0.38);
    return out.multiplyScalar(ride - 0.03 * (1 - t) ** 2 + lift * Math.sin(Math.PI * t) + flick * f * f);
  };
  for (const [a0, e0, a1, e1, w, flick = 0.04, lift = 0.018] of list) {
    const d0 = dir(a0, e0), d1 = dir(a1, e1), om = Math.max(0.05, Math.acos(Math.max(-1, Math.min(1, d0.dot(d1))))), base = pos.length / 3;
    for (let i = 0; i <= L; i++) {
      const t = i / L;
      at(d0, d1, om, t, flick, lift, p); at(d0, d1, om, Math.min(1.02, t + 0.02), flick, lift, q);
      tan.subVectors(q, p).normalize(); d.copy(p).normalize();
      side.crossVectors(tan, d).normalize(); nr.crossVectors(side, tan).normalize();
      const rad = w * (0.5 + 0.5 * Math.sin(Math.min(1, t / 0.3) * Math.PI / 2)) * (1 - t ** 2.2) ** 1.25;
      for (let j = 0; j < M; j++) {
        const a = j / M * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
        const h = sn > 0 ? 0.44 * (1 - Math.abs(cs)) : 0.14 * sn;          // penampang berbubung di tengah, datar di bawah
        pos.push(p.x + side.x * cs * rad + nr.x * h * rad, p.y + side.y * cs * rad + nr.y * h * rad, p.z + side.z * cs * rad + nr.z * h * rad);
        uv.push(cs * 0.5 + 0.5, t);
      }
    }
    for (let i = 0; i < L; i++) for (let j = 0; j < M; j++) {
      const A = base + i * M + j, B = base + i * M + (j + 1) % M;
      idx.push(A, B, B + M, A, B + M, A + M);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: hairTex(o), roughness: 0.8, side: THREE.DoubleSide }));
  m.castShadow = true; m.receiveShadow = true; head.add(m);
}
function hairBase(head, o, r, S, sw, flick, tiers) {
  add(head, ball(r, 36, 24), o.hair2m, MC.toArray());
  const rnd = seed(o.seed || 7), j = (a) => (rnd() - 0.5) * a;
  for (const [e0, e1, step, off, minAz, w] of tiers) for (let a = -180 + off; a < 180; a += step) {
    if (Math.abs(a) < minAz) continue;
    S.push([a + j(8), e0 + j(5), a + sw + j(8), e1 + j(8), w * (0.85 + rnd() * 0.3), flick * (0.5 + rnd())]);
  }
}
const HAIR = {
  // potongan anak laki-laki: berlapis, sedikit acak, poni menutup dahi sampai alis
  tousle(head, o) {
    const r = 0.348 + (o.puff || 0), S = [], f = o.hairFlip ? -1 : 1;
    hairBase(head, o, r, S, 14 * f, 0.05, [[82, 46, 40, 10, 0, 0.105], [58, 16, 30, 15, 58, 0.1], [30, -14, 30, 0, 80, 0.095], [4, -40, 28, 12, 104, 0.085]]);
    for (const [a0, a1, e1, w] of o.fringe) S.push([f * a0, 66, f * a1, e1 + 9, w, 0.014, 0.03]);
    for (const s of [-1, 1]) S.push([s * 78, 52, s * 76, -22, 0.058, 0.02, 0.02], [s * 92, 46, s * 90, -32, 0.06, 0.03, 0.02]);
    strands(head, o, r, S);
  },
  // rambut ibu dan nenek: belah tengah, disisir ke belakang, sanggul
  bun(head, o) {
    const r = 0.35, S = [];
    hairBase(head, o, r, S, 0, 0.004, [[82, 46, 40, 10, 0, 0.11], [58, 16, 30, 15, 58, 0.105], [30, -12, 30, 0, 80, 0.1]]);
    for (const s of [-1, 1]) {
      S.push([s * 4, 74, s * 52, 16, 0.12, 0.004, 0.03], [s * 26, 68, s * 76, 0, 0.1, 0.004, 0.025]);
      if (o.sideLocks) S.push([s * 78, 40, s * 72, -40, 0.045, 0.02, 0.02]);
    }
    strands(head, o, r, S);
    const y = o.bunY ?? 0.2, z = o.bunZ ?? -0.36;
    add(head, ball(0.115), o.hairm, [0, y, z], [0, 0, 0], [1.1, 0.95, 0.9]);
    add(head, new THREE.TorusGeometry(0.075, 0.022, 8, 20), o.hair2m, [0, y - 0.03, z + 0.07], [0.9, 0, 0]);
    add(head, new THREE.CylinderGeometry(0.008, 0.008, 0.34, 8), gold(), [0.02, y + 0.01, z], [0, 0, 1.15]);   // tusuk konde
  },
};

// ---------------------------------------------------------------- data karakter
// bayangan lukis di atas kain: gelap di bawah dagu dan di ujung bawah, ditambah garis lipatan
function paint(c, w, h, x0) {
  let g = c.createLinearGradient(0, 0, 0, h * 0.34);
  g.addColorStop(0, "rgba(64,36,74,0.42)"); g.addColorStop(1, "rgba(64,36,74,0)");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  g = c.createLinearGradient(0, h * 0.62, 0, h);
  g.addColorStop(0, "rgba(64,36,74,0)"); g.addColorStop(1, "rgba(64,36,74,0.34)");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(64,36,74,0.2)"; c.lineWidth = 5; c.lineCap = "round";
  for (const s of [-1, 1]) for (const [dx, y] of [[96, 0.5], [128, 0.66], [168, 0.42], [214, 0.6]]) {
    c.beginPath(); c.moveTo(x0 + s * dx, h * y); c.quadraticCurveTo(x0 + s * (dx + 12), h * (y + 0.12), x0 + s * (dx - 4), h * (y + 0.26)); c.stroke();
  }
}
const batik = (base, motif, dot, shade) => cloth(256, 256, (c, w, h, x0) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
    const x = i * 32 + (j % 2) * 16 + 8, y = j * 32 + 14;
    c.fillStyle = motif;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x + Math.cos(k * Math.PI / 2) * 6, y + Math.sin(k * Math.PI / 2) * 6, 5, 3, k * Math.PI / 2, 0, 7); c.fill(); }
    c.fillStyle = dot; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill();
  }
  if (shade) paint(c, w, h, x0);
});
const TORSO = [[-0.07, 0.178, 0.156], [-0.04, 0.186, 0.164], [0.05, 0.176, 0.154], [0.15, 0.152, 0.132], [0.24, 0.126, 0.112], [0.3, 0.092, 0.088], [0.335, 0.05, 0.05]];
const SLIM = [[-0.03, 0.162, 0.146], [0.05, 0.16, 0.144], [0.15, 0.146, 0.13], [0.24, 0.122, 0.108], [0.3, 0.09, 0.086], [0.335, 0.05, 0.05]];
const SKIRT = [[0.0, 0.16, 0.144], [-0.1, 0.19, 0.172], [-0.24, 0.218, 0.2], [-0.29, 0.222, 0.204]];
const gold = () => mat("#f0c040", { roughness: 0.35, metalness: 0.5, flat: true });
const tex = (t) => new THREE.MeshStandardMaterial({ map: t, roughness: 1 });
const CHARS = {
  nino: {
    name: "Nino", scale: 1, skin: "#f6cfae", hair: "#6a4a3e", hair2: "#3e2822", hair3: "#b58a6a", hairFn: "tousle", iris: ["#2a1410", "#84462a", "#d08a4a"],
    fringe: [[-60, -70, -2, 0.07], [-42, -52, 8, 0.075], [-24, -30, 2, 0.075], [-6, -10, -6, 0.07], [12, 8, 10, 0.075], [32, 34, 4, 0.075], [52, 62, -2, 0.07]],
    pants: "#4a6cc0", cuff: "#86a4ea", sock: "#ffffff", shoe: "#fbfbfb", sole: "#f07a2a", sleeve: "#f28c36", armBand: "#fff6e6", wristBand: "#c8601e",
    body: () => tex(cloth(512, 256, (c, w, h, x0) => {   // jaket balap terbuka di atas kaos gelap
      c.fillStyle = "#f28c36"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#313a60"; c.beginPath(); c.moveTo(x0 - 30, 0); c.lineTo(x0 + 30, 0); c.lineTo(x0 + 20, h); c.lineTo(x0 - 20, h); c.fill();
      c.fillStyle = "#ffd24a"; c.beginPath(); c.arc(x0, h * 0.5, 9, 0, 7); c.fill();                    // gambar kecil di kaos
      c.strokeStyle = "#fff6e6"; c.lineWidth = 7;
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x0 + s * 33, 0); c.lineTo(x0 + s * 23, h); c.stroke(); }
      c.fillStyle = "#fff6e6"; c.fillRect(x0 - 80, h * 0.18, 11, h * 0.7); c.fillRect(x0 + 69, h * 0.18, 11, h * 0.7);
      c.strokeStyle = "rgba(150,70,20,0.6)"; c.lineWidth = 3;                                           // kantong
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x0 + s * 96, h * 0.62); c.lineTo(x0 + s * 118, h * 0.8); c.stroke(); }
      c.fillStyle = "#c8601e"; c.fillRect(0, h - 24, w, 24);
      paint(c, w, h, x0);
    })),
    extra(p) {
      add(p.torso, loft([[0.275, 0.108, 0.1, 0, -0.012], [0.335, 0.098, 0.09, 0, -0.016]], false, false), "#ffa24e");   // kerah berdiri
      add(p.head, ball(0.03, 12, 8), "#fff0d8", [0.3, -0.04, -0.05], [0, 0, 0], [0.6, 1.25, 0.9]);                  // alat bantu dengar
    },
  },
  kael: {
    name: "Kael", scale: 1.03, skin: "#f8d8ba", hair: "#a2683c", hair2: "#6a3e20", hair3: "#e0aa66", hairFn: "tousle", hairFlip: true, puff: 0.012, seed: 21,
    sleepy: true, mouth: "flat", bulk: 0.006, iris: ["#26200f", "#5a7a3a", "#b4cc6c"],
    fringe: [[-60, -72, -8, 0.075], [-40, -56, -2, 0.08], [-20, -40, -10, 0.08], [0, -18, -4, 0.08], [20, 4, 6, 0.08], [40, 36, 0, 0.075], [58, 64, -8, 0.07]],
    pants: "#5a5e76", sock: "#e8e8f0", shoe: "#727a94", sole: "#3a3c4c", sleeve: "#9eacc2", wristBand: "#7e8ca2",
    torso: [[-0.08, 0.192, 0.17], [-0.04, 0.2, 0.178], [0.05, 0.188, 0.166], [0.15, 0.162, 0.142], [0.24, 0.132, 0.116], [0.3, 0.095, 0.09], [0.335, 0.05, 0.05]],
    body: () => tex(cloth(512, 256, (c, w, h, x0) => {   // hoodie kebesaran
      c.fillStyle = "#9eacc2"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#8a98ae"; c.beginPath(); c.roundRect(x0 - 50, h * 0.56, 100, 62, 10); c.fill();      // kantong
      c.fillStyle = "#ffffff"; c.fillRect(x0 - 13, 0, 5, h * 0.42); c.fillRect(x0 + 8, 0, 5, h * 0.46);    // tali
      c.fillStyle = "#7e8ca2"; c.fillRect(0, h - 24, w, 24);
      paint(c, w, h, x0);
    })),
    extra(p) {
      add(p.torso, ball(0.13), "#8a98ae", [0, 0.27, -0.11], [0.3, 0, 0], [1.2, 0.8, 0.6]);               // tudung
      const dk = mat("#2c2c3a", { roughness: 0.5, flat: true });
      add(p.torso, new THREE.TorusGeometry(0.108, 0.018, 10, 28, Math.PI * 1.25), dk, [0, 0.318, -0.01], [Math.PI / 2 - 0.12, 0, Math.PI * 1.875]);   // headset di leher
      for (const s of [-1, 1]) {
        add(p.torso, new THREE.CylinderGeometry(0.048, 0.048, 0.04, 20), dk, [s * 0.112, 0.3, 0.066], [0, 0, Math.PI / 2]);
        add(p.torso, new THREE.CylinderGeometry(0.028, 0.028, 0.012, 20), mat("#40f0d8", { emissive: "#40f0d8", emissiveIntensity: 1.2, flat: true }), [s * 0.134, 0.3, 0.066], [0, 0, Math.PI / 2]);
      }
    },
  },
  ibu: {
    name: "Ibu Nino", scale: 1.05, skin: "#f2c8a4", hair: "#46343f", hair2: "#261c28", hair3: "#7c6072", hairFn: "bun", lashes: true, sideLocks: true,
    iris: ["#2a1612", "#703c2a", "#b8744a"],
    bareLegs: true, shoe: "#9a5e3c", sole: "#5e3a22", sleeve: "#d6557a", shortSleeve: true, torso: SLIM,
    dress: () => tex(batik("#d6557a", "#ffd878", "#7a1e38")),
    body: () => tex(batik("#d6557a", "#ffd878", "#7a1e38", true)),
    extra(p) {
      add(p.torso, loft([[0.285, 0.1, 0.094], [0.325, 0.07, 0.068]], false, false), "#ffe6c8");           // kerah
      for (const s of [-1, 1]) add(p.head, ball(0.018, 10, 8), gold(), [s * 0.292, -0.115, -0.02]);       // anting
    },
  },
  nenek: {
    name: "Nenek Kael", scale: 0.92, skin: "#f0c8aa", hair: "#d4d4e2", hair2: "#a2a2ba", hair3: "#fbfbff", hairFn: "bun", hunch: 0.14, wrinkle: true,
    bunY: 0.3, bunZ: -0.27, eyeH: 0.05, eyeW: 0.038, iris: ["#2e2220", "#6a4c40", "#a88670"],
    bareLegs: true, shoe: "#74503c", sole: "#4a3022", sleeve: "#7cb898", wristBand: "#ffffff", torso: SLIM,
    dress: () => tex(cloth(256, 256, (c, w, h) => {   // sarung batik bergaris
      c.fillStyle = "#845836"; c.fillRect(0, 0, w, h);
      for (let y = 10; y < h; y += 44) { c.fillStyle = "#e8b858"; c.fillRect(0, y, w, 7); c.fillStyle = "#56341a"; c.fillRect(0, y + 11, w, 3); }
      c.fillStyle = "#e8b858";
      for (let j = 0; j < 6; j++) for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(i * 16 + (j % 2) * 8, j * 44 + 32, 2.6, 0, 7); c.fill(); }
    })),
    body: () => tex(cloth(512, 256, (c, w, h, x0) => {   // kebaya dengan renda
      c.fillStyle = "#7cb898"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#569070"; c.fillRect(x0 - 4, 0, 8, h);
      c.fillStyle = "#ffffff"; c.fillRect(0, h - 14, w, 14);
      for (let x = 0; x < w; x += 16) { c.beginPath(); c.arc(x + 8, h - 14, 7, Math.PI, 0); c.fill(); }
      paint(c, w, h, x0);
    })),
    extra(p) {
      add(p.torso, ball(0.02, 10, 8), gold(), [0, 0.24, 0.116]);                                            // bros
      const frame = mat("#8a5a3c", { roughness: 0.45, flat: true });
      for (const s of [-1, 1]) add(p.head, new THREE.TorusGeometry(0.056, 0.007, 8, 28), frame, [s * 0.104, -0.062, 0.284], [0.08, s * 0.34, 0]);   // kacamata bulat
      add(p.head, new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), frame, [0, -0.056, 0.304], [0, 0, Math.PI / 2]);
    },
  },
};

// ---------------------------------------------------------------- rakit dan gerakkan
export const CHAR_KEYS = Object.keys(CHARS);
export const charName = (key) => CHARS[key].name;

export function buildChar(key) {
  const o = { ...CHARS[key] };
  o.hairm = mat(o.hair, { flat: true, roughness: 0.8 }); o.hair2m = mat(o.hair2, { flat: true, roughness: 0.8 });
  o.skin = mat(o.skin, { sh: "#d07860" });
  const root = new THREE.Group(), body = new THREE.Group(), hips = new THREE.Group(), torso = new THREE.Group(), head = new THREE.Group();
  root.add(body); body.add(hips); hips.add(torso); torso.add(head);
  body.scale.setScalar(o.scale * K);
  hips.position.y = HIP;
  add(hips, loft([[-0.075, 0.12, 0.105], [-0.03, 0.16, 0.135], [0.04, 0.156, 0.13]]), o.dress ? o.skin : o.pants);   // panggul
  add(torso, loft(o.torso || TORSO), o.body());
  if (o.dress) add(hips, loft(SKIRT, false, true), o.dress());
  add(torso, loft([[0.3, 0.05, 0.05], [0.39, 0.046, 0.046]], false, false), o.skin);                               // leher
  torso.rotation.x = o.hunch || 0;
  head.position.set(0, 0.565, 0.012);
  head.scale.setScalar(0.9);
  head.rotation.x = -(o.hunch || 0) * 0.8;
  const setEyes = buildHead(head, o);
  HAIR[o.hairFn](head, o);
  const legs = [buildLeg(hips, -1, o), buildLeg(hips, 1, o)];
  const arms = [buildArm(torso, -1, o), buildArm(torso, 1, o)];
  if (o.extra) o.extra({ torso, head, hips });

  const st = { phase: 0, blink: 1 + Math.random() * 3, t: Math.random() * 10, walk: 0 };
  const STRIDE = 0.8, SPAN = 0.2;
  // dist: jarak tempuh frame ini (satuan tile). moving: sedang berjalan.
  function update(dt, dist = 0, moving = false) {
    st.t += dt;
    st.walk += ((moving ? 1 : 0) - st.walk) * Math.min(1, dt * 10);   // peralihan halus antara diam dan jalan
    st.phase += dist / (STRIDE * o.scale);
    const w = st.walk, L = THIGH + SHIN;
    legs.forEach((leg, i) => {
      const [fz, lift] = footCycle(st.phase + i * 0.5, SPAN * w, 0.6, 0.065 * w);
      const [a, b] = twoBoneIk(fz, -(L - 0.008 - 0.014 * w) + lift, THIGH, SHIN, -1);
      leg.hip.rotation.x = a; leg.knee.rotation.x = b; leg.foot.rotation.x = -(a + b);
    });
    arms.forEach((arm, i) => {
      const s = Math.sin((st.phase + i * 0.5) * Math.PI * 2);
      arm.shoulder.rotation.x = s * 0.75 * w + Math.sin(st.t * 1.3 + i) * 0.04 * (1 - w);
      arm.elbow.rotation.x = -(0.3 + Math.max(0, -s) * 0.5) * w - 0.15;
    });
    const bob = Math.abs(Math.sin(st.phase * Math.PI * 2));
    hips.position.y = HIP - 0.014 * w + bob * 0.022 * w + Math.sin(st.t * 1.6) * 0.003 * (1 - w);
    hips.rotation.x = 0.07 * w;                                       // condong ke depan saat jalan
    hips.rotation.y = Math.sin(st.phase * Math.PI * 2) * 0.1 * w;     // pinggul ikut berputar
    torso.scale.y = 1 + Math.sin(st.t * 1.6) * 0.012 * (1 - w);       // napas
    head.rotation.z = Math.sin(st.t * 0.7) * 0.035 * (1 - w) + Math.sin(st.phase * Math.PI * 2) * 0.03 * w;
    head.rotation.y = -hips.rotation.y * 0.8;
    st.blink -= dt;                                                    // kedip
    setEyes(st.blink < 0.12);
    if (st.blink < 0) st.blink = 2.2 + Math.random() * 3;
  }
  update(0);
  return { root, update, key };
}
