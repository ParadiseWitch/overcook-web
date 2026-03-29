/**
 * 测试对象：map-view 辅助函数。
 * 测试用例：适配缩放、浏览缩放钳制、滚动钳制、基于视口中心的缩放和视口尺寸解析。
 * 测试目标：保护驱动适配视图、浏览视图和 resize 行为的编辑器相机计算。
 * 期望：相机计算能保持预期世界中心，并始终落在支持范围内。
 */
import {
  clampSceneZoom,
  clampCameraScroll,
  computeCameraCenterWorldPoint,
  resolveViewportSize,
  computeScrollForViewportCenter,
  computeFitView,
  computeZoomScrollFromViewportCenter,
  normalizeZoom,
} from "../map-view";

describe("map-view", () => {
  it("computes a centered fit zoom and fills at least one viewport dimension", () => {
    const fit = computeFitView({
      viewportWidth: 1280,
      viewportHeight: 720,
      worldWidth: 17 * 48,
      worldHeight: 13 * 48,
      padding: 0,
    });

    expect(fit.zoom).toBeGreaterThan(1);
    expect(fit.centerX).toBeCloseTo((17 * 48) / 2);
    expect(fit.centerY).toBeCloseTo((13 * 48) / 2);
    expect(
      Math.max(
        fit.zoom * 17 * 48 / 1280,
        fit.zoom * 13 * 48 / 720,
      ),
    ).toBeCloseTo(1);
  });

  it("clamps zoom into the supported browse range", () => {
    expect(normalizeZoom(0.1)).toBe(0.5);
    expect(normalizeZoom(5)).toBe(2.5);
  });

  it("does not allow zooming out beyond the whole scene fit zoom", () => {
    expect(
      clampSceneZoom({
        zoom: 0.2,
        viewportWidth: 1280,
        viewportHeight: 720,
        worldWidth: 17 * 48,
        worldHeight: 13 * 48,
      }),
    ).toBeCloseTo(1.1538461538461537);
  });

  it("keeps camera scroll inside world bounds", () => {
    expect(
      clampCameraScroll({
        scrollX: -100,
        scrollY: 1200,
        viewportWidth: 800,
        viewportHeight: 600,
        zoom: 1,
        worldWidth: 1200,
        worldHeight: 900,
      }),
    ).toEqual({
      scrollX: 0,
      scrollY: 300,
    });
  });

  it("centers the map when the visible area is larger than the world", () => {
    expect(
      clampCameraScroll({
        scrollX: 0,
        scrollY: 0,
        viewportWidth: 1280,
        viewportHeight: 720,
        zoom: 0.75,
        worldWidth: 17 * 48,
        worldHeight: 13 * 48,
      }),
    ).toEqual({
      scrollX: -445.33333333333337,
      scrollY: -168,
    });
  });

  it("zooms around the viewport center instead of the pointer position", () => {
    expect(
      computeZoomScrollFromViewportCenter({
        scrollX: 120,
        scrollY: 80,
        viewportWidth: 800,
        viewportHeight: 600,
        currentZoom: 1,
        nextZoom: 1.25,
      }),
    ).toEqual({
      scrollX: 200,
      scrollY: 140,
    });
  });

  it("uses the camera's actual size when preserving the zoom center", () => {
    expect(
      computeCameraCenterWorldPoint({
        scrollX: 120,
        scrollY: 80,
        cameraWidth: 800,
        cameraHeight: 600,
        zoom: 1.25,
      }),
    ).toEqual({
      centerX: 440,
      centerY: 320,
    });
  });

  it("prefers actual camera size over fallback viewport defaults", () => {
    expect(
      resolveViewportSize({
        cameraWidth: 960,
        cameraHeight: 540,
        fallbackWidth: 1280,
        fallbackHeight: 720,
      }),
    ).toEqual({
      width: 960,
      height: 540,
    });
  });

  it("keeps the same world center when the viewport size changes", () => {
    expect(
      computeScrollForViewportCenter({
        centerX: 520,
        centerY: 380,
        viewportWidth: 1200,
        viewportHeight: 900,
        zoom: 1.25,
      }),
    ).toEqual({
      scrollX: 40,
      scrollY: 20,
    });
  });
});
