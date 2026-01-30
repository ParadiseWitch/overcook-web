import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10 },
}));

import { SinkStation } from "./sink-station";
import { Plate } from "../item/container/plate";

const createMockPlate = (status = "dirty") => {
  const mockScene = createMockScene();
  const plate = new Plate(mockScene as any, 0, 0, status as any);
  return plate;
};

describe("SinkStation", () => {
  let mockScene: ReturnType<typeof createMockScene> & { game: { getTime: any }; tweens: { add: any } };

  beforeEach(() => {
    mockScene = {
      ...createMockScene(),
      game: {
        getTime: vi.fn().mockReturnValue(0),
      },
      tweens: { add: vi.fn() },
    } as any;
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct texture", () => {
      const station = new SinkStation(mockScene as any, 100, 100);

      expect(station.textureKey).toBe("station_sink");
    });

    it("should set work speed to 0.12", () => {
      const station = new SinkStation(mockScene as any, 100, 100);

      expect(station.workSpeed).toBe(0.12);
    });

    it("should set canFire to false", () => {
      const station = new SinkStation(mockScene as any, 100, 100);

      expect(station.canFire).toBe(false);
    });
  });

  describe("getProgress / setProgress", () => {
    it("should return internal progress", () => {
      const station = new SinkStation(mockScene as any, 100, 100);

      expect(station.getProgress()).toBe(0);
    });

    it("should set internal progress", () => {
      const station = new SinkStation(mockScene as any, 100, 100);

      station.setProgress(50);

      expect(station.getProgress()).toBe(50);
    });
  });

  describe("work", () => {
    it("should start working when item is dirty plate", () => {
      const station = new SinkStation(mockScene as any, 100, 100);
      const plate = createMockPlate("dirty");
      station.item = plate as any;

      station.work();

      expect(station.workStatus).toBe("working");
    });

    it("should not work when no item", () => {
      const station = new SinkStation(mockScene as any, 100, 100);

      station.work();

      expect(station.workStatus).toBe("idle");
    });

    it("should not work when plate is not dirty", () => {
      const station = new SinkStation(mockScene as any, 100, 100);
      const plate = createMockPlate("empty");
      station.item = plate as any;

      station.work();

      expect(station.workStatus).toBe("idle");
    });
  });

  describe("updateWhenWorking", () => {
    it("should do nothing when no item", () => {
      const station = new SinkStation(mockScene as any, 100, 100);

      expect(() => station.updateWhenWorking(16)).not.toThrow();
    });
  });

  describe("updateWhenDone", () => {
    it("should set plate status to empty", () => {
      const station = new SinkStation(mockScene as any, 100, 100);
      const plate = createMockPlate("dirty");
      station.item = plate as any;

      station.updateWhenDone();

      expect(plate.status).toBe("empty");
    });

    it("should reset item position", () => {
      const station = new SinkStation(mockScene as any, 150, 200);
      const plate = createMockPlate("dirty");
      plate.x = 0;
      plate.y = 0;
      station.item = plate as any;

      station.updateWhenDone();

      expect(plate.x).toBe(150);
      expect(plate.y).toBe(200);
    });

    it("should transition to idle", () => {
      const station = new SinkStation(mockScene as any, 100, 100);
      const plate = createMockPlate("dirty");
      station.item = plate as any;
      station.workStatus = "done";

      station.updateWhenDone();

      expect(station.workStatus).toBe("idle");
    });

    it("should do nothing when no item", () => {
      const station = new SinkStation(mockScene as any, 100, 100);
      station.workStatus = "done";

      station.updateWhenDone();

      expect(station.workStatus).toBe("done");
    });
  });
});