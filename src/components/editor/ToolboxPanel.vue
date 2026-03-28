<template>
  <div class="section-grid">
    <div class="tool-group">
      <h3>画布操作</h3>
      <div class="tool-list">
        <button
          v-for="tool in canvasTools"
          :key="tool.id"
          type="button"
          class="tool"
          :class="{ active: activeTool === tool.id }"
          @click="$emit('toggle-tool', tool.id)"
        >
          {{ tool.label }}
        </button>
      </div>
    </div>

    <div class="tool-group">
      <h3>地板</h3>
      <div class="tool-list">
        <button
          v-for="tool in floorTools"
          :key="tool.id"
          type="button"
          class="tool"
          :class="{ active: activeTool === tool.id }"
          @click="$emit('toggle-tool', tool.id)"
        >
          {{ tool.label }}
        </button>
      </div>
    </div>

    <div class="tool-group">
      <h3>工作站</h3>
      <div class="tool-list">
        <button
          v-for="tool in stationTools"
          :key="tool.id"
          type="button"
          class="tool"
          :class="{ active: activeTool === tool.id }"
          @click="$emit('toggle-tool', tool.id)"
        >
          {{ tool.label }}
        </button>
      </div>
    </div>

    <div class="tool-group">
      <h3>玩家出生点</h3>
      <div class="tool-list">
        <button
          v-for="tool in playerTools"
          :key="tool.id"
          type="button"
          class="tool"
          :class="{ active: activeTool === tool.id }"
          @click="$emit('toggle-tool', tool.id)"
        >
          {{ tool.label }}
        </button>
      </div>
    </div>

    <div class="grid">
      <label class="field">
        <span>传送带方向</span>
        <select :value="conveyorDirection" @change="$emit('update:direction', ($event.target as HTMLSelectElement).value)">
          <option value="right">向右</option>
          <option value="left">向左</option>
          <option value="up">向上</option>
          <option value="down">向下</option>
        </select>
      </label>
      <label class="field">
        <span>传送带速度</span>
        <input :value="conveyorSpeed" type="number" min="1" max="500" @input="$emit('update:speed', ($event.target as HTMLInputElement).value)">
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTool: string | null;
  conveyorDirection: string;
  conveyorSpeed: number;
  canvasTools: Array<{ id: string; label: string }>;
  floorTools: Array<{ id: string; label: string }>;
  stationTools: Array<{ id: string; label: string }>;
  playerTools: Array<{ id: string; label: string }>;
}>();

defineEmits<{
  (e: "toggle-tool", id: string): void;
  (e: "update:direction", value: string): void;
  (e: "update:speed", value: string): void;
}>();
</script>

<style scoped>
.section-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tool-group h3 {
  margin: 0 0 8px;
  font-size: 13px;
  color: #cbd5e1;
}

.tool-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
  gap: 8px;
}

.tool {
  border-radius: 10px;
  border: 1px solid #475569;
  background: #0f172a;
  color: inherit;
  padding: 8px 12px;
  cursor: pointer;
}

.tool.active {
  background: #1d4ed8;
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
select {
  border-radius: 10px;
  border: 1px solid #334155;
  background: #020617;
  color: inherit;
  padding: 8px 10px;
  box-sizing: border-box;
}
</style>
