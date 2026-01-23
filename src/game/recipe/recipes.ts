import { Recipe, ingredientDef, foodDef } from './types';

// ============ 沙拉类菜谱 ============

export const lettuceSaladRecipe: Recipe = {
  id: 'lettuce-salad',
  category: 'salad',
  name: 'lettuce-salad',
  displayName: '生菜沙拉',
  difficulty: 1,
  baseScore: 20,
  targetFood: foodDef([
    ingredientDef('lettuce', ['cut'])
  ])
};

export const lettuceTomatoSaladRecipe: Recipe = {
  id: 'lettuce-tomato-salad',
  category: 'salad',
  name: 'lettuce-tomato-salad',
  displayName: '生菜番茄沙拉',
  difficulty: 1,
  baseScore: 30,
  targetFood: foodDef([
    ingredientDef('lettuce', ['cut']),
    ingredientDef('tomato', ['cut'])
  ])
};

// ============ 日料类菜谱 ============

export const fishSushiRecipe: Recipe = {
  id: 'fish-sushi',
  category: 'japanese',
  name: 'fish-sushi',
  displayName: '鱼寿司',
  difficulty: 2,
  baseScore: 50,
  targetFood: foodDef([
    ingredientDef('fish', ['cut']),
    ingredientDef('rice', ['boil']),
    ingredientDef('seaweed', [])
  ])
};

export const fishSashimiRecipe: Recipe = {
  id: 'fish-sashimi',
  category: 'japanese',
  name: 'fish-sashimi',
  displayName: '鱼刺身',
  difficulty: 1,
  baseScore: 25,
  targetFood: foodDef([
    ingredientDef('fish', ['cut'])
  ])
};

// ============ 汤类菜谱 ============

export const tomatoSoupRecipe: Recipe = {
  id: 'tomato-soup',
  category: 'soup',
  name: 'tomato-soup',
  displayName: '番茄汤',
  difficulty: 2,
  baseScore: 40,
  targetFood: foodDef([
    ingredientDef('tomato', ['cut'])
  ], ['stir-fry'])
};

export const vegetableSoupRecipe: Recipe = {
  id: 'vegetable-soup',
  category: 'soup',
  name: 'vegetable-soup',
  displayName: '蔬菜汤',
  difficulty: 2,
  baseScore: 50,
  targetFood: foodDef([
    ingredientDef('onion', ['cut']),
    ingredientDef('potato', ['cut']),
    ingredientDef('carrot', ['cut'])
  ], ['stir-fry'])
};

// ============ 蛋糕类菜谱 ============
// 清蛋糕：需要先搅拌（鸡蛋+面粉），再煎烤

export const plainCakeRecipe: Recipe = {
  id: 'plain-cake',
  category: 'cake',
  name: 'plain-cake',
  displayName: '清蛋糕',
  difficulty: 3,
  baseScore: 60,
  targetFood: foodDef([
    foodDef([
      ingredientDef('egg', []),
      ingredientDef('flour', [])
    ], ['mix'])
  ], ['pan-fry'])
};

export const chocolateCakeRecipe: Recipe = {
  id: 'chocolate-cake',
  category: 'cake',
  name: 'chocolate-cake',
  displayName: '巧克力蛋糕',
  difficulty: 4,
  baseScore: 80,
  targetFood: foodDef([
    foodDef([
      ingredientDef('egg', []),
      ingredientDef('flour', []),
      ingredientDef('chocolate', ['cut'])
    ], ['mix'])
  ], ['pan-fry'])
};

// ============ 汉堡类菜谱 ============
// 汉堡面包作为基底，上面叠加煎好的肉饼等配料

export const meatBurgerRecipe: Recipe = {
  id: 'meat-burger',
  category: 'burger',
  name: 'meat-burger',
  displayName: '肉堡',
  difficulty: 2,
  baseScore: 45,
  targetFood: foodDef([
    ingredientDef('burger-bun', []),
    ingredientDef('meat', ['cut', 'pan-fry'])
  ])
};

export const cheeseBurgerRecipe: Recipe = {
  id: 'cheese-burger',
  category: 'burger',
  name: 'cheese-burger',
  displayName: '芝士汉堡',
  difficulty: 3,
  baseScore: 55,
  targetFood: foodDef([
    ingredientDef('burger-bun', []),
    ingredientDef('meat', ['cut', 'pan-fry']),
    ingredientDef('cheese', ['cut'])
  ])
};

// ============ 菜谱集合 ============

export const ALL_RECIPES: Recipe[] = [
  lettuceSaladRecipe,
  lettuceTomatoSaladRecipe,
  fishSushiRecipe,
  fishSashimiRecipe,
  tomatoSoupRecipe,
  vegetableSoupRecipe,
  plainCakeRecipe,
  chocolateCakeRecipe,
  meatBurgerRecipe,
  cheeseBurgerRecipe
];

export function getRecipesByCategory(category: string): Recipe[] {
  return ALL_RECIPES.filter(r => r.category === category);
}

export function getRecipeById(id: string): Recipe | undefined {
  return ALL_RECIPES.find(r => r.id === id);
}

export function getRecipesByDifficulty(minDifficulty: number, maxDifficulty: number): Recipe[] {
  return ALL_RECIPES.filter(r => r.difficulty >= minDifficulty && r.difficulty <= maxDifficulty);
}
