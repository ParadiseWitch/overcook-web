/**
 * Targets the level editor camera helpers and pan math.
 * Covers camera clamping, zoom steps, zoom limits, and drag delta conversion.
 * Protects the editor canvas navigation rules from regressions.
 */
import {
  clampCameraCenter,
  getCameraViewportSize,
  getMinZoomForBounds,
  getNextZoomLevel,
  LEVEL_EDITOR_ZOOM,
} from "../level-editor-camera";
import { getPanCameraCenter } from "../level-editor-camera-pan";

describe("level-editor-camera", () => {
  it("clamps camera center inside world bounds when the world is larger than the viewport", () => {
    expect(
      clampCameraCenter(
        { x: 20, y: 780 },
        {
          worldWidth: 1000,
          worldHeight: 800,
          viewportWidth: 400,
          viewportHeight: 200,
        },
      ),
    ).toEqual({
      x: 200,
      y: 700,
    });
  });

  it("keeps camera centered when the world is smaller than the viewport", () => {
    expect(
      clampCameraCenter(
        { x: 999, y: -999 },
        {
          worldWidth: 240,
          worldHeight: 160,
          viewportWidth: 400,
          viewportHeight: 200,
        },
      ),
    ).toEqual({
      x: 120,
      y: 80,
    });
  });

  it("raises zoom level by a fixed step and clamps it to the configured maximum", () => {
    expect(
      getNextZoomLevel(LEVEL_EDITOR_ZOOM.max - 0.05, -120),
    ).toBe(LEVEL_EDITOR_ZOOM.max);
  });

  it("lowers zoom level by a fixed step and clamps it to the configured minimum", () => {
    expect(
      getNextZoomLevel(LEVEL_EDITOR_ZOOM.min + 0.05, 120),
    ).toBe(LEVEL_EDITOR_ZOOM.min);
  });

  it("does not allow zooming out beyond the world bounds", () => {
    const minZoom = getMinZoomForBounds(
      { worldWidth: 816, worldHeight: 624 },
      { width: 960, height: 540 },
    );

    expect(minZoom).toBeCloseTo(1.1764705882, 5);
    expect(
      getNextZoomLevel(minZoom + 0.05, 120, minZoom),
    ).toBeCloseTo(minZoom, 5);
  });

  it("derives the visible world span from viewport size and zoom", () => {
    expect(
      getCameraViewportSize({
        width: 960,
        height: 540,
        zoom: 1.5,
      }),
    ).toEqual({
      viewportWidth: 640,
      viewportHeight: 360,
    });
  });
});

describe("level-editor-camera-pan", () => {
  it("moves camera opposite to drag direction and scales delta by zoom", () => {
    expect(
      getPanCameraCenter(
        { x: 300, y: 240 },
        { x: 60, y: -30 },
        2,
      ),
    ).toEqual({
      x: 270,
      y: 255,
    });
  });
});
