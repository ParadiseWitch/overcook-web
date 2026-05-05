import type Phaser from "phaser";

export interface CameraCenter {
  x: number;
  y: number;
}

export interface CameraBounds {
  viewportWidth: number;
  viewportHeight: number;
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  worldWidth?: number;
  worldHeight?: number;
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

export interface CameraResizeState {
  center: CameraCenter;
  zoom: number;
}

export interface CanvasBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
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
  const { left, top, right, bottom, viewportWidth, viewportHeight } =
    normalizeCameraBounds(bounds);

  const minX = left + viewportWidth / 2;
  const maxX = right - viewportWidth / 2;
  const minY = top + viewportHeight / 2;
  const maxY = bottom - viewportHeight / 2;

  if (right - left <= viewportWidth || bottom - top <= viewportHeight) {
    return {
      x: right - left <= viewportWidth ? (left + right) / 2 : clamp(center.x, minX, maxX),
      y: bottom - top <= viewportHeight ? (top + bottom) / 2 : clamp(center.y, minY, maxY),
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

export function getFitZoomForBounds(
  bounds: CanvasBounds,
  viewport: ViewportSize,
) {
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;

  return Math.min(
    viewport.width / width,
    viewport.height / height,
  );
}

export function createCanvasBoundsFromView(
  center: CameraCenter,
  viewport: ViewportSize,
  zoom: number,
): CanvasBounds {
  const visible = getCameraViewportSize({
    width: viewport.width,
    height: viewport.height,
    zoom,
  });

  return {
    left: center.x - visible.viewportWidth / 2,
    top: center.y - visible.viewportHeight / 2,
    right: center.x + visible.viewportWidth / 2,
    bottom: center.y + visible.viewportHeight / 2,
  };
}

export function getMinZoomForBounds(
  bounds: Pick<Required<CameraBounds>, "left" | "top" | "right" | "bottom">,
  viewport: ViewportSize,
) {
  const navigationWidth = bounds.right - bounds.left;
  const navigationHeight = bounds.bottom - bounds.top;
  const minZoomFromWidth = viewport.width / navigationWidth;
  const minZoomFromHeight = viewport.height / navigationHeight;

  return Math.max(
    LEVEL_EDITOR_ZOOM.min,
    minZoomFromWidth,
    minZoomFromHeight,
  );
}

export function getCameraBounds(scene: Phaser.Scene, canvasBounds: CanvasBounds): CameraBounds {
  const camera = scene.cameras.main;
  const viewport = getCameraViewportSize({
    width: camera.width,
    height: camera.height,
    zoom: camera.zoom,
  });

  return {
    left: canvasBounds.left,
    top: canvasBounds.top,
    right: canvasBounds.right,
    bottom: canvasBounds.bottom,
    viewportWidth: viewport.viewportWidth,
    viewportHeight: viewport.viewportHeight,
  };
}

export function getCameraStateAfterViewportResize(
  current: CameraResizeState,
  canvasBounds: CanvasBounds,
  viewport: ViewportSize,
): CameraResizeState {
  const minZoom = getMinZoomForBounds(canvasBounds, viewport);
  const zoom = clamp(current.zoom, minZoom, LEVEL_EDITOR_ZOOM.max);
  const visible = getCameraViewportSize({
    width: viewport.width,
    height: viewport.height,
    zoom,
  });

  return {
    center: clampCameraCenter(current.center, {
      left: canvasBounds.left,
      top: canvasBounds.top,
      right: canvasBounds.right,
      bottom: canvasBounds.bottom,
      viewportWidth: visible.viewportWidth,
      viewportHeight: visible.viewportHeight,
    }),
    zoom,
  };
}

export function clampSceneCamera(
  scene: Phaser.Scene,
  center: CameraCenter,
  canvasBounds: CanvasBounds,
) {
  const target = clampCameraCenter(center, getCameraBounds(scene, canvasBounds));
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
  canvasBounds: CanvasBounds,
) {
  const camera = scene.cameras.main;
  const minZoom = getMinZoomForBounds(canvasBounds, {
    width: camera.width,
    height: camera.height,
  });
  const nextZoom = getNextZoomLevel(camera.zoom, deltaY, minZoom);

  if (nextZoom === camera.zoom) {
    return;
  }

  const currentCenter = { x: camera.midPoint.x, y: camera.midPoint.y };
  camera.setZoom(nextZoom);
  clampSceneCamera(scene, currentCenter, canvasBounds);
}

export function resetLevelEditorCamera(
  scene: Phaser.Scene,
  canvasBounds: CanvasBounds,
) {
  const fitZoom = getFitZoomForBounds(canvasBounds, {
    width: scene.cameras.main.width,
    height: scene.cameras.main.height,
  });
  scene.cameras.main.setZoom(fitZoom);
  clampSceneCamera(scene, {
    x: (canvasBounds.left + canvasBounds.right) / 2,
    y: (canvasBounds.top + canvasBounds.bottom) / 2,
  }, canvasBounds);
}

function normalizeCameraBounds(bounds: CameraBounds) {
  if (
    typeof bounds.left === "number" &&
    typeof bounds.top === "number" &&
    typeof bounds.right === "number" &&
    typeof bounds.bottom === "number"
  ) {
    return {
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom,
      viewportWidth: bounds.viewportWidth,
      viewportHeight: bounds.viewportHeight,
    };
  }

  return {
    left: 0,
    top: 0,
    right: bounds.worldWidth ?? 0,
    bottom: bounds.worldHeight ?? 0,
    viewportWidth: bounds.viewportWidth,
    viewportHeight: bounds.viewportHeight,
  };
}
