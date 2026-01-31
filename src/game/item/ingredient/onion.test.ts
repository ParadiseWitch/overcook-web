import { describe, it, expect, vi, beforeEach } from "vitest";
import { Onion } from "./onion";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Onion", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const onion = new Onion(mockScene as any, 100, 100);

      expect(onion.texture.key).toBe("item_onion");
    });

    it("should initialize with custom texture", () => {
      const onion = new Onion(mockScene as any, 100, 100, "custom_texture");

      expect(onion.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to onion", () => {
      const onion = new Onion(mockScene as any, 100, 100);

      expect(onion.ingredientType).toBe("onion");
    });

    it("should set position correctly", () => {
      const onion = new Onion(mockScene as any, 150, 200);

      expect(onion.x).toBe(150);
      expect(onion.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const onion = new Onion(mockScene as any, 100, 100);

      expect(onion.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should change texture when cut", () => {
      const onion = new Onion(mockScene as any, 100, 100);

      onion.addCookstate("cut");

      expect(onion.texture.key).toBe("item_onion_cut");
    });

    it("should add cut state to cookStates", () => {
      const onion = new Onion(mockScene as any, 100, 100);

      onion.addCookstate("cut");

      expect(onion.cookStates).toContain("cut");
    });

    it("should not change texture for non-cut states", () => {
      const onion = new Onion(mockScene as any, 100, 100);

      onion.addCookstate("boil");

      expect(onion.texture.key).toBe("item_onion");
    });

    it("should add boil state to cookStates", () => {
      const onion = new Onion(mockScene as any, 100, 100);

      onion.addCookstate("boil");

      expect(onion.cookStates).toContain("boil");
    });

    it("should handle multiple cook states", () => {
      const onion = new Onion(mockScene as any, 100, 100);

      onion.addCookstate("cut");
      onion.addCookstate("boil");

      expect(onion.cookStates).toContain("cut");
      expect(onion.cookStates).toContain("boil");
      expect(onion.cookStates.length).toBe(2);
    });
  });
});
