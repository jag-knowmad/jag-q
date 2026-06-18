/* global AFRAME, JAGQ_CARDS */
/**
 * Viewer controller.
 *
 * Flow (what an NFC-tap recipient experiences):
 *   1. NFC tag opens  view.html?card=<id>
 *   2. We look the card up in the registry and show a one-tap "Start" button
 *      (browsers require a user gesture before opening the camera).
 *   3. Tap -> camera opens, MindAR begins scanning for the postcard.
 *   4. Point at the postcard -> the animation appears instantly, locked to it.
 */
(function () {
  const params = new URLSearchParams(location.search);
  const cardId = params.get('card') || Object.keys(JAGQ_CARDS)[0];
  const card = JAGQ_CARDS[cardId];

  const stage = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const titleEl = document.getElementById('card-title');
  const subEl = document.getElementById('card-subtitle');
  const previewEl = document.getElementById('card-preview');
  const startBtn = document.getElementById('start-btn');
  const hint = document.getElementById('scan-hint');
  const errEl = document.getElementById('error');

  if (!card) {
    titleEl.textContent = 'Card not found';
    subEl.textContent = 'This link doesn’t match any postcard.';
    startBtn.style.display = 'none';
    return;
  }

  titleEl.textContent = card.title;
  subEl.textContent = card.subtitle || 'Point your camera at the postcard';
  if (card.preview) previewEl.style.backgroundImage = `url(${card.preview})`;

  // Build the AR scene for this card. We inject it only after the user taps
  // Start so the camera isn't requested on page load.
  function buildScene() {
    const height = (1 / card.aspect).toFixed(4);
    const cloud = card.cloud || {};
    const cloudAttr =
      `cloud-layer="horizon: ${cloud.horizon ?? 0.58}; ` +
      `soft: ${cloud.soft ?? 0.1}; speed: ${cloud.speed ?? 1.0}; ` +
      `coverage: ${cloud.coverage ?? 0.9}"`;

    const scene = document.createElement('a-scene');
    scene.setAttribute(
      'mindar-image',
      `imageTargetSrc: ${card.targetSrc}; autoStart: true; ` +
        'uiScanning: no; uiLoading: no; uiError: no; filterMinCF: 0.0001; filterBeta: 0.001'
    );
    scene.setAttribute('color-space', 'sRGB');
    scene.setAttribute('embedded', '');
    scene.setAttribute('renderer', 'colorManagement: true, physicallyCorrectLights: true, alpha: true');
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.setAttribute('device-orientation-permission-ui', 'enabled: false');

    scene.innerHTML = `
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      <a-entity id="target" mindar-image-target="targetIndex: 0">
        <a-entity
          geometry="primitive: plane; width: 1; height: ${height}"
          position="0 0 0"
          ${cloudAttr}></a-entity>
      </a-entity>
    `;

    stage.appendChild(scene);

    const target = scene.querySelector('#target');
    target.addEventListener('targetFound', () => {
      hint.classList.add('hidden');
    });
    target.addEventListener('targetLost', () => {
      hint.classList.remove('hidden');
    });

    scene.addEventListener('arError', () => {
      errEl.textContent =
        'Could not start the camera. Make sure you opened this in your phone’s browser and allowed camera access, then reload.';
      errEl.classList.remove('hidden');
    });

    // Once MindAR is running, show the scanning hint.
    scene.addEventListener('arReady', () => {
      hint.classList.remove('hidden');
    });
  }

  startBtn.addEventListener('click', () => {
    overlay.classList.add('starting');
    // Slight delay so the fade-out is visible before the camera kicks in.
    setTimeout(() => {
      overlay.classList.add('hidden');
      buildScene();
    }, 250);
  });
})();
