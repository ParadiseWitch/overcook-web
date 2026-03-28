<template>
  <section
    class="floating-panel"
    :class="{
      minimized,
      docked: state.dockedEdge !== null,
      dragging,
      'dock-left': state.dockedEdge === 'left',
      'dock-right': state.dockedEdge === 'right',
      'dock-top': state.dockedEdge === 'top',
      'dock-bottom': state.dockedEdge === 'bottom',
    }"
    :style="panelStyle"
  >
    <header class="panel-header" @pointerdown.stop.prevent="$emit('drag-start', $event)">
      <h2 class="panel-title">{{ title }}</h2>
      <div class="panel-actions">
        <button type="button" @click.stop="$emit('toggle-minimize')">
          {{ collapseLabel }}
        </button>
      </div>
    </header>

    <div v-if="!minimized" class="panel-content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { EditorPanelState } from "@/game/editor/editor-layout";

const props = defineProps<{
  title: string;
  state: EditorPanelState;
  minimized: boolean;
  dragging: boolean;
  styleObject: Record<string, string>;
}>();

defineEmits<{
  (e: "drag-start", event: PointerEvent): void;
  (e: "toggle-minimize"): void;
}>();

const panelStyle = computed(() => props.styleObject);
const collapseLabel = computed(() => {
  if (props.minimized) {
    return props.state.dockedEdge === "right" ? "←" : "→";
  }

  if (props.state.dockedEdge === "right") {
    return "→";
  }

  if (props.state.dockedEdge === "top") {
    return "↑";
  }

  if (props.state.dockedEdge === "bottom") {
    return "↓";
  }

  return "←";
});
</script>

<style scoped>
.floating-panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid rgba(51, 65, 85, 0.95);
  background: rgba(15, 23, 42, 0.94);
  color: #e2e8f0;
  box-shadow: 0 18px 60px rgba(2, 6, 23, 0.42);
  backdrop-filter: blur(14px);
  overflow: hidden;
  pointer-events: auto;
}

.floating-panel.dragging {
  box-shadow: 0 24px 72px rgba(2, 6, 23, 0.58);
}

.floating-panel.minimized {
  overflow: visible;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(30, 41, 59, 0.96);
  cursor: grab;
  user-select: none;
}

.panel-header:active {
  cursor: grabbing;
}

.panel-header h2 {
  margin: 0;
  font-size: 14px;
}

.panel-title {
  flex: 1 1 auto;
  min-width: 0;
}

.panel-actions {
  display: flex;
  gap: 6px;
}

.panel-actions button {
  border-radius: 8px;
  border: 1px solid #475569;
  background: #0f172a;
  color: inherit;
  padding: 6px 10px;
  cursor: pointer;
}

.panel-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.floating-panel.minimized .panel-content {
  display: none;
}

.floating-panel.minimized.dock-left,
.floating-panel.minimized.dock-right {
  width: 44px !important;
  min-width: 44px;
}

.floating-panel.minimized.dock-left .panel-header,
.floating-panel.minimized.dock-right .panel-header {
  height: 100%;
  flex-direction: column;
  gap: 8px;
  padding: 10px 6px;
}

.floating-panel.minimized.dock-left .panel-title,
.floating-panel.minimized.dock-right .panel-title {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  white-space: nowrap;
  overflow: hidden;
}

.floating-panel.minimized.dock-right .panel-title {
  transform: rotate(180deg);
}

.floating-panel.minimized.dock-top,
.floating-panel.minimized.dock-bottom {
  height: 44px !important;
  min-height: 44px;
}

.floating-panel.minimized.dock-top .panel-header,
.floating-panel.minimized.dock-bottom .panel-header {
  padding: 6px 10px;
}
</style>
