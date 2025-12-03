import { CookState, Ingredient } from "./ingredient";

export class Tomato extends Ingredient {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'item_tomato') {
    super(scene, x, y, texture);
  }

  addCookstate(cookState: CookState) {
    this.cookStates.push(cookState)
    if (cookState == 'cut') {
      // 切换为切好的番茄纹理
      this.setTexture('item_tomato_cut');
    }
  }
}
