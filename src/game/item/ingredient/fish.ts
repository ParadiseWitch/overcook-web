import { FoodState, Ingredient } from "./ingredient";

/**
 * 鱼食材
 * 示例菜品：鱼寿司（鱼/+米*+紫菜）、鱼刺身（鱼/）
 */
export class Fish extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_fish",
  ) {
    super(scene, x, y, texture, "fish");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    if (cookState == "cut") {
      this.setTexture("item_fish_cut");
    }
  }
}
