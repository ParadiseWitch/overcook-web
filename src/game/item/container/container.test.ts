import { describe, it, expect, vi, beforeEach } from "vitest";

class MockSprite {
  scene: any;
  x: number = 0;
  y: number = 0;
  texture: { key: string } = { key: "" };
  constructor(scene: any, x: number, y: number, texture: string) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.texture = { key: texture };
  }
  setDepth() { return this; }
  setTexture(key: string) { this.texture = { key }; return this; }
  setCircle() { return this; }
  destroy() {}
}

const MockPhaser = {
  Physics: { Arcade: { Sprite: MockSprite, StaticGroup: class {} } },
  GameObjects: { Rectangle: class {} },
};

(globalThis as any).Phaser = MockPhaser;

vi.mock("phaser", () => ({
  default: MockPhaser,
  ...MockPhaser,
}));

vi.mock("../../stations/station", () => ({
  Station: class MockStation {},
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
    getProgress() { return 0; }
    setProgress() {}
    setVelocity() {}
    setTexture(key: string) { this.texture = { key }; return this; }
    setCircle() { return this; }
  },
}));

import { Plate } from "./plate";
import { Ingredient } from "../ingredient/ingredient";
import Food from "../food";

const createMockScene = () => ({
  add: {
    rectangle: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      x: 0,
      y: 0,
      width: 0,
    }),
    existing: vi.fn(),
  },
  physics: {
    add: {
      existing: vi.fn(),
    },
  },
});

const createMockIngredient = (
  type: string,
  cookStates: string[] = []
): Ingredient => {
  const scene = createMockScene();
  const ingredient = new Ingredient(scene as any, 0, 0, type, type);
  ingredient.cookStates = cookStates as any;
  return ingredient;
};

