/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get distance between two game objects or points.
 */
export function distanceBetween(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Flash a sprite white for hit feedback.
 */
export function flashWhite(sprite, scene, duration = 100) {
  sprite.setTintFill(0xffffff);
  scene.time.delayedCall(duration, () => {
    sprite.clearTint();
  });
}

/**
 * Show floating damage number.
 */
export function showDamageNumber(scene, x, y, amount, color = '#ffffff') {
  const text = scene.add.text(x, y - 10, `-${amount}`, {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: color,
    stroke: '#000000',
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(1000);

  scene.tweens.add({
    targets: text,
    y: y - 50,
    alpha: 0,
    duration: 800,
    ease: 'Power2',
    onComplete: () => text.destroy(),
  });
}

/**
 * Screen shake effect.
 */
export function screenShake(camera, intensity = 2, duration = 100) {
  camera.shake(duration, intensity / 1000);
}

/**
 * Hit stop effect (brief pause for impact feel).
 */
export function hitStop(scene, duration = 60) {
  scene.physics.pause();
  scene.time.delayedCall(duration, () => {
    scene.physics.resume();
  });
}
