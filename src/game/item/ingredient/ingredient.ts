import { Item } from "..";
import { removeItem } from "../../manager/item-manager";

// 单食材烹饪状态：只能对单个食材进行处理
export type SingleCookState = "cut" | "boil" | "deep-fry";

// 多食物烹饪状态：可以对多个食材或加工后的食物一起处理
export type MultiCookState =
  | "stir-fry"
  | "barbecue"
  | "mix"
  | "bake"
  | "steam"
  | "pan-fry";

// 所有烹饪状态的联合类型
export type CookState = SingleCookState | MultiCookState;

// 特殊状态：过度烹饪会导致食物变质
export type SpecialState = "overcook" | "burnt";

// 食物状态：包含正常烹饪状态和特殊状态
export type FoodState = CookState | SpecialState;

// 基底食材配置：如汉堡面包、卷饼等可以直接组合配料的食材
export interface BaseIngredientConfig {
  canBeBase: boolean;
  acceptedToppings?: string[];
  maxToppings?: number;
}

export class Ingredient extends Item {
  // 食材类型标识，用于菜谱匹配
  public readonly ingredientType: string;
  // 烹饪状态链，记录食材经历的所有烹饪步骤（有序）
  public cookStates: FoodState[];
  private _progress: number = 0;

  // 基底食材属性：用于汉堡、披萨等需要在食材上直接叠加配料的场景
  public canBeBase: boolean = false;
  public acceptedToppings?: string[];
  public maxToppings?: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    ingredientType?: string,
    baseConfig?: BaseIngredientConfig,
  ) {
    super(scene, x, y, texture);
    this.ingredientType = ingredientType ?? texture;
    this.cookStates = [];

    if (baseConfig) {
      this.canBeBase = baseConfig.canBeBase;
      this.acceptedToppings = baseConfig.acceptedToppings;
      this.maxToppings = baseConfig.maxToppings;
    }
  }

  getProgress(): number {
    return this._progress;
  }

  setProgress(value: number): void {
    this._progress = value;
  }

  addCookstate(cookState: FoodState) {
    this.setProgress(0);
    if (cookState == "overcook") {
      this.setTexture("overcooke");
    }
    this.cookStates.push(cookState);
  }

  lastCookState(): FoodState | undefined {
    const len = this.cookStates.length;
    if (len === 0) return undefined;
    return this.cookStates[len - 1];
  }

  hasCookState(state: FoodState): boolean {
    return this.cookStates.includes(state);
  }

  destroy(fromScene?: boolean): void {
    // 从 ALL_ITEMS 中移除
    removeItem(this);
    super.destroy(fromScene);
  }
}
