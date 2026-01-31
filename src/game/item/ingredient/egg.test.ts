import { describe, it, expect, vi, beforeEach } from "vitest";
import { Egg } from "./egg";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Egg", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const egg = new Egg(mockScene as any, 100, 100);

      expect(egg.texture.key).toBe("item_egg");
    });

    it("should initialize with custom texture", () => {
      const egg = new Egg(mockScene as any, 100, 100, "custom_texture");

      expect(egg.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to egg", () => {
      const egg = new Egg(mockScene as any, 100, 100);

      expect(egg.ingredientType).toBe("egg");
    });

    it("should set position correctly", () => {
      const egg = new Egg(mockScene as any, 150, 200);

      expect(egg.x).toBe(150);
      expect(egg.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const egg = new Egg(mockScene as any, 100, 100);

      expect(egg.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should add mix state to cookStates", () => {
      const egg = new Egg(mockScene as any, 100, 100);

      egg.addCookstate("mix");

      expect(egg.cookStates).toContain("mix");
    });

    it("should not change texture for mix state", () => {
      const egg = new Egg(mockScene as any, 100, 100);

      egg.addCookstate("mix");

      expect(egg.texture.key).toBe("item_egg");
    });

    it("should add pan-fry state to cookStates", () => {
      const egg = new Egg(mockScene as any, 100, 100);

      egg.addCookstate("pan-fry");

      expect(egg.cookStates).toContain("pan-fry");
    });

    it("should handle multiple cook states", () => {
      const egg = new Egg(mockScene as any, 100, 100);

      egg.addCookstate("mix");
      egg.addCookstate("pan-fry");

      expect(egg.cookStates).toContain("mix");
      expect(egg.cookStates).toContain("pan-fry");
      expect(egg.cookStates.length).toBe(2);
    });
  });
});
