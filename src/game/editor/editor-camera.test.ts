import {
  computeMinimapViewportRect,
  computeScrollRange,
  createCenteredCameraState,
  computeViewportCenterFromMinimap,
  normalizeZoomPercent,
  viewportCenterToScroll,
} from "./editor-camera";

describe("editor-camera", () => {
  it("computes scroll ranges from world and visible size", () => {
    expect(
      computeScrollRange({
        worldWidth: 1200,
        worldHeight: 900,
        visibleWidth: 800,
        visibleHeight: 600,
      }),
    ).toEqual({
      maxScrollX: 400,
      maxScrollY: 300,
    });
  });

  it("maps viewport center back to scroll offsets", () => {
    expect(
      viewportCenterToScroll({
        centerX: 600,
        centerY: 450,
        visibleWidth: 800,
        visibleHeight: 600,
      }),
    ).toEqual({
      scrollX: 200,
      scrollY: 150,
    });
  });

  it("computes minimap viewport rectangle in minimap space", () => {
    expect(
      computeMinimapViewportRect({
        worldWidth: 1200,
        worldHeight: 900,
        visibleWidth: 400,
        visibleHeight: 300,
        scrollX: 200,
        scrollY: 150,
        minimapWidth: 180,
        minimapHeight: 120,
      }),
    ).toEqual({
      x: 30,
      y: 20,
      width: 60,
      height: 40,
    });
  });

  it("clamps the minimap viewport rectangle when the visible area exceeds the world", () => {
    expect(
      computeMinimapViewportRect({
        worldWidth: 1200,
        worldHeight: 900,
        visibleWidth: 1500,
        visibleHeight: 1200,
        scrollX: -100,
        scrollY: -40,
        minimapWidth: 180,
        minimapHeight: 120,
      }),
    ).toEqual({
      x: 0,
      y: 0,
      width: 180,
      height: 120,
    });
  });

  it("converts minimap pointer positions to viewport centers", () => {
    expect(
      computeViewportCenterFromMinimap({
        pointerX: 90,
        pointerY: 60,
        worldWidth: 1200,
        worldHeight: 900,
        minimapWidth: 180,
        minimapHeight: 120,
      }),
    ).toEqual({
      centerX: 600,
      centerY: 450,
    });
  });

  it("normalizes zoom percentage input into zoom value", () => {
    expect(normalizeZoomPercent(135)).toBe(1.35);
    expect(normalizeZoomPercent(10)).toBe(0.5);
    expect(normalizeZoomPercent(400)).toBe(2.5);
  });

  it("creates a default camera state centered on the whole scene", () => {
    expect(
      createCenteredCameraState({
        worldWidth: 816,
        worldHeight: 624,
        viewportWidth: 1280,
        viewportHeight: 720,
        zoom: 1,
      }),
    ).toEqual({
      scrollX: -232,
      scrollY: -48,
      centerX: 408,
      centerY: 312,
      visibleWidth: 1280,
      visibleHeight: 720,
      worldWidth: 816,
      worldHeight: 624,
      zoom: 1,
    });
  });
});
