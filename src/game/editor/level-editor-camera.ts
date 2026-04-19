import type Phaser from "phaser";

export interface CameraCenter {
  x: number;
  y: number;
}

export interface CameraBounds {
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export function clamp(n: number, min: number, max: number) {
  return n < min ? min : n > max ? max : n;
}

export function getGridCenter(
  gridWidth: number,
  gridHeight: number,
  tileSize: number,
): CameraCenter {
  return {
    x: (gridWidth * tileSize) / 2,
    y: (gridHeight * tileSize) / 2,
  };
}

export function clampCameraCenter(
  center: CameraCenter,
  bounds: CameraBounds,
): CameraCenter {
  const { worldWidth, worldHeight, viewportWidth, viewportHeight } = bounds;

  const minX = viewportWidth / 2;
  const maxX = worldWidth - viewportWidth / 2;
  const minY = viewportHeight / 2;
  const maxY = worldHeight - viewportHeight / 2;

  if (worldWidth <= viewportWidth || worldHeight <= viewportHeight) {
    return {
      x: worldWidth <= viewportWidth ? worldWidth / 2 : clamp(center.x, minX, maxX),
      y: worldHeight <= viewportHeight ? worldHeight / 2 : clamp(center.y, minY, maxY),
    };
  }

  return {
    x: clamp(center.x, minX, maxX),
    y: clamp(center.y, minY, maxY),
  };
}

export function getCameraBounds(scene: Phaser.Scene): CameraBounds {
  const camera = scene.cameras.main;

  return {
    worldWidth: scene.physics.world.bounds.width,
    worldHeight: scene.physics.world.bounds.height,
    viewportWidth: camera.displayWidth,
    viewportHeight: camera.displayHeight,
  };
}

export function clampSceneCamera(scene: Phaser.Scene, center: CameraCenter) {
  const target = clampCameraCenter(center, getCameraBounds(scene));
  scene.cameras.main.centerOn(target.x, target.y);
}

export function resetLevelEditorCamera(
  scene: Phaser.Scene,
  gridWidth: number,
  gridHeight: number,
  tileSize: number,
  zoom = 1.1,
) {
  scene.cameras.main.setZoom(zoom);
  clampSceneCamera(scene, getGridCenter(gridWidth, gridHeight, tileSize));
}
