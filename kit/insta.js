// Instagram profile mark: 1080 square, sand ground, mark sized for the circle crop.
global.window = global; require("../lab/pebbles.js"); require("../lab/layouts.js");
const fs = require("fs"), P = Pebbles;
const [,, key = "tight-540", mat = "glass", out = "../dist/instagram/fieldwise-instagram"] = process.argv;
const L = LAYOUTS.find((l) => l.key === key);
// Field glass: the same remap the kit uses (cool stones to greens, the warm one stays citrine).
const FIELD = [P.PAL.bottle, P.PAL.seafoam, P.PAL.moss, P.PAL.lime, P.PAL.teal, "#A9D9B9", "#4E9C6E"], WARM = new Set([P.PAL.citrine, P.PAL.amber, P.PAL.copper]), seen = new Map();
const its = L.stones.map((s) => { let c = P.PAL[s.color] || s.color; if (WARM.has(c)) c = P.PAL.citrine; else { if (!seen.has(c)) seen.set(c, FIELD[seen.size % FIELD.length]); c = seen.get(c); } return { poly: s.poly.map(([x, y]) => [1000 - x, y]).reverse(), color: c }; });
const all = P.bbox(its.flatMap((i) => i.poly)), S = Math.max(all.w, all.h), pad = 0.02 * S, room = mat === "glass" ? 0.19 * S : 0;
const vb = [all.x - pad - 0.25 * room, all.y - pad - 0.25 * room, all.w + 2 * pad + 1.25 * room, all.h + 2 * pad + 1.25 * room];
const N = 1080, k = (N * 0.62) / Math.max(all.w + 2 * pad, all.h + 2 * pad);
// optical centre: halfway between the box centre and the stones' mass centre
let A = 0, mx = 0, my = 0; for (const it of its) { const a = Math.abs(P.area(it.poly)), c = P.centroid(it.poly); A += a; mx += c[0] * a; my += c[1] * a; }
const cx = (all.x + all.w / 2 + mx / A) / 2, cy = (all.y + all.h / 2 + my / A) / 2;
const x = N / 2 - (cx - vb[0]) * k, y = N / 2 - (cy - vb[1]) * k;
const inner = P.render(its, { size: Math.round(vb[2] * k), material: mat, viewBox: vb })
  .replace(/^<svg[^>]*>/, `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(vb[2] * k).toFixed(1)}" height="${(vb[3] * k).toFixed(1)}" viewBox="${vb.map((v) => v.toFixed(1)).join(" ")}" overflow="visible">`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" width="${N}" height="${N}">
<title>Fieldwise</title>
<defs><radialGradient id="light" cx=".22" cy=".08" r="1.05"><stop offset="0" stop-color="#FFFCF4" stop-opacity=".55"/><stop offset="1" stop-color="#FFFCF4" stop-opacity="0"/></radialGradient></defs>
<rect width="${N}" height="${N}" fill="#ECE7DE"/><rect width="${N}" height="${N}" fill="url(#light)"/>
${inner}
</svg>`;
fs.writeFileSync(out + ".svg", svg);
console.log(out + ".svg", (svg.length / 1024).toFixed(0) + " KB");
