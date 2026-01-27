import { FoodState } from "../item/ingredient/ingredient";

/**
 * 食材定义：用于菜谱匹配的简化结构
 */
export interface IngredientDef {
  type: string; // 食材类型标识
  cookStates: FoodState[]; // 需要的烹饪状态
}

/**
 * 食物定义：用于菜谱匹配的结构
 * 支持嵌套以表达复杂菜品（如清蛋糕需要先搅拌再煎烤）
 */
export interface FoodDef {
  components: (FoodDef | IngredientDef)[]; // 组成成分
  cookStates: FoodState[]; // 整体的烹饪状态
}

/**
 * 菜谱定义
 * 使用 FoodDef 结构定义目标菜品，验证时比较玩家提交的食物是否匹配
 */
export interface Recipe {
  id: string; // 菜谱唯一ID
  category: string; // 分类：salad、soup、cake 等
  name: string; // 菜谱名称
  displayName: string; // 显示名称
  targetFood: FoodDef; // 目标食物结构
  difficulty: number; // 难度等级 1-5
  baseScore: number; // 基础得分
  texture?: string; // 用于UI显示的纹理
}

// 订单状态
export type OrderStatus = "pending" | "completed" | "expired" | "failed";

/**
 * 订单定义
 * 代表顾客的需求，玩家需要在时限内完成
 */
export interface Order {
  id: string;
  recipe: Recipe;
  createdAt: number; // 创建时间戳
  timeLimit: number; // 时间限制（毫秒）
  tipMultiplier: number; // 小费倍率（根据剩余时间动态计算）
  status: OrderStatus;
}

// 辅助函数：创建食材定义
export function ingredientDef(
  type: string,
  cookStates: FoodState[] = [],
): IngredientDef {
  return { type, cookStates };
}

// 辅助函数：创建食物定义
export function foodDef(
  components: (FoodDef | IngredientDef)[],
  cookStates: FoodState[] = [],
): FoodDef {
  return { components, cookStates };
}

// 类型守卫：判断是否为食材定义
export function isIngredientDef(
  def: FoodDef | IngredientDef,
): def is IngredientDef {
  return "type" in def && !("components" in def);
}

// 类型守卫：判断是否为食物定义
export function isFoodDef(def: FoodDef | IngredientDef): def is FoodDef {
  return "components" in def;
}
