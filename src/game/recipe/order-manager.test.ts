import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

class MockSprite {
  scene: any;
  x: number = 0;
  y: number = 0;
  constructor(scene: any, x: number, y: number, _texture: string) {
    this.scene = scene;
    this.x = x;
    this.y = y;
  }
  setDepth() { return this; }
  destroy() {}
}

const MockPhaser = {
  Physics: { Arcade: { Sprite: MockSprite, StaticGroup: class {} } },
  GameObjects: { Rectangle: class {} },
};

(globalThis as any).Phaser = MockPhaser;

vi.mock("phaser", () => ({
  default: MockPhaser,
  ...MockPhaser,
}));

vi.mock("../stations/station", () => ({
  Station: class MockStation {},
}));

vi.mock("../item/index", () => ({
  Item: class MockItem {
    scene: any;
    x: number;
    y: number;
    heldBy: any = null;
    isFlying: boolean = false;
    body: any = { enable: true };
    constructor(scene: any, x: number, y: number, _texture: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
    }
    update() {}
    destroy() {}
    getProgress() { return 0; }
    setProgress() {}
    setVelocity() {}
  },
}));

import { OrderManager } from "./order-manager";
import { Recipe, ingredientDef, foodDef } from "./types";

const createTestRecipe = (id: string, baseScore = 100): Recipe => ({
  id,
  category: "test",
  name: `Test Recipe ${id}`,
  displayName: `Test Recipe ${id}`,
  targetFood: foodDef([ingredientDef("tomato", ["cut"])], []),
  difficulty: 1,
  baseScore,
});

