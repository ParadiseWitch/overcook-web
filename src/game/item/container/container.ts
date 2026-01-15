import { Item } from "..";
import Food from "../food";
import { Ingredient } from "../ingredient/ingredient";


export type ContainerStatus = 'empty' | 'dirty' | 'combinable' | 'full';

export abstract class Container extends Item {
  private maxIngredients: number;

  public status: ContainerStatus;
  // public ingredients: Ingredient[];
  public food: Food;
  public canTransfer: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, status: ContainerStatus = 'empty', hasBar: boolean = true) {
    super(scene, x, y, texture);
    this.status = status;
    // this.ingredients = [];
    this.canTransfer = true;
    this.food = new Food(scene, this.x, this.y, '')
    if (hasBar) {
      // this.barBg = this.scene.add.rectangle(x, y - 30, 40, 6, 0x000000).setDepth(DEPTH.UI).setVisible(false);
      // this.bar = this.scene.add.rectangle(x - 20, y - 30, 0, 4, 0x00ff00).setDepth(DEPTH.UI + 1).setOrigin(0, 0.5).setVisible(false);
    }
  }

  abstract canAddIngredient(_ingredient: Ingredient): boolean;

  public getProgress(): number {
    return this.food.getProgress();
  }

  public setProgress(value: number) {
    this.food.setProgress(value);
  }

  public showBar() {
    this.food.showBar();
  }

  public hideBar() {
    this.food.hideBar();
  }

  public isEmpty() {
    return this.food.isEmpty();
  }

  public isFull() {
    return this.food.size() >= this.maxIngredients;
  }

  public update(_delta: number): void {
    super.update(_delta);
    // 食材跟着容器移动
    this.food.setXy(this.x, this.y);

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

    this.food.add(ingredient);
    return true;
  }

  public clear() {
    this.food.destroy();
  }

  public transferTo(container: Container): void {
    if (this.isEmpty() || !this.canTransfer) return;
    // 目标容器不是空, 返回
    if (!container.isEmpty()) return;
    const food = this.food;
    this.food = container.food;
    container.food = food;
  }

}
