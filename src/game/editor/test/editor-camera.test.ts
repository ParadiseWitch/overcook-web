/**
 * 测试对象：编辑器相机 HUD 与小地图辅助函数。
 * 测试目标：确保 HUD 直接消费新的 viewport/canvas 数据而不是旧 scroll 语义。
 */
import {
  computeMinimapViewportRect,
  createEditorCameraState,
  normalizeZoomPercent,
  viewportCenterFromMinimap,
} from "../editor-camera";

describe("editor-camera HUD helpers", () => {
  it("computes minimap viewport rectangle from viewport bounds", () => {
    const state = createEditorCameraState({
      sceneWidth: 1200,
      sceneHeight: 900,
      containerWidth: 1280,
      containerHeight: 720,
      zoom: 2,
      centerX: 600,
      centerY: 450,
    });

    expect(
      computeMinimapViewportRect({
        sceneWidth: state.sceneWidth,
        sceneHeight: state.sceneHeight,
        viewportLeft: state.viewportLeft,
        viewportTop: state.viewportTop,
        viewportWidth: state.viewportWidth,
        viewportHeight: state.viewportHeight,
        minimapWidth: 180,
        minimapHeight: 120,
      }),
    ).toEqual({
      x: 45,
      y: 30,
      width: 90,
      height: 60,
    });
  });

  it("clamps minimap viewport when the viewport covers the whole scene", () => {
    const state = createEditorCameraState({
      sceneWidth: 1200,
      sceneHeight: 900,
      containerWidth: 1280,
      containerHeight: 720,
      zoom: 1,
    });

    expect(
      computeMinimapViewportRect({
        sceneWidth: state.sceneWidth,
        sceneHeight: state.sceneHeight,
        viewportLeft: state.viewportLeft,
        viewportTop: state.viewportTop,
        viewportWidth: state.viewportWidth,
        viewportHeight: state.viewportHeight,
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

  it("converts a minimap pointer position into a camera center", () => {
    expect(
      viewportCenterFromMinimap({
        pointerX: 90,
        pointerY: 60,
        sceneWidth: 1200,
        sceneHeight: 900,
        minimapWidth: 180,
        minimapHeight: 120,
      }),
    ).toEqual({
      centerX: 600,
      centerY: 450,
    });
  });

  it("normalizes zoom percentage input into the supported zoom range", () => {
    expect(normalizeZoomPercent(100)).toBe(1);
    expect(normalizeZoomPercent(135)).toBe(1.35);
    expect(normalizeZoomPercent(250)).toBe(2);
  });
});
