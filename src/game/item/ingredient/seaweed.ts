import { FoodState, Ingredient } from "./ingredient";

/**
 * 紫菜食材
 * 示例菜品：鱼寿司（鱼/+米*+紫菜）
 * 紫菜通常不需要加工，直接使用
 */
export class Seaweed extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_seaweed",
  ) {
    super(scene, x, y, texture, "seaweed");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    // 紫菜通常不需要烹饪加工
  }
}
