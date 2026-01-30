import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10 },
}));

import { DeliveryStation } from "./delivery-station";
import { Plate } from "../item/container/plate";
import { Ingredient } from "../item/ingredient/ingredient";

const createMockPlate = (
  mockScene: any,
  isEmpty = true,
  thrower: any = null
) => {
  const plate = new Plate(mockScene, 0, 0);
  vi.spyOn(plate, "isEmpty").mockReturnValue(isEmpty);
  plate.thrower = thrower;
  return plate;
};

describe("DeliveryStation", () => {
  let mockScene: ReturnType<typeof createMockScene> & {
    tweens: { add: any };
    children: { getByName: any };
  };

  beforeEach(() => {
    mockScene = {
      ...createMockScene(),
      tweens: { add: vi.fn() },
      children: { getByName: vi.fn().mockReturnValue(null) },
    } as any;
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct texture", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);

      expect(station.textureKey).toBe("station_delivery");
    });

    it("should initialize with score 0", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);

      expect(station.score).toBe(0);
    });
  });

  describe("canPlace", () => {
    it("should return false for non-plate item", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const mockItem = {} as any;

      expect(station.canPlace(mockItem)).toBe(false);
    });

    it("should return false for empty plate", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const plate = createMockPlate(mockScene, true);

      expect(station.canPlace(plate)).toBe(false);
    });

    it("should return false for plate without thrower", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const plate = createMockPlate(mockScene, false, null);

      expect(station.canPlace(plate)).toBe(false);
    });

    it("should return true for non-empty plate with thrower", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const plate = createMockPlate(mockScene, false, { name: "player" });

      expect(station.canPlace(plate)).toBe(true);
    });
  });

  describe("placeItem", () => {
    it("should call deliver for plate", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const plate = createMockPlate(mockScene, false, { name: "player" });
      vi.spyOn(station, "deliver").mockImplementation(() => {});

      station.placeItem(plate);

      expect(station.deliver).toHaveBeenCalledWith(plate);
    });
  });

  describe("deliver", () => {
    it("should decrease score for invalid dish", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const plate = createMockPlate(mockScene, false);
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      ingredient.addCookstate("cut");
      plate.addIngredient(ingredient);
      vi.spyOn(plate, "clear").mockImplementation(() => {});
      vi.spyOn(plate, "destroy").mockImplementation(() => {});

      station.deliver(plate);

      expect(station.score).toBe(-60);
    });

    it("should increase score for valid dish", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const plate = createMockPlate(mockScene, false);
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      ingredient.addCookstate("cut");
      plate.addIngredient(ingredient);
      ingredient.addCookstate("stir-fry");
      vi.spyOn(plate, "clear").mockImplementation(() => {});
      vi.spyOn(plate, "destroy").mockImplementation(() => {});

      station.deliver(plate);

      expect(station.score).toBe(100);
    });

    it("should clear and destroy plate", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const plate = createMockPlate(mockScene, false);
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      ingredient.addCookstate("cut");
      plate.addIngredient(ingredient);
      const clearSpy = vi.spyOn(plate, "clear").mockImplementation(() => {});
      const destroySpy = vi.spyOn(plate, "destroy").mockImplementation(() => {});

      station.deliver(plate);

      expect(clearSpy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
    });

    it("should set station item to null after delivery", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const plate = createMockPlate(mockScene, false);
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      ingredient.addCookstate("cut");
      plate.addIngredient(ingredient);
      vi.spyOn(plate, "clear").mockImplementation(() => {});
      vi.spyOn(plate, "destroy").mockImplementation(() => {});

      station.deliver(plate);

      expect(station.item).toBeNull();
    });

    it("should show tip text animation", () => {
      const station = new DeliveryStation(mockScene as any, 100, 100);
      const plate = createMockPlate(mockScene, false);
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      ingredient.addCookstate("cut");
      plate.addIngredient(ingredient);
      vi.spyOn(plate, "clear").mockImplementation(() => {});
      vi.spyOn(plate, "destroy").mockImplementation(() => {});

      station.deliver(plate);

      expect(mockScene.tweens.add).toHaveBeenCalled();
    });
  });
});