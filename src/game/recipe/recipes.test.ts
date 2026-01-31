import { describe, it, expect } from "vitest";
import {
  ALL_RECIPES,
  lettuceSaladRecipe,
  lettuceTomatoSaladRecipe,
  fishSushiRecipe,
  fishSashimiRecipe,
  tomatoSoupRecipe,
  vegetableSoupRecipe,
  plainCakeRecipe,
  chocolateCakeRecipe,
  meatBurgerRecipe,
  cheeseBurgerRecipe,
  getRecipesByCategory,
  getRecipeById,
  getRecipesByDifficulty,
} from "./recipes";

describe("recipes", () => {
  describe("recipe definitions", () => {
    it("should have correct lettuce salad recipe", () => {
      expect(lettuceSaladRecipe.id).toBe("lettuce-salad");
      expect(lettuceSaladRecipe.category).toBe("salad");
      expect(lettuceSaladRecipe.difficulty).toBe(1);
      expect(lettuceSaladRecipe.baseScore).toBe(20);
    });

    it("should have correct lettuce tomato salad recipe", () => {
      expect(lettuceTomatoSaladRecipe.id).toBe("lettuce-tomato-salad");
      expect(lettuceTomatoSaladRecipe.category).toBe("salad");
      expect(lettuceTomatoSaladRecipe.difficulty).toBe(1);
      expect(lettuceTomatoSaladRecipe.baseScore).toBe(30);
    });

    it("should have correct fish sushi recipe", () => {
      expect(fishSushiRecipe.id).toBe("fish-sushi");
      expect(fishSushiRecipe.category).toBe("japanese");
      expect(fishSushiRecipe.difficulty).toBe(2);
      expect(fishSushiRecipe.baseScore).toBe(50);
    });

    it("should have correct fish sashimi recipe", () => {
      expect(fishSashimiRecipe.id).toBe("fish-sashimi");
      expect(fishSashimiRecipe.category).toBe("japanese");
      expect(fishSashimiRecipe.difficulty).toBe(1);
    });

    it("should have correct tomato soup recipe", () => {
      expect(tomatoSoupRecipe.id).toBe("tomato-soup");
      expect(tomatoSoupRecipe.category).toBe("soup");
      expect(tomatoSoupRecipe.difficulty).toBe(2);
    });

    it("should have correct vegetable soup recipe", () => {
      expect(vegetableSoupRecipe.id).toBe("vegetable-soup");
      expect(vegetableSoupRecipe.category).toBe("soup");
      expect(vegetableSoupRecipe.difficulty).toBe(2);
      expect(vegetableSoupRecipe.baseScore).toBe(50);
    });

    it("should have correct plain cake recipe", () => {
      expect(plainCakeRecipe.id).toBe("plain-cake");
      expect(plainCakeRecipe.category).toBe("cake");
      expect(plainCakeRecipe.difficulty).toBe(3);
      expect(plainCakeRecipe.baseScore).toBe(60);
    });

    it("should have correct chocolate cake recipe", () => {
      expect(chocolateCakeRecipe.id).toBe("chocolate-cake");
      expect(chocolateCakeRecipe.category).toBe("cake");
      expect(chocolateCakeRecipe.difficulty).toBe(4);
      expect(chocolateCakeRecipe.baseScore).toBe(80);
    });

    it("should have correct meat burger recipe", () => {
      expect(meatBurgerRecipe.id).toBe("meat-burger");
      expect(meatBurgerRecipe.category).toBe("burger");
      expect(meatBurgerRecipe.difficulty).toBe(2);
    });

    it("should have correct cheese burger recipe", () => {
      expect(cheeseBurgerRecipe.id).toBe("cheese-burger");
      expect(cheeseBurgerRecipe.category).toBe("burger");
      expect(cheeseBurgerRecipe.difficulty).toBe(3);
    });
  });

  describe("ALL_RECIPES", () => {
    it("should contain all 10 recipes", () => {
      expect(ALL_RECIPES.length).toBe(10);
    });

    it("should contain all expected recipes", () => {
      const recipeIds = ALL_RECIPES.map((r) => r.id);

      expect(recipeIds).toContain("lettuce-salad");
      expect(recipeIds).toContain("lettuce-tomato-salad");
      expect(recipeIds).toContain("fish-sushi");
      expect(recipeIds).toContain("fish-sashimi");
      expect(recipeIds).toContain("tomato-soup");
      expect(recipeIds).toContain("vegetable-soup");
      expect(recipeIds).toContain("plain-cake");
      expect(recipeIds).toContain("chocolate-cake");
      expect(recipeIds).toContain("meat-burger");
      expect(recipeIds).toContain("cheese-burger");
    });

    it("should have valid targetFood for all recipes", () => {
      ALL_RECIPES.forEach((recipe) => {
        expect(recipe.targetFood).toBeDefined();
        expect(recipe.targetFood.components).toBeDefined();
        expect(Array.isArray(recipe.targetFood.components)).toBe(true);
      });
    });
  });

  describe("getRecipesByCategory", () => {
    it("should return salad recipes", () => {
      const salads = getRecipesByCategory("salad");

      expect(salads.length).toBe(2);
      expect(salads.every((r) => r.category === "salad")).toBe(true);
    });

    it("should return japanese recipes", () => {
      const japanese = getRecipesByCategory("japanese");

      expect(japanese.length).toBe(2);
      expect(japanese.every((r) => r.category === "japanese")).toBe(true);
    });

    it("should return soup recipes", () => {
      const soups = getRecipesByCategory("soup");

      expect(soups.length).toBe(2);
      expect(soups.every((r) => r.category === "soup")).toBe(true);
    });

    it("should return cake recipes", () => {
      const cakes = getRecipesByCategory("cake");

      expect(cakes.length).toBe(2);
      expect(cakes.every((r) => r.category === "cake")).toBe(true);
    });

    it("should return burger recipes", () => {
      const burgers = getRecipesByCategory("burger");

      expect(burgers.length).toBe(2);
      expect(burgers.every((r) => r.category === "burger")).toBe(true);
    });

    it("should return empty array for unknown category", () => {
      const unknown = getRecipesByCategory("unknown");

      expect(unknown.length).toBe(0);
    });
  });

  describe("getRecipeById", () => {
    it("should return correct recipe by id", () => {
      const recipe = getRecipeById("lettuce-salad");

      expect(recipe).toBe(lettuceSaladRecipe);
    });

    it("should return fish sushi by id", () => {
      const recipe = getRecipeById("fish-sushi");

      expect(recipe).toBe(fishSushiRecipe);
    });

    it("should return chocolate cake by id", () => {
      const recipe = getRecipeById("chocolate-cake");

      expect(recipe).toBe(chocolateCakeRecipe);
    });

    it("should return undefined for unknown id", () => {
      const recipe = getRecipeById("unknown-recipe");

      expect(recipe).toBeUndefined();
    });

    it("should return undefined for empty id", () => {
      const recipe = getRecipeById("");

      expect(recipe).toBeUndefined();
    });
  });

  describe("getRecipesByDifficulty", () => {
    it("should return recipes with difficulty 1", () => {
      const easy = getRecipesByDifficulty(1, 1);

      expect(easy.length).toBeGreaterThan(0);
      expect(easy.every((r) => r.difficulty === 1)).toBe(true);
    });

    it("should return recipes with difficulty 2", () => {
      const medium = getRecipesByDifficulty(2, 2);

      expect(medium.length).toBeGreaterThan(0);
      expect(medium.every((r) => r.difficulty === 2)).toBe(true);
    });

    it("should return recipes within difficulty range 1-2", () => {
      const easyToMedium = getRecipesByDifficulty(1, 2);

      expect(easyToMedium.length).toBeGreaterThan(0);
      expect(
        easyToMedium.every((r) => r.difficulty >= 1 && r.difficulty <= 2)
      ).toBe(true);
    });

    it("should return recipes within difficulty range 3-4", () => {
      const hardToExpert = getRecipesByDifficulty(3, 4);

      expect(hardToExpert.length).toBeGreaterThan(0);
      expect(
        hardToExpert.every((r) => r.difficulty >= 3 && r.difficulty <= 4)
      ).toBe(true);
    });

    it("should return all recipes for range 1-4", () => {
      const all = getRecipesByDifficulty(1, 4);

      expect(all.length).toBe(ALL_RECIPES.length);
    });

    it("should return empty array for range with no matches", () => {
      const none = getRecipesByDifficulty(10, 20);

      expect(none.length).toBe(0);
    });
  });
});
