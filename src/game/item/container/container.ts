import { Item } from "..";
import { Ingredient } from "../ingredient/ingredient";


export type ContainerStatus = 'empty' | 'dirty' | 'combinable' | 'full';

export abstract class Container extends Item {
  status: ContainerStatus;
  public ingredients: Ingredient[];
  private maxIngredients: number;
  public canTransfer: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, status: ContainerStatus = 'empty') {
    super(scene, x, y, texture);
    this.status = status;
    this.ingredients = [];
    this.canTransfer = true;
  }

  public isEmpty() {
    return this.ingredients.length <= 0;
  }

  public isFull() {
    return this.ingredients.length >= this.maxIngredients;
  }

  public update(_delta: number): void {
    this.ingredients.forEach(ingredient => {
      ingredient.x = this.x;
      ingredient.y = this.y;
      ingredient.depth = this.depth + 1;
    })

    switch (this.status) {
      case 'empty':
        // 设置纹理
        break;
      case 'combinable':
      case 'dirty':
      default:
        break;
    }
  }

  abstract canAddIngredient(_ingredient: Ingredient): boolean;

  /**
   * 添加食材
   * @param ingredient 
   * @returns 
   */
  public addIngredient(ingredient: Ingredient): boolean {
    // 如果容器已满，不再添加食材
    if (this.isFull()) return false;
    // 如果不满足添加食材条件，不允许添加食材
    if (!this.canAddIngredient(ingredient)) return false;

    // 如果食材原来被角色持有，角色放手
    if (ingredient.heldBy) {
      ingredient.heldBy.heldItem = null;
      ingredient.heldBy = null;
    }
    // 锅里的鸭子才不会飞呢
    ingredient.isFlying = false;
    // 将食材放入容器内部
    ingredient.x = this.x;
    ingredient.y = this.y;

    if (ingredient.body) {
      ingredient.body.enable = false;
      ingredient.setVelocity(0, 0);
    }

    this.ingredients.push(ingredient);
    return true;
  }

  public clearIngredients() {
    this.ingredients.forEach(e => e.destroy());
    this.ingredients = [];
    // this.setTexture('item_plate'); // 切换为干净盘子纹理
  }

  transferTo(container: Container): void {
    if (this.isEmpty() || !this.canTransfer) return;
    if (container.isFull()) return;
    // 锅在working的时候不能transferTo
    // 是否每个食材都能添加到目标容器
    const canAdd = this.ingredients.every(i => container.canAddIngredient(i));
    if (!canAdd) return;
    this.ingredients.forEach(i => container.addIngredient(i));
    this.ingredients = [];
  }


}