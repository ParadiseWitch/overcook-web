import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10 },
}));

import { TrashStation } from "./trash-station";
import { Container } from "../item/container/container";
import { Plate } from "../item/container/plate";

const createMockItem = () => {
  return {
    x: 0,
    y: 0,
    body: { enable: true },
    heldBy: null as any,
    station: null as any,
    isFlying: false,
    setDepth: vi.fn(),
    setVelocity: vi.fn(),
    destroy: vi.fn(),
    getProgress: vi.fn().mockReturnValue(0),
    setProgress: vi.fn(),
  };
};

const createMockContainer = (mockScene: any, isEmpty = true, isFlying = false, heldBy: any = null) => {
  const container = new Plate(mockScene, 0, 0, "empty");
  container.isFlying = isFlying;
  container.heldBy = heldBy;
  vi.spyOn(container, "isEmpty").mockReturnValue(isEmpty);
  vi.spyOn(container, "clear").mockImplementation(() => {});
  return container;
};

describe("TrashStation", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    (mockScene as any).tweens = { add: vi.fn() };
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct texture", () => {
      const station = new TrashStation(mockScene as any, 100, 100);

      expect(station.textureKey).toBe("station_trash");
    });
  });

  describe("placeItem", () => {
    it("should destroy regular item with animation", () => {
      const station = new TrashStation(mockScene as any, 100, 100);
      const item = createMockItem();

      const result = station.placeItem(item as any);

      expect(result).toBe(true);
      expect((mockScene as any).tweens.add).toHaveBeenCalled();
    });

    it("should set item position to station position", () => {
      const station = new TrashStation(mockScene as any, 150, 200);
      const item = createMockItem();

      station.placeItem(item as any);

      expect(item.x).toBe(150);
      expect(item.y).toBe(200);
    });

    it("should disable item physics", () => {
      const station = new TrashStation(mockScene as any, 100, 100);
      const item = createMockItem();

      station.placeItem(item as any);

      expect(item.body.enable).toBe(false);
    });

    it("should keep flying non-empty container on station", () => {
      const station = new TrashStation(mockScene as any, 100, 100);
      const container = createMockContainer(mockScene, false, true);

      const result = station.placeItem(container as any);

      expect(result).toBe(true);
      expect(station.item).toBe(container);
    });

    it("should clear contents when hand-held non-empty container", () => {
      const station = new TrashStation(mockScene as any, 100, 100);
      const player = { name: "player" };
      const container = createMockContainer(mockScene, false, false, player);

      const result = station.placeItem(container as any);

      expect(result).toBe(false);
      expect(container.clear).toHaveBeenCalled();
    });

    it("should destroy empty container", () => {
      const station = new TrashStation(mockScene as any, 100, 100);
      const container = createMockContainer(mockScene, true, false);

      const result = station.placeItem(container as any);

      expect(result).toBe(true);
      expect((mockScene as any).tweens.add).toHaveBeenCalled();
    });

    it("should clear isFlying flag", () => {
      const station = new TrashStation(mockScene as any, 100, 100);
      const item = createMockItem();
      item.isFlying = true;

      station.placeItem(item as any);

      expect(item.isFlying).toBe(false);
    });

    it("should clear heldBy reference", () => {
      const station = new TrashStation(mockScene as any, 100, 100);
      const item = createMockItem();
      item.heldBy = { name: "player" };

      station.placeItem(item as any);

      expect(item.heldBy).toBeNull();
    });
  });
});
