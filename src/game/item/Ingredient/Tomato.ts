import { Ingredient, IngredientState } from "./ingredient";

export class Tomato extends Ingredient {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'item_tomato', state: IngredientState = 'unprocessed') {
    super(scene, x, y, texture, state);
  }
}
