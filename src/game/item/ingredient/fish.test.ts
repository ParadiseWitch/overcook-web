import { describe, it, expect, vi, beforeEach } from "vitest";
import { Fish } from "./fish";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Fish", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const fish = new Fish(mockScene as any, 100, 100);

      expect(fish.texture.key).toBe("item_fish");
    });

    it("should initialize with custom texture", () => {
      const fish = new Fish(mockScene as any, 100, 100, "custom_texture");

      expect(fish.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to fish", () => {
      const fish = new Fish(mockScene as any, 100, 100);

      expect(fish.ingredientType).toBe("fish");
    });

    it("should set position correctly", () => {
      const fish = new Fish(mockScene as any, 150, 200);

      expect(fish.x).toBe(150);
      expect(fish.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const fish = new Fish(mockScene as any, 100, 100);

      expect(fish.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should change texture when cut", () => {
      const fish = new Fish(mockScene as any, 100, 100);

      fish.addCookstate("cut");

      expect(fish.texture.key).toBe("item_fish_cut");
    });

    it("should add cut state to cookStates", () => {
      const fish = new Fish(mockScene as any, 100, 100);

      fish.addCookstate("cut");

      expect(fish.cookStates).toContain("cut");
    });

    it("should not change texture for non-cut states", () => {
      const fish = new Fish(mockScene as any, 100, 100);

      fish.addCookstate("barbecue");

      expect(fish.texture.key).toBe("item_fish");
    });

    it("should add barbecue state to cookStates", () => {
      const fish = new Fish(mockScene as any, 100, 100);

      fish.addCookstate("barbecue");

      expect(fish.cookStates).toContain("barbecue");
    });

    it("should handle multiple cook states", () => {
      const fish = new Fish(mockScene as any, 100, 100);

      fish.addCookstate("cut");
      fish.addCookstate("barbecue");

      expect(fish.cookStates).toContain("cut");
      expect(fish.cookStates).toContain("barbecue");
      expect(fish.cookStates.length).toBe(2);
    });
  });
});
