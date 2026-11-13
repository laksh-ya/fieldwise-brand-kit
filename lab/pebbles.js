/* Fieldwise sea-glass pebble renderer.
   Layouts are lists of polygons in a 1000-unit space; this turns them into
   soft pebble paths and renders them as SVG in several materials:
   glass (skeuomorphic, on sand), glow (on dark), tint (two flat tones),
   flat (one tone each), mono (one ink) and outline (line art). */
(function (root) {
  "use strict";

  /* ---------- colour ---------- */
  const hex2rgb = (h) => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((x) => x + x).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const rgb2hex = (c) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x.map((v, i) => v + (y[i] - v) * t)); };
  function saturate(h, s) {
    const [r, g, b] = hex2rgb(h); const l = 0.299 * r + 0.587 * g + 0.114 * b;
    return rgb2hex([r, g, b].map((v) => l + (v - l) * s));
  }

  /* ---------- random ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- geometry ---------- */
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const len = (a) => Math.hypot(a[0], a[1]);
  const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  function area(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function centroid(p) {
    let cx = 0, cy = 0, A = 0;
    for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; const f = a[0] * b[1] - b[0] * a[1]; cx += (a[0] + b[0]) * f; cy += (a[1] + b[1]) * f; A += f; }
    if (Math.abs(A) < 1e-9) return mul(p.reduce(add, [0, 0]), 1 / p.length);
    return [cx / (3 * A), cy / (3 * A)];
  }
  function bbox(p) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of p) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  // Intersect lines p+t*d and q+s*e.
  function lineX(p, d, q, e) {
    const den = d[0] * e[1] - d[1] * e[0];
    if (Math.abs(den) < 1e-9) return p;
    const t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / den;
    return add(p, mul(d, t));
  }
  // Shrink a convex polygon by distance g on every edge.
  function inset(poly, g) {
    if (!g) return poly.slice();
    const c = centroid(poly), n = poly.length, lines = [];
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n], d = norm(sub(b, a));
      let nn = [-d[1], d[0]];
      if (dot(nn, sub(c, a)) < 0) nn = mul(nn, -1);
      lines.push([add(a, mul(nn, g)), d]);
    }
    const out = [];
    for (let i = 0; i < n; i++) { const L0 = lines[(i - 1 + n) % n], L1 = lines[i]; out.push(lineX(L0[0], L0[1], L1[0], L1[1])); }
    return out;
  }
  // Split a convex polygon by the line through p with direction d.
  function split(poly, p, d) {
    const side = (q) => d[0] * (q[1] - p[1]) - d[1] * (q[0] - p[0]);
    const A = [], B = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], sa = side(a), sb = side(b);
      (sa >= 0 ? A : B).push(a);
      if ((sa >= 0) !== (sb >= 0)) { const t = sa / (sa - sb); const x = lerp(a, b, t); A.push(x); B.push(x); }
    }
    return [A, B].filter((q) => q.length >= 3 && Math.abs(area(q)) > 1);
  }
  function transform(poly, { dx = 0, dy = 0, rot = 0, scale = 1, about } = {}) {
    const c = about || centroid(poly), cs = Math.cos(rot), sn = Math.sin(rot);
    return poly.map(([x, y]) => { const u = (x - c[0]) * scale, v = (y - c[1]) * scale; return [c[0] + u * cs - v * sn + dx, c[1] + u * sn + v * cs + dy]; });
  }
  // An organic pebble polygon on an ellipse.
  function blob(cx, cy, rx, ry, rot, n, jit, R) {
    const pts = [], off = R() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * Math.PI * 2 + (R() - 0.5) * jit * (Math.PI * 2 / n);
      const k = 1 - R() * jit * 0.35;
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return pts;
  }

  // Soft pebble outline from a polygon: rounded corners and slightly convex edges.
  function pebblePath(poly, o = {}) {
    const round = o.round ?? 0.3, k = o.k ?? 0.6, bulge = o.bulge ?? 0.035, maxR = o.maxR ?? 85;
    const n = poly.length, c = centroid(poly);
    const A = [], Bp = [];
    for (let i = 0; i < n; i++) {
      const V = poly[i], P = poly[(i - 1 + n) % n], N = poly[(i + 1) % n];
      const lp = len(sub(P, V)), ln = len(sub(N, V));
      const r = Math.min(maxR, round * Math.min(lp, ln));
      A.push(add(V, mul(norm(sub(P, V)), Math.min(r, lp * 0.49))));
      Bp.push(add(V, mul(norm(sub(N, V)), Math.min(r, ln * 0.49))));
    }
    const f = (p) => p[0].toFixed(1) + " " + p[1].toFixed(1);
    let d = "M" + f(Bp[0]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, s = Bp[i], e = A[j], el = len(sub(e, s));
      const m = lerp(s, e, 0.5), dir = norm(sub(e, s));
      let nn = [-dir[1], dir[0]]; if (dot(nn, sub(m, c)) < 0) nn = mul(nn, -1);
      const cp = add(m, mul(nn, bulge * el));
      d += " Q" + f(cp) + " " + f(e);
      const V = poly[j];
      d += " C" + f(lerp(A[j], V, k)) + " " + f(lerp(Bp[j], V, k)) + " " + f(Bp[j]);
    }
    return d + "Z";
  }

  // Smooth closed path through many points (Catmull-Rom as cubic Béziers).
  function smoothPath(pts) {
    const n = pts.length, f = (p) => p[0].toFixed(1) + " " + p[1].toFixed(1);
    let d = "M" + f(pts[0]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += " C" + f([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + " " + f([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + " " + f(p2);
    }
    return d + "Z";
  }

  /* ---------- palette ---------- */
  const PAL = {
    cobalt: "#4C67C8", sky: "#9CB9DB", aqua: "#57BFCC", teal: "#2FA39A", seafoam: "#87D4AF",
    bottle: "#2C8A64", moss: "#6FAF62", lime: "#B6D46A", citrine: "#F1BB52", amber: "#E59A3C",
    milk: "#D8E1D9", copper: "#C47C57", lavender: "#C3B0D8",
  };
  const INK = "#18241F";

  /* ---------- rendering ---------- */
  let uid = 0;
  const SUN = [0.643, 0.766];

  // Pebble items: {poly, color, path?}. Returns the SVG markup string.
  function render(items, o = {}) {
    const mat = o.material || "glass";
    const id = "p" + (o.id || ++uid) + mat[0];
    const size = o.size || 400;
    const peb = items.map((it) => ({ ...it, d: it.path || (it.poly.length > 12 ? smoothPath(it.poly) : pebblePath(it.poly, it.shape || o.shape)), bb: bbox(it.poly), c0: centroid(it.poly) }));
    const all = bbox(peb.flatMap((p) => p.poly));
    const pad = (o.pad ?? 0.08) * Math.max(all.w, all.h);
    // room: leave space for the shadow on the sunny side's opposite edges (needed when drawn as an image, which clips)
    const room = o.room ? 0.19 * Math.max(all.w, all.h) : 0;
    const vb = o.viewBox || [all.x - pad - room * 0.25, all.y - pad - room * 0.25, all.w + pad * 2 + room * 1.25, all.h + pad * 2 + room * 1.25];
    const unit = vb[2] / size; // svg units per pixel
    const S = o.ref || Math.max(all.w, all.h);
    const ink = o.ink || INK;
    let defs = "", back = "", front = "";
    const anim = !!o.animatable;
    const gOpen = (cls, i, extra = "") => anim ? `<g class="${cls}" data-i="${i}"${extra}>` : `<g${extra}>`;

    if (mat === "flat" || mat === "mono" || mat === "tint" || mat === "outline") {
      peb.forEach((p, i) => {
        const fill = mat === "mono" ? ink : p.color;
        let s = "";
        if (mat === "outline") s = `<path d="${p.d}" fill="none" stroke="${ink}" stroke-width="${(o.stroke || 0.022) * S}" stroke-linejoin="round"/>`;
        else s = `<path d="${p.d}" fill="${fill}"/>`;
        if (mat === "tint") {
          // A second flat tone where light gathers at the far edge of the glass.
          const inner = transform(p.poly, { scale: 0.62, dx: (p.bb.w) * 0.1, dy: p.bb.h * 0.12 });
          defs += `<clipPath id="${id}c${i}"><path d="${p.d}"/></clipPath>`;
          s += `<path d="${inner.length > 12 ? smoothPath(inner) : pebblePath(inner, { round: 0.48, k: 0.7, bulge: 0.08 })}" fill="${mix(p.color, "#ffffff", 0.42)}" clip-path="url(#${id}c${i})"/>`;
        }
        front += gOpen("pb", i) + s + "</g>";
      });
    } else {
      const glow = mat === "glow";
      const L = (o.shadow ?? 0.15) * S;
      const blurS = Math.max(0.6 * unit, 0.014 * S), blurC = 0.022 * S;
      const grainF = Math.min(0.9, 0.55 / unit);
      const showGrain = size >= 72;
      defs += `<filter id="${id}bs" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${blurS}"/></filter>`;
      defs += `<filter id="${id}bc" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blurC}"/></filter>`;
      defs += `<filter id="${id}br" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${0.004 * S}"/></filter>`;
      defs += `<filter id="${id}be" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${0.022 * S}"/></filter>`;
      defs += `<filter id="${id}bg" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="${0.045 * S}"/></filter>`;
      defs += `<filter id="${id}gr" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${grainF}" numOctaves="3" seed="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.3" intercept="-0.15"/><feFuncG type="linear" slope="1.3" intercept="-0.15"/><feFuncB type="linear" slope="1.3" intercept="-0.15"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer></filter>`;
      defs += `<filter id="${id}sp" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${grainF * 1.1}" numOctaves="1" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  26 0 0 0 -18.6"/></filter>`;
      defs += `<radialGradient id="${id}spec" cx=".28" cy=".2" r=".62"><stop offset="0" stop-color="#fff" stop-opacity="${glow ? 0.32 : 0.5}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
      defs += `<linearGradient id="${id}mtl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".42" stop-color="#000"/></linearGradient>`;
      defs += `<linearGradient id="${id}mbr" x1="0" y1="0" x2="1" y2="1"><stop offset=".55" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>`;

      peb.forEach((p, i) => {
        const c = p.color, b = p.bb;
        const top = mix(saturate(c, 1.05), "#ffffff", glow ? 0.34 : 0.24), bot = mix(saturate(c, 1.12), "#1B2333", glow ? 0.1 : 0.2);
        defs += `<linearGradient id="${id}b${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${bot}"/></linearGradient>`;
        defs += `<radialGradient id="${id}g${i}" cx=".7" cy=".76" r=".52"><stop offset="0" stop-color="${mix(saturate(c, 1.25), "#fff", 0.5)}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
        defs += `<radialGradient id="${id}k${i}"><stop offset="0" stop-color="${mix(saturate(c, 1.9), "#fff", 0.42)}"/><stop offset=".5" stop-color="${saturate(c, 1.7)}" stop-opacity=".75"/><stop offset="1" stop-color="${saturate(c, 1.4)}" stop-opacity="0"/></radialGradient>`;
        defs += `<clipPath id="${id}c${i}"><path d="${p.d}"/></clipPath>`;
        defs += `<mask id="${id}m${i}" maskUnits="userSpaceOnUse" x="${b.x - 50}" y="${b.y - 50}" width="${b.w + 100}" height="${b.h + 100}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="url(#${id}mtl)"/></mask>`;
        defs += `<mask id="${id}n${i}" maskUnits="userSpaceOnUse" x="${b.x - 50}" y="${b.y - 50}" width="${b.w + 100}" height="${b.h + 100}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="url(#${id}mbr)"/></mask>`;

        // Shadow: the outline swept along the sun, coloured by the glass.
        let sh = "";
        const lp = L * (p.elev ?? 1);
        if (glow) {
          sh += `<path d="${p.d}" fill="${saturate(c, 1.3)}" opacity=".55" filter="url(#${id}bg)" transform="translate(${SUN[0] * lp * 0.25} ${SUN[1] * lp * 0.25})" style="mix-blend-mode:screen"/>`;
        } else {
          const steps = 7; let sw = "";
          for (let s = 1; s <= steps; s++) { const t = s / steps; sw += `<path d="${p.d}" transform="translate(${(SUN[0] * lp * t).toFixed(1)} ${(SUN[1] * lp * t).toFixed(1)})"/>`; }
          sh += `<g fill="${mix(saturate(c, 1.3), "#3B3329", 0.48)}" opacity=".4" filter="url(#${id}bs)" style="mix-blend-mode:multiply">${sw}</g>`;
          const cc = p.c0, sc = 0.7;
          sh += `<path d="${p.d}" fill="url(#${id}k${i})" opacity=".95" filter="url(#${id}bc)" transform="translate(${SUN[0] * lp * 0.5} ${SUN[1] * lp * 0.5}) translate(${cc[0]} ${cc[1]}) scale(${sc}) translate(${-cc[0]} ${-cc[1]})"/>`;
        }
        back += gOpen("sh", i) + sh + "</g>";

        const md = Math.min(b.w, b.h);
        const rw = Math.max(1.2 * unit, md * 0.035);
        let body = `<path d="${p.d}" fill="url(#${id}b${i})"/>`;
        body += `<g clip-path="url(#${id}c${i})">`;
        // light gathering at the far edge, and frosted edges glowing all round
        body += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="url(#${id}g${i})"/>`;
        body += `<path d="${p.d}" fill="none" stroke="${mix(saturate(c, 1.2), "#14202C", 0.45)}" stroke-width="${md * 0.34}" transform="translate(${-SUN[0] * md * 0.09} ${-SUN[1] * md * 0.09})" filter="url(#${id}be)" opacity="${glow ? 0.25 : 0.3}"/>`;
        body += `<path d="${p.d}" fill="none" stroke="${mix(saturate(c, 1.15), "#fff", 0.62)}" stroke-width="${md * 0.2}" filter="url(#${id}be)" opacity="${glow ? 0.75 : 0.6}"/>`;
        body += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="url(#${id}spec)"/>`;
        if (showGrain) {
          body += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" filter="url(#${id}gr)" opacity="${glow ? 0.2 : 0.24}" style="mix-blend-mode:soft-light"/>`;
          body += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" filter="url(#${id}sp)" opacity=".5"/>`;
        }
        body += `<path d="${p.d}" fill="none" stroke="#fff" stroke-width="${rw * 1.4}" mask="url(#${id}m${i})" filter="url(#${id}br)" opacity=".75"/>`;
        body += `<path d="${p.d}" fill="none" stroke="${mix(c, "#fff", 0.8)}" stroke-width="${rw * 1.2}" mask="url(#${id}n${i})" filter="url(#${id}br)" opacity=".85"/>`;
        body += `</g>`;
        body += `<path d="${p.d}" fill="none" stroke="${mix(c, "#1B2333", 0.5)}" stroke-opacity="${glow ? 0.15 : 0.2}" stroke-width="${Math.max(0.6 * unit, 0.002 * S)}"/>`;
        front += gOpen("pb", i) + body + "</g>";
      });
    }

    const bg = o.bg ? `<rect x="${vb[0] - vb[2]}" y="${vb[1] - vb[3]}" width="${vb[2] * 3}" height="${vb[3] * 3}" fill="${o.bg}"/>` : "";
    const h = size * vb[3] / vb[2];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.map((v) => v.toFixed(1)).join(" ")}" width="${o.fluid ? "100%" : size}" height="${o.fluid ? "100%" : h.toFixed(1)}" overflow="visible" style="overflow:visible"${o.label ? ` role="img" aria-label="${o.label}"` : ""}><defs>${defs}</defs>${bg}<g style="isolation:isolate">${back}${front}</g></svg>`;
  }

  root.Pebbles = { PAL, INK, mix, saturate, rng, area, centroid, bbox, inset, split, transform, blob, pebblePath, smoothPath, render, lerp, add, sub, mul, len, norm };
})(typeof window !== "undefined" ? window : globalThis);
