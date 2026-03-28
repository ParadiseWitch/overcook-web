<template>
  <div class="grid">
    <label v-for="field in scoreFields" :key="field.key" class="field">
      <span>{{ field.label }}</span>
      <input :value="scores[field.key]" type="number" min="0" @input="$emit('update:score', field.key, ($event.target as HTMLInputElement).value)">
    </label>
  </div>
</template>

<script setup lang="ts">
const scoreFields = [
  { key: "star1", label: "一星分数" },
  { key: "star2", label: "二星分数" },
  { key: "star3", label: "三星分数" },
  { key: "star4", label: "四星分数" },
] as const;

defineProps<{
  scores: Record<(typeof scoreFields)[number]["key"], number>;
}>();

defineEmits<{
  (e: "update:score", key: (typeof scoreFields)[number]["key"], value: string): void;
}>();
</script>

<style scoped>
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
