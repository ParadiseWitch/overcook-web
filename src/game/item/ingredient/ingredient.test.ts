import { describe, it, expect, vi, beforeEach } from "vitest";
import { Ingredient, BaseIngredientConfig } from "./ingredient";

vi.mock("phaser", () => ({
  default: {
    Physics: {
      Arcade: {
        Sprite: class {
          scene: any;
          x: number;
          y: number;
          texture: { key: string };
          constructor(scene: any, x: number, y: number, texture: string) {
            this.scene = scene;
            this.x = x;
            this.y = y;
            this.texture = { key: texture };
          }
          setDepth = vi.fn().mockReturnThis();
          setTexture = vi.fn().mockImplementation(function (this: any, key: string) {
            this.texture = { key };
            return this;
          });
          destroy = vi.fn();
        },
      },
    },
  },
  Physics: {
    Arcade: {
      Sprite: class {
        scene: any;
        x: number;
        y: number;
        texture: { key: string };
        constructor(scene: any, x: number, y: number, texture: string) {
          this.scene = scene;
          this.x = x;
          this.y = y;
          this.texture = { key: texture };
        }
        setDepth = vi.fn().mockReturnThis();
        setTexture = vi.fn().mockImplementation(function (this: any, key: string) {
          this.texture = { key };
          return this;
        });
        destroy = vi.fn();
      },
    },
  },
}));

vi.mock("..", () => ({
  Item: class MockItem {
    scene: any;
    x: number;
    y: number;
    texture: { key: string };
    heldBy: any = null;
    isFlying: boolean = false;
    body: any = { enable: true };

    constructor(scene: any, x: number, y: number, texture: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
      this.texture = { key: texture };
    }

    update() {}
    destroy() {}
    getProgress() {
      return 0;
    }
    setProgress() {}
    setVelocity() {}
    setTexture(key: string) {
      this.texture = { key };
      return this;
    }
  },
}));

const createMockScene = () => ({
  add: {
    existing: vi.fn(),
  },
  physics: {
    add: {
      existing: vi.fn(),
    },
  },
});

describe("Ingredient", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct type from parameter", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato_texture",
        "tomato"
      );

      expect(ingredient.ingredientType).toBe("tomato");
    });

    it("should use texture as type when ingredientType not provided", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "onion"
      );

      expect(ingredient.ingredientType).toBe("onion");
    });

    it("should initialize with empty cook states", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      expect(ingredient.cookStates).toHaveLength(0);
    });

    it("should set position correctly", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        150,
        200,
        "tomato",
        "tomato"
      );

      expect(ingredient.x).toBe(150);
      expect(ingredient.y).toBe(200);
    });

    it("should apply base config when provided", () => {
      const baseConfig: BaseIngredientConfig = {
        canBeBase: true,
        acceptedToppings: ["meat", "cheese"],
        maxToppings: 3,
      };

      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "bun",
        "bun",
        baseConfig
      );

      expect(ingredient.canBeBase).toBe(true);
      expect(ingredient.acceptedToppings).toEqual(["meat", "cheese"]);
      expect(ingredient.maxToppings).toBe(3);
    });

    it("should have default base config values when not provided", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      expect(ingredient.canBeBase).toBe(false);
      expect(ingredient.acceptedToppings).toBeUndefined();
      expect(ingredient.maxToppings).toBeUndefined();
    });
  });

  describe("cook states", () => {
    it("should add cook state and reset progress", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      ingredient.setProgress(50);
      ingredient.addCookstate("cut");

      expect(ingredient.cookStates).toContain("cut");
      expect(ingredient.getProgress()).toBe(0);
    });

    it("should change texture on overcook", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      ingredient.addCookstate("overcook");

      expect(ingredient.cookStates).toContain("overcook");
    });

    it("should return last cook state", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      expect(ingredient.lastCookState()).toBeUndefined();

      ingredient.addCookstate("cut");
      expect(ingredient.lastCookState()).toBe("cut");

      ingredient.addCookstate("boil");
      expect(ingredient.lastCookState()).toBe("boil");
    });

    it("should check if cook state exists", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      ingredient.addCookstate("cut");
      ingredient.addCookstate("boil");

      expect(ingredient.hasCookState("cut")).toBe(true);
      expect(ingredient.hasCookState("boil")).toBe(true);
      expect(ingredient.hasCookState("stir-fry")).toBe(false);
    });

    it("should support multiple cook states in sequence", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      ingredient.addCookstate("cut");
      ingredient.addCookstate("boil");
      ingredient.addCookstate("stir-fry");

      expect(ingredient.cookStates).toEqual(["cut", "boil", "stir-fry"]);
    });
  });

  describe("progress", () => {
    it("should get and set progress correctly", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      expect(ingredient.getProgress()).toBe(0);

      ingredient.setProgress(50);
      expect(ingredient.getProgress()).toBe(50);

      ingredient.setProgress(100);
      expect(ingredient.getProgress()).toBe(100);
    });

    it("should initialize with 0 progress", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      expect(ingredient.getProgress()).toBe(0);
    });
  });

  describe("ingredient types", () => {
    it("should support single cook state types", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      ingredient.addCookstate("cut");
      expect(ingredient.hasCookState("cut")).toBe(true);

      ingredient.addCookstate("boil");
      expect(ingredient.hasCookState("boil")).toBe(true);

      ingredient.addCookstate("deep-fry");
      expect(ingredient.hasCookState("deep-fry")).toBe(true);
    });

    it("should support multi cook state types", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "mixed",
        "mixed"
      );

      ingredient.addCookstate("stir-fry");
      ingredient.addCookstate("barbecue");
      ingredient.addCookstate("mix");

      expect(ingredient.hasCookState("stir-fry")).toBe(true);
      expect(ingredient.hasCookState("barbecue")).toBe(true);
      expect(ingredient.hasCookState("mix")).toBe(true);
    });

    it("should support special states", () => {
      const ingredient = new Ingredient(
        mockScene as any,
        100,
        100,
        "tomato",
        "tomato"
      );

      ingredient.addCookstate("overcook");
      expect(ingredient.hasCookState("overcook")).toBe(true);

      ingredient.addCookstate("burnt");
      expect(ingredient.hasCookState("burnt")).toBe(true);
    });
  });
});
