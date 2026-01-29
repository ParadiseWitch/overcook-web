import { Ingredient } from "../ingredient/ingredient";
import { Container, ContainerStatus } from "./container";

/**
 * 盘子
 */
export class Plate extends Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    status: ContainerStatus = "empty",
  ) {
    let texture = "item_plate";
    if (status == "dirty") {
      texture = "item_plate_dirty";
    }
    super(scene, x, y, texture, status);
    // 盘子类物品使用更大的圆形碰撞体
    this.setCircle(20, -4, -4);
  }

  setEmptyTexture(): void {
    this.setTexture("item_plate"); // 切换为干净盘子纹理
  }

  canAddIngredient(ingredient: Ingredient): boolean {
    // 只能放处理过的食材
    if (ingredient.cookStates.length == 0) return false;
    // 检查是否已满
    if (this.isFull()) return false;
    return true;
  }
}
