/**
 * 测试对象：新的编辑器相机几何模型。
 * 测试目标：保证 Scene -> Camera -> Viewport -> Canvas 的单一数学模型稳定。
 */
import {
  clampCameraCenter,
  clampZoom,
  createEditorCameraState,
  panCameraByScreenDelta,
  screenToWorld,
  setCameraCenter,
  setCameraZoom,
  worldToScreen,
} from "../editor-camera";

describe("editor-camera model", () => {
  it("covers the whole scene when zoom is 1", () => {
    const state = createEditorCameraState({
      sceneWidth: 816,
      sceneHeight: 624,
      containerWidth: 1280,
      containerHeight: 720,
      zoom: 1,
    });

    expect(state.viewportWidth).toBe(816);
    expect(state.viewportHeight).toBe(624);
    expect(state.viewportLeft).toBe(0);
    expect(state.viewportTop).toBe(0);
    expect(state.centerX).toBe(408);
    expect(state.centerY).toBe(312);
  });

  it("shows half of the scene when zoom is 2", () => {
    const state = createEditorCameraState({
      sceneWidth: 816,
      sceneHeight: 624,
      containerWidth: 1280,
      containerHeight: 720,
      zoom: 2,
    });

    expect(state.viewportWidth).toBe(408);
    expect(state.viewportHeight).toBe(312);
    expect(state.viewportLeft).toBe(204);
    expect(state.viewportTop).toBe(156);
  });

  it("keeps the camera inside scene bounds after moving the center", () => {
    const state = setCameraCenter(
      createEditorCameraState({
        sceneWidth: 816,
        sceneHeight: 624,
        containerWidth: 1280,
        containerHeight: 720,
        zoom: 2,
      }),
      -100,
      9999,
    );

    expect(state.centerX).toBe(204);
    expect(state.centerY).toBe(468);
    expect(state.viewportLeft).toBe(0);
    expect(state.viewportTop).toBe(312);
  });

  it("computes a centered canvas rect that preserves the scene ratio", () => {
    const state = createEditorCameraState({
      sceneWidth: 816,
      sceneHeight: 624,
      containerWidth: 1600,
      containerHeight: 720,
      zoom: 1,
    });

    expect(state.canvasWidth).toBeCloseTo(941.5384615384615);
    expect(state.canvasHeight).toBe(720);
    expect(state.canvasLeft).toBeCloseTo(329.2307692307693);
    expect(state.canvasTop).toBe(0);
  });

  it("maps world and screen coordinates through the active canvas rect", () => {
    const state = createEditorCameraState({
      sceneWidth: 816,
      sceneHeight: 624,
      containerWidth: 1600,
      containerHeight: 720,
      zoom: 2,
    });

    const screen = worldToScreen(state, { x: 408, y: 312 });
    const world = screenToWorld(state, screen);

    expect(screen.x).toBeCloseTo(800);
    expect(screen.y).toBeCloseTo(360);
    expect(world).toEqual({
      x: 408,
      y: 312,
      insideCanvas: true,
    });
  });

  it("rejects screen points that fall inside letterboxed margins", () => {
    const state = createEditorCameraState({
      sceneWidth: 816,
      sceneHeight: 624,
      containerWidth: 1600,
      containerHeight: 720,
      zoom: 1,
    });

    expect(screenToWorld(state, { x: 20, y: 100 })).toEqual({
      x: null,
      y: null,
      insideCanvas: false,
    });
  });

  it("keeps camera center stable while changing zoom", () => {
    const initial = createEditorCameraState({
      sceneWidth: 816,
      sceneHeight: 624,
      containerWidth: 1280,
      containerHeight: 720,
      zoom: 1,
    });

    const zoomed = setCameraZoom(initial, 1.8);

    expect(zoomed.centerX).toBe(initial.centerX);
    expect(zoomed.centerY).toBe(initial.centerY);
    expect(zoomed.viewportWidth).toBeCloseTo(453.3333333333333);
    expect(zoomed.viewportHeight).toBeCloseTo(346.6666666666667);
  });

  it("pans camera opposite to the drag direction", () => {
    const initial = createEditorCameraState({
      sceneWidth: 816,
      sceneHeight: 624,
      containerWidth: 1280,
      containerHeight: 720,
      zoom: 2,
    });

    const moved = panCameraByScreenDelta(initial, { deltaX: 120, deltaY: -60 });

    expect(moved.centerX).toBeCloseTo(356);
    expect(moved.centerY).toBeCloseTo(338);
  });

  it("clamps zoom into the supported range", () => {
    expect(clampZoom(0.4)).toBe(1);
    expect(clampZoom(3)).toBe(2);
  });

  it("clamps raw center coordinates using the current viewport size", () => {
    expect(
      clampCameraCenter({
        sceneWidth: 816,
        sceneHeight: 624,
        centerX: 999,
        centerY: -100,
        zoom: 2,
      }),
    ).toEqual({
      centerX: 612,
      centerY: 156,
    });
  });
});
