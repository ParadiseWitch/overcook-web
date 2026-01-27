import { FoodState, Ingredient } from "./ingredient";

export class Tomato extends Ingredient {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "item_tomato",
  ) {
    super(scene, x, y, texture, "tomato");
  }

  addCookstate(cookState: FoodState) {
    super.addCookstate(cookState);
    if (cookState == "cut") {
      this.setTexture("item_tomato_cut");
    }
  }
}
