import { Ingredient, IngredientState } from "./Ingredient";

export class Tomato extends Ingredient {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'item_tomato', state: IngredientState = 'unprocessed') {
    super(scene, x, y, texture, state);
  }
}
