import { Ingredient } from '../ingredient/ingredient';
import { Container, ContainerStatus } from './container';

/**
 * 盘子
 */
export class Plate extends Container {

  constructor(scene: Phaser.Scene, x: number, y: number, status: ContainerStatus = 'empty') {
    let texture = 'item_plate';
    if (status == 'dirty') {
      texture = 'item_plate_dirty'
    }
    super(scene, x, y, texture, status);
    // 盘子类物品使用更大的圆形碰撞体
    this.setCircle(20, -4, -4);
  }


  addIngredientCondition(ingredient: Ingredient): boolean {
    // 只能放处理过的食材
    if (ingredient.cookStates.length == 0) return false;
    return true;
  }

  interactWithIngredient(ingredient: Ingredient): void {
    this.addIngredient(ingredient)
  }

  interactWithContainer(container: Container): void {
    // 盘子空，其余容器不为空 -> 倒入盘子
    if (this.isEmpty() && !container.isEmpty()) {
      container.transferTo(this);
      return;
    }
    // 盘子不空，其余容器空 -> 倒入其余容器
    if (!this.isEmpty() && container.isEmpty()) {
      this.transferTo(container);
      return;
    }
  }

}
