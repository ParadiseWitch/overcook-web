import Food from '../item/food';
import { FoodMatcher } from './food-matcher';
import { Order, Recipe } from './types';

/**
 * 订单管理器
 * 
 * 负责生成订单、验证交付、计算得分
 * 订单池中的菜谱可以动态配置，适应不同关卡的需求
 */
export class OrderManager {
  private orders: Order[] = [];
  private recipePool: Recipe[] = [];
  private maxOrders: number = 4;
  private orderIdCounter: number = 0;

  constructor(maxOrders: number = 4) {
    this.maxOrders = maxOrders;
  }

  setRecipePool(recipes: Recipe[]): void {
    this.recipePool = recipes;
  }

  addRecipes(recipes: Recipe[]): void {
    this.recipePool.push(...recipes);
  }

  // 获取当前待完成的订单
  getOrders(): Order[] {
    return this.orders.filter(o => o.status === 'pending');
  }

  getAllOrders(): Order[] {
    return [...this.orders];
  }

  /**
   * 生成新订单
   * 如果未指定菜谱，会从菜谱池中随机选择
   */
  generateOrder(recipe?: Recipe): Order | null {
    const pendingOrders = this.orders.filter(o => o.status === 'pending');
    if (pendingOrders.length >= this.maxOrders) {
      return null;
    }

    if (!recipe) {
      if (this.recipePool.length === 0) {
        return null;
      }
      const randomIndex = Math.floor(Math.random() * this.recipePool.length);
      recipe = this.recipePool[randomIndex];
    }

    const order: Order = {
      id: `order-${++this.orderIdCounter}`,
      recipe: recipe,
      createdAt: Date.now(),
      timeLimit: this.calculateTimeLimit(recipe),
      tipMultiplier: 1.0,
      status: 'pending'
    };

    this.orders.push(order);
    return order;
  }

  // 根据菜谱难度计算时间限制
  private calculateTimeLimit(recipe: Recipe): number {
    const baseTime = 60000;
    const difficultyMultiplier = 1 + (recipe.difficulty - 1) * 0.3;
    return Math.round(baseTime * difficultyMultiplier);
  }

  /**
   * 验证交付的食物
   * 遍历待完成订单，找到第一个匹配的订单返回
   */
  validateDelivery(submittedFood: Food): Order | null {
    const pendingOrders = this.orders.filter(o => o.status === 'pending');

    for (const order of pendingOrders) {
      if (FoodMatcher.matches(submittedFood, order.recipe.targetFood)) {
        return order;
      }
    }

    return null;
  }

  /**
   * 完成订单并计算得分
   * 得分 = 基础分 × 时间奖励倍率（最高1.5倍）
   */
  completeOrder(orderId: string): number {
    const order = this.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') {
      return 0;
    }

    order.status = 'completed';

    const elapsedTime = Date.now() - order.createdAt;
    const remainingTime = order.timeLimit - elapsedTime;
    const timeBonus = Math.max(0, remainingTime / order.timeLimit);

    const baseScore = order.recipe.baseScore;
    const tipMultiplier = 1 + timeBonus * 0.5;
    const finalScore = Math.round(baseScore * tipMultiplier);

    return finalScore;
  }

  /**
   * 更新订单状态
   * 检查超时订单并更新小费倍率
   * 返回本次更新中过期的订单列表
   */
  update(): Order[] {
    const now = Date.now();
    const expiredOrders: Order[] = [];

    for (const order of this.orders) {
      if (order.status !== 'pending') continue;

      const elapsed = now - order.createdAt;
      if (elapsed >= order.timeLimit) {
        order.status = 'expired';
        expiredOrders.push(order);
      } else {
        const remainingRatio = 1 - elapsed / order.timeLimit;
        order.tipMultiplier = 1 + remainingRatio * 0.5;
      }
    }

    return expiredOrders;
  }

  // 清理已完成/过期的旧订单
  clearOldOrders(maxAgeMs: number = 10000): void {
    const now = Date.now();
    this.orders = this.orders.filter(o => {
      if (o.status === 'pending') return true;
      return now - o.createdAt < maxAgeMs;
    });
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.find(o => o.id === orderId);
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'pending') {
      order.status = 'failed';
      return true;
    }
    return false;
  }

  getRemainingTime(orderId: string): number {
    const order = this.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') return 0;

    const elapsed = Date.now() - order.createdAt;
    return Math.max(0, order.timeLimit - elapsed);
  }

  // 获取剩余时间比例 (0-1)，用于UI显示
  getRemainingTimeRatio(orderId: string): number {
    const order = this.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'pending') return 0;

    const elapsed = Date.now() - order.createdAt;
    return Math.max(0, 1 - elapsed / order.timeLimit);
  }

  reset(): void {
    this.orders = [];
    this.orderIdCounter = 0;
  }
}

// 全局订单管理器实例
export const orderManager = new OrderManager();
