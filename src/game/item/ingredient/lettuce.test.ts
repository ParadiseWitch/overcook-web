import { describe, it, expect, vi, beforeEach } from "vitest";
import { Lettuce } from "./lettuce";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Lettuce", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const lettuce = new Lettuce(mockScene as any, 100, 100);

      expect(lettuce.texture.key).toBe("item_lettuce");
    });

    it("should initialize with custom texture", () => {
      const lettuce = new Lettuce(mockScene as any, 100, 100, "custom_texture");

      expect(lettuce.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to lettuce", () => {
      const lettuce = new Lettuce(mockScene as any, 100, 100);

      expect(lettuce.ingredientType).toBe("lettuce");
    });

    it("should set position correctly", () => {
      const lettuce = new Lettuce(mockScene as any, 150, 200);

      expect(lettuce.x).toBe(150);
      expect(lettuce.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const lettuce = new Lettuce(mockScene as any, 100, 100);

      expect(lettuce.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should change texture when cut", () => {
      const lettuce = new Lettuce(mockScene as any, 100, 100);

      lettuce.addCookstate("cut");

      expect(lettuce.texture.key).toBe("item_lettuce_cut");
    });

    it("should add cut state to cookStates", () => {
      const lettuce = new Lettuce(mockScene as any, 100, 100);

      lettuce.addCookstate("cut");

      expect(lettuce.cookStates).toContain("cut");
    });

    it("should not change texture for non-cut states", () => {
      const lettuce = new Lettuce(mockScene as any, 100, 100);

      lettuce.addCookstate("mix");

      expect(lettuce.texture.key).toBe("item_lettuce");
    });

    it("should add mix state to cookStates", () => {
      const lettuce = new Lettuce(mockScene as any, 100, 100);

      lettuce.addCookstate("mix");

      expect(lettuce.cookStates).toContain("mix");
    });

    it("should handle multiple cook states", () => {
      const lettuce = new Lettuce(mockScene as any, 100, 100);

      lettuce.addCookstate("cut");
      lettuce.addCookstate("mix");

      expect(lettuce.cookStates).toContain("cut");
      expect(lettuce.cookStates).toContain("mix");
      expect(lettuce.cookStates.length).toBe(2);
    });
  });
});
