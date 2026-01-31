import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10 },
}));

vi.mock("../manager/item-manager", () => ({
  ALL_ITEMS: [],
}));

import { DirtyPlateStation } from "./dirty-plate-station";

describe("DirtyPlateStation", () => {
  let mockScene: ReturnType<typeof createMockScene> & {
    events: { on: any; emit: any };
  };

  beforeEach(() => {
    mockScene = {
      ...createMockScene(),
      events: {
        on: vi.fn(),
        emit: vi.fn(),
      },
    } as any;
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct texture", () => {
      const station = new DirtyPlateStation(mockScene as any, 100, 100);

      expect(station.textureKey).toBe("station_dirty_plate");
    });

    it("should register event listener for add-dirty-plate", () => {
      new DirtyPlateStation(mockScene as any, 100, 100);

      expect(mockScene.events.on).toHaveBeenCalledWith(
        "add-dirty-plate",
        expect.any(Function)
      );
    });
  });

  describe("canPlace", () => {
    it("should return false for any item", () => {
      const station = new DirtyPlateStation(mockScene as any, 100, 100);
      const mockItem = {} as any;

      expect(station.canPlace(mockItem)).toBe(false);
    });
  });

  describe("genDirtyPlate", () => {
    it("should not generate plate when station has item", () => {
      const station = new DirtyPlateStation(mockScene as any, 100, 100);
      station.item = {} as any;

      station.genDirtyPlate();

      expect(station.item).not.toHaveProperty("status");
    });

    it("should generate dirty plate when station is empty", () => {
      const station = new DirtyPlateStation(mockScene as any, 100, 100);

      station.genDirtyPlate();

      expect(station.item).not.toBeNull();
      expect((station.item as any).status).toBe("dirty");
    });

    it("should set plate position to station position", () => {
      const station = new DirtyPlateStation(mockScene as any, 150, 200);

      station.genDirtyPlate();

      expect(station.item?.x).toBe(150);
      expect(station.item?.y).toBe(200);
    });

    it("should set plate station reference", () => {
      const station = new DirtyPlateStation(mockScene as any, 100, 100);

      station.genDirtyPlate();

      expect(station.item?.station).toBe(station);
    });

    it("should set plate homeStation reference", () => {
      const station = new DirtyPlateStation(mockScene as any, 100, 100);

      station.genDirtyPlate();

      expect(station.item?.homeStation).toBe(station);
    });
  });
});
