import { describe, it, expect, vi, beforeEach } from "vitest";

class MockSprite {
  scene: any;
  x: number = 0;
  y: number = 0;
  depth: number = 0;
  constructor(scene: any, x: number, y: number, _texture: string) {
    this.scene = scene;
    this.x = x;
    this.y = y;
  }
  setDepth(d: number) { this.depth = d; return this; }
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

vi.mock("./index", () => ({
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

import Food from "./food";
import { Ingredient } from "./ingredient/ingredient";

const createMockScene = () => ({
  add: {
    rectangle: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      x: 0,
      y: 0,
      width: 0,
    }),
    existing: vi.fn(),
  },
  physics: {
    add: {
      existing: vi.fn(),
    },
  },
});

const createMockIngredient = (type: string): Ingredient => {
  const scene = createMockScene();
  const ingredient = new Ingredient(scene as any, 0, 0, type, type);
  return ingredient;
};

describe("Food", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with empty components and cook states", () => {
      const food = new Food(mockScene as any, 100, 100, "food");

      expect(food.components).toHaveLength(0);
      expect(food.cookStates).toHaveLength(0);
      expect(food.isCooking).toBe(false);
    });

    it("should set position correctly", () => {
      const food = new Food(mockScene as any, 150, 200, "food");

      expect(food.x).toBe(150);
      expect(food.y).toBe(200);
    });
  });

  describe("components management", () => {
    it("should add component and update position", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const ingredient = createMockIngredient("tomato");

      food.add(ingredient);

      expect(food.components).toContain(ingredient);
      expect(food.size()).toBe(1);
    });

    it("should unlink ingredient from player when added", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const ingredient = createMockIngredient("tomato");
      const mockPlayer = { heldItem: ingredient };
      ingredient.heldBy = mockPlayer as any;

      food.add(ingredient);

      expect(ingredient.heldBy).toBeNull();
      expect(mockPlayer.heldItem).toBeNull();
    });

    it("should return correct size", () => {
      const food = new Food(mockScene as any, 100, 100, "food");

      expect(food.size()).toBe(0);
      expect(food.isEmpty()).toBe(true);

      food.add(createMockIngredient("tomato"));
      expect(food.size()).toBe(1);
      expect(food.isEmpty()).toBe(false);

      food.add(createMockIngredient("onion"));
      expect(food.size()).toBe(2);
    });

    it("should flatten nested Food structures", () => {
      const outerFood = new Food(mockScene as any, 100, 100, "food");
      const innerFood = new Food(mockScene as any, 100, 100, "food");

      const tomato = createMockIngredient("tomato");
      const onion = createMockIngredient("onion");

      innerFood.add(tomato);
      outerFood.add(innerFood);
      outerFood.add(onion);

      const flattened = outerFood.flatten();

      expect(flattened).toHaveLength(2);
      expect(flattened).toContain(tomato);
      expect(flattened).toContain(onion);
    });

    it("should return last component", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const tomato = createMockIngredient("tomato");
      const onion = createMockIngredient("onion");

      food.add(tomato);
      food.add(onion);

      expect(food.last()).toBe(onion);
    });

    it("should check if component exists", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const tomato = createMockIngredient("tomato");
      const onion = createMockIngredient("onion");

      food.add(tomato);

      expect(food.has(tomato)).toBe(true);
      expect(food.has(onion)).toBe(false);
    });

    it("should check nested ingredient existence", () => {
      const outerFood = new Food(mockScene as any, 100, 100, "food");
      const innerFood = new Food(mockScene as any, 100, 100, "food");
      const tomato = createMockIngredient("tomato");

      innerFood.add(tomato);
      outerFood.add(innerFood);

      expect(outerFood.hasIngredient(tomato)).toBe(true);
    });
  });

  describe("cook states", () => {
    it("should add cook state and reset progress", () => {
      const food = new Food(mockScene as any, 100, 100, "food");

      food.setProgress(50);
      food.addCookState("cut");

      expect(food.cookStates).toContain("cut");
      expect(food.getProgress()).toBe(0);
    });

    it("should check if cook state exists", () => {
      const food = new Food(mockScene as any, 100, 100, "food");

      food.addCookState("cut");
      food.addCookState("boil");

      expect(food.hasCookState("cut")).toBe(true);
      expect(food.hasCookState("boil")).toBe(true);
      expect(food.hasCookState("stir-fry")).toBe(false);
    });

    it("should return last cook state", () => {
      const food = new Food(mockScene as any, 100, 100, "food");

      expect(food.lastCookState()).toBeUndefined();

      food.addCookState("cut");
      expect(food.lastCookState()).toBe("cut");

      food.addCookState("boil");
      expect(food.lastCookState()).toBe("boil");
    });
  });

  describe("progress", () => {
    it("should clamp progress between 0 and 100", () => {
      const food = new Food(mockScene as any, 100, 100, "food");

      food.setProgress(-10);
      expect(food.getProgress()).toBe(0);

      food.setProgress(150);
      expect(food.getProgress()).toBe(100);

      food.setProgress(50);
      expect(food.getProgress()).toBe(50);
    });

    it("should initialize with 0 progress", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      expect(food.getProgress()).toBe(0);
    });
  });

  describe("topping system", () => {
    it("should identify base ingredient", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const bun = createMockIngredient("bun");
      bun.canBeBase = true;

      food.add(bun);

      expect(food.getBaseIngredient()).toBe(bun);
    });

    it("should return null when no base ingredient", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const tomato = createMockIngredient("tomato");

      food.add(tomato);

      expect(food.getBaseIngredient()).toBeNull();
    });

    it("should validate topping acceptance", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const bun = createMockIngredient("bun");
      bun.canBeBase = true;
      bun.acceptedToppings = ["meat", "cheese"];

      food.add(bun);

      const meat = createMockIngredient("meat");
      const lettuce = createMockIngredient("lettuce");

      expect(food.canAddTopping(meat)).toBe(true);
      expect(food.canAddTopping(lettuce)).toBe(false);
    });

    it("should enforce max toppings limit", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const bun = createMockIngredient("bun");
      bun.canBeBase = true;
      bun.maxToppings = 2;

      food.add(bun);
      food.add(createMockIngredient("meat"));
      food.add(createMockIngredient("cheese"));

      const lettuce = createMockIngredient("lettuce");
      expect(food.canAddTopping(lettuce)).toBe(false);
    });

    it("should return false when no base for topping", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const tomato = createMockIngredient("tomato");

      expect(food.canAddTopping(tomato)).toBe(false);
    });
  });

  describe("setXy", () => {
    it("should update position of all components", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const tomato = createMockIngredient("tomato");

      food.add(tomato);
      food.setXy(200, 200);

      expect(tomato.x).toBe(200);
      expect(tomato.y).toBe(200);
    });
  });

  describe("destroy", () => {
    it("should destroy all components", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const tomato = createMockIngredient("tomato");
      const destroySpy = vi.spyOn(tomato, "destroy");

      food.add(tomato);
      food.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(food.components).toHaveLength(0);
    });
  });

  describe("ingredients getter (deprecated)", () => {
    it("should return only Ingredient components", () => {
      const food = new Food(mockScene as any, 100, 100, "food");
      const tomato = createMockIngredient("tomato");
      const innerFood = new Food(mockScene as any, 0, 0, "inner");

      food.add(tomato);
      food.add(innerFood);

      const ingredients = food.ingredients;

      expect(ingredients).toHaveLength(1);
      expect(ingredients[0]).toBe(tomato);
    });
  });
});
