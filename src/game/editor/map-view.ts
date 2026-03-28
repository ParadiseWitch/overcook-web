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

export function normalizeZoom(zoom: number): number {
  return Math.min(2.5, Math.max(0.5, zoom));
}

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

export function computeZoomScrollFromViewportCenter(input: {
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
  currentZoom: number;
  nextZoom: number;
}): { scrollX: number; scrollY: number } {
  const centerWorldX = input.scrollX + input.viewportWidth / input.currentZoom / 2;
  const centerWorldY = input.scrollY + input.viewportHeight / input.currentZoom / 2;

  return {
    scrollX: centerWorldX - input.viewportWidth / input.nextZoom / 2,
    scrollY: centerWorldY - input.viewportHeight / input.nextZoom / 2,
  };
}

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
