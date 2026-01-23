import { Item } from "..";
import Food, { FoodComponent } from "../food";
import { Ingredient } from "../ingredient/ingredient";

// 容器状态：空、脏（需要清洗）、可组合、已满
export type ContainerStatus = 'empty' | 'dirty' | 'combinable' | 'full';

/**
 * 容器基类
 * 
 * 容器是承载食物的载体，如盘子、锅等
 * 容器只关心装载的Food，不关心Food内部的具体组合
 */
export abstract class Container extends Item {
  private maxComponents: number = 4;

  public status: ContainerStatus;
  public food: Food;
  // 是否可以将内容物转移到其他容器
  public canTransfer: boolean;

  // NOTE: _hasBar is kept for API compatibility but no longer used.
  // Progress bar is now managed by Food class directly.
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, status: ContainerStatus = 'empty', _hasBar: boolean = true) {
    super(scene, x, y, texture);
    this.status = status;
    this.canTransfer = true;
    this.food = new Food(scene, this.x, this.y, '');
  }

  // 子类实现：判断是否接受特定食材
  abstract canAddIngredient(_ingredient: Ingredient): boolean;

  // 判断是否可以添加食物组件（食材或已加工食物）
  canAdd(component: FoodComponent): boolean {
    if (component instanceof Ingredient) {
      return this.canAddIngredient(component);
    }
    return !this.isFull();
  }

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
    return this.food.size() >= this.maxComponents;
  }

  public update(_delta: number): void {
    super.update(_delta);
    this.food.setXy(this.x, this.y);

    switch (this.status) {
      case 'empty':
        break;
      case 'combinable':
      case 'dirty':
      default:
        break;
    }
  }

  public addIngredient(ingredient: Ingredient): boolean {
    if (this.isFull()) return false;
    if (!this.canAddIngredient(ingredient)) return false;

    this.food.add(ingredient);
    return true;
  }

  public addFood(component: FoodComponent): boolean {
    if (this.isFull()) return false;
    if (!this.canAdd(component)) return false;

    this.food.add(component);
    return true;
  }

  public clear() {
    this.food.destroy();
  }

  /**
   * 将内容物转移到另一个容器
   * 仅当源容器非空、可转移、目标容器为空时生效
   */
  public transferTo(container: Container): void {
    if (this.isEmpty() || !this.canTransfer) return;
    if (!container.isEmpty()) return;

    const food = this.food;
    this.food = container.food;
    container.food = food;
  }

  protected setMaxComponents(max: number) {
    this.maxComponents = max;
  }
}
