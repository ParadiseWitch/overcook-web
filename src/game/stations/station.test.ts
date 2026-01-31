import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10 },
}));

import { Station } from "./station";
import { Item } from "../item";

class TestStation extends Station {
  constructor(scene: any, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
  }
}

const createMockItem = (x = 100, y = 100) => {
  const item = {
    x,
    y,
    body: { enable: true },
    heldBy: null,
    station: null as any,
    isFlying: false,
    _progress: 0,
    setDepth: vi.fn(),
    setVelocity: vi.fn(),
    getProgress() {
      return this._progress;
    },
    setProgress(v: number) {
      this._progress = v;
    },
    destroy: vi.fn(),
  };
  return item as unknown as Item;
};

describe("Station", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct position", () => {
      const station = new TestStation(mockScene as any, 100, 200, "test");

      expect(station.x).toBe(100);
      expect(station.y).toBe(200);
    });

    it("should initialize with correct texture key", () => {
      const station = new TestStation(mockScene as any, 100, 100, "station_test");

      expect(station.textureKey).toBe("station_test");
    });

    it("should initialize with idle work status", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");

      expect(station.workStatus).toBe("idle");
    });

    it("should initialize with null item", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");

      expect(station.item).toBeNull();
    });

    it("should initialize with canPick true", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");

      expect(station.canPick).toBe(true);
    });

    it("should initialize with canFire true", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");

      expect(station.canFire).toBe(true);
    });
  });

  describe("canPlace", () => {
    it("should return true by default", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem();

      expect(station.canPlace(item)).toBe(true);
    });
  });

  describe("placeItem", () => {
    it("should place item successfully when station is empty", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem(50, 50);

      const result = station.placeItem(item);

      expect(result).toBe(true);
      expect(station.item).toBe(item);
      expect(item.station).toBe(station);
    });

    it("should set item position to station position", () => {
      const station = new TestStation(mockScene as any, 100, 200, "test");
      const item = createMockItem(50, 50);

      station.placeItem(item);

      expect(item.x).toBe(100);
      expect(item.y).toBe(200);
    });

    it("should clear item heldBy", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem();
      item.heldBy = { name: "player" } as any;

      station.placeItem(item);

      expect(item.heldBy).toBeNull();
    });

    it("should disable item physics body", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem();

      station.placeItem(item);

      expect(item.body.enable).toBe(false);
    });

    it("should not place item if station already has item", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item1 = createMockItem();
      const item2 = createMockItem();

      station.placeItem(item1);
      const result = station.placeItem(item2);

      expect(result).toBe(false);
      expect(station.item).toBe(item1);
    });

    it("should not place item if item already on another station", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem();
      item.station = { name: "other" } as any;

      const result = station.placeItem(item);

      expect(result).toBe(false);
    });
  });

  describe("getProgress / setProgress", () => {
    it("should return 0 when no item", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");

      expect(station.getProgress()).toBe(0);
    });

    it("should delegate to item getProgress", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem();
      (item as any)._progress = 50;
      station.item = item;

      expect(station.getProgress()).toBe(50);
    });

    it("should do nothing when setting progress with no item", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");

      expect(() => station.setProgress(50)).not.toThrow();
    });

    it("should delegate to item setProgress", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem();
      station.item = item;

      station.setProgress(75);

      expect(item.getProgress()).toBe(75);
    });
  });

  describe("removeItem", () => {
    it("should destroy item and set to null", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem();
      station.item = item;

      station.removeItem();

      expect(item.destroy).toHaveBeenCalled();
      expect(station.item).toBeNull();
    });

    it("should handle null item gracefully", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");

      expect(() => station.removeItem()).not.toThrow();
    });
  });

  describe("update", () => {
    it("should keep item position synced when idle", () => {
      const station = new TestStation(mockScene as any, 100, 200, "test");
      const item = createMockItem(50, 50);
      station.item = item;

      station.update(16);

      expect(item.x).toBe(100);
      expect(item.y).toBe(200);
    });

    it("should transition from working to done when progress reaches 100", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem();
      (item as any)._progress = 100;
      station.item = item;
      station.workStatus = "working";

      station.update(16);

      expect(station.workStatus).toBe("done");
    });

    it("should increase progress when working", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const item = createMockItem();
      station.item = item;
      station.workStatus = "working";

      station.update(16);

      expect(item.getProgress()).toBeGreaterThan(0);
    });

    it("should transition to idle when working without item", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      station.workStatus = "working";

      station.update(16);

      expect(station.workStatus).toBe("idle");
    });
  });

  describe("getSprite", () => {
    it("should return the sprite", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");

      expect(station.getSprite()).toBe(station.sprite);
    });
  });

  describe("work", () => {
    it("should do nothing by default", () => {
      const station = new TestStation(mockScene as any, 100, 100, "test");
      const mockPlayer = {} as any;

      expect(() => station.work(mockPlayer)).not.toThrow();
      expect(station.workStatus).toBe("idle");
    });
  });
});