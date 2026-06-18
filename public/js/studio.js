/* global JAGQ */
/**
 * Studio: turn any photo into an AR postcard, entirely in the browser.
 *   1. pick a photo
 *   2. drag the line to the horizon/treeline (where clouds should stop)
 *   3. compile -> download target.mind + target.jpg + a cards.js snippet
 *   4. copy the NFC link
 */
(function () {
  const MAX_W = 1024; // marker size; bigger = slower compile, little tracking gain

  const fileInput = document.getElementById('file');
  const stageWrap = document.getElementById('preview-wrap');
  const canvas = document.getElementById('preview');
  const line = document.getElementById('horizon-line');
  const idInput = document.getElementById('card-id');
  const titleInput = document.getElementById('card-title');
  const compileBtn = document.getElementById('compile');
  const progress = document.getElementById('progress');
  const output = document.getElementById('output');

  let img = null;
  let horizonFromTop = 0.4; // fraction from the top where the treeline sits

  function slug(s) {
    return (s || 'my-card').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    img = new Image();
    img.onload = () => {
      drawPreview();
      stageWrap.style.display = 'block';
      compileBtn.disabled = false;
      if (!titleInput.value) titleInput.value = f.name.replace(/\.[^.]+$/, '');
    };
    img.src = url;
  });

  function drawPreview() {
    const w = 480;
    const h = Math.round((img.height / img.width) * w);
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    positionLine();
  }

  function positionLine() {
    line.style.top = `${horizonFromTop * 100}%`;
  }

  // Drag the horizon line.
  let dragging = false;
  const setFromY = (clientY) => {
    const rect = canvas.getBoundingClientRect();
    horizonFromTop = Math.min(0.95, Math.max(0.05, (clientY - rect.top) / rect.height));
    positionLine();
  };
  line.addEventListener('pointerdown', () => (dragging = true));
  window.addEventListener('pointermove', (e) => dragging && setFromY(e.clientY));
  window.addEventListener('pointerup', () => (dragging = false));
  stageWrap.addEventListener('click', (e) => {
    if (e.target === canvas) setFromY(e.clientY);
  });

  function downscaleToCanvas() {
    const w = Math.min(MAX_W, img.width);
    const h = Math.round((img.height / img.width) * w);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    return c;
  }

  compileBtn.addEventListener('click', async () => {
    if (!img) return;
    compileBtn.disabled = true;
    progress.style.display = 'block';
    progress.textContent = 'Preparing… (this runs on your device and can take ~30–60s)';
    await new Promise((r) => setTimeout(r, 50));

    const src = downscaleToCanvas();
    let mindBytes;
    try {
      mindBytes = await JAGQ.compileTarget(src, (p) => {
        progress.textContent = `Compiling marker… ${p.toFixed(0)}%`;
      });
    } catch (err) {
      progress.textContent = 'Compile failed: ' + err.message;
      compileBtn.disabled = false;
      return;
    }

    const id = slug(idInput.value || titleInput.value);
    const aspect = (src.width / src.height).toFixed(4);
    const horizonV = (1 - horizonFromTop).toFixed(2); // plane v-space (0 bottom)

    const mindBlob = new Blob([mindBytes], { type: 'application/octet-stream' });
    const jpgBlob = await new Promise((res) => src.toBlob(res, 'image/jpeg', 0.9));

    const snippet =
      `  '${id}': {\n` +
      `    title: '${(titleInput.value || id).replace(/'/g, "\\'")}',\n` +
      `    subtitle: '',\n` +
      `    targetSrc: 'cards/${id}/target.mind',\n` +
      `    preview: 'cards/${id}/target.jpg',\n` +
      `    aspect: ${aspect},\n` +
      `    effect: 'clouds',\n` +
      `    cloud: { horizon: ${horizonV}, soft: 0.12, speed: 1.0, coverage: 0.92 },\n` +
      `  },`;

    const origin = location.href.replace(/studio\.html.*$/, '').replace(/\/$/, '');
    const nfcUrl = `${origin}/view.html?card=${id}`;

    progress.style.display = 'none';
    output.style.display = 'block';
    output.innerHTML = `
      <h2>Done! Your postcard “${id}” is ready.</h2>
      <ol class="steps">
        <li>Download both files and put them in <code>public/cards/${id}/</code>:
          <div class="row" style="margin-top:8px">
            <a class="btn" id="dl-mind" download="target.mind">target.mind</a>
            <a class="btn" id="dl-jpg" download="target.jpg">target.jpg</a>
          </div>
        </li>
        <li>Add this entry to <code>public/js/cards.js</code>:
          <div class="url-box" id="snippet"></div>
        </li>
        <li>Program an NFC tag with this link and stick it on the postcard:
          <div class="url-box">${nfcUrl}</div>
          <button class="btn" style="margin-top:10px;font-size:0.85rem;padding:9px 18px" id="copy-url">Copy link</button>
        </li>
      </ol>`;

    document.getElementById('dl-mind').href = URL.createObjectURL(mindBlob);
    document.getElementById('dl-jpg').href = URL.createObjectURL(jpgBlob);
    document.getElementById('snippet').textContent = snippet;
    document.getElementById('copy-url').addEventListener('click', () => {
      navigator.clipboard.writeText(nfcUrl).catch(() => prompt('Copy:', nfcUrl));
    });
    output.scrollIntoView({ behavior: 'smooth' });
  });
})();
