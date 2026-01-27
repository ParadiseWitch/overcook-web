import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initFireHelper,
  startFire,
  stopFire,
  isOnFire,
  updateFireHelper,
  tryExtinguish,
  clearAllFires,
} from "./fire-helper";

vi.mock("../manager/station-manager", () => ({
  getStationAt: vi.fn(),
}));

import { getStationAt } from "../manager/station-manager";

const createMockStation = (x: number, y: number, canFire: boolean = true) => ({
  x,
  y,
  canFire,
  workStatus: "idle" as "idle" | "working" | "done" | "danger" | "fire",
});

const createMockScene = () => {
  const mockEmitter = {
    destroy: vi.fn(),
    setDepth: vi.fn(),
  };
  return {
    add: {
      particles: vi.fn().mockReturnValue(mockEmitter),
    },
  };
};

describe("FireHelper", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    initFireHelper(mockScene as any);
    vi.clearAllMocks();
  });

  describe("startFire", () => {
    it("should start fire on a station", () => {
      const station = createMockStation(100, 100);
      startFire(station as any);

      expect(station.workStatus).toBe("fire");
      expect(isOnFire(station as any)).toBe(true);
    });

    it("should not start fire if station cannot catch fire", () => {
      const station = createMockStation(100, 100, false);
      startFire(station as any);

      expect(station.workStatus).toBe("idle");
      expect(isOnFire(station as any)).toBe(false);
    });

    it("should not start fire twice on the same station", () => {
      const station = createMockStation(100, 100);
      startFire(station as any);
      startFire(station as any);

      expect(station.workStatus).toBe("fire");
    });
  });

  describe("stopFire", () => {
    it("should stop fire on a station", () => {
      const station = createMockStation(100, 100);
      startFire(station as any);
      stopFire(station as any);

      expect(station.workStatus).toBe("idle");
      expect(isOnFire(station as any)).toBe(false);
    });

    it("should do nothing if station is not on fire", () => {
      const station = createMockStation(100, 100);
      stopFire(station as any);

      expect(station.workStatus).toBe("idle");
    });
  });

  describe("isOnFire", () => {
    it("should return true if station is on fire", () => {
      const station = createMockStation(100, 100);
      startFire(station as any);

      expect(isOnFire(station as any)).toBe(true);
    });

    it("should return false if station is not on fire", () => {
      const station = createMockStation(100, 100);

      expect(isOnFire(station as any)).toBe(false);
    });
  });

  describe("updateFireHelper", () => {
    it("should spread fire after spread interval", () => {
      const station1 = createMockStation(100, 100);
      const station2 = createMockStation(148, 100);

      vi.mocked(getStationAt).mockImplementation((x, y) => {
        if (x === 148 && y === 100) return station2 as any;
        return undefined;
      });

      startFire(station1 as any);
      updateFireHelper(3000);

      expect(isOnFire(station2 as any)).toBe(true);
    });

    it("should not spread fire before interval", () => {
      const station1 = createMockStation(100, 100);
      const station2 = createMockStation(148, 100);

      vi.mocked(getStationAt).mockImplementation((x, y) => {
        if (x === 148 && y === 100) return station2 as any;
        return undefined;
      });

      startFire(station1 as any);
      updateFireHelper(2000);

      expect(isOnFire(station2 as any)).toBe(false);
    });
  });

  describe("tryExtinguish", () => {
    it("should extinguish fire when conditions are met", () => {
      const station = createMockStation(100, 100);
      startFire(station as any);

      const facing = { angle: () => 0 };

      tryExtinguish(
        station as any,
        80,
        100,
        50,
        Math.PI / 3,
        facing as any,
        2000,
      );

      expect(isOnFire(station as any)).toBe(false);
    });

    it("should not extinguish if station is out of range", () => {
      const station = createMockStation(100, 100);
      startFire(station as any);

      const facing = { angle: () => 0 };

      tryExtinguish(
        station as any,
        0,
        100,
        50,
        Math.PI / 3,
        facing as any,
        2000,
      );

      expect(isOnFire(station as any)).toBe(true);
    });

    it("should not extinguish if angle is wrong", () => {
      const station = createMockStation(100, 100);
      startFire(station as any);

      const facing = { angle: () => Math.PI };

      tryExtinguish(
        station as any,
        80,
        100,
        50,
        Math.PI / 6,
        facing as any,
        2000,
      );

      expect(isOnFire(station as any)).toBe(true);
    });

    it("should require multiple updates to extinguish", () => {
      const station = createMockStation(100, 100);
      startFire(station as any);

      const facing = { angle: () => 0 };

      tryExtinguish(
        station as any,
        80,
        100,
        50,
        Math.PI / 3,
        facing as any,
        1000,
      );

      expect(isOnFire(station as any)).toBe(true);

      tryExtinguish(
        station as any,
        80,
        100,
        50,
        Math.PI / 3,
        facing as any,
        1000,
      );

      expect(isOnFire(station as any)).toBe(false);
    });
  });

  describe("clearAllFires", () => {
    it("should clear all fires", () => {
      const station1 = createMockStation(100, 100);
      const station2 = createMockStation(200, 200);

      startFire(station1 as any);
      startFire(station2 as any);

      clearAllFires();

      expect(station1.workStatus).toBe("idle");
      expect(station2.workStatus).toBe("idle");
      expect(isOnFire(station1 as any)).toBe(false);
      expect(isOnFire(station2 as any)).toBe(false);
    });
  });
});
