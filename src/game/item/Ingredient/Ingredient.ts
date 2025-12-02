import { Item } from '../item';

export type CookState = 'cut' | 'boil' | 'pan-fry' | 'deep-fry'; // 食材状态：已切、已煮、煎炒、油炸

export class Ingredient extends Item {
  // 食材的烹饪状态
  public cookStates: CookState[];

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.cookStates = [];
  }

  addCookstate(cookState: CookState) {
    this.cookStates.push(cookState)
  }


  lastCookState(): CookState {
    const len = this.cookStates.length;
    return this.cookStates[len - 1 < 0 ? 0 : len - 1];
  }
}
