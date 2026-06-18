/**
 * Card registry. Each entry is one printed postcard that an NFC tag points at
 * via  view.html?card=<id>.  Add a card by compiling its marker
 * (npm run add-card) and dropping an entry here.
 */
window.JAGQ_CARDS = {
  'frozen-lake': {
    title: 'Frozen Lake',
    subtitle: 'Winter shoreline — the sky comes alive',
    targetSrc: 'cards/frozen-lake/target.mind',
    preview: 'cards/frozen-lake/target.jpg',
    aspect: 1.4993, // width / height of the target image
    effect: 'clouds',
    // Tuned for this photo: treeline sits ~40% down, so horizon ~0.58 in
    // plane v-space (0 = bottom, 1 = top).
    cloud: { horizon: 0.68, soft: 0.07, speed: 1.0, coverage: 0.92 },
  },
};
