import { describe, it, expect, vi, beforeEach } from "vitest";
import { Tomato } from "./tomato";
import { createMockScene } from "../../../__mocks__/phaser";

describe("Tomato", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default texture", () => {
      const tomato = new Tomato(mockScene as any, 100, 100);

      expect(tomato.texture.key).toBe("item_tomato");
    });

    it("should initialize with custom texture", () => {
      const tomato = new Tomato(mockScene as any, 100, 100, "custom_texture");

      expect(tomato.texture.key).toBe("custom_texture");
    });

    it("should set ingredient type to tomato", () => {
      const tomato = new Tomato(mockScene as any, 100, 100);

      expect(tomato.ingredientType).toBe("tomato");
    });

    it("should set position correctly", () => {
      const tomato = new Tomato(mockScene as any, 150, 200);

      expect(tomato.x).toBe(150);
      expect(tomato.y).toBe(200);
    });

    it("should start with empty cook states", () => {
      const tomato = new Tomato(mockScene as any, 100, 100);

      expect(tomato.cookStates).toEqual([]);
    });
  });

  describe("addCookstate", () => {
    it("should change texture when cut", () => {
      const tomato = new Tomato(mockScene as any, 100, 100);

      tomato.addCookstate("cut");

      expect(tomato.texture.key).toBe("item_tomato_cut");
    });

    it("should add cut state to cookStates", () => {
      const tomato = new Tomato(mockScene as any, 100, 100);

      tomato.addCookstate("cut");

      expect(tomato.cookStates).toContain("cut");
    });

    it("should not change texture for non-cut states", () => {
      const tomato = new Tomato(mockScene as any, 100, 100);

      tomato.addCookstate("boil");

      expect(tomato.texture.key).toBe("item_tomato");
    });

    it("should add boil state to cookStates", () => {
      const tomato = new Tomato(mockScene as any, 100, 100);

      tomato.addCookstate("boil");

      expect(tomato.cookStates).toContain("boil");
    });

    it("should handle multiple cook states", () => {
      const tomato = new Tomato(mockScene as any, 100, 100);

      tomato.addCookstate("cut");
      tomato.addCookstate("boil");

      expect(tomato.cookStates).toContain("cut");
      expect(tomato.cookStates).toContain("boil");
      expect(tomato.cookStates.length).toBe(2);
    });
  });
});