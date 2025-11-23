import type { GameScene } from '../scenes/GameScene';
import { Item } from './Item';

export type IngredientState = 'unprocessed' | 'cut'; // 食材状态：未加工或已切

export class Ingredient extends Item {
  public ingredientState: IngredientState; // 食材的当前状态

  constructor(scene: GameScene, x: number, y: number, texture: string, state: IngredientState) {
    super(scene, x, y, texture);
    this.ingredientState = state;
  }
}
