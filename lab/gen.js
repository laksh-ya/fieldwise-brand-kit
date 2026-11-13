// Generate many arrangements and write them to a JSON for a contact sheet.
require("./pebbles.js"); require("./arrange.js");
const { arrange, colour } = Arrange, R0 = Pebbles.rng(99);
const pickT = (R, w = { chunk: 3, shard: 3, oval: 2, drop: 1.5, long: 1 }) => { let s = R() * Object.values(w).reduce((a, b) => a + b); for (const k in w) { s -= w[k]; if (s <= 0) return k; } return "chunk"; };
const RECIPES = {
  bold:    { sizes: [255, 190, 150, 115, 85], gap: 26 },
  settled: { sizes: [200, 160, 135, 115, 98, 82, 70], gap: 22 },
  many:    { sizes: [175, 145, 125, 110, 96, 86, 76, 68, 60, 54, 48], gap: 18 },
  loose:   { sizes: [190, 150, 128, 110, 95, 82, 70, 60], gap: 46 },
  tight:   { sizes: [205, 165, 140, 120, 102, 88, 76, 66, 58], gap: 9 },
  nine:    { sizes: [185, 150, 132, 116, 102, 90, 80, 70, 62], gap: 20 },
  trio:    { sizes: [265, 175, 115, 70], gap: 30 },
  ring:    { sizes: [118, 112, 106, 100, 96, 92, 88, 84, 80, 76, 72], gap: 18, hole: (() => { const d = 215, s2 = Math.SQRT2; return [d, d + d * s2, 1000 - 2 * d - d * s2, 1000 - 2 * d - d * s2]; })() },
};
const which = (process.argv[2] || Object.keys(RECIPES).join(",")).split(",");
const seeds = +(process.argv[3] || 8);
const out = [];
for (const name of which) {
  const rc = RECIPES[name];
  for (let s = 1; s <= seeds; s++) {
    const seed = s * 101 + name.length * 7;
    const R = Pebbles.rng(seed);
    const stones = rc.sizes.map((r) => ({ r: r * (0.92 + R() * 0.16), type: pickT(R) }));
    const placed = arrange({ seed, stones, gap: rc.gap, hole: rc.hole, jitter: 40 });
    const cols = colour(placed, { seed, scheme: "shore", warm: "tip" });
    out.push({ id: `${name}-${seed}`, recipe: name, seed, stones: placed.map((p, i) => ({ poly: p.pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]), color: cols[i] })), missing: rc.sizes.length - placed.length });
  }
}
require("fs").writeFileSync(process.argv[4] || "gen-out.json", JSON.stringify(out));
console.log(out.map((o) => `${o.id}:${o.stones.length}${o.missing ? "(-" + o.missing + ")" : ""}`).join(" "));
