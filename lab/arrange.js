/* Sea-glass stones, settled by hand into a right angle.
   Each stone is a random broken shard tumbled smooth (Chaikin corner cutting),
   then stones are placed largest-first, each sliding as far into the corner as
   it can without touching the walls or the stones already there.
   Run with node to precompute layouts into layouts.js. */
(function (root) {
  "use strict";
  const P = root.Pebbles;
  const { rng, centroid, area } = P;

  /* ---------- stone shapes ---------- */
  function chaikin(pts, it, q = 0.25) {
    for (let k = 0; k < it; k++) {
      const out = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        out.push([a[0] * (1 - q) + b[0] * q, a[1] * (1 - q) + b[1] * q], [a[0] * q + b[0] * (1 - q), a[1] * q + b[1] * (1 - q)]);
      }
      pts = out;
    }
    return pts;
  }
  function resample(pts, n) {
    const L = [0]; for (let i = 1; i <= pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i % pts.length][0] - pts[i - 1][0], pts[i % pts.length][1] - pts[i - 1][1]));
    const tot = L[L.length - 1], out = []; let j = 0;
    for (let k = 0; k < n; k++) {
      const t = (k / n) * tot; while (L[j + 1] < t) j++;
      const a = pts[j], b = pts[(j + 1) % pts.length], u = (t - L[j]) / (L[j + 1] - L[j] || 1);
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
    }
    return out;
  }
  const TYPES = {
    shard: { k: [3, 4], asp: [0.62, 0.95], it: 3 },
    chunk: { k: [4, 5], asp: [0.7, 0.95], it: 4 },
    oval:  { k: [5, 7], asp: [0.58, 0.82], it: 5 },
    long:  { k: [4, 5], asp: [0.38, 0.55], it: 4 },
    drop:  { k: [3, 3], asp: [0.7, 0.9], it: 5 },
  };
  // A stone of equivalent radius r, centred on the origin.
  function stone(R, type, r) {
    const T = TYPES[type], k = T.k[0] + Math.floor(R() * (T.k[1] - T.k[0] + 1));
    const asp = T.asp[0] + R() * (T.asp[1] - T.asp[0]), off = R() * Math.PI * 2;
    let pts = [];
    for (let i = 0; i < k; i++) {
      const a = off + (i / k) * Math.PI * 2 + (R() - 0.5) * (Math.PI * 2 / k) * 0.55;
      const rad = 1 + (R() - 0.5) * 0.45;
      pts.push([Math.cos(a) * rad, Math.sin(a) * rad * asp]);
    }
    pts = chaikin(pts, T.it, 0.22 + R() * 0.06);
    pts = resample(pts, 56);
    // a little lumpiness, the way real glass wears unevenly
    const ph = R() * 6.28, ph2 = R() * 6.28;
    pts = pts.map(([x, y], i) => { const t = i / 56 * 6.283, f = 1 + 0.025 * Math.sin(2 * t + ph) + 0.018 * Math.sin(3 * t + ph2); return [x * f, y * f]; });
    const c = centroid(pts); pts = pts.map(([x, y]) => [x - c[0], y - c[1]]);
    const s = r / Math.sqrt(Math.abs(area(pts)) / Math.PI);
    return pts.map(([x, y]) => [x * s, y * s]);
  }

  /* ---------- placement ---------- */
  const rot = (pts, a) => { const c = Math.cos(a), s = Math.sin(a); return pts.map(([x, y]) => [x * c - y * s, x * s + y * c]); };
  function minDist(A, B) {
    let m = Infinity;
    for (let i = 0; i < A.length; i++) for (let j = 0; j < B.length; j++) { const d = (A[i][0] - B[j][0]) ** 2 + (A[i][1] - B[j][1]) ** 2; if (d < m) m = d; }
    return Math.sqrt(m);
  }
  function pip(pt, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  // Container: right triangle with the right angle at (0,H); optional hollow centre.
  function inside(pts, W, H, hole) {
    for (const [x, y] of pts) {
      if (x < 0 || y > H || H * x - W * (y) > 0) return false; // ◣: y >= x*H/W
    }
    if (hole) { // hollow: no point may sit inside the inner triangle
      const [hx, hy, hw, hh] = hole; // inner right triangle: corner (hx, hy+hh), size hw x hh
      for (const [x, y] of pts) { const u = x - hx, v = y - hy; if (u > 0 && v < hh && v > 0 && hh * u - hw * v < 0) return false; }
    }
    return true;
  }

  /* opts: seed, stones:[{type, r}], gap, W, H, corner weight, hole, jitter */
  function arrange(o) {
    const R = rng(o.seed), W = o.W || 1000, H = o.H || 1000, gap = o.gap ?? 22;
    const stones = o.stones.map((s) => ({ ...s, pts: stone(R, s.type, s.r) })).sort((a, b) => b.r - a.r);
    const corner = [0, H];
    const step = o.step || 14, cand = [];
    for (let x = 0; x <= W; x += step) for (let y = 0; y <= H; y += step) if (y >= x * H / W) cand.push([x, y]);
    const placed = [];
    for (const s of stones) {
      let best = null;
      const nr = o.rotations || 18;
      for (let k = 0; k < nr; k++) {
        const a = (k / nr) * Math.PI + (R() - 0.5) * 0.1;
        const pr = rot(s.pts, a);
        const bx = pr.reduce((m, p) => Math.max(m, Math.hypot(p[0], p[1])), 0);
        // score: pulled into the corner; a little noise keeps it hand-placed
        const wx = o.wx ?? 1, wy = o.wy ?? 1;
        const sc = (p) => Math.hypot((p[0] - corner[0]) * wx, (p[1] - corner[1]) * wy);
        const order = cand.map((p) => [p, sc(p) + (R() - 0.5) * (o.jitter ?? 30)]).sort((a, b) => a[1] - b[1]);
        for (const [p, score] of order) {
          if (best && score >= best.score) break;
          const pts = pr.map(([x, y]) => [x + p[0], y + p[1]]);
          if (!inside(pts, W, H, o.hole)) continue;
          let ok = true;
          for (const q of placed) { if (Math.hypot(q.c[0] - p[0], q.c[1] - p[1]) > q.br + bx + gap) continue; if (pip(p, q.pts) || pip(q.c, pts) || pts.some((v, vi) => vi % 3 === 0 && pip(v, q.pts)) || minDist(pts, q.pts) < gap) { ok = false; break; } }
          if (!ok) continue;
          best = { pts, score, c: p, br: bx };
          break;
        }
      }
      if (best) placed.push({ ...best, type: s.type, r: s.r });
    }
    return placed;
  }

  /* ---------- colour ---------- */
  const SCHEMES = {
    shore: ["cobalt", "aqua", "seafoam", "bottle", "milk", "sky", "teal", "lavender", "lime"],
    field: ["bottle", "seafoam", "moss", "lime", "teal", "milk", "aqua"],
  };
  // Neighbouring stones never share a colour; one stone is the warm, lit one.
  function colour(placed, o = {}) {
    const R = rng((o.seed || 1) * 7 + 3), names = (SCHEMES[o.scheme] || SCHEMES.shore).slice();
    const near = (a, b) => minDist(a.pts, b.pts) < 90;
    const warmAt = o.warm ?? "tip"; // tip | corner | middle | none
    let wi = -1;
    if (warmAt !== "none") {
      const cs = placed.map((p) => centroid(p.pts));
      const target = warmAt === "corner" ? [0, 1000] : warmAt === "middle" ? [330, 670] : warmAt === "right" ? [1000, 1000] : [0, 0];
      let bd = Infinity; cs.forEach((c, i) => { const d = Math.hypot(c[0] - target[0], c[1] - target[1]); if (d < bd) { bd = d; wi = i; } });
    }
    const out = [];
    placed.forEach((p, i) => {
      if (i === wi) { out.push(o.warmColor || "citrine"); return; }
      const used = new Set(placed.map((q, j) => (j < out.length && near(p, q) ? out[j] : null)));
      for (let t = names.length - 1; t > 0; t--) { const j = Math.floor(R() * (t + 1)); [names[t], names[j]] = [names[j], names[t]]; }
      out.push(names.find((n) => !used.has(n)) || names[0]);
    });
    if (o.extraWarm) { // one copper or amber accent somewhere else
      let j = Math.floor(R() * placed.length); if (j === wi) j = (j + 1) % placed.length; out[j] = o.extraWarm;
    }
    return out;
  }

  // Stones resting against a wall get a slightly flatter face there, as if laid against a straight edge.
  function settle(placed, k = 0.6, t = 80, W = 1000, H = 1000) {
    const hyp = Math.hypot(W, H);
    const walls = [
      (x, y) => [x, [-1, 0]],                        // left: distance x, outward normal
      (x, y) => [H - y, [0, 1]],                     // bottom
      (x, y) => [(W * y - H * x) / hyp, [H / hyp, -W / hyp]], // slope
    ];
    return placed.map((p) => {
      let pts = p.pts.map(([x, y]) => {
        for (const w of walls) {
          const [d, n] = w(x, y);
          if (d < t) { const nd = d * (1 - k) + (d * d / t) * k * 0.5; x += n[0] * (d - nd); y += n[1] * (d - nd); }
        }
        return [x, y];
      });
      return { ...p, pts };
    });
  }

  root.Arrange = { settle, stone, arrange, colour, chaikin, TYPES, SCHEMES };
})(typeof window !== "undefined" ? window : globalThis);
