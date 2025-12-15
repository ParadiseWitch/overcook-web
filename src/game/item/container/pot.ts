import { Ingredient } from "../ingredient/ingredient";
import { Container, ContainerStatus } from "./container";


/**
 * 锅
 * 只能同时放一种食材
 */
export class Pot extends Container {

  constructor(scene: Phaser.Scene, x: number, y: number, status: ContainerStatus = 'empty') {
    super(scene, x, y, "item_pot", status);
    this.setCircle(20, -4, -4);
  }

  setEmptyTexture(): void {
    // todo
  }

  /**
   * 添加食材条件
   * @param ingredient 食材
   * @returns 是否可以添加食材
   */
  canAddIngredient(ingredient: Ingredient): boolean {
    // 锅只允许放一种食材
    if (!this.isEmpty()) return false;
    // 锅可以：
    // 1. 放切过的食材
    // 2. 放煮过的食材
    return ingredient.lastCookState() == 'cut' || ingredient.lastCookState() == 'boil'
  }

}
