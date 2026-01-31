import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../../__mocks__/phaser";

vi.mock("../../config", () => ({
  DEPTH: { PLAYER: 10, ITEM: 20, STATION: 5 },
}));

import { Pot } from "./pot";
import { Ingredient } from "../ingredient/ingredient";

const createMockIngredient = (
  mockScene: any,
  type: string,
  cookStates: string[] = []
): Ingredient => {
  const ingredient = new Ingredient(mockScene as any, 0, 0, type, type);
  ingredient.cookStates = cookStates as any;
  return ingredient;
};

describe("Pot", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with empty status by default", () => {
      const pot = new Pot(mockScene as any, 100, 100);

      expect(pot.status).toBe("empty");
      expect(pot.isEmpty()).toBe(true);
    });

    it("should initialize with specified status", () => {
      const pot = new Pot(mockScene as any, 100, 100, "dirty");

      expect(pot.status).toBe("dirty");
    });

    it("should set position correctly", () => {
      const pot = new Pot(mockScene as any, 150, 200);

      expect(pot.x).toBe(150);
      expect(pot.y).toBe(200);
    });

    it("should have maxComponents set to 3", () => {
      const pot = new Pot(mockScene as any, 100, 100);

      for (let i = 0; i < 3; i++) {
        pot.addIngredient(createMockIngredient(mockScene, `item${i}`, ["cut"]));
      }
      expect(pot.isFull()).toBe(true);
    });
  });

  describe("canAddIngredient", () => {
    it("should accept cut ingredients", () => {
      const pot = new Pot(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(mockScene, "tomato", ["cut"]);

      expect(pot.canAddIngredient(ingredient)).toBe(true);
    });

    it("should accept boiled ingredients", () => {
      const pot = new Pot(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(mockScene, "rice", ["boil"]);

      expect(pot.canAddIngredient(ingredient)).toBe(true);
    });

    it("should reject unprocessed ingredients", () => {
      const pot = new Pot(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(mockScene, "tomato", []);

      expect(pot.canAddIngredient(ingredient)).toBe(false);
    });

    it("should reject ingredients with only pan-fry state", () => {
      const pot = new Pot(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(mockScene, "meat", ["pan-fry"]);

      expect(pot.canAddIngredient(ingredient)).toBe(false);
    });

    it("should accept ingredient with cut as last state", () => {
      const pot = new Pot(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(mockScene, "vegetable", ["boil", "cut"]);

      expect(pot.canAddIngredient(ingredient)).toBe(true);
    });
  });

  describe("addIngredient", () => {
    it("should add cut ingredient successfully", () => {
      const pot = new Pot(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(mockScene, "tomato", ["cut"]);

      const result = pot.addIngredient(ingredient);

      expect(result).toBe(true);
      expect(pot.isEmpty()).toBe(false);
    });

    it("should add boiled ingredient successfully", () => {
      const pot = new Pot(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(mockScene, "rice", ["boil"]);

      const result = pot.addIngredient(ingredient);

      expect(result).toBe(true);
      expect(pot.isEmpty()).toBe(false);
    });

    it("should reject when pot is full", () => {
      const pot = new Pot(mockScene as any, 100, 100);

      for (let i = 0; i < 3; i++) {
        pot.addIngredient(createMockIngredient(mockScene, `item${i}`, ["cut"]));
      }

      const extraIngredient = createMockIngredient(mockScene, "extra", ["cut"]);
      const result = pot.addIngredient(extraIngredient);

      expect(result).toBe(false);
    });

    it("should reject unprocessed ingredient", () => {
      const pot = new Pot(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(mockScene, "tomato", []);

      const result = pot.addIngredient(ingredient);

      expect(result).toBe(false);
    });
  });

  describe("setEmptyTexture", () => {
    it("should be callable (placeholder implementation)", () => {
      const pot = new Pot(mockScene as any, 100, 100);

      expect(() => pot.setEmptyTexture()).not.toThrow();
    });
  });
});
