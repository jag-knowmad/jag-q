/**
 * Renders a faithful preview GIF of the AR cloud effect by porting the
 * cloud-layer.js GLSL shader to JS and compositing it over the photo's sky
 * region — exactly what the phone shows when it tracks the printed postcard.
 *
 *   node tools/preview.mjs <photo.jpg> <out.gif> [width=520] [frames=48]
 */
import fs from 'node:fs';
import jpeg from 'jpeg-js';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;

// Config mirrors the frozen-lake card in public/js/cards.js.
const cfg = {
  horizon: 0.68,
  soft: 0.07,
  coverage: 0.92,
  speed: 1.0,
  skyLow: [0.9, 0.9, 0.87],
  skyHigh: [0.62, 0.74, 0.86],
  cloud: [0.99, 0.99, 0.98],
  cloudDark: [0.72, 0.75, 0.8],
};

const fract = (x) => x - Math.floor(x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const mix = (a, b, t) => a + (b - a) * t;
function smoothstep(e0, e1, x) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

// hash(vec2) -> float   (port of the GLSL in cloud-layer.js)
function hash(x, y) {
  let px = fract(x * 123.34);
  let py = fract(y * 456.21);
  const d = px * (px + 45.32) + py * (py + 45.32); // dot(p, p + 45.32)
  px += d;
  py += d;
  return fract(px * py);
}
function noise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return mix(a, b, ux) + (c - a) * uy * (1 - ux) + (d - b) * ux * uy;
}
function fbm(x, y) {
  let v = 0;
  let amp = 0.5;
  for (let i = 0; i < 6; i++) {
    v += amp * noise(x, y);
    x *= 2;
    y *= 2;
    amp *= 0.5;
  }
  return v;
}

// Returns [r,g,b,alpha] (0..1) for a uv and time, matching the fragment shader.
function shade(u, v, t) {
  const p1x = u * 3.0 + t * 0.012;
  const p1y = v * 2.2 + t * 0.002;
  const p2x = u * 6.5 - t * 0.022;
  const p2y = v * 4.5 + 7.3;
  const n = fbm(p1x, p1y) * 0.62 + fbm(p2x, p2y) * 0.38;

  const density = smoothstep(0.5, 0.92, n);

  const g = smoothstep(cfg.horizon, 1.0, v);
  const sky = cfg.skyLow.map((lo, i) => mix(lo, cfg.skyHigh[i], g));

  const ct = smoothstep(0.45, 1.0, n);
  const cloudCol = cfg.cloudDark.map((dk, i) => mix(dk, cfg.cloud[i], ct));

  const col = sky.map((s, i) => mix(s, cloudCol[i], density));

  const horizonMask = smoothstep(cfg.horizon, cfg.horizon + cfg.soft, v);
  const topMask = smoothstep(1.0, 0.9, v);
  const alpha = horizonMask * topMask * cfg.coverage;

  return [col[0], col[1], col[2], alpha];
}

// ---- render --------------------------------------------------------------
const [, , input, out, wArg, fArg] = process.argv;
if (!input || !out) {
  console.error('Usage: node tools/preview.mjs <photo.jpg> <out.gif> [width] [frames]');
  process.exit(1);
}
const OUTW = parseInt(wArg || '520', 10);
const FRAMES = parseInt(fArg || '48', 10);
const FPS = 16;

const raw = jpeg.decode(fs.readFileSync(input), { useTArray: true, formatAsRGBA: true });
const OUTH = Math.round((raw.height / raw.width) * OUTW);

// Downscale the photo to OUTW x OUTH (nearest is fine for a preview).
function sample(px, py) {
  const sx = Math.min(raw.width - 1, Math.floor((px / OUTW) * raw.width));
  const sy = Math.min(raw.height - 1, Math.floor((py / OUTH) * raw.height));
  const o = (sy * raw.width + sx) * 4;
  return [raw.data[o], raw.data[o + 1], raw.data[o + 2]];
}

const gif = GIFEncoder();
// One drift cycle: advance time so the loop is smooth-ish.
const tSpan = 520; // seconds of shader-time across the loop
for (let f = 0; f < FRAMES; f++) {
  const t = (f / FRAMES) * tSpan * cfg.speed;
  const rgba = new Uint8Array(OUTW * OUTH * 4);
  for (let y = 0; y < OUTH; y++) {
    const v = 1 - y / OUTH; // plane v-space: top of image = v≈1
    for (let x = 0; x < OUTW; x++) {
      const u = x / OUTW;
      const [pr, pg, pb] = sample(x, y);
      const [cr, cg, cb, a] = shade(u, v, t);
      const o = (y * OUTW + x) * 4;
      rgba[o] = Math.round(mix(pr, cr * 255, a));
      rgba[o + 1] = Math.round(mix(pg, cg * 255, a));
      rgba[o + 2] = Math.round(mix(pb, cb * 255, a));
      rgba[o + 3] = 255;
    }
  }
  const palette = quantize(rgba, 256);
  const indexed = applyPalette(rgba, palette);
  gif.writeFrame(indexed, OUTW, OUTH, { palette, delay: Math.round(1000 / FPS) });
  process.stdout.write(`\rframe ${f + 1}/${FRAMES}`);
}
gif.finish();
fs.writeFileSync(out, Buffer.from(gif.bytes()));
console.log(`\nWrote ${out} (${OUTW}x${OUTH}, ${FRAMES} frames)`);
