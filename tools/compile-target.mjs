/**
 * Headless MindAR image-target compiler.
 *
 * MindAR's official compiler runs in the browser (or via its OfflineCompiler,
 * which depends on the native `canvas` module). This environment has no cairo,
 * so instead we:
 *   1. decode the JPEG with the pure-JS jpeg-js,
 *   2. downscale it to a tracking-friendly size,
 *   3. feed the RGBA straight into MindAR's CompilerBase through a tiny
 *      fake-canvas shim (so no native `canvas` is ever loaded),
 *   4. run the tracking-feature extraction (copied from OfflineCompiler),
 *   5. write the resulting `.mind` marker + the downscaled preview JPEG.
 *
 * Usage:
 *   node tools/compile-target.mjs <input.jpg> <outDir> [maxWidth=1024]
 *
 * Produces <outDir>/target.mind and <outDir>/target.jpg
 */
import fs from 'node:fs';
import path from 'node:path';
import jpeg from 'jpeg-js';
import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';
// Side-effect: registers the CPU kernels MindAR's detector relies on.
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';

// --- bilinear downscale (pure JS, RGBA in -> RGBA out) -------------------
function downscaleRGBA(src, sw, sh, dw, dh) {
  const dst = new Uint8Array(dw * dh * 4);
  const xRatio = sw / dw;
  const yRatio = sh / dh;
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, (y + 0.5) * yRatio - 0.5);
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(sh - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, (x + 0.5) * xRatio - 0.5);
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(sw - 1, x0 + 1);
      const fx = sx - x0;
      const di = (y * dw + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = src[(y0 * sw + x0) * 4 + c];
        const p10 = src[(y0 * sw + x1) * 4 + c];
        const p01 = src[(y1 * sw + x0) * 4 + c];
        const p11 = src[(y1 * sw + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx;
        const bot = p01 + (p11 - p01) * fx;
        dst[di + c] = Math.round(top + (bot - top) * fy);
      }
    }
  }
  return dst;
}

// --- compiler subclass that never touches the native canvas --------------
class HeadlessCompiler extends CompilerBase {
  // CompilerBase.compileImageTargets() calls createProcessCanvas(img),
  // then ctx.drawImage + ctx.getImageData to obtain RGBA. We already have the
  // RGBA on the img object, so the shim just hands it back.
  createProcessCanvas(img) {
    const { width, height, rgba } = img;
    return {
      getContext() {
        return {
          drawImage() {},
          getImageData() {
            return { data: rgba, width, height };
          },
        };
      },
    };
  }

  // Copied from OfflineCompiler.compileTrack (no canvas dependency).
  compileTrack({ progressCallback, targetImages, basePercent }) {
    return new Promise((resolve) => {
      const percentPerImage = (100 - basePercent) / targetImages.length;
      let percent = 0;
      const list = [];
      for (let i = 0; i < targetImages.length; i++) {
        const imageList = buildTrackingImageList(targetImages[i]);
        const percentPerAction = percentPerImage / imageList.length;
        const trackingData = extractTrackingFeatures(imageList, () => {
          percent += percentPerAction;
          progressCallback(basePercent + percent);
        });
        list.push(trackingData);
      }
      resolve(list);
    });
  }
}

async function main() {
  const [, , input, outDir, maxWidthArg] = process.argv;
  if (!input || !outDir) {
    console.error('Usage: node tools/compile-target.mjs <input.jpg> <outDir> [maxWidth=1024]');
    process.exit(1);
  }
  const maxWidth = parseInt(maxWidthArg || '1024', 10);

  console.log('Decoding', input);
  const raw = jpeg.decode(fs.readFileSync(input), { useTArray: true, formatAsRGBA: true });
  let { width, height, data } = raw;
  console.log(`  original: ${width}x${height}`);

  if (width > maxWidth) {
    const dw = maxWidth;
    const dh = Math.round((height / width) * dw);
    console.log(`  downscaling to ${dw}x${dh}`);
    data = downscaleRGBA(data, width, height, dw, dh);
    width = dw;
    height = dh;
  }

  fs.mkdirSync(outDir, { recursive: true });

  // Save the downscaled preview JPEG (used by the studio + plane aspect ratio).
  const jpg = jpeg.encode({ data, width, height }, 90);
  fs.writeFileSync(path.join(outDir, 'target.jpg'), jpg.data);
  console.log('  wrote target.jpg');

  const compiler = new HeadlessCompiler();
  const img = { width, height, rgba: data };
  console.log('Compiling tracking marker (CPU, please wait)...');
  let lastLogged = -10;
  await compiler.compileImageTargets([img], (p) => {
    if (p - lastLogged >= 10) {
      console.log(`  ${p.toFixed(0)}%`);
      lastLogged = p;
    }
  });

  const buffer = compiler.exportData();
  fs.writeFileSync(path.join(outDir, 'target.mind'), Buffer.from(buffer));
  console.log(`Done. Wrote ${path.join(outDir, 'target.mind')} (${buffer.length} bytes)`);
  console.log(`Target aspect (w/h): ${(width / height).toFixed(4)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
