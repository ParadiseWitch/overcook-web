/**
 * 测试对象：level-editor-utils 辅助函数。
 * 测试用例：工具默认对象构造、配方选项生成和选中对象补丁更新。
 * 测试目标：锁定编辑器侧配置辅助逻辑的稳定行为，方便回归审查。
 * 期望：辅助函数能生成合法编辑器对象，并在更新过程中保留判别类型信息。
 */
import {
  buildDefaultStationForTool,
  getAllRecipeOptions,
  updateSelectedObject,
} from "../level-editor-utils";
import { getDefaultLevelConfig } from "../../types/level-config";

describe("level-editor-utils", () => {
  it("builds conveyor config from tool settings", () => {
    expect(
      buildDefaultStationForTool("ingredient-cheese", 4, 5),
    ).toMatchObject({
      type: "ingredient",
      x: 4,
      y: 5,
      ingredientType: "cheese",
      infinite: true,
    });
  });

  it("updates the selected object while preserving its discriminated type", () => {
    const config = getDefaultLevelConfig();
    config.map.floors.push({
      type: "conveyor",
      x: 1,
      y: 1,
      direction: "right",
      speed: 100,
    });

    const updated = updateSelectedObject(
      config,
      {
        kind: "floor",
        x: 1,
        y: 1,
      },
      {
        direction: "left",
        speed: 180,
      },
    );

    expect(updated.map.floors[0]).toMatchObject({
      type: "conveyor",
      x: 1,
      y: 1,
      direction: "left",
      speed: 180,
    });
  });

  it("returns recipe options with display names for the order pool", () => {
    expect(getAllRecipeOptions()).toContainEqual({
      id: "fish-sushi",
      label: "鱼寿司",
    });
  });
});
