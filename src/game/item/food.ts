import { DEPTH } from "../config";
import { Station } from "../stations/station";
import { FoodState, Ingredient } from "./ingredient/ingredient";

// 食物组件类型：支持食材和已加工食物的嵌套组合
export type FoodComponent = Food | Ingredient;

/**
 * 食物类
 * 
 * 代表由食材组合/烹饪而成的产物，支持嵌套结构以表达复杂菜品
 * 例如：清蛋糕 = 煎烤后的(搅拌后的(鸡蛋+面粉))
 */
export default class Food extends Phaser.Physics.Arcade.Sprite {
  private barBg: Phaser.GameObjects.Rectangle;
  private bar: Phaser.GameObjects.Rectangle;

  // 组成成分：支持嵌套，可以是食材或已加工的食物
  public components: FoodComponent[];

  // 烹饪状态链：记录这个食物整体经历的烹饪步骤
  public cookStates: FoodState[];

  // 是否正在被烹饪
  public isCooking: boolean;

  // 当前烹饪进度 (0-100)
  private _progress: number;

  // 当前所在的工作站
  public currentStation?: Station;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.components = [];
    this.cookStates = [];
    this.isCooking = false;
    this._progress = 0;
    this.barBg = this.scene.add.rectangle(x, y - 30, 40, 6, 0x000000).setDepth(DEPTH.UI).setVisible(false);
    this.bar = this.scene.add.rectangle(x - 20, y - 30, 0, 4, 0x00ff00).setDepth(DEPTH.UI + 1).setOrigin(0, 0.5).setVisible(false);
  }

  /**
   * @deprecated Use `components` directly or `flatten()` for all nested ingredients.
   * WARNING: This getter creates a new filtered array on every access, which may
   * cause performance issues if called frequently (e.g., in update loops).
   */
  get ingredients(): Ingredient[] {
    return this.components.filter((c): c is Ingredient => c instanceof Ingredient);
  }

  setXy(x: number, y: number) {
    this.components.forEach(component => {
      if (component instanceof Ingredient) {
        component.x = x;
        component.y = y;
        component.depth = DEPTH.UI + 1;
      } else if (component instanceof Food) {
        component.setXy(x, y);
      }
    });
  }

  size(): number {
    return this.components.length;
  }

  isEmpty(): boolean {
    return this.size() <= 0;
  }

  /**
   * 添加组件到食物中
   * 当食材被添加时，会自动解除其与玩家的持有关系
   */
  add(component: FoodComponent) {
    this.components.push(component);

    if (component instanceof Ingredient) {
      if (component.heldBy) {
        component.heldBy.heldItem = null;
        component.heldBy = null;
      }
      component.isFlying = false;
      if (component.body) {
        component.body.enable = false;
        component.setVelocity(0, 0);
      }
    }

    this.setXy(this.x, this.y);
  }

  addIngredient(ingredient: Ingredient) {
    this.add(ingredient);
  }

  last(): FoodComponent | undefined {
    return this.components[this.size() - 1];
  }

  lastIngredient(): Ingredient | undefined {
    const ingredients = this.ingredients;
    return ingredients[ingredients.length - 1];
  }

  has(component: FoodComponent): boolean {
    return this.components.includes(component);
  }

  // 递归检查是否包含某个食材（包括嵌套的Food中）
  hasIngredient(ingredient: Ingredient): boolean {
    return this.components.some(c => {
      if (c === ingredient) return true;
      if (c instanceof Food) return c.hasIngredient(ingredient);
      return false;
    });
  }

  /**
   * 获取基底食材
   * 用于汉堡、披萨等场景，基底食材可以直接叠加配料
   */
  getBaseIngredient(): Ingredient | null {
    for (const comp of this.components) {
      if (comp instanceof Ingredient && comp.canBeBase) {
        return comp;
      }
      if (comp instanceof Food) {
        const base = comp.getBaseIngredient();
        if (base) return base;
      }
    }
    return null;
  }

  /**
   * 检查是否可以添加配料
   * 需要有基底食材，且未超过配料数量限制，且配料类型被接受
   * 
   * KNOWN LIMITATION: currentToppings 计算假设基底是第一个组件，
   * 但 getBaseIngredient() 是递归查找的。如果基底不在第一位，
   * 配料数量限制可能不准确。
   */
  canAddTopping(topping: FoodComponent): boolean {
    const base = this.getBaseIngredient();
    if (!base || !base.canBeBase) return false;

    const currentToppings = this.components.length - 1;
    if (base.maxToppings && currentToppings >= base.maxToppings) return false;

    if (base.acceptedToppings) {
      const toppingType = this.getToppingType(topping);
      if (!base.acceptedToppings.includes(toppingType)) {
        return false;
      }
    }

    return true;
  }

  private getToppingType(topping: FoodComponent): string {
    if (topping instanceof Ingredient) {
      return topping.ingredientType;
    }
    const firstIngredient = topping.ingredients[0];
    return firstIngredient?.ingredientType ?? '';
  }

  /**
   * 展平嵌套结构，获取所有原始食材
   * 用于计算食物的完整成分列表
   */
  flatten(): Ingredient[] {
    const result: Ingredient[] = [];
    for (const comp of this.components) {
      if (comp instanceof Ingredient) {
        result.push(comp);
      } else if (comp instanceof Food) {
        result.push(...comp.flatten());
      }
    }
    return result;
  }

  addCookState(state: FoodState) {
    this.cookStates.push(state);
    this._progress = 0;
  }

  hasCookState(state: FoodState): boolean {
    return this.cookStates.includes(state);
  }

  lastCookState(): FoodState | undefined {
    if (this.cookStates.length === 0) return undefined;
    return this.cookStates[this.cookStates.length - 1];
  }

  getProgress(): number {
    return this._progress;
  }

  setProgress(value: number) {
    this._progress = Math.max(0, Math.min(100, value));
  }

  showBar() {
    this.barBg.setVisible(true);
    this.bar.setVisible(true);
    this.bar.width = (this.getProgress() / 100) * 40;
  }

  hideBar() {
    this.barBg.setVisible(false);
    this.bar.setVisible(false);
  }

  update(_delta: number) {
    if (this.bar) {
      this.bar.x = this.x - 20;
      this.bar.y = this.y - 30;
    }
    if (this.barBg) {
      this.barBg.x = this.x;
      this.barBg.y = this.y - 30;
    }
  }

  destroy() {
    this.components.forEach(c => {
      if (c instanceof Ingredient) {
        c.destroy();
      } else if (c instanceof Food) {
        c.destroy();
      }
    });
    this.components = [];
    this.barBg?.destroy();
    this.bar?.destroy();
    super.destroy();
  }
}
