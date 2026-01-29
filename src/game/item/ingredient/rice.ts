import { FoodState, Ingredient } from "./ingredient";

/**
 * 米食材
 * 示例菜品：鱼寿司（鱼/+米*+紫菜）
 */
export class Rice extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_rice",
  ) {
    super(scene, x, y, texture, "rice");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    if (cookState == "boil") {
      this.setTexture("item_rice_cooked");
    }
  }
}
