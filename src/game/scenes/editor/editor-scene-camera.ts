import Phaser from "phaser";

import {
  clampSceneZoom,
  clampCameraScroll,
  computeCameraCenterWorldPoint,
  computeScrollForViewportCenter,
  computeFitView,
  normalizeZoom,
  resolveViewportSize,
} from "../../editor/map-view";
import type { EditorCameraState, MapViewMode } from "./level-editor-scene";

// 负责编辑器相机的视口尺寸、缩放和滚动计算。
export interface EditorSceneCameraContext {
  cameras: { main: Phaser.Cameras.Scene2D.Camera };
  scale: { resize: (width: number, height: number) => void };
  sys: { isActive: () => boolean };
  viewportWidth: number;
  viewportHeight: number;
  mapViewMode: MapViewMode;
  fitPadding: number;
  browseZoomDefault: number;
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  emitViewModeChanged: () => void;
  emitCameraChanged: () => void;
}

/**
 * 初始化编辑器相机视口尺寸和背景色。
 */
export function initializeCameraViewport(scene: EditorSceneCameraContext) {
  const camera = scene.cameras.main;
  const initialViewport = resolveViewportSize({
    cameraWidth: camera.width,
    cameraHeight: camera.height,
    fallbackWidth: scene.viewportWidth,
    fallbackHeight: scene.viewportHeight,
  });

  scene.viewportWidth = initialViewport.width;
  scene.viewportHeight = initialViewport.height;
  camera.setSize(scene.viewportWidth, scene.viewportHeight);
  camera.setBackgroundColor(0x20242b);
}

/**
 * 更新编辑器视口尺寸，并保持当前世界中心尽量不跳变。
 */
export function setViewportSize(scene: EditorSceneCameraContext, width: number, height: number) {
  const camera = scene.cameras.main;
  const center = computeCameraCenterWorldPoint({
    scrollX: camera.scrollX,
    scrollY: camera.scrollY,
    cameraWidth: camera.width,
    cameraHeight: camera.height,
    zoom: camera.zoom,
  });

  scene.viewportWidth = Math.max(320, Math.floor(width));
  scene.viewportHeight = Math.max(240, Math.floor(height));

  if (scene.sys.isActive()) {
    scene.scale.resize(scene.viewportWidth, scene.viewportHeight);
    camera.setSize(scene.viewportWidth, scene.viewportHeight);
    // 视口变化后重新按世界中心回推 scroll，避免 resize 时视角跳向左上角。
    const nextScroll = computeScrollForViewportCenter({
      centerX: center.centerX,
      centerY: center.centerY,
      viewportWidth: camera.width,
      viewportHeight: camera.height,
      zoom: camera.zoom,
    });
    camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
    clampCameraPosition(scene);
    scene.emitCameraChanged();
  }
}

/**
 * 切换编辑器相机的视图模式，并触发对应的相机重置逻辑。
 */
export function setMapViewMode(scene: EditorSceneCameraContext, mode: MapViewMode) {
  scene.mapViewMode = mode;

  if (!scene.sys.isActive()) {
    return;
  }

  if (mode === "fit") {
    applyFitView(scene);
    scene.emitViewModeChanged();
    return;
  }

  scene.cameras.main.setZoom(scene.browseZoomDefault);
  clampCameraPosition(scene);
  scene.emitViewModeChanged();
  scene.emitCameraChanged();
}

/**
 * 按当前视图模式把相机恢复到默认状态。
 */
export function resetCameraView(scene: EditorSceneCameraContext) {
  if (!scene.sys.isActive()) {
    return;
  }

  if (scene.mapViewMode === "fit") {
    applyFitView(scene);
    return;
  }

  scene.cameras.main.setZoom(scene.browseZoomDefault);
  centerCamera(scene);
  clampCameraPosition(scene);
  scene.emitCameraChanged();
}

/**
 * 读取当前相机状态，供 Vue HUD 和小地图消费。
 */
export function getCameraState(scene: EditorSceneCameraContext): EditorCameraState {
  const camera = scene.cameras.main;
  const center = computeCameraCenterWorldPoint({
    scrollX: camera.scrollX,
    scrollY: camera.scrollY,
    cameraWidth: camera.width,
    cameraHeight: camera.height,
    zoom: camera.zoom,
  });
  return {
    scrollX: camera.scrollX,
    scrollY: camera.scrollY,
    zoom: camera.zoom,
    visibleWidth: camera.width / camera.zoom,
    visibleHeight: camera.height / camera.zoom,
    worldWidth: scene.gridWidth * scene.tileSize,
    worldHeight: scene.gridHeight * scene.tileSize,
    centerX: center.centerX,
    centerY: center.centerY,
  };
}

