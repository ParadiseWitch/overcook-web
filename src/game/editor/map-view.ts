export interface FitViewInput {
  viewportWidth: number;
  viewportHeight: number;
  worldWidth: number;
  worldHeight: number;
  padding: number;
}

export interface FitViewResult {
  zoom: number;
  centerX: number;
  centerY: number;
}

/**
 * 根据视口和世界尺寸计算适配视图所需的中心点与缩放比例。
 */
export function computeFitView(input: FitViewInput): FitViewResult {
  const safeViewportWidth = Math.max(1, input.viewportWidth - input.padding * 2);
  const safeViewportHeight = Math.max(1, input.viewportHeight - input.padding * 2);
  const zoomX = safeViewportWidth / Math.max(1, input.worldWidth);
  const zoomY = safeViewportHeight / Math.max(1, input.worldHeight);

  return {
    zoom: Math.min(zoomX, zoomY),
    centerX: input.worldWidth / 2,
    centerY: input.worldHeight / 2,
  };
}

/**
 * 把缩放值限制在编辑器支持的范围内。
 */
export function normalizeZoom(zoom: number): number {
  return Math.min(2.5, Math.max(0.5, zoom));
}

/**
 * 结合世界尺寸和视口尺寸，限制浏览模式缩放范围。
 */
export function clampSceneZoom(input: {
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  worldWidth: number;
  worldHeight: number;
  padding?: number;
}): number {
  const fitZoom = computeFitView({
    viewportWidth: input.viewportWidth,
    viewportHeight: input.viewportHeight,
    worldWidth: input.worldWidth,
    worldHeight: input.worldHeight,
    padding: input.padding ?? 0,
  }).zoom;

  return Math.min(2.5, Math.max(fitZoom, input.zoom));
}

/**
 * 在保持视口中心不变的前提下，计算缩放前后的 scroll。
 */
export function computeZoomScrollFromViewportCenter(input: {
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
  currentZoom: number;
  nextZoom: number;
}): { scrollX: number; scrollY: number } {
  const center = computeCameraCenterWorldPoint({
    scrollX: input.scrollX,
    scrollY: input.scrollY,
    cameraWidth: input.viewportWidth,
    cameraHeight: input.viewportHeight,
    zoom: input.currentZoom,
  });

  return {
    scrollX: center.centerX - input.viewportWidth / input.nextZoom / 2,
    scrollY: center.centerY - input.viewportHeight / input.nextZoom / 2,
  };
}

/**
 * 计算当前相机中心对应的世界坐标。
 */
export function computeCameraCenterWorldPoint(input: {
  scrollX: number;
  scrollY: number;
  cameraWidth: number;
  cameraHeight: number;
  zoom: number;
}): { centerX: number; centerY: number } {
  return {
    centerX: input.scrollX + input.cameraWidth / input.zoom / 2,
    centerY: input.scrollY + input.cameraHeight / input.zoom / 2,
  };
}

/**
 * 优先使用真实相机尺寸，回退时才采用外部传入的默认视口尺寸。
 */
export function resolveViewportSize(input: {
  cameraWidth: number;
  cameraHeight: number;
  fallbackWidth: number;
  fallbackHeight: number;
}): { width: number; height: number } {
  return {
    width: Math.max(1, Math.floor(input.cameraWidth || input.fallbackWidth)),
    height: Math.max(1, Math.floor(input.cameraHeight || input.fallbackHeight)),
  };
}

/**
 * 根据目标视口中心点反推相机 scroll。
 */
export function computeScrollForViewportCenter(input: {
  centerX: number;
  centerY: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
}): { scrollX: number; scrollY: number } {
  return {
    scrollX: input.centerX - input.viewportWidth / input.zoom / 2,
    scrollY: input.centerY - input.viewportHeight / input.zoom / 2,
  };
}

/**
 * 将相机滚动限制在世界边界内，必要时在大视口下居中世界。
 */
export function clampCameraScroll(input: {
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  worldWidth: number;
  worldHeight: number;
}): { scrollX: number; scrollY: number } {
  const visibleWidth = input.viewportWidth / input.zoom;
  const visibleHeight = input.viewportHeight / input.zoom;
  const maxScrollX = input.worldWidth - visibleWidth;
  const maxScrollY = input.worldHeight - visibleHeight;

  return {
    scrollX: maxScrollX <= 0
      ? maxScrollX / 2
      : clamp(input.scrollX, 0, maxScrollX),
    scrollY: maxScrollY <= 0
      ? maxScrollY / 2
      : clamp(input.scrollY, 0, maxScrollY),
  };
}

/**
 * 把数值限制在给定闭区间内。
 */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