describe("OrderManager", () => {
  let orderManager: OrderManager;
  let originalDateNow: typeof Date.now;

  beforeEach(() => {
    orderManager = new OrderManager(4);
    originalDateNow = Date.now;
    vi.clearAllMocks();
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  describe("constructor", () => {
    it("should initialize with empty orders", () => {
      expect(orderManager.getOrders()).toHaveLength(0);
    });

    it("should respect custom max orders", () => {
      const customManager = new OrderManager(2);
      customManager.setRecipePool([createTestRecipe("1")]);

      customManager.generateOrder();
      customManager.generateOrder();
      const result = customManager.generateOrder();

      expect(result).toBeNull();
    });
  });

  describe("setRecipePool", () => {
    it("should set the recipe pool", () => {
      const recipes = [createTestRecipe("1"), createTestRecipe("2")];
      orderManager.setRecipePool(recipes);

      const order = orderManager.generateOrder();
      expect(order).not.toBeNull();
    });
  });

  describe("addRecipes", () => {
    it("should add recipes to existing pool", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      orderManager.addRecipes([createTestRecipe("2")]);

      const order1 = orderManager.generateOrder();
      const order2 = orderManager.generateOrder();

      expect(order1).not.toBeNull();
      expect(order2).not.toBeNull();
    });
  });

  describe("generateOrder", () => {
    it("should create order with unique id", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);

      const order1 = orderManager.generateOrder();
      const order2 = orderManager.generateOrder();

      expect(order1?.id).not.toBe(order2?.id);
    });

    it("should not exceed max orders limit", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);

      for (let i = 0; i < 4; i++) {
        orderManager.generateOrder();
      }

      const result = orderManager.generateOrder();
      expect(result).toBeNull();
    });

    it("should pick random recipe from pool when not specified", () => {
      const recipes = [createTestRecipe("1"), createTestRecipe("2")];
      orderManager.setRecipePool(recipes);

      const order = orderManager.generateOrder();
      expect(order).not.toBeNull();
      expect(recipes.map((r) => r.id)).toContain(order?.recipe.id);
    });

    it("should return null when recipe pool is empty", () => {
      const result = orderManager.generateOrder();
      expect(result).toBeNull();
    });

    it("should use specified recipe when provided", () => {
      const recipe = createTestRecipe("specific");
      orderManager.setRecipePool([createTestRecipe("other")]);

      const order = orderManager.generateOrder(recipe);
      expect(order?.recipe.id).toBe("specific");
    });

    it("should set order status to pending", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);

      const order = orderManager.generateOrder();
      expect(order?.status).toBe("pending");
    });

    it("should calculate time limit based on difficulty", () => {
      const easyRecipe = createTestRecipe("easy");
      easyRecipe.difficulty = 1;

      const hardRecipe = createTestRecipe("hard");
      hardRecipe.difficulty = 3;

      orderManager.setRecipePool([easyRecipe]);
      const easyOrder = orderManager.generateOrder(easyRecipe);

      orderManager.reset();
      orderManager.setRecipePool([hardRecipe]);
      const hardOrder = orderManager.generateOrder(hardRecipe);

      expect(hardOrder!.timeLimit).toBeGreaterThan(easyOrder!.timeLimit);
    });
  });

  describe("getOrders", () => {
    it("should return only pending orders", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      orderManager.completeOrder(order!.id);

      expect(orderManager.getOrders()).toHaveLength(0);
    });
  });

  describe("getAllOrders", () => {
    it("should return all orders including completed", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      orderManager.completeOrder(order!.id);

      expect(orderManager.getAllOrders()).toHaveLength(1);
    });
  });

  describe("completeOrder", () => {
    it("should mark order as completed", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      orderManager.completeOrder(order!.id);

      expect(orderManager.getOrder(order!.id)?.status).toBe("completed");
    });

    it("should calculate score with time bonus", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1", 100)]);
      const order = orderManager.generateOrder();

      Date.now = vi.fn().mockReturnValue(mockTime + 1000);
      const score = orderManager.completeOrder(order!.id);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeGreaterThanOrEqual(100);
    });

    it("should return 0 for non-existent order", () => {
      const score = orderManager.completeOrder("non-existent");
      expect(score).toBe(0);
    });

    it("should return 0 for already completed order", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      orderManager.completeOrder(order!.id);
      const secondScore = orderManager.completeOrder(order!.id);

      expect(secondScore).toBe(0);
    });
  });

  describe("update", () => {
    it("should expire orders past time limit", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      Date.now = vi.fn().mockReturnValue(mockTime + order!.timeLimit + 1000);
      const expired = orderManager.update();

      expect(expired).toHaveLength(1);
      expect(orderManager.getOrder(order!.id)?.status).toBe("expired");
    });

    it("should update tip multiplier based on remaining time", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();
      const initialTip = order!.tipMultiplier;

      Date.now = vi.fn().mockReturnValue(mockTime + order!.timeLimit / 2);
      orderManager.update();

      const updatedOrder = orderManager.getOrder(order!.id);
      expect(updatedOrder!.tipMultiplier).toBeLessThan(initialTip + 0.5);
    });

    it("should return list of newly expired orders", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1")]);
      const order1 = orderManager.generateOrder();
      orderManager.generateOrder();

      Date.now = vi.fn().mockReturnValue(mockTime + order1!.timeLimit + 1000);
      const expired = orderManager.update();

      expect(expired.length).toBeGreaterThanOrEqual(1);
    });

    it("should not expire already completed orders", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      orderManager.completeOrder(order!.id);

      Date.now = vi.fn().mockReturnValue(mockTime + order!.timeLimit + 1000);
      const expired = orderManager.update();

      expect(expired).toHaveLength(0);
    });
  });

  describe("getRemainingTime", () => {
    it("should return correct remaining time", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      Date.now = vi.fn().mockReturnValue(mockTime + 10000);
      const remaining = orderManager.getRemainingTime(order!.id);

      expect(remaining).toBe(order!.timeLimit - 10000);
    });

    it("should return 0 for completed orders", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      orderManager.completeOrder(order!.id);
      const remaining = orderManager.getRemainingTime(order!.id);

      expect(remaining).toBe(0);
    });

    it("should return 0 for non-existent order", () => {
      const remaining = orderManager.getRemainingTime("non-existent");
      expect(remaining).toBe(0);
    });

    it("should not return negative time", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      Date.now = vi.fn().mockReturnValue(mockTime + order!.timeLimit + 10000);
      const remaining = orderManager.getRemainingTime(order!.id);

      expect(remaining).toBe(0);
    });
  });

  describe("getRemainingTimeRatio", () => {
    it("should return ratio between 0 and 1", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      Date.now = vi.fn().mockReturnValue(mockTime + order!.timeLimit / 2);
      const ratio = orderManager.getRemainingTimeRatio(order!.id);

      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThan(1);
    });
  });

  describe("cancelOrder", () => {
    it("should cancel pending order", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      const result = orderManager.cancelOrder(order!.id);

      expect(result).toBe(true);
      expect(orderManager.getOrder(order!.id)?.status).toBe("failed");
    });

    it("should return false for non-existent order", () => {
      const result = orderManager.cancelOrder("non-existent");
      expect(result).toBe(false);
    });

    it("should return false for already completed order", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      orderManager.completeOrder(order!.id);
      const result = orderManager.cancelOrder(order!.id);

      expect(result).toBe(false);
    });
  });

  describe("clearOldOrders", () => {
    it("should remove old completed orders", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1")]);
      const order = orderManager.generateOrder();

      orderManager.completeOrder(order!.id);

      Date.now = vi.fn().mockReturnValue(mockTime + 20000);
      orderManager.clearOldOrders(10000);

      expect(orderManager.getAllOrders()).toHaveLength(0);
    });

    it("should keep pending orders", () => {
      const mockTime = 1000000;
      Date.now = vi.fn().mockReturnValue(mockTime);

      orderManager.setRecipePool([createTestRecipe("1")]);
      orderManager.generateOrder();

      Date.now = vi.fn().mockReturnValue(mockTime + 20000);
      orderManager.clearOldOrders(10000);

      expect(orderManager.getAllOrders()).toHaveLength(1);
    });
  });

  describe("reset", () => {
    it("should clear all orders", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      orderManager.generateOrder();
      orderManager.generateOrder();

      orderManager.reset();

      expect(orderManager.getAllOrders()).toHaveLength(0);
    });

    it("should reset order id counter", () => {
      orderManager.setRecipePool([createTestRecipe("1")]);
      orderManager.generateOrder();

      orderManager.reset();
      const newOrder = orderManager.generateOrder();

      expect(newOrder?.id).toBe("order-1");
    });
  });
});
