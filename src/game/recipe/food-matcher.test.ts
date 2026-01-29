import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { FoodMatcher } from "./food-matcher";
import { FoodDef, IngredientDef, ingredientDef, foodDef } from "./types";
import { FoodState, Ingredient } from "../item/ingredient/ingredient";
import Food from "../item/food";

const createMockScene = () => ({
  add: {
    rectangle: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    }),
    existing: vi.fn(),
  },
  physics: {
    add: {
      existing: vi.fn(),
    },
  },
});

const createMockIngredient = (
  type: string,
  cookStates: FoodState[] = []
): Ingredient => {
  const scene = createMockScene();
  const ingredient = new Ingredient(scene as any, 0, 0, type, type);
  ingredient.cookStates = [...cookStates];
  return ingredient;
};

const createMockFood = (
  components: (Food | Ingredient)[],
  cookStates: FoodState[] = []
): Food => {
  const scene = createMockScene();
  const food = new Food(scene as any, 0, 0, "food");
  food.components = components;
  food.cookStates = cookStates;
  return food;
};

describe("FoodMatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("matches", () => {
    it("should match when cook states and components are identical", () => {
      const tomato = createMockIngredient("tomato", ["cut"]);
      const food = createMockFood([tomato], []);
      const target: FoodDef = foodDef([ingredientDef("tomato", ["cut"])], []);

      expect(FoodMatcher.matches(food, target)).toBe(true);
    });

    it("should return false when cook states differ", () => {
      const tomato = createMockIngredient("tomato", ["cut"]);
      const food = createMockFood([tomato], ["stir-fry"]);
      const target: FoodDef = foodDef([ingredientDef("tomato", ["cut"])], ["boil"]);

      expect(FoodMatcher.matches(food, target)).toBe(false);
    });

    it("should return false when component count differs", () => {
      const tomato = createMockIngredient("tomato", ["cut"]);
      const onion = createMockIngredient("onion", ["cut"]);
      const food = createMockFood([tomato, onion], []);
      const target: FoodDef = foodDef([ingredientDef("tomato", ["cut"])], []);

      expect(FoodMatcher.matches(food, target)).toBe(false);
    });

    it("should match components regardless of order", () => {
      const tomato = createMockIngredient("tomato", ["cut"]);
      const onion = createMockIngredient("onion", ["cut"]);
      const food = createMockFood([onion, tomato], []);
      const target: FoodDef = foodDef(
        [ingredientDef("tomato", ["cut"]), ingredientDef("onion", ["cut"])],
        []
      );

      expect(FoodMatcher.matches(food, target)).toBe(true);
    });
  });

  describe("cookStatesEqual", () => {
    it("should return true for identical cook state arrays", () => {
      const a: FoodState[] = ["cut", "boil"];
      const b: FoodState[] = ["cut", "boil"];

      expect(FoodMatcher.cookStatesEqual(a, b)).toBe(true);
    });

    it("should return false for different lengths", () => {
      const a: FoodState[] = ["cut"];
      const b: FoodState[] = ["cut", "boil"];

      expect(FoodMatcher.cookStatesEqual(a, b)).toBe(false);
    });

    it("should return false for different states at same positions", () => {
      const a: FoodState[] = ["cut", "boil"];
      const b: FoodState[] = ["cut", "stir-fry"];

      expect(FoodMatcher.cookStatesEqual(a, b)).toBe(false);
    });

    it("should return true for empty arrays", () => {
      expect(FoodMatcher.cookStatesEqual([], [])).toBe(true);
    });
  });

  describe("componentsMatch", () => {
    it("should match ingredients by type and cook states", () => {
      const tomato = createMockIngredient("tomato", ["cut"]);
      const target: IngredientDef[] = [ingredientDef("tomato", ["cut"])];

      expect(FoodMatcher.componentsMatch([tomato], target)).toBe(true);
    });

    it("should match nested Food components recursively", () => {
      const innerTomato = createMockIngredient("tomato", ["cut"]);
      const innerFood = createMockFood([innerTomato], ["boil"]);
      const outerFood = createMockFood([innerFood], []);

      const innerTarget: FoodDef = foodDef([ingredientDef("tomato", ["cut"])], ["boil"]);
      const outerTarget: FoodDef = foodDef([innerTarget], []);

      expect(FoodMatcher.matches(outerFood, outerTarget)).toBe(true);
    });

    it("should use greedy matching for unordered components", () => {
      const tomato = createMockIngredient("tomato", []);
      const onion = createMockIngredient("onion", []);
      const carrot = createMockIngredient("carrot", []);

      const submitted = [carrot, tomato, onion];
      const target = [
        ingredientDef("tomato", []),
        ingredientDef("onion", []),
        ingredientDef("carrot", []),
      ];

      expect(FoodMatcher.componentsMatch(submitted, target)).toBe(true);
    });

    it("should fail when a target component has no match", () => {
      const tomato = createMockIngredient("tomato", []);
      const target = [ingredientDef("onion", [])];

      expect(FoodMatcher.componentsMatch([tomato], target)).toBe(false);
    });
  });

  describe("ingredientMatches", () => {
    it("should match when type and cook states are equal", () => {
      const ingredient = createMockIngredient("tomato", ["cut", "boil"]);
      const target: IngredientDef = ingredientDef("tomato", ["cut", "boil"]);

      expect(FoodMatcher.ingredientMatches(ingredient, target)).toBe(true);
    });

    it("should fail when ingredient type differs", () => {
      const ingredient = createMockIngredient("tomato", ["cut"]);
      const target: IngredientDef = ingredientDef("onion", ["cut"]);

      expect(FoodMatcher.ingredientMatches(ingredient, target)).toBe(false);
    });

    it("should fail when cook states differ", () => {
      const ingredient = createMockIngredient("tomato", ["cut"]);
      const target: IngredientDef = ingredientDef("tomato", ["boil"]);

      expect(FoodMatcher.ingredientMatches(ingredient, target)).toBe(false);
    });
  });

  describe("hasIngredientType", () => {
    it("should return true if food contains the ingredient type", () => {
      const tomato = createMockIngredient("tomato", []);
      const food = createMockFood([tomato], []);

      expect(FoodMatcher.hasIngredientType(food, "tomato")).toBe(true);
    });

    it("should return false if food does not contain the ingredient type", () => {
      const tomato = createMockIngredient("tomato", []);
      const food = createMockFood([tomato], []);

      expect(FoodMatcher.hasIngredientType(food, "onion")).toBe(false);
    });
  });

  describe("getIngredientTypes", () => {
    it("should return all ingredient types in the food", () => {
      const tomato = createMockIngredient("tomato", []);
      const onion = createMockIngredient("onion", []);
      const food = createMockFood([tomato, onion], []);

      const types = FoodMatcher.getIngredientTypes(food);
      expect(types).toContain("tomato");
      expect(types).toContain("onion");
      expect(types.length).toBe(2);
    });
  });

  describe("calculateSimilarity", () => {
    it("should return 100 for perfect match", () => {
      const tomato = createMockIngredient("tomato", ["cut"]);
      const food = createMockFood([tomato], []);
      const target: FoodDef = foodDef([ingredientDef("tomato", ["cut"])], []);

      expect(FoodMatcher.calculateSimilarity(food, target)).toBe(100);
    });

    it("should return partial score for partial cook state match", () => {
      const tomato = createMockIngredient("tomato", []);
      const food = createMockFood([tomato], ["cut"]);
      const target: FoodDef = foodDef([ingredientDef("tomato", [])], ["cut", "boil"]);

      const similarity = FoodMatcher.calculateSimilarity(food, target);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(100);
    });

    it("should weight cook states at 30% and components at 70%", () => {
      const tomato = createMockIngredient("tomato", []);
      const food = createMockFood([tomato], []);
      const target: FoodDef = foodDef([ingredientDef("tomato", [])], ["cut"]);

      const similarity = FoodMatcher.calculateSimilarity(food, target);
      expect(similarity).toBe(70);
    });

    it("should return 0 when nothing matches", () => {
      const tomato = createMockIngredient("tomato", []);
      const food = createMockFood([tomato], ["cut"]);
      const target: FoodDef = foodDef([ingredientDef("onion", [])], ["boil"]);

      const similarity = FoodMatcher.calculateSimilarity(food, target);
      expect(similarity).toBeLessThan(30);
    });
  });
});
