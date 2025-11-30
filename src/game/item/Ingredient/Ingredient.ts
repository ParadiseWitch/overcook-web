import { Item } from '../Item';

export type IngredientState = 'unprocessed' | 'cut' | 'boil' | 'pan-fry' | 'deep-fry'; // 食材状态：未加工、已切、已煮、煎炒、油炸

export class Ingredient extends Item {
  public ingredientState: IngredientState; // 食材的当前状态

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, state: IngredientState) {
    super(scene, x, y, texture);
    this.ingredientState = state;
  }
}
