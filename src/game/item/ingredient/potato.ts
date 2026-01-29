import { FoodState, Ingredient } from "./ingredient";

/**
 * 土豆食材
 * 示例菜品：洋葱土豆胡萝卜汤《洋葱/+土豆/+胡萝卜/》
 */
export class Potato extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_potato",
  ) {
    super(scene, x, y, texture, "potato");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    if (cookState == "cut") {
      this.setTexture("item_potato_cut");
    }
  }
}
