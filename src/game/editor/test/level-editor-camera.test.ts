/**
 * 测试对象：level-editor-camera 与 level-editor-camera-pan 辅助函数。
 * 测试用例：相机边界钳制、小地图居中与拖拽位移换算。
 * 测试目标：保护编辑器画布移动的核心规则，避免输入接线后回归。
 * 期望：相机目标点会被稳定钳制，拖拽位移会按缩放值正确换算。
 */
import { clampCameraCenter } from "../level-editor-camera";
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
