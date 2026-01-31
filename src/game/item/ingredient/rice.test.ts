import { describe, it, expect, vi, beforeEach } from "vitest";
import { Rice } from "./rice";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Rice", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const rice = new Rice(mockScene as any, 100, 100);

      expect(rice.texture.key).toBe("item_rice");
    });

    it("should initialize with custom texture", () => {
      const rice = new Rice(mockScene as any, 100, 100, "custom_texture");

      expect(rice.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to rice", () => {
      const rice = new Rice(mockScene as any, 100, 100);

      expect(rice.ingredientType).toBe("rice");
    });

    it("should set position correctly", () => {
      const rice = new Rice(mockScene as any, 150, 200);

      expect(rice.x).toBe(150);
      expect(rice.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const rice = new Rice(mockScene as any, 100, 100);

      expect(rice.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should change texture when boiled", () => {
      const rice = new Rice(mockScene as any, 100, 100);

      rice.addCookstate("boil");

      expect(rice.texture.key).toBe("item_rice_cooked");
    });

    it("should add boil state to cookStates", () => {
      const rice = new Rice(mockScene as any, 100, 100);

      rice.addCookstate("boil");

      expect(rice.cookStates).toContain("boil");
    });

    it("should not change texture for non-boil states", () => {
      const rice = new Rice(mockScene as any, 100, 100);

      rice.addCookstate("steam");

      expect(rice.texture.key).toBe("item_rice");
    });

    it("should add steam state to cookStates", () => {
      const rice = new Rice(mockScene as any, 100, 100);

      rice.addCookstate("steam");

      expect(rice.cookStates).toContain("steam");
    });

    it("should handle multiple cook states", () => {
      const rice = new Rice(mockScene as any, 100, 100);

      rice.addCookstate("boil");
      rice.addCookstate("mix");

      expect(rice.cookStates).toContain("boil");
      expect(rice.cookStates).toContain("mix");
      expect(rice.cookStates.length).toBe(2);
    });
  });
});
