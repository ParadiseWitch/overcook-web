import Phaser from "phaser";

import {
  createCenteredCameraState,
  createEditorCameraState,
  setCameraCenter as updateCameraCenter,
  setCameraZoom as updateCameraZoom,
  type EditorCameraState,
} from "../../editor/editor-camera";

// 负责编辑器相机的画布矩形、缩放和世界视口同步。
export interface EditorSceneCameraContext {
  cameras: { main: Phaser.Cameras.Scene2D.Camera };
  scale: { resize: (width: number, height: number) => void };
  sys: { isActive: () => boolean };
  canvasContainerWidth: number;
  canvasContainerHeight: number;
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  cameraState: EditorCameraState;
  emitCameraChanged: () => void;
}

/**
 * 初始化编辑器相机的容器尺寸和背景色。
 */
export function initializeCameraViewport(scene: EditorSceneCameraContext) {
  const camera = scene.cameras.main;
  scene.canvasContainerWidth = Math.max(320, Math.floor(scene.canvasContainerWidth || camera.width));
  scene.canvasContainerHeight = Math.max(240, Math.floor(scene.canvasContainerHeight || camera.height));
  camera.setBackgroundColor(0x20242b);
  refreshCameraView(scene);
}

/**
 * 更新编辑器容器尺寸，并尽量保持当前世界中心不跳变。
 */
export function setCanvasSize(scene: EditorSceneCameraContext, width: number, height: number) {
  scene.canvasContainerWidth = Math.max(320, Math.floor(width));
  scene.canvasContainerHeight = Math.max(240, Math.floor(height));

  if (!scene.sys.isActive()) {
    return;
  }

  scene.scale.resize(scene.canvasContainerWidth, scene.canvasContainerHeight);
  scene.cameraState = createEditorCameraState({
    sceneWidth: scene.gridWidth * scene.tileSize,
    sceneHeight: scene.gridHeight * scene.tileSize,
    containerWidth: scene.canvasContainerWidth,
    containerHeight: scene.canvasContainerHeight,
    centerX: scene.cameraState.centerX,
    centerY: scene.cameraState.centerY,
    zoom: scene.cameraState.zoom,
  });
  applyCameraState(scene);
  scene.emitCameraChanged();
}

/**
 * 读取当前相机状态，供 Vue HUD 和小地图消费。
 */
export function getCameraState(scene: EditorSceneCameraContext): EditorCameraState {
  return scene.cameraState;
}

/**
 * 把相机移动到指定世界中心点。
 */
export function setCameraCenter(scene: EditorSceneCameraContext, centerX: number, centerY: number) {
  scene.cameraState = updateCameraCenter(scene.cameraState, centerX, centerY);
  applyCameraState(scene);
  scene.emitCameraChanged();
}

/**
 * 设置相机缩放，并保持当前 camera center 不变。
 */
export function setCameraZoom(scene: EditorSceneCameraContext, zoom: number) {
  scene.cameraState = updateCameraZoom(scene.cameraState, zoom);
  applyCameraState(scene);
  scene.emitCameraChanged();
}

/**
 * 按默认中心和缩放重置相机。
 */
export function resetCamera(scene: EditorSceneCameraContext) {
  scene.cameraState = createCenteredCameraState({
    worldWidth: scene.gridWidth * scene.tileSize,
    worldHeight: scene.gridHeight * scene.tileSize,
    viewportWidth: scene.canvasContainerWidth,
    viewportHeight: scene.canvasContainerHeight,
    zoom: 1,
  });
  applyCameraState(scene);
  scene.emitCameraChanged();
}

/**
 * 在地图尺寸或容器尺寸变化后重新应用相机状态。
 */
export function refreshCameraView(scene: EditorSceneCameraContext) {
  if (!scene.sys.isActive()) {
    return;
  }

  scene.cameraState = createEditorCameraState({
    sceneWidth: scene.gridWidth * scene.tileSize,
    sceneHeight: scene.gridHeight * scene.tileSize,
    containerWidth: scene.canvasContainerWidth,
    containerHeight: scene.canvasContainerHeight,
    centerX: scene.cameraState.centerX,
    centerY: scene.cameraState.centerY,
    zoom: scene.cameraState.zoom,
  });
  applyCameraState(scene);
  scene.emitCameraChanged();
}

/**
 * 重新钳制当前相机状态，确保地图边界不会漏出。
 */
export function clampCameraPosition(scene: EditorSceneCameraContext) {
  scene.cameraState = createEditorCameraState({
    sceneWidth: scene.gridWidth * scene.tileSize,
    sceneHeight: scene.gridHeight * scene.tileSize,
    containerWidth: scene.canvasContainerWidth,
    containerHeight: scene.canvasContainerHeight,
    centerX: scene.cameraState.centerX,
    centerY: scene.cameraState.centerY,
    zoom: scene.cameraState.zoom,
  });
  applyCameraState(scene);
}

/**
 * 把抽象 camera state 映射回 Phaser camera 的 viewport、scroll 和 zoom。
 */
function applyCameraState(scene: EditorSceneCameraContext) {
  const camera = scene.cameras.main;
  const phaserZoom = scene.cameraState.canvasWidth / Math.max(1, scene.cameraState.viewportWidth);

  camera.setViewport(
    scene.cameraState.canvasLeft,
    scene.cameraState.canvasTop,
    scene.cameraState.canvasWidth,
    scene.cameraState.canvasHeight,
  );
  camera.setZoom(phaserZoom);
  camera.setScroll(scene.cameraState.viewportLeft, scene.cameraState.viewportTop);
}
