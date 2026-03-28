<template>
  <div class="section-grid">
    <div class="recipe-list">
      <label v-for="recipe in recipeOptions" :key="recipe.id" class="check">
        <input :checked="recipes.includes(recipe.id)" type="checkbox" @change="$emit('toggle-recipe', recipe.id, ($event.target as HTMLInputElement).checked)">
        <span>{{ recipe.label }}</span>
      </label>
    </div>
    <div class="grid">
      <label class="field">
        <span>最大同时订单数</span>
        <input :value="maxActiveOrders" type="number" min="1" @input="$emit('update:max-active', ($event.target as HTMLInputElement).value)">
      </label>
      <label class="field">
        <span>订单生成间隔</span>
        <input :value="spawnInterval" type="number" min="1" @input="$emit('update:spawn-interval', ($event.target as HTMLInputElement).value)">
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecipeOption } from "@/game/editor/level-editor-utils";

defineProps<{
  recipeOptions: RecipeOption[];
  recipes: string[];
  maxActiveOrders: number;
  spawnInterval: number;
}>();

defineEmits<{
  (e: "toggle-recipe", recipeId: string, checked: boolean): void;
  (e: "update:max-active", value: string): void;
  (e: "update:spawn-interval", value: string): void;
}>();
</script>

<style scoped>
.section-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recipe-list {
  display: grid;
  gap: 8px;
  max-height: 240px;
  overflow: auto;
  padding-right: 4px;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

input {
  border-radius: 10px;
  border: 1px solid #334155;
  background: #020617;
  color: inherit;
  padding: 8px 10px;
  box-sizing: border-box;
}
</style>
