import { Item } from "..";
import { DEPTH } from "../../config";
import { Ingredient } from "../ingredient/ingredient";


export type ContainerStatus = 'empty' | 'dirty' | 'combinable' | 'full';

export abstract class Container extends Item {
  private maxIngredients: number;
  private barBg?: Phaser.GameObjects.Rectangle; // 进度条背景
  private bar?: Phaser.GameObjects.Rectangle; // 进度条填充

  public status: ContainerStatus;
  public ingredients: Ingredient[];
  public canTransfer: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, status: ContainerStatus = 'empty', hasBar: boolean = true) {
    super(scene, x, y, texture);
    this.status = status;
    this.ingredients = [];
    this.canTransfer = true;
    if (hasBar) {
      this.barBg = this.scene.add.rectangle(x, y - 30, 40, 6, 0x000000).setDepth(DEPTH.UI).setVisible(false);
      this.bar = this.scene.add.rectangle(x - 20, y - 30, 0, 4, 0x00ff00).setDepth(DEPTH.UI + 1).setOrigin(0, 0.5).setVisible(false);
    }
  }

  abstract canAddIngredient(_ingredient: Ingredient): boolean;

  public getProgress(): number {
    if (this.isEmpty()) return 0;
    const sum = this.ingredients.reduce((prev, i) => prev + i.getProgress(), 0);
    return sum / this.ingredients.length;
  }

  public setProgress(value: number) {
    if (this.isEmpty()) return;
    const delta = (value - this.getProgress()) * this.ingredients.length;
    this.ingredients.reduce((remaining, ingredient) => {
      const current = ingredient.getProgress();
      const space = 100 - current;
      const allocated = Math.min(remaining, space);
      ingredient.setProgress(current + allocated);
      return remaining - allocated;
    }, delta);
  }

  public showBar() {
    this.barBg?.setVisible(true);
    if (this.bar) {
      this.bar.setVisible(true);
      this.bar.width = (this.getProgress() / 100) * 40;
    }
  }

  public hideBar() {
    this.barBg?.setVisible(false);
    this.bar?.setVisible(false);
  }

  public isEmpty() {
    return this.ingredients.length <= 0;
  }

  public isFull() {
    return this.ingredients.length >= this.maxIngredients;
  }

  public update(_delta: number): void {
    // 食材跟着容器移动
    this.ingredients.forEach(ingredient => {
      ingredient.x = this.x;
      ingredient.y = this.y;
      ingredient.depth = this.depth + 1;
    })

    // 进度条跟着容器移动
    if (this.bar) {
      this.bar.x = this.x - 20;
      this.bar.y = this.y - 30;
    }
    if (this.barBg) {
      this.barBg.x = this.x;
      this.barBg.y = this.y - 30;
    }

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

  public transferTo(container: Container): void {
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
