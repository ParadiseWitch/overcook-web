import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10, PLAYER: 15 },
}));

vi.mock("../manager/item-manager", () => ({
  ALL_ITEMS: [],
}));

import { IngredientStation } from "./ingredient-station";
import { Ingredient } from "../item/ingredient/ingredient";

class TestIngredient extends Ingredient {
  constructor(scene: any, x: number, y: number) {
    super(scene, x, y, "test_ingredient", "test");
  }
}

describe("IngredientStation", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const station = new IngredientStation(
        mockScene as any,
        100,
        100,
        TestIngredient
      );

      expect(station.textureKey).toBe("station_crate");
    });

    it("should initialize with custom texture", () => {
      const station = new IngredientStation(
        mockScene as any,
        100,
        100,
        TestIngredient,
        "custom_crate"
      );

      expect(station.textureKey).toBe("custom_crate");
    });

    it("should store ingredient type", () => {
      const station = new IngredientStation(
        mockScene as any,
        100,
        100,
        TestIngredient
      );

      expect(station.ingredientType).toBe(TestIngredient);
    });
  });

  describe("genIngredientForPlayer", () => {
    it("should create ingredient of correct type", () => {
      const station = new IngredientStation(
        mockScene as any,
        100,
        100,
        TestIngredient
      );
      const mockPlayer = {
        pick: vi.fn(),
      } as any;

      const result = station.genIngredientForPlayer(mockPlayer);

      expect(result).toBeInstanceOf(TestIngredient);
    });

    it("should call player pick with new ingredient", () => {
      const station = new IngredientStation(
        mockScene as any,
        100,
        100,
        TestIngredient
      );
      const mockPlayer = {
        pick: vi.fn(),
      } as any;

      const result = station.genIngredientForPlayer(mockPlayer);

      expect(mockPlayer.pick).toHaveBeenCalledWith(result);
    });

    it("should create ingredient at station position", () => {
      const station = new IngredientStation(
        mockScene as any,
        150,
        200,
        TestIngredient
      );
      const mockPlayer = {
        pick: vi.fn(),
      } as any;

      const result = station.genIngredientForPlayer(mockPlayer);

      expect(result.x).toBe(150);
      expect(result.y).toBe(200);
    });
  });
});
