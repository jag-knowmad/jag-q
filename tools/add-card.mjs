/**
 * Convenience wrapper: compile a photo into a card folder and print the
 * cards.js entry to paste in.
 *
 *   npm run add-card -- <photo.jpg> <card-id> [horizonFromTop=0.4]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [, , input, id, horizonArg] = process.argv;
if (!input || !id) {
  console.error('Usage: npm run add-card -- <photo.jpg> <card-id> [horizonFromTop=0.4]');
  process.exit(1);
}
const horizonFromTop = parseFloat(horizonArg || '0.4');
const outDir = path.join('public', 'cards', id);

execFileSync('node', ['tools/compile-target.mjs', input, outDir, '1024'], { stdio: 'inherit' });

// Derive aspect from the JPEG we just wrote.
import jpeg from 'jpeg-js';
const dec = jpeg.decode(fs.readFileSync(path.join(outDir, 'target.jpg')));
const aspect = (dec.width / dec.height).toFixed(4);
const horizonV = (1 - horizonFromTop).toFixed(2);

console.log('\nAdd this to public/js/cards.js inside window.JAGQ_CARDS:\n');
console.log(
  `  '${id}': {\n` +
    `    title: '${id}',\n` +
    `    subtitle: '',\n` +
    `    targetSrc: 'cards/${id}/target.mind',\n` +
    `    preview: 'cards/${id}/target.jpg',\n` +
    `    aspect: ${aspect},\n` +
    `    effect: 'clouds',\n` +
    `    cloud: { horizon: ${horizonV}, soft: 0.12, speed: 1.0, coverage: 0.92 },\n` +
    `  },\n`
);
console.log(`NFC link (after deploy):  https://YOUR-DOMAIN/view.html?card=${id}`);