describe("Container", () => {
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe("Plate (concrete Container)", () => {
    describe("constructor", () => {
      it("should initialize with empty status by default", () => {
        const plate = new Plate(mockScene as any, 100, 100);

        expect(plate.status).toBe("empty");
        expect(plate.isEmpty()).toBe(true);
      });

      it("should initialize with specified status", () => {
        const plate = new Plate(mockScene as any, 100, 100, "dirty");

        expect(plate.status).toBe("dirty");
      });

      it("should set position correctly", () => {
        const plate = new Plate(mockScene as any, 150, 200);

        expect(plate.x).toBe(150);
        expect(plate.y).toBe(200);
      });

      it("should have canTransfer enabled by default", () => {
        const plate = new Plate(mockScene as any, 100, 100);

        expect(plate.canTransfer).toBe(true);
      });
    });

    describe("canAddIngredient", () => {
      it("should accept processed ingredients", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        const ingredient = createMockIngredient("tomato", ["cut"]);

        expect(plate.canAddIngredient(ingredient)).toBe(true);
      });

      it("should reject unprocessed ingredients", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        const ingredient = createMockIngredient("tomato", []);

        expect(plate.canAddIngredient(ingredient)).toBe(false);
      });
    });

    describe("addIngredient", () => {
      it("should add processed ingredient successfully", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        const ingredient = createMockIngredient("tomato", ["cut"]);

        const result = plate.addIngredient(ingredient);

        expect(result).toBe(true);
        expect(plate.isEmpty()).toBe(false);
      });

      it("should reject when container is full", () => {
        const plate = new Plate(mockScene as any, 100, 100);

        for (let i = 0; i < 4; i++) {
          plate.addIngredient(createMockIngredient(`item${i}`, ["cut"]));
        }

        const extraIngredient = createMockIngredient("extra", ["cut"]);
        const result = plate.addIngredient(extraIngredient);

        expect(result).toBe(false);
      });

      it("should reject unprocessed ingredient", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        const ingredient = createMockIngredient("tomato", []);

        const result = plate.addIngredient(ingredient);

        expect(result).toBe(false);
      });
    });

    describe("isEmpty and isFull", () => {
      it("should return true for empty container", () => {
        const plate = new Plate(mockScene as any, 100, 100);

        expect(plate.isEmpty()).toBe(true);
        expect(plate.isFull()).toBe(false);
      });

      it("should return false after adding ingredient", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        plate.addIngredient(createMockIngredient("tomato", ["cut"]));

        expect(plate.isEmpty()).toBe(false);
      });

      it("should return true when full", () => {
        const plate = new Plate(mockScene as any, 100, 100);

        for (let i = 0; i < 4; i++) {
          plate.addIngredient(createMockIngredient(`item${i}`, ["cut"]));
        }

        expect(plate.isFull()).toBe(true);
      });
    });

    describe("progress", () => {
      it("should delegate progress to food", () => {
        const plate = new Plate(mockScene as any, 100, 100);

        plate.setProgress(50);
        expect(plate.getProgress()).toBe(50);
      });
    });

    describe("transferTo", () => {
      it("should transfer contents to empty container", () => {
        const plate1 = new Plate(mockScene as any, 100, 100);
        const plate2 = new Plate(mockScene as any, 200, 200);

        plate1.addIngredient(createMockIngredient("tomato", ["cut"]));
        const originalFood = plate1.food;

        plate1.transferTo(plate2);

        expect(plate2.food).toBe(originalFood);
      });

      it("should not transfer when source is empty", () => {
        const plate1 = new Plate(mockScene as any, 100, 100);
        const plate2 = new Plate(mockScene as any, 200, 200);

        const originalFood = plate2.food;
        plate1.transferTo(plate2);

        expect(plate2.food).toBe(originalFood);
      });

      it("should not transfer when target is not empty", () => {
        const plate1 = new Plate(mockScene as any, 100, 100);
        const plate2 = new Plate(mockScene as any, 200, 200);

        plate1.addIngredient(createMockIngredient("tomato", ["cut"]));
        plate2.addIngredient(createMockIngredient("onion", ["cut"]));

        const originalFood1 = plate1.food;
        const originalFood2 = plate2.food;

        plate1.transferTo(plate2);

        expect(plate1.food).toBe(originalFood1);
        expect(plate2.food).toBe(originalFood2);
      });

      it("should not transfer when canTransfer is false", () => {
        const plate1 = new Plate(mockScene as any, 100, 100);
        const plate2 = new Plate(mockScene as any, 200, 200);

        plate1.addIngredient(createMockIngredient("tomato", ["cut"]));
        plate1.canTransfer = false;

        const originalFood1 = plate1.food;
        plate1.transferTo(plate2);

        expect(plate1.food).toBe(originalFood1);
      });
    });

    describe("canAdd", () => {
      it("should accept ingredient that passes canAddIngredient", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        const ingredient = createMockIngredient("tomato", ["cut"]);

        expect(plate.canAdd(ingredient)).toBe(true);
      });

      it("should reject ingredient that fails canAddIngredient", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        const ingredient = createMockIngredient("tomato", []);

        expect(plate.canAdd(ingredient)).toBe(false);
      });

      it("should accept Food when not full", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        const food = new Food(mockScene as any, 0, 0, "food");

        expect(plate.canAdd(food)).toBe(true);
      });

      it("should reject Food when full", () => {
        const plate = new Plate(mockScene as any, 100, 100);

        for (let i = 0; i < 4; i++) {
          plate.addIngredient(createMockIngredient(`item${i}`, ["cut"]));
        }

        const food = new Food(mockScene as any, 0, 0, "food");
        expect(plate.canAdd(food)).toBe(false);
      });
    });

    describe("addFood", () => {
      it("should add food component successfully", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        const ingredient = createMockIngredient("tomato", ["cut"]);

        const result = plate.addFood(ingredient);

        expect(result).toBe(true);
        expect(plate.isEmpty()).toBe(false);
      });
    });

    describe("update", () => {
      it("should update food position via setXy", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        plate.addIngredient(createMockIngredient("tomato", ["cut"]));

        const setXySpy = vi.spyOn(plate.food, "setXy");
        plate.update(16);

        expect(setXySpy).toHaveBeenCalledWith(plate.x, plate.y);
      });
    });

    describe("clear", () => {
      it("should destroy food contents", () => {
        const plate = new Plate(mockScene as any, 100, 100);
        plate.addIngredient(createMockIngredient("tomato", ["cut"]));

        const destroySpy = vi.spyOn(plate.food, "destroy");
        plate.clear();

        expect(destroySpy).toHaveBeenCalled();
      });
    });
  });
});