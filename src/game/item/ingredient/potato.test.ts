import { describe, it, expect, vi, beforeEach } from "vitest";
import { Potato } from "./potato";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Potato", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const potato = new Potato(mockScene as any, 100, 100);

      expect(potato.texture.key).toBe("item_potato");
    });

    it("should initialize with custom texture", () => {
      const potato = new Potato(mockScene as any, 100, 100, "custom_texture");

      expect(potato.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to potato", () => {
      const potato = new Potato(mockScene as any, 100, 100);

      expect(potato.ingredientType).toBe("potato");
    });

    it("should set position correctly", () => {
      const potato = new Potato(mockScene as any, 150, 200);

      expect(potato.x).toBe(150);
      expect(potato.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const potato = new Potato(mockScene as any, 100, 100);

      expect(potato.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should change texture when cut", () => {
      const potato = new Potato(mockScene as any, 100, 100);

      potato.addCookstate("cut");

      expect(potato.texture.key).toBe("item_potato_cut");
    });

    it("should add cut state to cookStates", () => {
      const potato = new Potato(mockScene as any, 100, 100);

      potato.addCookstate("cut");

      expect(potato.cookStates).toContain("cut");
    });

    it("should not change texture for non-cut states", () => {
      const potato = new Potato(mockScene as any, 100, 100);

      potato.addCookstate("boil");

      expect(potato.texture.key).toBe("item_potato");
    });

    it("should add boil state to cookStates", () => {
      const potato = new Potato(mockScene as any, 100, 100);

      potato.addCookstate("boil");

      expect(potato.cookStates).toContain("boil");
    });

    it("should handle multiple cook states", () => {
      const potato = new Potato(mockScene as any, 100, 100);

      potato.addCookstate("cut");
      potato.addCookstate("boil");

      expect(potato.cookStates).toContain("cut");
      expect(potato.cookStates).toContain("boil");
      expect(potato.cookStates.length).toBe(2);
    });
  });
});
