<template>
  <div v-if="selectedObject" class="section-grid">
    <p class="selection-title">当前选中：{{ selectedTitle }}</p>
    <div class="grid">
      <label v-for="field in selectedFields" :key="field.key" class="field">
        <span>{{ field.label }}</span>
        <input
          v-if="field.type === 'text'"
          :value="readField(field.key)"
          type="text"
          @input="$emit('patch', field, ($event.target as HTMLInputElement).value)"
        >
        <input
          v-else-if="field.type === 'number'"
          :value="readField(field.key)"
          type="number"
          :min="field.min"
          :max="field.max"
          :step="field.step ?? 1"
          @input="$emit('patch', field, ($event.target as HTMLInputElement).value)"
        >
        <input
          v-else-if="field.type === 'checkbox'"
          :checked="Boolean(readField(field.key))"
          type="checkbox"
          @change="$emit('patch', field, ($event.target as HTMLInputElement).checked)"
        >
        <input
          v-else-if="field.type === 'color'"
          :value="readField(field.key)"
          type="color"
          @input="$emit('patch', field, ($event.target as HTMLInputElement).value)"
        >
        <select
          v-else
          :value="readField(field.key)"
          @change="$emit('patch', field, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="option in field.options" :key="String(option.value)" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>
    <button type="button" class="danger" @click="$emit('delete-selection')">删除当前对象</button>
  </div>
  <p v-else class="hint">
    请选择一个地板、工作站或玩家出生点，然后在这里编辑它的属性。
  </p>
</template>

<script setup lang="ts">
type EditableField = {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "select" | "color";
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string | number }>;
};

const props = defineProps<{
  selectedObject: { kind: string; object: Record<string, unknown> } | null;
  selectedTitle: string;
  selectedFields: EditableField[];
}>();

const emit = defineEmits<{
  (e: "patch", field: EditableField, value: unknown): void;
  (e: "delete-selection"): void;
}>();

function readField(key: string) {
  const value = props.selectedObject?.object[key];
  if (key === "color") {
    return `#${Math.max(0, Number(value ?? 0x4da6ff)).toString(16).padStart(6, "0").slice(-6)}`;
  }
  if (value === undefined || value === null) {
    return key === "rotation" ? 0 : "";
  }
  return value;
}
</script>

<style scoped>
.section-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selection-title,
.hint {
  margin: 0;
  color: #94a3b8;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

input,
select {
  border-radius: 10px;
  border: 1px solid #334155;
  background: #020617;
  color: inherit;
  padding: 8px 10px;
  box-sizing: border-box;
}

input[type="checkbox"] {
  width: auto;
  accent-color: #38bdf8;
}

input[type="color"] {
  padding: 4px;
  min-height: 42px;
}

.danger {
  border-radius: 10px;
  border: 1px solid #7f1d1d;
  background: #991b1b;
  color: inherit;
  padding: 8px 12px;
  cursor: pointer;
}
</style>
