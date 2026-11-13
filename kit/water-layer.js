/* water-layer.js
   Pointer-driven "water on glass": a small stable-fluids solve on a velocity texture,
   then the scene is sampled at uv - velocity (three times for an RGB fringe) with a
   glint from the velocity gradient. Pass a canvas as `source` and call redrawScene()
   whenever it changes. Needs WebGL2 and float render targets. */
(function (global) {
  "use strict";

  const VERT = `#version 300 es
in vec2 aPos;
uniform vec2 texelSize;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
void main(){
  vUv = aPos * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;
  const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
`;
  const SPLAT = HEAD + `
uniform sampler2D uTarget; uniform float aspect; uniform vec2 point; uniform vec3 color; uniform float radius;
void main(){ vec2 p = vUv - point; p.x *= aspect; vec3 s = exp(-dot(p, p) / radius) * color; o = vec4(texture(uTarget, vUv).xyz + s, 1.0); }`;
  const ADVECT = HEAD + `
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation;
void main(){ vec2 c = vUv - dt * texture(uVelocity, vUv).xy * texelSize; o = texture(uSource, c) / (1.0 + dissipation * dt); }`;
  const DIVERGENCE = HEAD + `
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).x; float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y; float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x; if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;
  const CURL = HEAD + `
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).y; float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x; float B = texture(uVelocity, vB).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;
  const VORTICITY = HEAD + `
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
void main(){
  float L = texture(uCurl, vL).x; float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x; float B = texture(uCurl, vB).x; float C = texture(uCurl, vUv).x;
  vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + 0.0001; f *= curl * C; f.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + f * dt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`;
  const CLEAR = HEAD + `
uniform sampler2D uTexture; uniform float value;
void main(){ o = value * texture(uTexture, vUv); }`;
  const PRESSURE = HEAD + `
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main(){
  float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x;
  float d = texture(uDivergence, vUv).x;
  o = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
}`;
  const GRADIENT = HEAD + `
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main(){
  float L = texture(uPressure, vL).x; float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x; float B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  o = vec4(v, 0.0, 1.0);
}`;
  const COMPOSITE = HEAD + `
uniform sampler2D uScene; uniform sampler2D uVelocity; uniform vec2 simTexel;
uniform float strength; uniform float split; uniform float sheen;
float h(vec2 uv){ return length(texture(uVelocity, uv).xy); }
void main(){
  vec2 vel = texture(uVelocity, vUv).xy;
  vec2 off = vel * strength * 0.00012;
  vec3 col;
  col.r = texture(uScene, vUv - off * (1.0 + split)).r;
  col.g = texture(uScene, vUv - off).g;
  col.b = texture(uScene, vUv - off * (1.0 - split)).b;
  vec2 e = simTexel * 2.0;
  float dx = h(vUv + vec2(e.x, 0.0)) - h(vUv - vec2(e.x, 0.0));
  float dy = h(vUv + vec2(0.0, e.y)) - h(vUv - vec2(0.0, e.y));
  vec3 n = normalize(vec3(-dx, -dy, 90.0));
  vec3 l = normalize(vec3(-0.4, 0.6, 1.0));
  float spec = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), 40.0);
  col += spec * sheen;
  col += (n.x - n.y) * sheen * 0.18;
  o = vec4(col, 1.0);
}`;

  const DEFAULTS = { strength: 1, swirl: 20, fade: 1.2, split: 0.25, sheen: 0.45, size: 1, force: 6000, simRes: 128, pressureIters: 20, dprCap: 2, source: null, autoWander: false };

  class WaterLayer {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.o = Object.assign({}, DEFAULTS, opts || {});
      this.splats = [];
      this.pointer = { has: false, x: 0, y: 0 };
      this.visible = true;
      this.touched = false; this.t = 0;
      this.reduced = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
      if (!gl) throw new Error("WebGL2 is not available.");
      if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) throw new Error("No float render targets.");
      this.gl = gl;
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const vs = this._shader(gl.VERTEX_SHADER, VERT);
      const mk = (src) => this._program(vs, this._shader(gl.FRAGMENT_SHADER, src));
      this.p = { splat: mk(SPLAT), advect: mk(ADVECT), divergence: mk(DIVERGENCE), curl: mk(CURL), vorticity: mk(VORTICITY), clear: mk(CLEAR), pressure: mk(PRESSURE), gradient: mk(GRADIENT), composite: mk(COMPOSITE) };
      this.sceneTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);

      this._onMove = this._onMove.bind(this);
      this._onLeave = () => { this.pointer.has = false; };
      this._frame = this._frame.bind(this);
      const tgt = this.o.eventTarget || canvas;
      tgt.addEventListener("pointermove", this._onMove, { passive: true });
      tgt.addEventListener("pointerdown", this._onMove, { passive: true });
      tgt.addEventListener("pointerleave", this._onLeave);
      tgt.addEventListener("pointercancel", this._onLeave);
      this._tgt = tgt;
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(canvas);
      this._io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; });
      this._io.observe(canvas);
      this.resize();
      this.last = performance.now();
      this.raf = requestAnimationFrame(this._frame);
    }

    set(opts) { const res = this.o.simRes, dpr = this.o.dprCap; Object.assign(this.o, opts); if (this.o.simRes !== res || this.o.dprCap !== dpr) this.resize(); }
    redrawScene() { if (this.o.source) this._upload(this.o.source); this.dirty = true; }
    splat(x, y, fx, fy) { this.splats.push([x, y, fx, fy]); }

    resize() {
      const c = this.canvas;
      this.dpr = Math.min(global.devicePixelRatio || 1, this.o.dprCap);
      this.cssW = Math.max(1, c.clientWidth); this.cssH = Math.max(1, c.clientHeight);
      c.width = Math.round(this.cssW * this.dpr); c.height = Math.round(this.cssH * this.dpr);
      const aspect = this.cssW / this.cssH, r = this.o.simRes;
      const w = aspect >= 1 ? Math.round(r * aspect) : r, h = aspect >= 1 ? r : Math.round(r / aspect);
      if (!this.vel || this.vel.read.w !== w || this.vel.read.h !== h) {
        this._freeTargets();
        this.vel = this._double(w, h); this.pres = this._double(w, h);
        this.div = this._fbo(w, h); this.curlT = this._fbo(w, h);
      }
      this.redrawScene();
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      this._tgt.removeEventListener("pointermove", this._onMove); this._tgt.removeEventListener("pointerdown", this._onMove);
      this._tgt.removeEventListener("pointerleave", this._onLeave); this._tgt.removeEventListener("pointercancel", this._onLeave);
      this._ro.disconnect(); this._io.disconnect();
      this._freeTargets();
      const lose = this.gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext();
    }

    _onMove(e) {
      const r = this.canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
      if (this.pointer.has && e.type === "pointermove") {
        const dx = x - this.pointer.x, dy = y - this.pointer.y;
        if (dx || dy) this.splats.push([x, y, dx * this.o.force, dy * this.o.force]);
      }
      this.pointer.has = true; this.pointer.x = x; this.pointer.y = y;
      this.lastInput = performance.now();
      this.touched = true;
    }

    _frame(now) {
      this.raf = requestAnimationFrame(this._frame);
      const dt = Math.min((now - this.last) / 1000, 1 / 60);
      this.last = now;
      if (!this.visible || this.paused || document.hidden || !this.vel) return;
      if (this.o.autoWander && !this.touched && !this.reduced) this._wander(dt);
      const gl = this.gl;
      gl.disable(gl.BLEND);
      for (const s of this.splats) this._splat(s[0], s[1], s[2], s[3]);
      this.splats.length = 0;
      this._step(dt);
      this._composite();
    }

    // Drift on its own until the user moves the pointer (same path as the original water-layer.js).
    _wander(dt) {
      this.t += dt;
      const t = this.t, x = 0.5 + 0.34 * Math.sin(t * 0.8), y = 0.5 + 0.26 * Math.sin(t * 1.6 + 0.6);
      if (this._wp) this.splats.push([x, y, (x - this._wp[0]) * this.o.force, (y - this._wp[1]) * this.o.force]);
      this._wp = [x, y];
    }

    _splat(x, y, fx, fy) {
      const gl = this.gl, p = this.p.splat;
      gl.useProgram(p.prog);
      gl.uniform2f(p.u.texelSize, this.vel.read.tx, this.vel.read.ty);
      gl.uniform1i(p.u.uTarget, this.vel.read.bind(0));
      gl.uniform1f(p.u.aspect, this.cssW / this.cssH);
      gl.uniform2f(p.u.point, x, y);
      gl.uniform3f(p.u.color, fx, fy, 0);
      gl.uniform1f(p.u.radius, 0.0018 * this.o.size * this.o.size);
      this._blit(this.vel.write); this.vel.swap();
    }

    _step(dt) {
      const gl = this.gl, P = this.p, v = this.vel, tx = v.read.tx, ty = v.read.ty;
      gl.useProgram(P.curl.prog); gl.uniform2f(P.curl.u.texelSize, tx, ty); gl.uniform1i(P.curl.u.uVelocity, v.read.bind(0)); this._blit(this.curlT);
      gl.useProgram(P.vorticity.prog); gl.uniform2f(P.vorticity.u.texelSize, tx, ty); gl.uniform1i(P.vorticity.u.uVelocity, v.read.bind(0)); gl.uniform1i(P.vorticity.u.uCurl, this.curlT.bind(1)); gl.uniform1f(P.vorticity.u.curl, this.o.swirl); gl.uniform1f(P.vorticity.u.dt, dt); this._blit(v.write); v.swap();
      gl.useProgram(P.divergence.prog); gl.uniform2f(P.divergence.u.texelSize, tx, ty); gl.uniform1i(P.divergence.u.uVelocity, v.read.bind(0)); this._blit(this.div);
      gl.useProgram(P.clear.prog); gl.uniform1i(P.clear.u.uTexture, this.pres.read.bind(0)); gl.uniform1f(P.clear.u.value, 0.8); this._blit(this.pres.write); this.pres.swap();
      gl.useProgram(P.pressure.prog); gl.uniform2f(P.pressure.u.texelSize, tx, ty); gl.uniform1i(P.pressure.u.uDivergence, this.div.bind(0));
      for (let i = 0; i < this.o.pressureIters; i++) { gl.uniform1i(P.pressure.u.uPressure, this.pres.read.bind(1)); this._blit(this.pres.write); this.pres.swap(); }
      gl.useProgram(P.gradient.prog); gl.uniform2f(P.gradient.u.texelSize, tx, ty); gl.uniform1i(P.gradient.u.uPressure, this.pres.read.bind(0)); gl.uniform1i(P.gradient.u.uVelocity, v.read.bind(1)); this._blit(v.write); v.swap();
      gl.useProgram(P.advect.prog); gl.uniform2f(P.advect.u.texelSize, tx, ty);
      const vt = v.read.bind(0); gl.uniform1i(P.advect.u.uVelocity, vt); gl.uniform1i(P.advect.u.uSource, vt);
      gl.uniform1f(P.advect.u.dt, dt); gl.uniform1f(P.advect.u.dissipation, this.o.fade); this._blit(v.write); v.swap();
    }

    _composite() {
      const gl = this.gl, p = this.p.composite;
      gl.useProgram(p.prog);
      gl.uniform2f(p.u.texelSize, 1 / this.canvas.width, 1 / this.canvas.height);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.sceneTex); gl.uniform1i(p.u.uScene, 0);
      gl.uniform1i(p.u.uVelocity, this.vel.read.bind(1));
      gl.uniform2f(p.u.simTexel, this.vel.read.tx, this.vel.read.ty);
      gl.uniform1f(p.u.strength, this.o.strength); gl.uniform1f(p.u.split, this.o.split); gl.uniform1f(p.u.sheen, this.o.sheen);
      this._blit(null);
    }

    _upload(src) {
      if (!src.width || !src.height) return;
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); } catch (e) { /* not ready */ }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }

    _blit(target) {
      const gl = this.gl;
      if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
      else { gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    _fbo(w, h) {
      const gl = this.gl, tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fbo, w, h, tx: 1 / w, ty: 1 / h, bind(unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; } };
    }
    _double(w, h) { let a = this._fbo(w, h), b = this._fbo(w, h); return { get read() { return a; }, get write() { return b; }, swap() { const t = a; a = b; b = t; } }; }
    _freeTargets() {
      const gl = this.gl, free = (f) => { if (f) { gl.deleteTexture(f.tex); gl.deleteFramebuffer(f.fbo); } };
      if (this.vel) { free(this.vel.read); free(this.vel.write); }
      if (this.pres) { free(this.pres.read); free(this.pres.write); }
      free(this.div); free(this.curlT);
      this.vel = this.pres = this.div = this.curlT = null;
    }
    _shader(type, src) { const gl = this.gl, s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    _program(vs, fs) {
      const gl = this.gl, prog = gl.createProgram();
      gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.bindAttribLocation(prog, 0, "aPos"); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      const u = {}, n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(prog, i).name; u[name] = gl.getUniformLocation(prog, name); }
      return { prog, u };
    }
  }

  /* Pond: a painted 2D scene under the water, with ripples, drips and a short animation clock.
     Falls back to the plain 2D scene when WebGL2 isn't there. */
  class Pond {
    constructor(o) {
      this.o = Object.assign({ dpr: 2, drip: 0, dripPower: 0.45, tap: 1, water: {}, fixed: false }, o);
      this.el = document.createElement("div"); this.el.className = "pond" + (this.o.fixed ? " fixed" : "");
      this.scene = document.createElement("canvas"); this.ctx = this.scene.getContext("2d");
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const c = document.createElement("canvas");
      this.el.appendChild(c);
      const target = this.o.fixed ? global : c;
      try { this.water = new WaterLayer(c, Object.assign({ source: this.scene, dprCap: this.o.dpr, eventTarget: target }, this.o.water)); this.view = c; }
      catch (e) { c.remove(); this.water = null; this.view = this.scene; this.el.appendChild(this.scene); }
      this.view.className = "pond-c";
      this.lastTouch = 0;
      this._down = (e) => {
        const r = this.view.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
        this.ripple((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, this.o.tap);
        this.lastTouch = performance.now();
        if (this.o.onTouch) this.o.onTouch();
      };
      this._move = () => { this.lastTouch = performance.now(); };
      target.addEventListener("pointerdown", this._down, { passive: true });
      target.addEventListener("pointermove", this._move, { passive: true });
      this._target = target;
      this._loop = this._loop.bind(this);
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.el);
      this._drip = this._drip.bind(this); this._dripT = setTimeout(this._drip, 1500);
    }
    _drip() {
      const ms = this.o.drip;
      this._dripT = setTimeout(this._drip, ms > 0 ? ms * (0.7 + Math.random() * 0.6) : 1000);
      if (!ms || this.reduced || !this.water || !this.water.visible || this.water.paused || document.hidden || !this.el.isConnected) return;
      if (performance.now() - this.lastTouch < 5000) return;
      const p = this.o.dripAt ? this.o.dripAt() : [0.15 + Math.random() * 0.7, 0.2 + Math.random() * 0.6];
      this.ripple(p[0], p[1], this.o.dripPower * (0.8 + Math.random() * 0.4));
    }
    config(c) {
      const { drip, dripPower, tap, enabled, ...water } = c;
      if (drip != null) this.o.drip = drip; if (dripPower != null) this.o.dripPower = dripPower; if (tap != null) this.o.tap = tap;
      if (this.water) { this.water.set(water); if (enabled != null) this.water.paused = !enabled; }
      if (enabled != null) this.el.classList.toggle("off", !enabled);
    }
    attach(parent) { if (this.el.parentNode !== parent) parent.insertBefore(this.el, parent.firstChild); }
    resize() {
      const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return;
      const d = Math.min(global.devicePixelRatio || 1, this.o.dpr);
      this.w = w; this.h = h; this.d = d;
      this.scene.width = Math.round(w * d); this.scene.height = Math.round(h * d);
      this.paint(this.anim ? performance.now() - this.t0 : undefined);
    }
    paint(t) {
      if (!this.w) return;
      const ctx = this.ctx; ctx.setTransform(this.d, 0, 0, this.d, 0, 0); ctx.clearRect(0, 0, this.w, this.h);
      this.o.paint(ctx, this.w, this.h, t == null ? Infinity : t, this);
      if (this.water) this.water.redrawScene();
      this.el.classList.add("ready");
    }
    set(paint) { this.o.paint = paint; this.paint(); }
    play(ms) {
      if (this.reduced) { this.paint(); return; }
      this.t0 = performance.now(); this.dur = ms;
      if (!this.anim) this.anim = requestAnimationFrame(this._loop);
    }
    _loop(now) {
      const t = now - this.t0; this.paint(t);
      if (t < this.dur) this.anim = requestAnimationFrame(this._loop); else { this.anim = null; this.paint(); }
    }
    // A ring of outward pushes: a stone dropped into shallow water. x, y are 0..1 from the top left.
    ripple(x, y, s = 1) {
      if (!this.water || this.reduced || this.water.paused || s <= 0) return;
      const n = 16, r = 0.03 + 0.03 * s, f = 700 * s, asp = (this.w || 1) / (this.h || 1);
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a); this.water.splat(x + (dx * r) / asp, 1 - y + dy * r, dx * f, dy * f); }
    }
    destroy() {
      clearTimeout(this._dripT); cancelAnimationFrame(this.anim); this.ro.disconnect();
      this._target.removeEventListener("pointerdown", this._down); this._target.removeEventListener("pointermove", this._move);
      if (this.water) this.water.destroy();
      this.el.remove();
    }
  }

  global.WaterLayer = WaterLayer;
  global.Pond = Pond;
})(typeof window !== "undefined" ? window : globalThis);
