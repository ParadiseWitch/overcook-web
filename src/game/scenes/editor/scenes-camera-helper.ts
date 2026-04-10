

/**
 * 根据场景大小和缩放值，限制相机中心点始终落在合法区域内。
 */
export function clampCameraPosition(scene: Phaser.Scene, x: number, y: number) {
  const worldWidth = scene.physics.world.bounds.width;
  const worldHeight = scene.physics.world.bounds.height;
  const camera = scene.cameras.main;
  const viewportW = camera.displayWidth;
  const viewportH = camera.displayHeight;
  const targetX = clamp(x, viewportW / 2, worldWidth - viewportW / 2);
  const targetY = clamp(y, viewportH / 2, worldHeight - viewportH / 2);
  camera.centerOn(targetX, targetY);
}

export function clamp(n: number, min: number, max: number) {
  return n < min ? min : (n > max ? max : n)
}
