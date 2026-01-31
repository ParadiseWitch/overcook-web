import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10 },
}));

import { CutStation } from "./cut-station";
import { Ingredient } from "../item/ingredient/ingredient";

const createMockIngredient = (cookStates: string[] = []) => {
  const mockScene = createMockScene();
  const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
  ingredient.cookStates = cookStates as any;
  return ingredient;
};

describe("CutStation", () => {
  let mockScene: ReturnType<typeof createMockScene> & { tweens: { add: any } };

  beforeEach(() => {
    mockScene = {
      ...createMockScene(),
      tweens: { add: vi.fn() },
    } as any;
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct texture", () => {
      const station = new CutStation(mockScene as any, 100, 100);

      expect(station.textureKey).toBe("station_cut");
    });

    it("should set work speed to 0.15", () => {
      const station = new CutStation(mockScene as any, 100, 100);

      expect(station.workSpeed).toBe(0.15);
    });
  });

  describe("work", () => {
    it("should start working when item is unprocessed ingredient", () => {
      const station = new CutStation(mockScene as any, 100, 100);
      const ingredient = createMockIngredient([]);
      station.item = ingredient as any;

      station.work();

      expect(station.workStatus).toBe("working");
    });

    it("should not work when no item", () => {
      const station = new CutStation(mockScene as any, 100, 100);

      station.work();

      expect(station.workStatus).toBe("idle");
    });

    it("should not work when ingredient already has cook state", () => {
      const station = new CutStation(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(["cut"]);
      station.item = ingredient as any;

      station.work();

      expect(station.workStatus).toBe("idle");
    });
  });

  describe("updateWhenWorking", () => {
    it("should set canPick to false", () => {
      const station = new CutStation(mockScene as any, 100, 100);
      const ingredient = createMockIngredient([]);
      station.item = ingredient as any;
      station.workStatus = "working";

      station.updateWhenWorking(16);

      expect(station.canPick).toBe(false);
    });

    it("should transition to idle when no item", () => {
      const station = new CutStation(mockScene as any, 100, 100);
      station.workStatus = "working";

      station.updateWhenWorking(16);

      expect(station.workStatus).toBe("idle");
    });
  });

  describe("updateWhenDone", () => {
    it("should add cut state to ingredient", () => {
      const station = new CutStation(mockScene as any, 100, 100);
      const ingredient = createMockIngredient([]);
      station.item = ingredient as any;
      station.workStatus = "done";

      station.updateWhenDone();

      expect(ingredient.cookStates).toContain("cut");
    });

    it("should set canPick to true", () => {
      const station = new CutStation(mockScene as any, 100, 100);
      const ingredient = createMockIngredient([]);
      station.item = ingredient as any;
      station.canPick = false;

      station.updateWhenDone();

      expect(station.canPick).toBe(true);
    });

    it("should reset item position", () => {
      const station = new CutStation(mockScene as any, 150, 200);
      const ingredient = createMockIngredient([]);
      ingredient.x = 0;
      ingredient.y = 0;
      station.item = ingredient as any;

      station.updateWhenDone();

      expect(ingredient.x).toBe(150);
      expect(ingredient.y).toBe(200);
    });

    it("should transition to idle", () => {
      const station = new CutStation(mockScene as any, 100, 100);
      const ingredient = createMockIngredient([]);
      station.item = ingredient as any;
      station.workStatus = "done";

      station.updateWhenDone();

      expect(station.workStatus).toBe("idle");
    });

    it("should not process already cut ingredient", () => {
      const station = new CutStation(mockScene as any, 100, 100);
      const ingredient = createMockIngredient(["cut"]);
      station.item = ingredient as any;

      station.updateWhenDone();

      expect(ingredient.cookStates.filter((s: string) => s === "cut").length).toBe(1);
    });

    it("should transition to idle when no item", () => {
      const station = new CutStation(mockScene as any, 100, 100);
      station.workStatus = "done";

      station.updateWhenDone();

      expect(station.workStatus).toBe("idle");
    });
  });
});