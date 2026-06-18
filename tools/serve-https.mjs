/**
 * Local HTTPS server for testing on a PHONE without deploying.
 *
 * Phones only allow camera access over https:// (or localhost, which a phone
 * can't use to reach your laptop). So we serve public/ over HTTPS with a
 * self-signed certificate. Your phone, on the same Wi-Fi, opens the printed
 * LAN URL, taps through the one-time "not private" warning, and the camera
 * works.
 *
 *   npm run dev:https     ->  https://<your-laptop-ip>:8443
 *
 * Needs `openssl` (preinstalled on macOS and most Linux). The certificate is
 * generated once into tools/.cert/ and reused.
 */
import https from 'node:https';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve('public');
const port = process.env.PORT || 8443;
const certDir = path.resolve('tools/.cert');
const keyFile = path.join(certDir, 'key.pem');
const crtFile = path.join(certDir, 'cert.pem');

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.mind': 'application/octet-stream',
};

function ensureCert() {
  if (fs.existsSync(keyFile) && fs.existsSync(crtFile)) return;
  fs.mkdirSync(certDir, { recursive: true });
  console.log('Generating a one-time self-signed certificate…');
  try {
    execFileSync(
      'openssl',
      ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', keyFile,
       '-out', crtFile, '-days', '825', '-subj', '/CN=ar-postcards.local'],
      { stdio: 'inherit' }
    );
  } catch {
    console.error(
      '\nCould not run `openssl`. On macOS it is preinstalled; if this failed,\n' +
      'install it (e.g. `brew install openssl`) and try again.\n'
    );
    process.exit(1);
  }
}

function lanIPs() {
  const out = [];
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs)) {
    for (const ni of ifs[name] || []) {
      if (ni.family === 'IPv4' && !ni.internal) out.push(ni.address);
    }
  }
  return out;
}

ensureCert();

https
  .createServer({ key: fs.readFileSync(keyFile), cert: fs.readFileSync(crtFile) }, (req, res) => {
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
  .listen(port, '0.0.0.0', () => {
    const ips = lanIPs();
    console.log(`\n  AR Postcards (HTTPS) — open this on your PHONE (same Wi-Fi):\n`);
    if (ips.length === 0) {
      console.log(`    (couldn't detect a LAN IP — check System Settings → Wi-Fi → Details)`);
    }
    for (const ip of ips) {
      console.log(`    https://${ip}:${port}/view.html?card=frozen-lake`);
    }
    console.log(`\n  Your phone will warn "Not Private" (because the cert is self-signed) —`);
    console.log(`  tap Advanced → Proceed. Then allow the camera. This is safe; it's your`);
    console.log(`  own laptop on your own network. Press Ctrl+C to stop.\n`);
  });
