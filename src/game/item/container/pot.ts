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

  /**
   * 添加食材条件
   * @param ingredient 食材
   * @returns 是否可以添加食材
   */
  addIngredientCondition(ingredient: Ingredient): boolean {
    // 锅只允许放一种食材
    if (!this.isEmpty()) return false;
    // 锅可以：
    // 1. 放切过的食材
    // 2. 放煮过的食材
    return ingredient.lastCookState() == 'cut' || ingredient.lastCookState() == 'boil'
  }


  /**
   * 锅与容器交互
   * @param container 容器
   * @returns 是否成功交互
   */
  interactWithContainer(container: Container) {
    // 锅空，其余容器只有一种食材 -> 倒入锅中
    if (this.isEmpty() && container.ingredients.length == 1) {
      container.transferTo(this);
      return;
    }
    // 锅不空且食材已经煮好，其余容器空 -> 倒入其余容器
    if (!this.isEmpty() && this.ingredients[0].lastCookState() == 'boil' && container.isEmpty()) {
      this.transferTo(container);
      return;
    }
  }

  /**
   * 锅与食材交互
   * @param ingredient 食材
   */
  interactWithIngredient(ingredient: Ingredient) {
    // 锅不为空时，不可以添加食材
    if (!this.isEmpty()) return;
    // 食材不是切好的状态时，不可以添加食材
    if (ingredient.cookStates.length != 1 && ingredient.cookStates[0] != 'cut') return;
    this.addIngredient(ingredient);
  }
}
