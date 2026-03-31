/**
 * 测试对象：editor-render 辅助函数。
 * 测试用例：工作站贴图选择、食材标签、地板渲染规格和可渲染地板排序。
 * 测试目标：验证编辑器预览渲染和关卡配置语义保持一致。
 * 期望：针对典型编辑器对象，辅助函数返回稳定且可预期的渲染规格。
 */
import type { LevelConfig } from "../../types/level-config";
import type { ConveyorFloor } from "../../types/level-config";

import * as editorRender from "../editor-render";

describe("editor-render", () => {
  it("renders wall tiles with the wall texture", () => {
    expect(
      editorRender.getFloorRenderSpec({
        type: "wall",
        x: 1,
        y: 2,
      }),
    ).toMatchObject({
      textureKey: "wall",
      angle: 0,
      depth: 0,
    });
  });

  it("rotates conveyor tiles based on direction", () => {
    expect(
      editorRender.getFloorRenderSpec({
        type: "conveyor",
        x: 0,
        y: 0,
        direction: "left",
        speed: 100,
      } satisfies ConveyorFloor),
    ).toMatchObject({
      textureKey: "conveyor",
      angle: 180,
    });
  });
});
