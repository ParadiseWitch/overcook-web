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

export interface CameraViewport {
  width: number;
  height: number;
  zoom: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export const LEVEL_EDITOR_ZOOM = {
  default: 1.1,
  min: 0.6,
  max: 2,
  step: 0.1,
} as const;

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

export function getCameraViewportSize(viewport: CameraViewport) {
  const zoom = viewport.zoom <= 0 ? 1 : viewport.zoom;

  return {
    viewportWidth: viewport.width / zoom,
    viewportHeight: viewport.height / zoom,
  };
}

export function getMinZoomForBounds(
  bounds: Pick<Required<CameraBounds>, "worldWidth" | "worldHeight">,
  viewport: ViewportSize,
) {
  const minZoomFromWidth = viewport.width / bounds.worldWidth;
  const minZoomFromHeight = viewport.height / bounds.worldHeight;

  return Math.max(
    LEVEL_EDITOR_ZOOM.min,
    minZoomFromWidth,
    minZoomFromHeight,
  );
}

export function getCameraBounds(scene: Phaser.Scene): CameraBounds {
  const camera = scene.cameras.main;
  const viewport = getCameraViewportSize({
    width: camera.width,
    height: camera.height,
    zoom: camera.zoom,
  });

  return {
    worldWidth: scene.physics.world.bounds.width,
    worldHeight: scene.physics.world.bounds.height,
    viewportWidth: viewport.viewportWidth,
    viewportHeight: viewport.viewportHeight,
  };
}

export function clampSceneCamera(
  scene: Phaser.Scene,
  center: CameraCenter,
) {
  const target = clampCameraCenter(center, getCameraBounds(scene));
  scene.cameras.main.centerOn(target.x, target.y);
}

export function getNextZoomLevel(
  currentZoom: number,
  deltaY: number,
  minZoom: number = LEVEL_EDITOR_ZOOM.min,
) {
  const direction = deltaY === 0 ? 0 : deltaY > 0 ? -1 : 1;
  const nextZoom = currentZoom + LEVEL_EDITOR_ZOOM.step * direction;
  return clamp(nextZoom, minZoom, LEVEL_EDITOR_ZOOM.max);
}

export function zoomSceneCamera(
  scene: Phaser.Scene,
  deltaY: number,
) {
  const camera = scene.cameras.main;
  const minZoom = getMinZoomForBounds({
    worldWidth: scene.physics.world.bounds.width,
    worldHeight: scene.physics.world.bounds.height,
  }, {
    width: camera.width,
    height: camera.height,
  });
  const nextZoom = getNextZoomLevel(camera.zoom, deltaY, minZoom);

  if (nextZoom === camera.zoom) {
    return;
  }

  const currentCenter = { x: camera.midPoint.x, y: camera.midPoint.y };
  camera.setZoom(nextZoom);
  clampSceneCamera(scene, currentCenter);
}

export function resetLevelEditorCamera(
  scene: Phaser.Scene,
  gridWidth: number,
  gridHeight: number,
  tileSize: number,
  zoom = LEVEL_EDITOR_ZOOM.default,
) {
  scene.cameras.main.setZoom(zoom);
  clampSceneCamera(scene, getGridCenter(gridWidth, gridHeight, tileSize));
}
