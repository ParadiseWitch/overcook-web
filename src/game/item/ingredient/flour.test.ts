import { describe, it, expect, vi, beforeEach } from "vitest";
import { Flour } from "./flour";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Flour", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const flour = new Flour(mockScene as any, 100, 100);

      expect(flour.texture.key).toBe("item_flour");
    });

    it("should initialize with custom texture", () => {
      const flour = new Flour(mockScene as any, 100, 100, "custom_texture");

      expect(flour.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to flour", () => {
      const flour = new Flour(mockScene as any, 100, 100);

      expect(flour.ingredientType).toBe("flour");
    });

    it("should set position correctly", () => {
      const flour = new Flour(mockScene as any, 150, 200);

      expect(flour.x).toBe(150);
      expect(flour.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const flour = new Flour(mockScene as any, 100, 100);

      expect(flour.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should add mix state to cookStates", () => {
      const flour = new Flour(mockScene as any, 100, 100);

      flour.addCookstate("mix");

      expect(flour.cookStates).toContain("mix");
    });

    it("should not change texture for mix state", () => {
      const flour = new Flour(mockScene as any, 100, 100);

      flour.addCookstate("mix");

      expect(flour.texture.key).toBe("item_flour");
    });

    it("should add bake state to cookStates", () => {
      const flour = new Flour(mockScene as any, 100, 100);

      flour.addCookstate("bake");

      expect(flour.cookStates).toContain("bake");
    });

    it("should handle multiple cook states", () => {
      const flour = new Flour(mockScene as any, 100, 100);

      flour.addCookstate("mix");
      flour.addCookstate("bake");

      expect(flour.cookStates).toContain("mix");
      expect(flour.cookStates).toContain("bake");
      expect(flour.cookStates.length).toBe(2);
    });
  });
});
