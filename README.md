# AR Postcards

Print a photo, stick an **NFC tag** on the back, and hand it to someone. They
tap their phone, the link opens, the camera starts, and the scene **animates
right on top of the printed photo** — no app to install. Same idea as Artivive /
Overly AR postcards.

The bundled demo turns a winter lakeside photo into a **living sky**: drifting,
realistic clouds rendered in real time over the photo's sky region, locked to
the print as you move your phone.

```
NFC tag → view.html?card=<id> → tap “Bring it to life” → point at the postcard → animation
```

## How it works

- **Image tracking:** [MindAR](https://github.com/hiukim/mind-ar-js) recognises
  the printed photo from the phone camera and gives its position/orientation.
- **The animation:** a WebGL shader (`public/js/cloud-layer.js`) paints an
  animated sky onto a plane anchored to the photo, masked to the sky region and
  faded to transparent at the horizon so the real treeline/water show through.
  It's procedural — **no video file to host or buffer.**
- **Self-contained:** A-Frame + MindAR are vendored in `public/lib/`, so the
  site is just static files. Works in mobile Safari & Chrome **over HTTPS**
  (camera access requires HTTPS, or `localhost` for dev).

## Project layout

```
public/                     ← deploy this folder (static site)
  index.html                ← landing page + card gallery + “copy NFC link”
  view.html                 ← the AR viewer (reads ?card=<id>)
  studio.html               ← make a new postcard in the browser
  js/
    cards.js                ← the card registry (one entry per postcard)
    viewer.js               ← builds the AR scene, handles start/scan/found
    cloud-layer.js          ← the animated-sky A-Frame component
    studio.js               ← Studio UI logic
  lib/                      ← vendored aframe + mindar + studio compiler
  cards/<id>/target.mind    ← compiled tracking marker
  cards/<id>/target.jpg     ← downscaled preview image
tools/
  compile-target.mjs        ← headless marker compiler (CPU, no native canvas)
  add-card.mjs              ← wrapper: compile + print a cards.js entry
  studio-compiler.entry.js  ← source for the in-browser compiler bundle
  serve.mjs                 ← tiny static dev server
```

## Run it on your laptop (no install needed)

The site is plain static files and the dev server uses only built-in Node —
**you do not need `npm install`** (and shouldn't run it; a build-only dependency
needs native libraries that aren't required to run the app).

```bash
git clone https://github.com/jag-knowmad/jag-q.git
cd jag-q
git checkout claude/ar-photo-animation-8tt58j
node tools/serve.mjs          # prints the local URLs
```

Then open **http://localhost:8080/view.html?card=frozen-lake** in Chrome or
Safari on the same laptop, click **“Bring it to life”**, allow camera access,
and hold up a print of the photo — or just show `public/cards/frozen-lake/target.jpg`
full-screen on your phone — to the webcam. The clouds animate over the sky.

> Camera APIs are allowed on `http://localhost`, so no HTTPS is needed for this
> laptop test. (Testing on a *phone* later does need HTTPS — that's what the
> deploy step is for.)

## Add your own postcard

**Option A — in the browser (no terminal):** open `studio.html`, pick a photo,
drag the line to the horizon, hit **Compile marker**, then download
`target.mind` + `target.jpg` into `public/cards/<id>/` and paste the printed
entry into `public/js/cards.js`.

**Option B — command line:**

```bash
npm run add-card -- path/to/photo.jpg my-card-id 0.4
#                    └ photo          └ id        └ horizon (fraction from top)
```

This writes `public/cards/my-card-id/{target.mind,target.jpg}` and prints the
`cards.js` entry to paste in.

> Tuning the clouds: each card's `cloud` config in `cards.js` controls
> `horizon` (where clouds stop, 0=bottom 1=top of photo), `soft` (fade band),
> `speed`, and `coverage` (how strongly the new sky replaces the old one).

## Deploy

It's a static site — deploy the `public/` folder anywhere with HTTPS
(Vercel, Netlify, GitHub Pages, Cloudflare Pages). `vercel.json` is included
(`outputDirectory: public`), so on Vercel it deploys as-is.

## Make the NFC tags

1. Buy NTAG213/215 NFC stickers.
2. With a phone app (e.g. **NFC Tools**), write a **URL record**:
   `https://YOUR-DOMAIN/view.html?card=<id>`
3. Stick it on the back of the matching printed photo.
4. Tapping the tag opens the viewer for that exact card.

The landing page and Studio both give you a **Copy NFC link** button so you
don't have to type the URL.

## Notes & limits

- iOS Safari and Android Chrome are supported. The first screen has a **“Bring
  it to life”** button because browsers only open the camera after a tap — that
  same tap also satisfies iOS's gesture requirement.
- Tracking likes **matte, well-lit, detailed** prints; very glossy paper or
  glare hurts recognition. The demo photo has lots of texture and tracks well.
- The marker compiler runs on the CPU; ~1024px photos compile in seconds
  (CLI) or ~30–60s (in-browser Studio).
