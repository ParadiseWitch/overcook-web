import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10 },
}));

vi.mock("../helper/fire-helper", () => ({
  startFire: vi.fn(),
}));

import { PotStation } from "./pot-station";
import { Pot } from "../item/container/pot";
import { Ingredient } from "../item/ingredient/ingredient";
import { startFire } from "../helper/fire-helper";

const createMockPot = (mockScene: any, isEmpty = true) => {
  const pot = new Pot(mockScene, 0, 0);
  vi.spyOn(pot, "isEmpty").mockReturnValue(isEmpty);
  return pot;
};

const createMockIngredient = (mockScene: any, cookStates: string[] = []) => {
  const ingredient = new Ingredient(mockScene, 0, 0, "tomato", "tomato");
  ingredient.cookStates = cookStates as any;
  return ingredient;
};

describe("PotStation", () => {
  let mockScene: ReturnType<typeof createMockScene> & {
    game: { getTime: any };
    tweens: { add: any };
  };
  let mockGraphics: any;

  beforeEach(() => {
    mockGraphics = {
      fillStyle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      fillTriangle: vi.fn().mockReturnThis(),
      strokeTriangle: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    };
    mockScene = {
      ...createMockScene(),
      game: { getTime: vi.fn().mockReturnValue(0) },
      tweens: { add: vi.fn() },
    } as any;
    (mockScene.add as any).graphics = vi.fn().mockReturnValue(mockGraphics);
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct texture", () => {
      const station = new PotStation(mockScene as any, 100, 100);

      expect(station.textureKey).toBe("station_pot");
    });

    it("should set work speed to 0.1", () => {
      const station = new PotStation(mockScene as any, 100, 100);

      expect(station.workSpeed).toBe(0.1);
    });

    it("should create danger UI graphics", () => {
      new PotStation(mockScene as any, 100, 100);

      expect((mockScene.add as any).graphics).toHaveBeenCalled();
    });
  });

  describe("updateWhenIdle", () => {
    it("should hide danger UI", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      station.workStatus = "idle";

      station.updateWhenIdle(16);

      expect(mockGraphics.setVisible).toHaveBeenCalledWith(false);
    });

    it("should do nothing when no item", () => {
      const station = new PotStation(mockScene as any, 100, 100);

      station.updateWhenIdle(16);

      expect(station.workStatus).toBe("idle");
    });

    it("should start working when pot has cut ingredient", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      const pot = createMockPot(mockScene, false);
      const ingredient = createMockIngredient(mockScene, ["cut"]);
      pot.addIngredient(ingredient);
      station.item = pot;

      station.updateWhenIdle(16);

      expect(station.workStatus).toBe("working");
    });

    it("should go to done state when pot has stir-fry ingredient", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      const pot = createMockPot(mockScene, false);
      const ingredient = createMockIngredient(mockScene, ["cut"]);
      pot.addIngredient(ingredient);
      ingredient.addCookstate("stir-fry");
      station.item = pot;

      station.updateWhenIdle(16);

      expect(station.workStatus).toBe("done");
    });
  });

  describe("updateWhenWorking", () => {
    it("should transition to idle when no item", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      station.workStatus = "working";

      station.updateWhenWorking(16);

      expect(station.workStatus).toBe("idle");
    });

    it("should transition to idle when item is empty pot", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      const pot = createMockPot(mockScene, true);
      station.item = pot;
      station.workStatus = "working";

      station.updateWhenWorking(16);

      expect(station.workStatus).toBe("idle");
    });
  });

  describe("updateWhenDone", () => {
    it("should transition to idle when no item", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      station.workStatus = "done";

      station.updateWhenDone(16);

      expect(station.workStatus).toBe("idle");
    });

    it("should transition to idle when pot is empty", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      const pot = createMockPot(mockScene, true);
      station.item = pot;
      station.workStatus = "done";

      station.updateWhenDone(16);

      expect(station.workStatus).toBe("idle");
    });

    it("should add stir-fry state to ingredient", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      const pot = createMockPot(mockScene, false);
      const ingredient = createMockIngredient(mockScene, ["cut"]);
      pot.addIngredient(ingredient);
      station.item = pot;
      station.workStatus = "done";

      station.updateWhenDone(16);

      expect(ingredient.cookStates).toContain("stir-fry");
    });

    it("should transition to danger after safe time", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      const pot = createMockPot(mockScene, false);
      const ingredient = createMockIngredient(mockScene, ["cut"]);
      pot.addIngredient(ingredient);
      ingredient.addCookstate("stir-fry");
      station.item = pot;
      station.workStatus = "done";
      (station as any).timeAfterDone = 4000;

      station.updateWhenDone(16);

      expect(station.workStatus).toBe("danger");
    });
  });

  describe("updateWhenDanger", () => {
    it("should transition to idle when no item", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      station.workStatus = "danger";

      station.updateWhenDanger(16);

      expect(station.workStatus).toBe("idle");
    });

    it("should transition to fire after danger time", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      const pot = createMockPot(mockScene, false);
      const ingredient = createMockIngredient(mockScene, ["cut"]);
      pot.addIngredient(ingredient);
      ingredient.addCookstate("stir-fry");
      station.item = pot;
      station.workStatus = "danger";
      (station as any).timeAfterDone = 10000;

      station.updateWhenDanger(16);

      expect(station.workStatus).toBe("fire");
      expect(ingredient.cookStates).toContain("overcook");
      expect(startFire).toHaveBeenCalledWith(station);
    });

    it("should blink danger UI", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      const pot = createMockPot(mockScene, false);
      const ingredient = createMockIngredient(mockScene, ["cut"]);
      pot.addIngredient(ingredient);
      ingredient.addCookstate("stir-fry");
      station.item = pot;
      station.workStatus = "danger";
      (station as any).timeAfterDone = 4000;
      (station as any).lastDnagerBlinkTime = 0;
      mockScene.game.getTime.mockReturnValue(600);

      station.updateWhenDanger(16);

      expect(mockGraphics.setVisible).toHaveBeenCalled();
    });
  });

  describe("updateWhenFire", () => {
    it("should hide danger UI", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      station.workStatus = "fire";

      station.updateWhenFire(16);

      expect(mockGraphics.setVisible).toHaveBeenCalledWith(false);
    });

    it("should disable pot transfer", () => {
      const station = new PotStation(mockScene as any, 100, 100);
      const pot = createMockPot(mockScene, false);
      pot.canTransfer = true;
      station.item = pot;
      station.workStatus = "fire";

      station.updateWhenFire(16);

      expect(pot.canTransfer).toBe(false);
    });
  });
});