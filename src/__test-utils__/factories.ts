import { vi } from "vitest";
import { FoodState } from "../game/item/ingredient/ingredient";
import {
  FoodDef,
  IngredientDef,
  Recipe,
  ingredientDef,
  foodDef,
} from "../game/recipe/types";

export function createIngredientDef(
  type: string,
  cookStates: FoodState[] = []
): IngredientDef {
  return ingredientDef(type, cookStates);
}

export function createFoodDef(
  components: (FoodDef | IngredientDef)[],
  cookStates: FoodState[] = []
): FoodDef {
  return foodDef(components, cookStates);
}

export function createRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "test-recipe",
    category: "test",
    name: "Test Recipe",
    displayName: "Test Recipe",
    targetFood: createFoodDef([createIngredientDef("tomato", ["cut"])]),
    difficulty: 1,
    baseScore: 100,
    ...overrides,
  };
}

export function createMockStation(x = 100, y = 100, canFire = true) {
  return {
    x,
    y,
    canFire,
    canPick: true,
    workStatus: "idle" as "idle" | "working" | "done" | "danger" | "fire",
    item: null as any,
    placeItem: vi.fn().mockReturnValue(true),
    removeItem: vi.fn(),
  };
}

export function createMockPlayer(x = 100, y = 100) {
  return {
    x,
    y,
    heldItem: null as any,
    facing: { x: 1, y: 0, angle: () => 0 },
  };
}

export function createMockItem(x = 100, y = 100) {
  return {
    x,
    y,
    heldBy: null as any,
    station: null as any,
    isFlying: false,
    body: {
      enable: true,
      setVelocity: vi.fn(),
    },
    setDepth: vi.fn(),
    setVelocity: vi.fn(),
    setVisible: vi.fn(),
    destroy: vi.fn(),
    getProgress: vi.fn().mockReturnValue(0),
    setProgress: vi.fn(),
  };
}

export function createMockIngredient(
  type: string,
  cookStates: FoodState[] = []
) {
  return {
    ingredientType: type,
    cookStates: [...cookStates],
    x: 100,
    y: 100,
    heldBy: null as any,
    station: null as any,
    isFlying: false,
    canBeBase: false,
    acceptedToppings: undefined as string[] | undefined,
    maxToppings: undefined as number | undefined,
    body: { enable: true },
    setVelocity: vi.fn(),
    getProgress: vi.fn().mockReturnValue(0),
    setProgress: vi.fn(),
    addCookstate: vi.fn(),
    lastCookState: vi.fn().mockImplementation(function (this: any) {
      return this.cookStates[this.cookStates.length - 1];
    }),
    hasCookState: vi.fn().mockImplementation(function (this: any, state: FoodState) {
      return this.cookStates.includes(state);
    }),
  };
}
