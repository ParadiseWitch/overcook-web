import { FoodState, Ingredient } from "./ingredient";

/**
 * 洋葱食材
 * 示例菜品：洋葱土豆胡萝卜汤《洋葱/+土豆/+胡萝卜/》
 */
export class Onion extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_onion",
  ) {
    super(scene, x, y, texture, "onion");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    if (cookState == "cut") {
      this.setTexture("item_onion_cut");
    }
  }
}
