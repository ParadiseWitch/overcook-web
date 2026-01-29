import { FoodState, Ingredient } from "./ingredient";

/**
 * 鸡蛋食材
 * 示例菜品：清蛋糕（鸡蛋+面粉搅拌后煎制）
 */
export class Egg extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_egg",
  ) {
    super(scene, x, y, texture, "egg");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    // 鸡蛋通常不需要切，直接用于搅拌
  }
}
