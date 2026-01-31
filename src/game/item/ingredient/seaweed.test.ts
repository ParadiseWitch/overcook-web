import { describe, it, expect, vi, beforeEach } from "vitest";
import { Seaweed } from "./seaweed";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Seaweed", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const seaweed = new Seaweed(mockScene as any, 100, 100);

      expect(seaweed.texture.key).toBe("item_seaweed");
    });

    it("should initialize with custom texture", () => {
      const seaweed = new Seaweed(mockScene as any, 100, 100, "custom_texture");

      expect(seaweed.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to seaweed", () => {
      const seaweed = new Seaweed(mockScene as any, 100, 100);

      expect(seaweed.ingredientType).toBe("seaweed");
    });

    it("should set position correctly", () => {
      const seaweed = new Seaweed(mockScene as any, 150, 200);

      expect(seaweed.x).toBe(150);
      expect(seaweed.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const seaweed = new Seaweed(mockScene as any, 100, 100);

      expect(seaweed.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should add mix state to cookStates", () => {
      const seaweed = new Seaweed(mockScene as any, 100, 100);

      seaweed.addCookstate("mix");

      expect(seaweed.cookStates).toContain("mix");
    });

    it("should not change texture when adding state", () => {
      const seaweed = new Seaweed(mockScene as any, 100, 100);

      seaweed.addCookstate("mix");

      expect(seaweed.texture.key).toBe("item_seaweed");
    });

    it("should handle multiple cook states", () => {
      const seaweed = new Seaweed(mockScene as any, 100, 100);

      seaweed.addCookstate("mix");
      seaweed.addCookstate("steam");

      expect(seaweed.cookStates).toContain("mix");
      expect(seaweed.cookStates).toContain("steam");
      expect(seaweed.cookStates.length).toBe(2);
    });
  });
});
