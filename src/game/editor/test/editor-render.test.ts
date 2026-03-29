/**
 * 测试对象：editor-render 辅助函数。
 * 测试用例：工作站贴图选择、食材标签、地板渲染规格和可渲染地板排序。
 * 测试目标：验证编辑器预览渲染和关卡配置语义保持一致。
 * 期望：针对典型编辑器对象，辅助函数返回稳定且可预期的渲染规格。
 */
import type { LevelConfig } from "../../types/level-config";
import type { ConveyorFloor } from "../../types/level-config";

import { buildRenderableFloors, getFloorRenderSpec } from "../editor-render";

describe("editor-render", () => {
  it("renders wall tiles with the wall texture", () => {
    expect(
      getFloorRenderSpec({
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
      getFloorRenderSpec({
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

  it("renders a full floor grid even when config only stores overrides", () => {
    const config = {
      id: "test",
      name: "test",
      version: "1.0",
      gameType: "local-coop",
      duration: 300,
      scoreTarget: { star1: 1, star2: 2, star3: 3 },
      map: {
        width: 2,
        height: 2,
        floors: [{ type: "wall", x: 1, y: 0 }],
      },
      players: [],
      stations: [],
      orderPool: { recipes: [], maxActiveOrders: 1, spawnInterval: 10 },
    } satisfies LevelConfig;

    expect(buildRenderableFloors(config)).toEqual([
      { type: "normal", x: 0, y: 0 },
      { type: "wall", x: 1, y: 0 },
      { type: "normal", x: 0, y: 1 },
      { type: "normal", x: 1, y: 1 },
    ]);
  });
});
