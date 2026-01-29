import { FoodState, Ingredient } from "./ingredient";

/**
 * 胡萝卜食材
 * 示例菜品：洋葱土豆胡萝卜汤《洋葱/+土豆/+胡萝卜/》
 */
export class Carrot extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_carrot",
  ) {
    super(scene, x, y, texture, "carrot");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    if (cookState == "cut") {
      this.setTexture("item_carrot_cut");
    }
  }
}