/**
 * 直接设置相机 scroll，并在设置后重新钳制到合法范围。
 */
export function setCameraScroll(scene: EditorSceneCameraContext, scrollX: number, scrollY: number) {
  const camera = scene.cameras.main;
  camera.setScroll(scrollX, scrollY);
  clampCameraPosition(scene);
  scene.emitCameraChanged();
}

/**
 * 把相机移动到指定世界中心点。
 */
export function setCameraCenter(scene: EditorSceneCameraContext, centerX: number, centerY: number) {
  const camera = scene.cameras.main;
  const nextScroll = computeScrollForViewportCenter({
    centerX,
    centerY,
    viewportWidth: camera.width,
    viewportHeight: camera.height,
    zoom: camera.zoom,
  });
  camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
  clampCameraPosition(scene);
  scene.emitCameraChanged();
}

/**
 * 设置相机缩放，并尽量保持当前视口中心对应的世界点不变。
 */
export function setCameraZoom(scene: EditorSceneCameraContext, zoom: number, ensureBrowseMode: () => void) {
  ensureBrowseMode();
  const camera = scene.cameras.main;
  const nextZoom = clampSceneZoom({
    zoom,
    viewportWidth: scene.viewportWidth,
    viewportHeight: scene.viewportHeight,
    worldWidth: scene.gridWidth * scene.tileSize,
    worldHeight: scene.gridHeight * scene.tileSize,
    padding: scene.fitPadding,
  });
  const center = computeCameraCenterWorldPoint({
    scrollX: camera.scrollX,
    scrollY: camera.scrollY,
    cameraWidth: camera.width,
    cameraHeight: camera.height,
    zoom: camera.zoom,
  });
  camera.setZoom(nextZoom);
  const nextScroll = computeScrollForViewportCenter({
    centerX: center.centerX,
    centerY: center.centerY,
    viewportWidth: camera.width,
    viewportHeight: camera.height,
    zoom: nextZoom,
  });
  camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
  clampCameraPosition(scene);
  scene.emitCameraChanged();
}

/**
 * 按当前视图模式刷新相机位置与缩放。
 */
export function refreshCameraView(scene: EditorSceneCameraContext) {
  if (!scene.sys.isActive()) {
    return;
  }

  if (scene.mapViewMode === "fit") {
    applyFitView(scene);
    return;
  }

  clampCameraPosition(scene);
}

/**
 * 计算并应用适配视图的缩放和居中结果。
 */
export function applyFitView(scene: EditorSceneCameraContext) {
  const camera = scene.cameras.main;
  const result = computeFitView({
    viewportWidth: scene.viewportWidth,
    viewportHeight: scene.viewportHeight,
    worldWidth: scene.gridWidth * scene.tileSize,
    worldHeight: scene.gridHeight * scene.tileSize,
    padding: scene.fitPadding,
  });

  camera.setZoom(normalizeZoom(result.zoom));
  const nextScroll = computeScrollForViewportCenter({
    centerX: result.centerX,
    centerY: result.centerY,
    viewportWidth: camera.width,
    viewportHeight: camera.height,
    zoom: camera.zoom,
  });
  camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
  clampCameraPosition(scene);
  scene.emitCameraChanged();
}

/**
 * 把相机移动到当前世界中心。
 */
export function centerCamera(scene: EditorSceneCameraContext) {
  const camera = scene.cameras.main;
  const nextScroll = computeScrollForViewportCenter({
    centerX: (scene.gridWidth * scene.tileSize) / 2,
    centerY: (scene.gridHeight * scene.tileSize) / 2,
    viewportWidth: camera.width,
    viewportHeight: camera.height,
    zoom: camera.zoom,
  });
  camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
}

/**
 * 将相机位置限制在世界边界内。
 */
export function clampCameraPosition(scene: EditorSceneCameraContext) {
  const camera = scene.cameras.main;
  const next = clampCameraScroll({
    scrollX: camera.scrollX,
    scrollY: camera.scrollY,
    viewportWidth: camera.width,
    viewportHeight: camera.height,
    zoom: camera.zoom,
    worldWidth: scene.gridWidth * scene.tileSize,
    worldHeight: scene.gridHeight * scene.tileSize,
  });

  camera.setScroll(next.scrollX, next.scrollY);
}
