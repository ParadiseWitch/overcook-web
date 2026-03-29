export const EDITOR_CAMERA_MIN_ZOOM = 1;
export const EDITOR_CAMERA_MAX_ZOOM = 2;

export interface EditorCameraState {
  centerX: number;
  centerY: number;
  zoom: number;
  sceneWidth: number;
  sceneHeight: number;
  canvasLeft: number;
  canvasTop: number;
  canvasWidth: number;
  canvasHeight: number;
  viewportLeft: number;
  viewportTop: number;
  viewportWidth: number;
  viewportHeight: number;
}

interface CameraBaseInput {
  sceneWidth: number;
  sceneHeight: number;
  containerWidth: number;
  containerHeight: number;
  centerX?: number;
  centerY?: number;
  zoom: number;
}

/**
 * 计算页面容器中的有效渲染区域，并保持其宽高比与场景一致。
 */
export function computeCanvasRect(input: {
  sceneWidth: number;
  sceneHeight: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const safeSceneWidth = Math.max(1, input.sceneWidth);
  const safeSceneHeight = Math.max(1, input.sceneHeight);
  const safeContainerWidth = Math.max(1, input.containerWidth);
  const safeContainerHeight = Math.max(1, input.containerHeight);
  const sceneRatio = safeSceneWidth / safeSceneHeight;
  const containerRatio = safeContainerWidth / safeContainerHeight;

  if (containerRatio > sceneRatio) {
    const width = safeContainerHeight * sceneRatio;
    return {
      left: (safeContainerWidth - width) / 2,
      top: 0,
      width,
      height: safeContainerHeight,
    };
  }

  const height = safeContainerWidth / sceneRatio;
  return {
    left: 0,
    top: (safeContainerHeight - height) / 2,
    width: safeContainerWidth,
    height,
  };
}

/**
 * 把缩放值限制在编辑器支持的范围内。
 */
export function clampZoom(zoom: number) {
  return clamp(zoom, EDITOR_CAMERA_MIN_ZOOM, EDITOR_CAMERA_MAX_ZOOM);
}

/**
 * 根据场景大小和缩放值，限制相机中心点始终落在合法区域内。
 */
export function clampCameraCenter(input: {
  sceneWidth: number;
  sceneHeight: number;
  centerX: number;
  centerY: number;
  zoom: number;
}) {
  const viewportWidth = Math.max(1, input.sceneWidth / clampZoom(input.zoom));
  const viewportHeight = Math.max(1, input.sceneHeight / clampZoom(input.zoom));
  const halfWidth = viewportWidth / 2;
  const halfHeight = viewportHeight / 2;

  return {
    centerX: clamp(input.centerX, halfWidth, Math.max(halfWidth, input.sceneWidth - halfWidth)),
    centerY: clamp(input.centerY, halfHeight, Math.max(halfHeight, input.sceneHeight - halfHeight)),
  };
}

/**
 * 基于场景、容器和相机中心构建一份完整的编辑器相机状态。
 */
export function createEditorCameraState(input: CameraBaseInput): EditorCameraState {
  const zoom = clampZoom(input.zoom);
  const center = clampCameraCenter({
    sceneWidth: input.sceneWidth,
    sceneHeight: input.sceneHeight,
    centerX: input.centerX ?? input.sceneWidth / 2,
    centerY: input.centerY ?? input.sceneHeight / 2,
    zoom,
  });
  const viewportWidth = Math.max(1, input.sceneWidth / zoom);
  const viewportHeight = Math.max(1, input.sceneHeight / zoom);
  const canvasRect = computeCanvasRect({
    sceneWidth: input.sceneWidth,
    sceneHeight: input.sceneHeight,
    containerWidth: input.containerWidth,
    containerHeight: input.containerHeight,
  });

  return {
    centerX: center.centerX,
    centerY: center.centerY,
    zoom,
    sceneWidth: input.sceneWidth,
    sceneHeight: input.sceneHeight,
    canvasLeft: canvasRect.left,
    canvasTop: canvasRect.top,
    canvasWidth: canvasRect.width,
    canvasHeight: canvasRect.height,
    viewportLeft: center.centerX - viewportWidth / 2,
    viewportTop: center.centerY - viewportHeight / 2,
    viewportWidth,
    viewportHeight,
  };
}

/**
 * 生成以场景中心和默认缩放为基准的初始相机状态。
 */
export function createCenteredCameraState(input: {
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
}) {
  return createEditorCameraState({
    sceneWidth: input.worldWidth,
    sceneHeight: input.worldHeight,
    containerWidth: input.viewportWidth,
    containerHeight: input.viewportHeight,
    zoom: input.zoom,
  });
}

/**
 * 在保持其它状态不变的前提下更新相机中心。
 */
export function setCameraCenter(state: EditorCameraState, centerX: number, centerY: number) {
  return createEditorCameraState({
    sceneWidth: state.sceneWidth,
    sceneHeight: state.sceneHeight,
    containerWidth: state.canvasWidth + state.canvasLeft * 2,
    containerHeight: state.canvasHeight + state.canvasTop * 2,
    centerX,
    centerY,
    zoom: state.zoom,
  });
}

/**
 * 在保持相机中心不变的前提下更新缩放值。
 */
export function setCameraZoom(state: EditorCameraState, zoom: number) {
  return createEditorCameraState({
    sceneWidth: state.sceneWidth,
    sceneHeight: state.sceneHeight,
    containerWidth: state.canvasWidth + state.canvasLeft * 2,
    containerHeight: state.canvasHeight + state.canvasTop * 2,
    centerX: state.centerX,
    centerY: state.centerY,
    zoom,
  });
}

/**
 * 根据屏幕拖拽位移反向平移相机中心。
 */
export function panCameraByScreenDelta(
  state: EditorCameraState,
  input: { deltaX: number; deltaY: number },
) {
  const worldDeltaX = input.deltaX / Math.max(1, state.canvasWidth) * state.viewportWidth;
  const worldDeltaY = input.deltaY / Math.max(1, state.canvasHeight) * state.viewportHeight;

  return setCameraCenter(
    state,
    state.centerX - worldDeltaX,
    state.centerY - worldDeltaY,
  );
}

/**
 * 把世界坐标映射到容器坐标系中的屏幕点。
 */
export function worldToScreen(state: EditorCameraState, input: { x: number; y: number }) {
  return {
    x: state.canvasLeft + ((input.x - state.viewportLeft) / state.viewportWidth) * state.canvasWidth,
    y: state.canvasTop + ((input.y - state.viewportTop) / state.viewportHeight) * state.canvasHeight,
  };
}

/**
 * 把屏幕坐标映射回世界坐标，并标记该点是否命中了有效画布区域。
 */
export function screenToWorld(state: EditorCameraState, input: { x: number; y: number }) {
  const insideCanvas =
    input.x >= state.canvasLeft &&
    input.x <= state.canvasLeft + state.canvasWidth &&
    input.y >= state.canvasTop &&
    input.y <= state.canvasTop + state.canvasHeight;

  if (!insideCanvas) {
    return {
      x: null,
      y: null,
      insideCanvas: false,
    };
  }

  return {
    x: state.viewportLeft + ((input.x - state.canvasLeft) / state.canvasWidth) * state.viewportWidth,
    y: state.viewportTop + ((input.y - state.canvasTop) / state.canvasHeight) * state.viewportHeight,
    insideCanvas: true,
  };
}

/**
 * 根据当前 viewport 在场景中的边界计算小地图上的视口框。
 */
export function computeMinimapViewportRect(input: {
  sceneWidth: number;
  sceneHeight: number;
  viewportLeft: number;
  viewportTop: number;
  viewportWidth: number;
  viewportHeight: number;
  minimapWidth: number;
  minimapHeight: number;
}) {
  const scaleX = input.minimapWidth / Math.max(1, input.sceneWidth);
  const scaleY = input.minimapHeight / Math.max(1, input.sceneHeight);

  return {
    x: clamp(input.viewportLeft * scaleX, 0, input.minimapWidth),
    y: clamp(input.viewportTop * scaleY, 0, input.minimapHeight),
    width: clamp(input.viewportWidth * scaleX, 0, input.minimapWidth),
    height: clamp(input.viewportHeight * scaleY, 0, input.minimapHeight),
  };
}

/**
 * 把小地图上的点转换成世界中的目标相机中心点。
 */
export function viewportCenterFromMinimap(input: {
  pointerX: number;
  pointerY: number;
  sceneWidth: number;
  sceneHeight: number;
  minimapWidth?: number;
  minimapHeight?: number;
}) {
  const safeWidth = Math.max(1, input.minimapWidth ?? input.sceneWidth);
  const safeHeight = Math.max(1, input.minimapHeight ?? input.sceneHeight);

  return {
    centerX: (input.pointerX / safeWidth) * input.sceneWidth,
    centerY: (input.pointerY / safeHeight) * input.sceneHeight,
  };
}

/**
 * 把百分比缩放输入转换成编辑器内部的 zoom 值。
 */
export function normalizeZoomPercent(percent: number) {
  return clampZoom(percent / 100);
}

/**
 * 将数值限制在给定区间内。
 */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
