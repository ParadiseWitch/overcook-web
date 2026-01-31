import { expect } from "vitest";
import Food from "../game/item/food";
import { FoodDef } from "../game/recipe/types";
import { FoodMatcher } from "../game/recipe/food-matcher";

expect.extend({
  toMatchRecipe(received: Food, expected: FoodDef) {
    const pass = FoodMatcher.matches(received, expected);
    return {
      pass,
      message: () =>
        pass
          ? `Expected food not to match recipe`
          : `Expected food to match recipe. Similarity: ${FoodMatcher.calculateSimilarity(received, expected)}%`,
    };
  },
});

declare module "vitest" {
  interface Assertion<T = any> {
    toMatchRecipe(expected: FoodDef): T;
  }
}
