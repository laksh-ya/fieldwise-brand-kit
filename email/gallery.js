// The preview page for all emails (dist/index.html).
module.exports = (index, groups) => {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const list = groups.map(([g, name]) => {
    const items = index.filter((x) => x.group === g);
    if (!items.length) return "";
    return `<section><h3>${esc(name.toLowerCase())}</h3>${items.map((x) => `<button class="it" data-id="${x.id}"><b>${esc(x.name.toLowerCase())}</b>${x.kind === "plain" ? "<i>plain</i>" : ""}</button>`).join("")}</section>`;
  }).join("");
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Fieldwise emails</title>
<link rel="icon" href="assets/mark-tint.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root { --bg: #F3F1EC; --panel: #FFFFFF; --soft: #ECE8E0; --ink: #18241F; --ink2: #4A544E; --line: #E2DED5; --green: #2C8A64; --sel: #E3EEE7; color-scheme: light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #15191B; --panel: #1D2225; --soft: #262C30; --ink: #F1F0EC; --ink2: #B9C0BA; --line: #2F363A; --sel: #22332B; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #15191B; --panel: #1D2225; --soft: #262C30; --ink: #F1F0EC; --ink2: #B9C0BA; --line: #2F363A; --sel: #22332B; color-scheme: dark; }
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body { background: var(--bg); color: var(--ink); font: 15px/1.45 Inter, system-ui, sans-serif; -webkit-tap-highlight-color: transparent; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
.app { display: grid; grid-template-columns: 290px 1fr; height: 100dvh; }
aside { border-right: 1px solid var(--line); overflow: auto; padding: 22px 14px 40px; }
.brand { display: flex; align-items: center; gap: 10px; padding: 0 8px 18px; }
.brand img { height: 26px; }
.brand span { font-weight: 600; letter-spacing: -.01em; }
h3 { margin: 18px 8px 6px; font-size: 13px; font-weight: 500; color: var(--ink2); }
.it { display: flex; align-items: center; justify-content: space-between; width: 100%; text-align: left; padding: 9px 10px; border-radius: 12px; transition: background .2s; }
.it b { font-weight: 500; }
.it i { font-style: normal; font-size: 12px; color: var(--ink2); }
.it:hover { background: var(--soft); }
.it[aria-current="true"] { background: var(--sel); }
main { display: flex; flex-direction: column; min-width: 0; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding: 16px 22px; border-bottom: 1px solid var(--line); background: var(--panel); }
.meta { flex: 1 1 320px; min-width: 0; }
.meta .sj { font-weight: 600; font-size: 16px; overflow-wrap: anywhere; }
.meta .ph { color: var(--ink2); font-size: 14px; overflow-wrap: anywhere; }
.meta .wh { color: var(--ink2); font-size: 13.5px; margin-top: 6px; }
.tools { display: flex; flex-wrap: wrap; gap: 6px; }
.tools button, .tools a { padding: 8px 13px; border-radius: 999px; background: var(--soft); font-size: 13.5px; text-decoration: none; color: inherit; transition: background .2s, transform .15s; }
.tools button:active, .tools a:active { transform: scale(.96); }
.tools button[aria-pressed="true"] { background: var(--ink); color: var(--panel); }
.stage { flex: 1; overflow: auto; display: flex; justify-content: center; padding: 22px; }
iframe { border: 0; width: 100%; max-width: 760px; height: 100%; min-height: 600px; background: transparent; border-radius: 14px; transition: max-width .35s cubic-bezier(.2,.8,.2,1); }
iframe.phone { max-width: 390px; }
.tags { display: none; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tags.on { display: flex; }
.tags code { font: 12.5px ui-monospace, Menlo, monospace; background: var(--soft); padding: 3px 7px; border-radius: 7px; }
.toast { position: fixed; left: 50%; bottom: 24px; transform: translate(-50%, 20px); opacity: 0; background: var(--ink); color: var(--panel); padding: 10px 16px; border-radius: 999px; font-size: 14px; transition: .25s; pointer-events: none; }
.toast.on { opacity: 1; transform: translate(-50%, 0); }
@media (max-width: 860px) {
  .app { display: block; height: auto; }
  aside { border: 0; padding: 14px 16px 0; overflow: visible; }
  .brand { padding: 4px 0 10px; }
  aside section { display: contents; }
  aside h3 { display: none; }
  .nav { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 12px; scroll-snap-type: x proximity; scrollbar-width: none; }
  .nav::-webkit-scrollbar { display: none; }
  .it { width: auto; flex: none; white-space: nowrap; background: var(--panel); padding: 9px 13px; border-radius: 999px; scroll-snap-align: start; gap: 8px; }
  .bar { padding: 14px 16px; position: sticky; top: 0; z-index: 2; }
  .tools .wd { display: none; }
  .stage { padding: 12px 0 40px; }
  iframe, iframe.phone { max-width: 100%; border-radius: 0; min-height: 80dvh; }
}
</style></head>
<body>
<div class="app">
  <aside><div class="brand"><img src="assets/mark-tint.png" alt=""><span>fieldwise emails</span></div><div class="nav">${list}</div></aside>
  <main>
    <div class="bar">
      <div class="meta"><div class="sj" id="sj"></div><div class="ph" id="ph"></div><div class="wh" id="wh"></div><div class="tags" id="tags"></div></div>
      <div class="tools">
        <button data-a="wide" class="wd" aria-pressed="true">desktop</button><button data-a="phone" class="wd" aria-pressed="false">phone</button>
        <button data-a="dark" aria-pressed="false">dark</button>
        <button data-a="tags" aria-pressed="false">tags</button>
        <button data-a="html">copy html</button><button data-a="text">copy text</button><button data-a="rich">copy email</button>
        <a id="dl" download>download</a>
      </div>
    </div>
    <div class="stage"><iframe id="fr" title="email preview"></iframe></div>
  </main>
</div>
<div class="toast" id="toast"></div>
<script>
const INDEX = ${JSON.stringify(index)};
const $ = (s) => document.querySelector(s), fr = $("#fr");
let cur = INDEX[0], dark = false;
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 1600); }
function show(id, push) {
  cur = INDEX.find((x) => x.id === id) || INDEX[0];
  document.querySelectorAll(".it").forEach((b) => b.setAttribute("aria-current", b.dataset.id === cur.id));
  $("#sj").textContent = cur.sampleSubject || cur.name;
  $("#ph").textContent = cur.samplePre;
  $("#wh").textContent = cur.when || "";
  $("#tags").innerHTML = cur.tags.map((t) => "<code>{{" + t + "}}</code>").join("") || "<code>no tags</code>";
  fr.src = "samples/" + cur.id + ".html";
  $("#dl").href = "templates/" + cur.id + ".html";
  $("#dl").setAttribute("download", "fieldwise-" + cur.id + ".html");
  fr.style.colorScheme = dark ? "dark" : "light";
  if (push) history.replaceState(null, "", "#" + cur.id);
  try { localStorage.setItem("fw-email", cur.id); } catch (e) {}
}
fr.addEventListener("load", () => { try { const d = fr.contentDocument; fr.style.height = Math.max(600, d.documentElement.scrollHeight + 4) + "px"; } catch (e) {} });
document.addEventListener("click", async (e) => {
  const it = e.target.closest(".it"); if (it) { show(it.dataset.id, true); if (matchMedia("(max-width:860px)").matches) it.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); return; }
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a;
  if (a === "wide" || a === "phone") { fr.classList.toggle("phone", a === "phone"); document.querySelectorAll(".wd").forEach((x) => x.setAttribute("aria-pressed", x.dataset.a === a)); setTimeout(() => fr.dispatchEvent(new Event("load")), 400); }
  else if (a === "dark") { dark = !dark; b.setAttribute("aria-pressed", dark); fr.style.colorScheme = dark ? "dark" : "light"; }
  else if (a === "tags") { const on = $("#tags").classList.toggle("on"); b.setAttribute("aria-pressed", on); }
  else if (a === "html" || a === "text") {
    const r = await fetch("templates/" + cur.id + "." + (a === "html" ? "html" : "txt")); const t = await r.text();
    try { await navigator.clipboard.writeText(t); toast(a === "html" ? "html copied" : "text copied"); } catch (err) { toast("couldn't copy"); }
  } else if (a === "rich") { // the rendered sample, ready to paste into gmail compose
    try {
      const d = fr.contentDocument, html = d.documentElement.outerHTML;
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([d.body.innerText], { type: "text/plain" }) })]);
      toast("copied, paste it into a new email");
    } catch (err) { toast("couldn't copy"); }
  }
});
let start = location.hash.slice(1); try { start = start || localStorage.getItem("fw-email") || ""; } catch (e) {}
show(start);
{ const c = document.querySelector('.it[aria-current="true"]'), n = document.querySelector(".nav"); if (c && matchMedia("(max-width:860px)").matches) n.scrollLeft = c.offsetLeft - 16; }
</script>
</body></html>`;
};
