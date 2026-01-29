import { FoodState, Ingredient } from "./ingredient";

/**
 * 生菜食材
 * 示例菜品：生菜沙拉、生菜番茄沙拉
 */
export class Lettuce extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_lettuce",
  ) {
    super(scene, x, y, texture, "lettuce");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    if (cookState == "cut") {
      this.setTexture("item_lettuce_cut");
    }
  }
}
