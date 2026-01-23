import { Ingredient } from "../ingredient/ingredient";
import { Container, ContainerStatus } from "./container";


/**
 * 锅
 * 
 * 用于灶台上煮汤或炒菜
 * 可以放入切好或煮过的食材，最多3种
 */
export class Pot extends Container {

  constructor(scene: Phaser.Scene, x: number, y: number, status: ContainerStatus = 'empty') {
    super(scene, x, y, "item_pot", status);
    this.setCircle(20, -4, -4);
    this.setMaxComponents(3);
  }

  setEmptyTexture(): void {
    // todo
  }

  canAddIngredient(ingredient: Ingredient): boolean {
    // 锅只接受切过或煮过的食材
    const lastState = ingredient.lastCookState();
    return lastState === 'cut' || lastState === 'boil';
  }
}
