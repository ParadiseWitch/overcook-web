/**
 * 计算当前视口在世界中的可滚动范围。
 */
export function computeScrollRange(input: {
  worldWidth: number;
  worldHeight: number;
  visibleWidth: number;
  visibleHeight: number;
}) {
  return {
    maxScrollX: Math.max(0, input.worldWidth - input.visibleWidth),
    maxScrollY: Math.max(0, input.worldHeight - input.visibleHeight),
  };
}

/**
 * 根据视口中心点和可视区域尺寸反推出相机 scroll。
 */
export function viewportCenterToScroll(input: {
  centerX: number;
  centerY: number;
  visibleWidth: number;
  visibleHeight: number;
}) {
  return {
    scrollX: input.centerX - input.visibleWidth / 2,
    scrollY: input.centerY - input.visibleHeight / 2,
  };
}

/**
 * 计算小地图中表示当前视口的矩形区域。
 */
export function computeMinimapViewportRect(input: {
  worldWidth: number;
  worldHeight: number;
  visibleWidth: number;
  visibleHeight: number;
  scrollX: number;
  scrollY: number;
  minimapWidth: number;
  minimapHeight: number;
}) {
  const scaleX = input.minimapWidth / Math.max(1, input.worldWidth);
  const scaleY = input.minimapHeight / Math.max(1, input.worldHeight);

  return {
    x: clamp(input.scrollX * scaleX, 0, input.minimapWidth),
    y: clamp(input.scrollY * scaleY, 0, input.minimapHeight),
    width: clamp(input.visibleWidth * scaleX, 0, input.minimapWidth),
    height: clamp(input.visibleHeight * scaleY, 0, input.minimapHeight),
  };
}

/**
 * 根据小地图上的指针位置换算出世界中的视口中心点。
 */
export function computeViewportCenterFromMinimap(input: {
  pointerX: number;
  pointerY: number;
  worldWidth: number;
  worldHeight: number;
  minimapWidth: number;
  minimapHeight: number;
}) {
  return {
    centerX: (input.pointerX / Math.max(1, input.minimapWidth)) * input.worldWidth,
    centerY: (input.pointerY / Math.max(1, input.minimapHeight)) * input.worldHeight,
  };
}

/**
 * 把百分比形式的缩放值转换成编辑器内部使用的 zoom。
 */
export function normalizeZoomPercent(percent: number) {
  return Math.min(2.5, Math.max(0.5, percent / 100));
}

/**
 * 为编辑器初始化一份以世界中心为基准的相机状态。
 */
export function createCenteredCameraState(input: {
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
}) {
  const visibleWidth = input.viewportWidth / input.zoom;
  const visibleHeight = input.viewportHeight / input.zoom;
  const centerX = input.worldWidth / 2;
  const centerY = input.worldHeight / 2;
  const scroll = viewportCenterToScroll({
    centerX,
    centerY,
    visibleWidth,
    visibleHeight,
  });

  return {
    scrollX: scroll.scrollX,
    scrollY: scroll.scrollY,
    zoom: input.zoom,
    visibleWidth,
    visibleHeight,
    worldWidth: input.worldWidth,
    worldHeight: input.worldHeight,
    centerX,
    centerY,
  };
}

/**
 * 把数值限制在给定区间内。
 */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
