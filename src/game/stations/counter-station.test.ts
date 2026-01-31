import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { STATION: 5, UI: 100, UI_TIP: 101, ITEM: 10 },
}));

import { CounterStation } from "./counter-station";

describe("CounterStation", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const station = new CounterStation(mockScene as any, 100, 100);

      expect(station.textureKey).toBe("station_counter");
    });

    it("should initialize with custom texture", () => {
      const station = new CounterStation(
        mockScene as any,
        100,
        100,
        "custom_counter"
      );

      expect(station.textureKey).toBe("custom_counter");
    });

    it("should set position correctly", () => {
      const station = new CounterStation(mockScene as any, 150, 200);

      expect(station.x).toBe(150);
      expect(station.y).toBe(200);
    });
  });
});
