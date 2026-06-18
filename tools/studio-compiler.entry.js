/**
 * Browser build of the MindAR marker compiler, bundled to a global
 * (window.JAGQ.compileTarget) with esbuild. Runs entirely on the main thread
 * on the tfjs CPU backend — the same path proven in tools/compile-target.mjs —
 * so it needs neither the native `canvas` module nor MindAR's Vite worker.
 */
import * as tf from '@tensorflow/tfjs';
import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js';
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js';
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js';
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js';

class BrowserCompiler extends CompilerBase {
  createProcessCanvas(img) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    return c;
  }
  compileTrack({ progressCallback, targetImages, basePercent }) {
    return new Promise((resolve) => {
      const percentPerImage = (100 - basePercent) / targetImages.length;
      let percent = 0;
      const list = [];
      for (let i = 0; i < targetImages.length; i++) {
        const imageList = buildTrackingImageList(targetImages[i]);
        const per = percentPerImage / imageList.length;
        list.push(
          extractTrackingFeatures(imageList, () => {
            percent += per;
            progressCallback(basePercent + percent);
          })
        );
      }
      resolve(list);
    });
  }
}

/**
 * @param {HTMLImageElement} img  already-loaded image (any size)
 * @param {(pct:number)=>void} onProgress
 * @returns {Promise<Uint8Array>} the .mind file bytes
 */
async function compileTarget(img, onProgress) {
  await tf.setBackend('cpu');
  await tf.ready();
  const compiler = new BrowserCompiler();
  await compiler.compileImageTargets([img], (p) => onProgress && onProgress(p));
  return compiler.exportData();
}

window.JAGQ = window.JAGQ || {};
window.JAGQ.compileTarget = compileTarget;
