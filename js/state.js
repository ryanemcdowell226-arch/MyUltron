// Shared namespace + settings. Every other file reads/writes window.ULTRON.
window.ULTRON = window.ULTRON || {};

ULTRON.settings = {
  idleRotation: true,
  idleRotationSpeed: 1.0,
  dotCountMultiplier: 1.0,
  dotSize: 1.0,
  minWobble: 0.006,
  maxWobble: 0.02,
  ambientDots: true,
  clickTolerancePx: 14,
  allowZoom: true
};

// Filled in by three-scene.js / symbol.js / interaction.js once they init.
ULTRON.three = {};
ULTRON.interaction = {};
