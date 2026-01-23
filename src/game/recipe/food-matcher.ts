import Food, { FoodComponent } from '../item/food';
import { FoodState, Ingredient } from '../item/ingredient/ingredient';
import { FoodDef, IngredientDef, isFoodDef, isIngredientDef } from './types';

/**
 * 食物匹配器
 * 
 * 用于验证玩家提交的食物是否符合订单要求
 * 核心思路：将玩家的 Food 与菜谱的 FoodDef 进行结构比较
 */
export class FoodMatcher {
  /**
   * 比较提交的食物是否匹配目标菜谱
   * 烹饪状态必须有序匹配，组件可以无序匹配
   */
  static matches(submitted: Food, target: FoodDef): boolean {
    if (!this.cookStatesEqual(submitted.cookStates, target.cookStates)) {
      return false;
    }

    if (submitted.components.length !== target.components.length) {
      return false;
    }

    return this.componentsMatch(submitted.components, target.components);
  }

  // 比较烹饪状态链（必须有序一致）
  static cookStatesEqual(a: FoodState[], b: FoodState[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((state, i) => state === b[i]);
  }

  /**
   * 比较组件是否匹配（无序匹配）
   * 使用贪婪算法确保每个目标组件都能找到对应的提交组件
   */
  static componentsMatch(
    submitted: FoodComponent[],
    target: (FoodDef | IngredientDef)[]
  ): boolean {
    const used = new Set<number>();

    for (const targetComp of target) {
      let found = false;

      for (let i = 0; i < submitted.length; i++) {
        if (used.has(i)) continue;

        if (this.componentEquals(submitted[i], targetComp)) {
          used.add(i);
          found = true;
          break;
        }
      }

      if (!found) return false;
    }

    return true;
  }

  // 比较单个组件是否匹配
  static componentEquals(
    submitted: FoodComponent,
    target: FoodDef | IngredientDef
  ): boolean {
    if (isIngredientDef(target)) {
      if (!(submitted instanceof Ingredient)) {
        return false;
      }
      return this.ingredientMatches(submitted, target);
    }

    if (isFoodDef(target)) {
      if (!(submitted instanceof Food)) {
        return false;
      }
      return this.matches(submitted, target);
    }

    return false;
  }

  // 比较食材是否匹配
  static ingredientMatches(submitted: Ingredient, target: IngredientDef): boolean {
    if (submitted.ingredientType !== target.type) {
      return false;
    }
    return this.cookStatesEqual(submitted.cookStates, target.cookStates);
  }

  // 检查食物中是否包含指定类型的食材
  static hasIngredientType(food: Food, ingredientType: string): boolean {
    return food.flatten().some(ing => ing.ingredientType === ingredientType);
  }

  // 获取食物中所有食材的类型列表
  static getIngredientTypes(food: Food): string[] {
    return food.flatten().map(ing => ing.ingredientType);
  }

  /**
   * 计算相似度得分 (0-100)
   * 用于部分匹配反馈，帮助玩家了解还差什么
   */
  static calculateSimilarity(submitted: Food, target: FoodDef): number {
    let score = 0;
    let maxScore = 0;

    // 烹饪状态权重 30%
    const cookStateWeight = 30;
    maxScore += cookStateWeight;
    if (this.cookStatesEqual(submitted.cookStates, target.cookStates)) {
      score += cookStateWeight;
    } else {
      const matchingStates = submitted.cookStates.filter(
        (s, i) => target.cookStates[i] === s
      ).length;
      const totalStates = Math.max(submitted.cookStates.length, target.cookStates.length);
      if (totalStates > 0) {
        score += (matchingStates / totalStates) * cookStateWeight;
      }
    }

    // 组件权重 70%
    const componentWeight = 70;
    maxScore += componentWeight;

    const submittedTypes = this.getIngredientTypes(submitted);
    const targetTypes = this.getTargetIngredientTypes(target);

    if (targetTypes.length > 0) {
      const matchingTypes = submittedTypes.filter(t => targetTypes.includes(t)).length;
      const accuracy = matchingTypes / targetTypes.length;
      score += accuracy * componentWeight;
    }

    return Math.round((score / maxScore) * 100);
  }

  // 从 FoodDef 中提取所有食材类型
  private static getTargetIngredientTypes(target: FoodDef): string[] {
    const types: string[] = [];

    for (const comp of target.components) {
      if (isIngredientDef(comp)) {
        types.push(comp.type);
      } else if (isFoodDef(comp)) {
        types.push(...this.getTargetIngredientTypes(comp));
      }
    }

    return types;
  }
}
