/**
 * Targets the level editor camera helpers and pan math.
 * Covers camera clamping, fit-to-canvas zoom, zoom step bounds, and drag delta conversion.
 * Protects the editor canvas navigation rules from regressions.
 */
import {
  clampCameraCenter,
  createCanvasBoundsFromView,
  getCameraViewportSize,
  getFitZoomForBounds,
  getMinZoomForBounds,
  getNextZoomLevel,
  LEVEL_EDITOR_ZOOM,
} from "../level-editor-camera";
import {
  getPanCameraCenter,
  getPanCursor,
} from "../level-editor-camera-pan";

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

  it("does not allow zooming out beyond the initial canvas bounds", () => {
    const bounds = createCanvasBoundsFromView(
      { x: 408, y: 312 },
      { width: 960, height: 540 },
      0.8,
    );
    const minZoom = getMinZoomForBounds(bounds, { width: 960, height: 540 });

    expect(minZoom).toBeCloseTo(0.8, 5);
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

  it("freezes canvas bounds from the actual initial camera view", () => {
    const bounds = createCanvasBoundsFromView(
      { x: 408, y: 312 },
      { width: 960, height: 540 },
      LEVEL_EDITOR_ZOOM.default,
    );

    expect(getFitZoomForBounds(bounds, { width: 960, height: 540 })).toBeCloseTo(
      LEVEL_EDITOR_ZOOM.default,
      5,
    );
    expect(bounds.left).toBeCloseTo(-28.363636363636374, 5);
    expect(bounds.top).toBeCloseTo(66.54545454545453, 5);
    expect(bounds.right).toBeCloseTo(844.3636363636364, 5);
    expect(bounds.bottom).toBeCloseTo(557.4545454545455, 5);
  });

  it("clamps camera center against editor navigation bounds instead of bare map bounds", () => {
    expect(
      clampCameraCenter(
        { x: -900, y: -520 },
        {
          left: -960,
          top: -540,
          right: 1776,
          bottom: 1164,
          viewportWidth: 640,
          viewportHeight: 360,
        },
      ),
    ).toEqual({
      x: -640,
      y: -360,
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

  it("uses a grab cursor while space is held without dragging", () => {
    expect(
      getPanCursor({
        spaceDown: true,
        pointerDown: false,
        active: false,
      }),
    ).toBe("grab");
  });

  it("uses a grabbing cursor while the pan gesture is active", () => {
    expect(
      getPanCursor({
        spaceDown: true,
        pointerDown: true,
        active: true,
      }),
    ).toBe("grabbing");
  });

  it("returns to the default cursor when space is not held", () => {
    expect(
      getPanCursor({
        spaceDown: false,
        pointerDown: false,
        active: false,
      }),
    ).toBe("default");
  });
});
