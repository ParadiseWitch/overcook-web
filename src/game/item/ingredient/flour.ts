import { FoodState, Ingredient } from "./ingredient";

/**
 * 面粉食材
 * 示例菜品：清蛋糕（鸡蛋+面粉搅拌后煎制）
 */
export class Flour extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_flour",
  ) {
    super(scene, x, y, texture, "flour");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    // 面粉通常直接用于搅拌
  }
}
