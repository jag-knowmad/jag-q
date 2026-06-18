/**
 * Minimal static server for local testing.  Camera APIs work over
 * http://localhost, so no HTTPS needed for desktop dev.
 *   npm run dev   ->  http://localhost:8080
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('public');
const port = process.env.PORT || 8080;
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.mind': 'application/octet-stream',
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root) || !fs.existsSync(file)) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => {
    console.log(`\n  AR Postcards running locally:`);
    console.log(`    Home    →  http://localhost:${port}/`);
    console.log(`    Viewer  →  http://localhost:${port}/view.html?card=frozen-lake`);
    console.log(`    Studio  →  http://localhost:${port}/studio.html`);
    console.log(`\n  Camera works on localhost. Open the Viewer, click "Bring it to life",`);
    console.log(`  and hold up a print (or show public/cards/frozen-lake/target.jpg on another screen).`);
    console.log(`  Press Ctrl+C to stop.\n`);
  });
