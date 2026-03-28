<template>
  <div class="section-grid">
    <label class="field">
      <span>关卡名称</span>
      <input :value="form.name" type="text" @input="$emit('update:name', ($event.target as HTMLInputElement).value)">
    </label>
    <label class="field">
      <span>关卡描述</span>
      <textarea :value="form.description" rows="3" @input="$emit('update:description', ($event.target as HTMLTextAreaElement).value)" />
    </label>
    <label class="field">
      <span>游戏模式</span>
      <select :value="form.gameType" @change="$emit('update:game-type', ($event.target as HTMLSelectElement).value)">
        <option value="local-coop">本地合作</option>
        <option value="local-versus">本地对战</option>
        <option value="online-coop">线上合作</option>
        <option value="online-versus">线上对战</option>
      </select>
    </label>
    <div class="grid compact-grid">
      <label class="field">
        <span>游戏时长</span>
        <input :value="form.duration" type="number" min="30" @input="$emit('update:duration', ($event.target as HTMLInputElement).value)">
      </label>
      <label class="field">
        <span>地图宽度</span>
        <input :value="form.map.width" type="number" min="5" max="50" @input="$emit('update:width', ($event.target as HTMLInputElement).value)">
      </label>
      <label class="field">
        <span>地图高度</span>
        <input :value="form.map.height" type="number" min="5" max="50" @input="$emit('update:height', ($event.target as HTMLInputElement).value)">
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  form: {
    name: string;
    description: string;
    gameType: string;
    duration: number;
    map: {
      width: number;
      height: number;
    };
  };
}>();

defineEmits<{
  (e: "update:name", value: string): void;
  (e: "update:description", value: string): void;
  (e: "update:game-type", value: string): void;
  (e: "update:duration", value: string): void;
  (e: "update:width", value: string): void;
  (e: "update:height", value: string): void;
}>();
</script>

<style scoped>
.section-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

input,
select,
textarea {
  border-radius: 10px;
  border: 1px solid #334155;
  background: #020617;
  color: inherit;
  padding: 8px 10px;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
}
</style>
