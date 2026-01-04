import { Item } from '..';

export type CookState = 'cut' | 'boil' | 'pan-fry' | 'deep-fry' | 'overcook'; // 食材状态：已切、已煮、煎炒、油炸

export class Ingredient extends Item {
  // 食材的烹饪状态
  public cookStates: CookState[];
  private _progress: number = 0;
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.cookStates = [];
  }

  getProgress(): number {
    return this._progress;
  }

  setProgress(value: number): void {
    this._progress = value
  }

  addCookstate(cookState: CookState) {
    this.setProgress(0);
    if (cookState == 'overcook') {
      this.setTexture('overcooke')
    }
    this.cookStates.push(cookState)
  }


  lastCookState(): CookState {
    const len = this.cookStates.length;
    return this.cookStates[len - 1 < 0 ? 0 : len - 1];
  }
}
