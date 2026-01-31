import { describe, it, expect, vi, beforeEach } from "vitest";
import { Carrot } from "./carrot";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Carrot", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const carrot = new Carrot(mockScene as any, 100, 100);

      expect(carrot.texture.key).toBe("item_carrot");
    });

    it("should initialize with custom texture", () => {
      const carrot = new Carrot(mockScene as any, 100, 100, "custom_texture");

      expect(carrot.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to carrot", () => {
      const carrot = new Carrot(mockScene as any, 100, 100);

      expect(carrot.ingredientType).toBe("carrot");
    });

    it("should set position correctly", () => {
      const carrot = new Carrot(mockScene as any, 150, 200);

      expect(carrot.x).toBe(150);
      expect(carrot.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const carrot = new Carrot(mockScene as any, 100, 100);

      expect(carrot.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should change texture when cut", () => {
      const carrot = new Carrot(mockScene as any, 100, 100);

      carrot.addCookstate("cut");

      expect(carrot.texture.key).toBe("item_carrot_cut");
    });

    it("should add cut state to cookStates", () => {
      const carrot = new Carrot(mockScene as any, 100, 100);

      carrot.addCookstate("cut");

      expect(carrot.cookStates).toContain("cut");
    });

    it("should not change texture for non-cut states", () => {
      const carrot = new Carrot(mockScene as any, 100, 100);

      carrot.addCookstate("boil");

      expect(carrot.texture.key).toBe("item_carrot");
    });

    it("should add boil state to cookStates", () => {
      const carrot = new Carrot(mockScene as any, 100, 100);

      carrot.addCookstate("boil");

      expect(carrot.cookStates).toContain("boil");
    });

    it("should handle multiple cook states", () => {
      const carrot = new Carrot(mockScene as any, 100, 100);

      carrot.addCookstate("cut");
      carrot.addCookstate("boil");

      expect(carrot.cookStates).toContain("cut");
      expect(carrot.cookStates).toContain("boil");
      expect(carrot.cookStates.length).toBe(2);
    });
  });
});
