// chars3d.js | karakter 3D chibi Recursio
// Gaya: kepala besar membulat, badan mungil berbentuk lonceng, lengan baju menggembung, tangan dan kaki kecil,
// rambut dari helai tebal melengkung, mata anime dilukis di tekstur wajah. Permukaan halus, bukan bersegi.
// Langkah diikat ke jarak tempuh agar kaki yang menapak tidak meluncur
// (rumus langkah dan IK dua ruas diadaptasi dari kit biped-walker, viettranx/3dviz-pro-max, MIT).
import * as THREE from "./lib/three.module.min.js";

const mats = {};
const mat = (color, o = {}) => {
  const k = color + JSON.stringify(o);
  return (mats[k] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o }));
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
    p.setXYZ(i, p.getX(i) * 0.072 * (1 + 0.12 * z), y * 0.06 * (z < 0 ? 1 : 1 - 0.25 * z), z * 0.108);   // tumit membulat, ujung melandai
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
  add(foot, shoeGeo(), o.shoe, [0, -FOOT + 0.045, 0.03]);
  add(foot, loft([[-FOOT, 0.07, 0.106, 0, 0.032], [-FOOT + 0.016, 0.074, 0.11, 0, 0.032]]), o.sole);
  return { hip, knee, foot };
}

function buildArm(torso, side, o) {
  const shoulder = new THREE.Group(), elbow = new THREE.Group();
  shoulder.position.set(side * (0.128 + (o.bulk || 0)), 0.255, 0); elbow.position.y = -UPPER;
  shoulder.rotation.z = side * 0.32;
  torso.add(shoulder); shoulder.add(elbow);
  const b = o.bulk || 0;
  add(shoulder, loft([[0.04, 0.045 + b, 0.05 + b], [-0.02, 0.07 + b, 0.072 + b], [-0.09, 0.078 + b, 0.08 + b], [-UPPER, 0.07 + b, 0.072 + b]]), o.sleeve);
  if (o.armBand) add(shoulder, loft([[-0.05, 0.079 + b, 0.081 + b], [-0.08, 0.081 + b, 0.083 + b]], false, false), o.armBand);
  if (o.shortSleeve) {
    add(elbow, loft([[0.02, 0.046, 0.046], [-FORE, 0.04, 0.04]]), o.skin);
  } else {
    add(elbow, loft([[0.015, 0.07 + b, 0.072 + b], [-0.05, 0.08 + b, 0.082 + b], [-0.095, 0.064 + b, 0.066 + b], [-FORE, 0.046, 0.048]]), o.sleeve);   // lengan baju menggembung
    if (o.wristBand) add(elbow, loft([[-FORE + 0.028, 0.053, 0.055], [-FORE - 0.004, 0.05, 0.052]]), o.wristBand);
  }
  add(elbow, ball(0.047), o.skin, [0, -FORE - 0.03, 0.004], [0, 0, 0], [0.92, 1.08, 0.92]);     // tangan kecil
  add(elbow, ball(0.02, 10, 8), o.skin, [side * -0.02, -FORE - 0.03, 0.036]);                   // ibu jari
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
  const ex = o.eyeX || 0.098, ey = o.eyeY || -0.05, rx = (o.eyeW || 0.041) * S, ry = (o.eyeH || 0.058) * S, ink = "#2b1a20";
  c.lineCap = "round"; c.lineJoin = "round";
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

// ---------------------------------------------------------------- rambut dari helai tebal
const dir = (az, el) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)); };
// tiap helai: [arah pangkal (az, el), arah ujung (az, el), jarak ujung dari pusat kepala, setengah lebar, angkat, tebal]
function locks(head, o, list) {
  const pos = [], col = [], idx = [], L = 14, M = 12;
  const cA = new THREE.Color(o.hair2), cB = new THREE.Color(o.hair), cC = new THREE.Color(o.hair3), cc = new THREE.Color();
  const p = new THREE.Vector3(), tan = new THREE.Vector3(), side = new THREE.Vector3(), nr = new THREE.Vector3();
  for (const l of list) {
    let A, B, C, w, th;
    if (l.length >= 9) { A = dir(l[0], l[1]).multiplyScalar(0.26); C = dir(l[2], l[3]).multiplyScalar(l[4]); B = dir(l[5], l[6]).multiplyScalar(l[7]); w = l[8]; th = l[9] ?? 0.55; }
    else { A = dir(l[0], l[1]).multiplyScalar(0.27); B = dir(l[2], l[3]).multiplyScalar(l[4]); w = l[5]; th = l[7] ?? 0.5; C = A.clone().add(B).normalize().multiplyScalar(Math.max(0.3, (0.3 + l[4]) / 2) + (l[6] ?? 0.03)); }
    const base = pos.length / 3;
    for (let i = 0; i <= L; i++) {
      const t = i / L, u = 1 - t;
      p.set(0, 0, 0).addScaledVector(A, u * u).addScaledVector(C, 2 * u * t).addScaledVector(B, t * t);
      tan.set(0, 0, 0).addScaledVector(A, -2 * u).addScaledVector(C, 2 * u - 2 * t).addScaledVector(B, 2 * t).normalize();
      side.crossVectors(tan, p).normalize(); nr.crossVectors(tan, side).normalize();
      const rad = w * (0.7 + 0.3 * Math.sin(Math.min(1, t / 0.35) * Math.PI / 2)) * (1 - t ** 2.4);
      t < 0.5 ? cc.lerpColors(cA, cB, t * 2) : cc.lerpColors(cB, cC, (t - 0.5) * 2);
      for (let j = 0; j < M; j++) {
        const a = j / M * Math.PI * 2, cs = Math.cos(a) * rad, sn = Math.sin(a) * rad * th;
        pos.push(p.x + side.x * cs + nr.x * sn, p.y + side.y * cs + nr.y * sn, p.z + side.z * cs + nr.z * sn);
        col.push(cc.r, cc.g, cc.b);
      }
    }
    for (let i = 0; i < L; i++) for (let j = 0; j < M; j++) {
      const a = base + i * M + j, b = base + i * M + (j + 1) % M, c2 = b + M, d = a + M;
      idx.push(a, b, c2, a, c2, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }));
  m.castShadow = true; m.receiveShadow = true; head.add(m);
}
const capHair = (head, o, r = 0.325) => add(head, ball(r, 32, 22), o.hair, [0, 0.06, -0.055], [0, 0, 0], [1.03, 1, 1.02]);
const mir3 = (list) => list.flatMap((l) => [l, [-l[0], l[1], -l[2], l[3], l[4], -l[5], ...l.slice(6)]]);
const mir = (list) => list.flatMap((l) => l[0] === 0 || l[0] === 180 ? [l] : [l, [-l[0], l[1], -l[2], ...l.slice(3)]]);
const HAIR = {
  // gumpalan besar yang disisir menyamping: poni lebar, gundukan di ubun-ubun, ujung mencuat di belakang
  swept(head, o) {
    capHair(head, o, 0.325 + (o.puff || 0));
    const f = o.hairFlip ? -1 : 1, P = o.puff || 0, len = o.fringe || 0;
    const L = [
      // poni
      [25, 74, 8, 44, 0.375, -24, 10 - len, 0.345, 0.135, 0.42], [6, 78, 20, 52, 0.372, 26, 22 - len, 0.345, 0.105, 0.42], [44, 70, 40, 42, 0.37, 30, 12 - len, 0.345, 0.11, 0.42],
      [-12, 74, -38, 46, 0.375, -56, 0 - len, 0.345, 0.125, 0.42], [62, 62, 72, 34, 0.365, 70, -8, 0.335, 0.095, 0.45],
      [-48, 64, -70, 38, 0.365, -80, -12, 0.335, 0.1, 0.45],
      // depan telinga
      ...mir3([[92, 44, 96, 6, 0.355, 86, -36, 0.33, 0.075, 0.5]]),
      // gundukan ubun-ubun
      [170, 70, 60, 76, 0.4 + P, 28, 54, 0.45 + P, 0.15, 0.55], [190, 70, -60, 76, 0.4 + P, -44, 50, 0.46 + P, 0.15, 0.55],
      [140, 70, 108, 58, 0.43 + P, 98, 30, 0.49 + P, 0.14, 0.6], [-140, 70, -108, 58, 0.43 + P, -100, 26, 0.49 + P, 0.14, 0.6],
      [150, 74, 30, 86, 0.4 + P, 40, 70, 0.5 + P, 0.07, 0.6],
      // belakang, ujung mencuat keluar
      ...mir3([[150, 62, 150, 30, 0.46 + P, 140, 0, 0.5 + P, 0.15, 0.6], [112, 30, 118, 2, 0.43 + P, 110, -28, 0.45 + P, 0.12, 0.6],
        [160, 22, 162, -8, 0.44 + P, 156, -36, 0.46 + P, 0.125, 0.6]]),
      [180, 64, 180, 30, 0.47 + P, 176, -2, 0.52 + P, 0.16, 0.6], [180, 20, 180, -14, 0.44 + P, 184, -42, 0.45 + P, 0.12, 0.6],
    ];
    locks(head, o, L.map((l) => [f * l[0], l[1], f * l[2], l[3], l[4], f * l[5], ...l.slice(6)]));
  },
  bun(head, o) {                                     // belah tengah rapi dengan sanggul
    capHair(head, o, 0.328);
    locks(head, o, [
      ...mir([[4, 74, 58, 14, 0.342, 0.16, 0.07, 0.3], [34, 68, 80, -4, 0.34, 0.12, 0.05, 0.32],
        ...(o.sideLocks ? [[84, 30, 78, -44, 0.335, 0.05, 0.03]] : [])]),
    ]);
    const y = o.bunY ?? 0.2, z = o.bunZ ?? -0.34;
    add(head, ball(0.115), o.hair, [0, y, z], [0, 0, 0], [1.1, 0.95, 0.9]);
    add(head, new THREE.TorusGeometry(0.075, 0.022, 8, 20), o.hair2, [0, y - 0.03, z + 0.07], [0.9, 0, 0]);
    add(head, new THREE.CylinderGeometry(0.008, 0.008, 0.34, 8), mat("#e0b040", { roughness: 0.35, metalness: 0.5 }), [0.02, y + 0.01, z], [0, 0, 1.15]);   // tusuk konde
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
// baju berbentuk lonceng: melebar di bawah, menyempit ke leher
const TORSO = [[-0.075, 0.196, 0.172], [-0.04, 0.204, 0.18], [0.05, 0.186, 0.164], [0.15, 0.158, 0.138], [0.24, 0.128, 0.114], [0.3, 0.092, 0.088], [0.335, 0.05, 0.05]];
const SLIM = [[-0.03, 0.168, 0.15], [0.05, 0.166, 0.148], [0.15, 0.15, 0.132], [0.24, 0.124, 0.11], [0.3, 0.09, 0.086], [0.335, 0.05, 0.05]];
const SKIRT = [[0.0, 0.166, 0.148], [-0.1, 0.2, 0.18], [-0.24, 0.232, 0.212], [-0.29, 0.238, 0.218]];
const gold = () => mat("#f0c040", { roughness: 0.35, metalness: 0.5 });
const CHARS = {
  nino: {
    name: "Nino", scale: 1, skin: "#f0c09a", hair: "#4a3a52", hair2: "#2c2236", hair3: "#75608a", hairFn: "swept", iris: ["#2a1612", "#7a4426", "#c98444"],
    pants: "#4668b8", cuff: "#7c9be0", sock: "#ffffff", shoe: "#fafafa", sole: "#f07a2a", sleeve: "#f08a34", armBand: "#ffffff", wristBand: "#c8601e",
    body: () => mat("#ffffff", { map: cloth(512, 256, (c, w, h, x0) => {   // jaket balap terbuka di atas kaos gelap
      c.fillStyle = "#f08a34"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#2f3658"; c.beginPath(); c.moveTo(x0 - 34, 0); c.lineTo(x0 + 34, 0); c.lineTo(x0 + 22, h); c.lineTo(x0 - 22, h); c.fill();
      c.fillStyle = "#ffe2b0"; c.fillRect(x0 - 8, h * 0.42, 16, 16);                                   // gambar kecil di kaos
      c.strokeStyle = "#fff4e0"; c.lineWidth = 7;
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x0 + s * 37, 0); c.lineTo(x0 + s * 25, h); c.stroke(); }
      c.fillStyle = "#ffffff"; c.fillRect(x0 - 78, 0, 12, h * 0.9); c.fillRect(x0 + 66, 0, 12, h * 0.9);
      c.fillStyle = "#c8601e"; c.fillRect(0, 0, w, 26);
    }) }),
    extra(p) {
      add(p.torso, loft([[0.275, 0.108, 0.1, 0, -0.012], [0.33, 0.1, 0.092, 0, -0.016]], false, false), "#ffa050");   // kerah berdiri
      add(p.head, ball(0.03, 12, 8), "#fff0d8", [0.31, -0.04, -0.05], [0, 0, 0], [0.6, 1.25, 0.9]);              // alat bantu dengar
    },
  },
  kael: {
    name: "Kael", scale: 1.03, skin: "#f6d0ae", hair: "#9a6238", hair2: "#6a3e20", hair3: "#cf9558", hairFn: "swept", hairFlip: true, puff: 0.015, fringe: 6, sleepy: true, mouth: "flat", bulk: 0.008,
    iris: ["#2a1a12", "#56703a", "#a8c468"],
    pants: "#565a70", sock: "#e8e8f0", shoe: "#6a7088", sole: "#3a3c4c", sleeve: "#98a6bc", wristBand: "#7a889e",
    torso: [[-0.085, 0.208, 0.184], [-0.04, 0.216, 0.192], [0.05, 0.198, 0.174], [0.15, 0.168, 0.146], [0.24, 0.134, 0.118], [0.3, 0.095, 0.09], [0.335, 0.05, 0.05]],
    body: () => mat("#ffffff", { map: cloth(512, 256, (c, w, h, x0) => {   // hoodie kebesaran
      c.fillStyle = "#98a6bc"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#7a889e"; c.fillRect(0, 0, w, 24);
      c.fillStyle = "#8694aa"; c.beginPath(); c.roundRect(x0 - 50, 44, 100, 62, 10); c.fill();          // kantong
      c.fillStyle = "#ffffff"; c.fillRect(x0 - 13, h * 0.62, 5, h * 0.3); c.fillRect(x0 + 8, h * 0.62, 5, h * 0.3);   // tali
    }) }),
    extra(p) {
      add(p.torso, ball(0.13), "#8694aa", [0, 0.27, -0.115], [0.3, 0, 0], [1.25, 0.8, 0.62]);            // tudung
      const dk = mat("#2c2c3a", { roughness: 0.5 });
      add(p.torso, new THREE.TorusGeometry(0.112, 0.02, 10, 28, Math.PI * 1.25), dk, [0, 0.318, -0.01], [Math.PI / 2 - 0.12, 0, Math.PI * 0.875 + Math.PI]);   // headset di leher
      for (const s of [-1, 1]) {
        add(p.torso, new THREE.CylinderGeometry(0.052, 0.052, 0.045, 20), dk, [s * 0.118, 0.3, 0.07], [0, 0, Math.PI / 2], [1, 1, 1]);
        add(p.torso, new THREE.CylinderGeometry(0.03, 0.03, 0.012, 20), mat("#40f0d8", { emissive: "#40f0d8", emissiveIntensity: 1.2 }), [s * 0.143, 0.3, 0.07], [0, 0, Math.PI / 2]);
      }
    },
  },
  ibu: {
    name: "Ibu Nino", scale: 1.04, skin: "#eebc94", hair: "#40303e", hair2: "#261c28", hair3: "#6a5068", hairFn: "bun", lashes: true, sideLocks: true,
    iris: ["#2a1612", "#703c2a", "#b8744a"],
    bareLegs: true, shoe: "#9a5e3c", sole: "#5e3a22", sleeve: "#d24e70", shortSleeve: true, torso: SLIM,
    dress: () => mat("#ffffff", { map: batik("#d24e70", "#ffd878", "#7a1e38") }),
    body: () => mat("#ffffff", { map: batik("#d24e70", "#ffd878", "#7a1e38") }),
    extra(p) {
      add(p.torso, loft([[0.285, 0.1, 0.094], [0.325, 0.07, 0.068]], false, false), "#ffe6c8");           // kerah
      for (const s of [-1, 1]) add(p.head, ball(0.02, 10, 8), gold(), [s * 0.3, -0.11, -0.02]);       // anting
    },
  },
  nenek: {
    name: "Nenek Kael", scale: 0.92, skin: "#eec0a0", hair: "#d0d0de", hair2: "#a4a4bc", hair3: "#f4f4fc", hairFn: "bun", hunch: 0.14, wrinkle: true,
    bunY: 0.3, bunZ: -0.24, eyeH: 0.046, eyeW: 0.036, iris: ["#2e2220", "#6a4c40", "#a88670"],
    bareLegs: true, shoe: "#74503c", sole: "#4a3022", sleeve: "#7cb898", wristBand: "#ffffff", torso: SLIM,
    dress: () => mat("#ffffff", { map: cloth(256, 256, (c, w, h) => {   // sarung batik bergaris
      c.fillStyle = "#845836"; c.fillRect(0, 0, w, h);
      for (let y = 10; y < h; y += 44) { c.fillStyle = "#e8b858"; c.fillRect(0, y, w, 7); c.fillStyle = "#56341a"; c.fillRect(0, y + 11, w, 3); }
      c.fillStyle = "#e8b858";
      for (let j = 0; j < 6; j++) for (let i = 0; i < 16; i++) { c.beginPath(); c.arc(i * 16 + (j % 2) * 8, j * 44 + 32, 2.6, 0, 7); c.fill(); }
    }) }),
    body: () => mat("#ffffff", { map: cloth(512, 256, (c, w, h, x0) => {   // kebaya dengan renda
      c.fillStyle = "#7cb898"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#569070"; c.fillRect(x0 - 4, 0, 8, h);
      c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, 16);
      for (let x = 0; x < w; x += 16) { c.beginPath(); c.arc(x + 8, 16, 7, 0, Math.PI); c.fill(); }
    }) }),
    extra(p) {
      add(p.torso, ball(0.022, 10, 8), gold(), [0, 0.24, 0.118]);                                           // bros
      const frame = mat("#8a5a3c", { roughness: 0.45 });
      for (const s of [-1, 1]) add(p.head, new THREE.TorusGeometry(0.052, 0.007, 8, 28), frame, [s * 0.101, -0.052, 0.286], [0.06, s * 0.34, 0]);   // kacamata bulat
      add(p.head, new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), frame, [0, -0.046, 0.304], [0, 0, Math.PI / 2]);
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
