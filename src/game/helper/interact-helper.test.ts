import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10, PLAYER: 15 },
}));

import { interact } from "./interact-helper";
import { Player } from "../player";
import { Station } from "../stations/station";
import { Item } from "../item";
import { Plate } from "../item/container/plate";
import { Ingredient } from "../item/ingredient/ingredient";

class TestStation extends Station {
  constructor(scene: any, x: number, y: number) {
    super(scene, x, y, "test");
  }
}

const createMockPlayer = (mockScene: any, heldItem: any = null) => {
  const player = {
    heldItem,
    putDownToFloor: vi.fn(),
    pick: vi.fn().mockImplementation((item: any) => {
      player.heldItem = item;
      item.heldBy = player;
    }),
  };
  return player as unknown as Player;
};

describe("interact-helper", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("interact with null target", () => {
    it("should do nothing when target is null and player has no item", () => {
      const player = createMockPlayer(mockScene);

      interact(player, null);

      expect(player.putDownToFloor).not.toHaveBeenCalled();
    });

    it("should put down item when target is null and player has item", () => {
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      const player = createMockPlayer(mockScene, ingredient);

      interact(player, null);

      expect(player.putDownToFloor).toHaveBeenCalled();
    });
  });

  describe("interact with Station", () => {
    it("should place held item on empty station", () => {
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      const player = createMockPlayer(mockScene, ingredient);
      const station = new TestStation(mockScene as any, 100, 100);
      const placeItemSpy = vi.spyOn(station, "placeItem");

      interact(player, station);

      expect(placeItemSpy).toHaveBeenCalledWith(ingredient);
    });

    it("should interact with station item when station has item", () => {
      const stationItem = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      const player = createMockPlayer(mockScene);
      const station = new TestStation(mockScene as any, 100, 100);
      station.item = stationItem;

      interact(player, station);

      expect(player.pick).toHaveBeenCalledWith(stationItem);
    });
  });

  describe("interact with Container", () => {
    it("should pick up container when player has no held item", () => {
      const player = createMockPlayer(mockScene);
      const container = new Plate(mockScene as any, 100, 100);

      interact(player, container);

      expect(player.pick).toHaveBeenCalledWith(container);
    });

    it("should add ingredient to container when player holds ingredient", () => {
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      ingredient.addCookstate("cut");
      const player = createMockPlayer(mockScene, ingredient);
      const container = new Plate(mockScene as any, 100, 100);
      const addIngredientSpy = vi.spyOn(container, "addIngredient");

      interact(player, container);

      expect(addIngredientSpy).toHaveBeenCalledWith(ingredient);
    });

    it("should transfer from non-empty container to held empty container", () => {
      const heldContainer = new Plate(mockScene as any, 0, 0);
      const player = createMockPlayer(mockScene, heldContainer);
      const targetContainer = new Plate(mockScene as any, 100, 100);
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      ingredient.addCookstate("cut");
      targetContainer.addIngredient(ingredient);
      const transferToSpy = vi.spyOn(targetContainer, "transferTo");

      interact(player, targetContainer);

      expect(transferToSpy).toHaveBeenCalledWith(heldContainer);
    });

    it("should transfer from held non-empty container to empty target container", () => {
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      ingredient.addCookstate("cut");
      const heldContainer = new Plate(mockScene as any, 0, 0);
      heldContainer.addIngredient(ingredient);
      const player = createMockPlayer(mockScene, heldContainer);
      const targetContainer = new Plate(mockScene as any, 100, 100);
      const transferToSpy = vi.spyOn(heldContainer, "transferTo");

      interact(player, targetContainer);

      expect(transferToSpy).toHaveBeenCalledWith(targetContainer);
    });
  });

  describe("interact with Ingredient", () => {
    it("should pick up ingredient when player has no held item", () => {
      const player = createMockPlayer(mockScene);
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");

      interact(player, ingredient);

      expect(player.pick).toHaveBeenCalledWith(ingredient);
    });

    it("should add ingredient to held container", () => {
      const container = new Plate(mockScene as any, 0, 0);
      const player = createMockPlayer(mockScene, container);
      const ingredient = new Ingredient(mockScene as any, 0, 0, "tomato", "tomato");
      ingredient.addCookstate("cut");
      const addIngredientSpy = vi.spyOn(container, "addIngredient");

      interact(player, ingredient);

      expect(addIngredientSpy).toHaveBeenCalledWith(ingredient);
    });
  });
});
