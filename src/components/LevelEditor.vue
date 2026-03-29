<template>
  <div ref="mapStage" class="editor-root">
    <div ref="gameHost" class="game-host" />

    <div class="top-toolbar">
      <div class="toolbar-group">
        <button type="button" @click="createNewLevel">新建</button>
        <button type="button" @click="downloadJson">保存</button>
        <button type="button" @click="openImportDialog">导入</button>
        <button type="button" @click="copyJson">导出</button>
      </div>

      <div class="toolbar-group">
        <button type="button" :class="{ active: mapViewMode === 'fit' }" @click="setMapViewMode('fit')">适配视图</button>
        <button type="button" :class="{ active: mapViewMode === 'browse' }"
          @click="setMapViewMode('browse')">浏览视图</button>
        <button type="button" @click="resetCameraView">重置视角</button>
      </div>
    </div>

    <p v-if="status.message" :class="['status-banner', status.tone]">{{ status.message }}</p>

    <div class="panel-layer">
      <EditorFloatingPanel v-for="panel in panelEntries" :key="panel.id" :title="panel.title"
        :state="panelLayouts[panel.id]" :style-object="getPanelStyle(panel.id)"
        :minimized="panelLayouts[panel.id].minimized" :dragging="draggingPanelId === panel.id"
        @drag-start="startPanelDrag(panel.id, $event)" @toggle-minimize="togglePanelMinimize(panel.id)">
        <BasicSettingsPanel v-if="panel.id === 'basic-settings'" :form="form" @update:name="updateName"
          @update:description="updateDescription" @update:game-type="updateGameType" @update:duration="updateDuration"
          @update:width="updateMapWidth" @update:height="updateMapHeight" />

        <ScoreTargetPanel v-else-if="panel.id === 'score-target'" :scores="form.scoreTarget"
          @update:score="updateScore" />

        <ToolboxPanel v-else-if="panel.id === 'toolbox'" :active-tool="activeTool"
          :conveyor-direction="toolOptions.conveyorDirection" :conveyor-speed="toolOptions.conveyorSpeed"
          :canvas-tools="canvasTools" :floor-tools="floorTools" :station-tools="stationTools"
          :player-tools="playerTools" @toggle-tool="toggleTool" @update:direction="updateConveyorDirection"
          @update:speed="updateConveyorSpeed" />

        <OrderPoolPanel v-else-if="panel.id === 'order-pool'" :recipe-options="recipeOptions"
          :recipes="form.orderPool.recipes" :max-active-orders="form.orderPool.maxActiveOrders"
          :spawn-interval="form.orderPool.spawnInterval" @toggle-recipe="toggleRecipe"
          @update:max-active="updateMaxActiveOrders" @update:spawn-interval="updateSpawnInterval" />

        <ValidationPanel v-else-if="panel.id === 'validation'" :validation="validation" />

        <PropertiesPanel v-else-if="panel.id === 'properties'" :selected-object="selectedObject"
          :selected-title="selectedTitle" :selected-fields="selectedFields" @patch="patchSelected"
          @delete-selection="deleteSelection" />
      </EditorFloatingPanel>
    </div>

    <div class="viewport-hud">
      <section class="minimap-panel">
        <div ref="minimapSurface" class="minimap-surface" @pointerdown.prevent="startMinimapDrag">
          <div class="minimap-world" />
          <div class="minimap-viewport" :style="minimapViewportStyle" />
        </div>

        <div class="zoom-controls">
          <button type="button" @click="changeZoomBy(-0.1)">-</button>
          <input class="zoom-slider" type="range" min="50" max="250" step="1" :value="zoomPercent"
            @input="updateZoomSlider">
          <button type="button" @click="changeZoomBy(0.1)">+</button>
          <input class="zoom-input" type="number" min="50" max="250" step="1" :value="zoomPercent"
            @change="updateZoomInput">
          <span class="zoom-unit">%</span>
        </div>
      </section>
    </div>

    <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="handleImport">
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef } from "vue";

import EditorFloatingPanel from "@/components/EditorFloatingPanel.vue";
import BasicSettingsPanel from "@/components/editor/BasicSettingsPanel.vue";
import OrderPoolPanel from "@/components/editor/OrderPoolPanel.vue";
import PropertiesPanel from "@/components/editor/PropertiesPanel.vue";
import ScoreTargetPanel from "@/components/editor/ScoreTargetPanel.vue";
import ToolboxPanel from "@/components/editor/ToolboxPanel.vue";
import ValidationPanel from "@/components/editor/ValidationPanel.vue";
import { createCenteredCameraState } from "@/game/editor/editor-camera";
import {
  type EditorPanelId,
} from "@/game/editor/editor-layout";
import { useEditorPanelLayout } from "@/components/editor/useEditorPanelLayout";
import { useLevelEditorMinimap } from "@/components/editor/useLevelEditorMinimap";
import { useLevelEditorPhaserBridge } from "@/components/editor/useLevelEditorPhaserBridge";
import {
  useLevelEditorState,
  type EditableField,
} from "@/components/editor/useLevelEditorState";
import { LevelEditorScene, type EditorCameraState, type MapViewMode } from "@/game/scenes/editor/level-editor-scene";
import { getDefaultLevelConfig } from "@/game/types/level-config";

const floorTools = [
  { id: "normal-floor", label: "普通地板" },
  { id: "wall-floor", label: "墙壁" },
  { id: "conveyor-floor", label: "传送带" },
];
const canvasTools = [
  { id: "hand-tool", label: "手形工具" },
  { id: "move-tool", label: "移动工具" },
  { id: "zoom-tool", label: "缩放工具" },
];
const stationTools = [
  { id: "counter", label: "空柜台" }, { id: "plate-counter", label: "盘子柜台" }, { id: "cut", label: "切菜板" },
  { id: "pot", label: "锅" }, { id: "sink", label: "洗碗池" }, { id: "delivery", label: "上菜口" },
  { id: "dirty-plate", label: "脏盘子点" }, { id: "trash", label: "垃圾桶" }, { id: "fire-extinguisher", label: "灭火器" },
  { id: "mixer", label: "搅拌器" }, { id: "ingredient-tomato", label: "番茄箱" }, { id: "ingredient-lettuce", label: "生菜箱" },
  { id: "ingredient-rice", label: "米箱" }, { id: "ingredient-fish", label: "鱼箱" }, { id: "ingredient-seaweed", label: "紫菜箱" },
  { id: "ingredient-onion", label: "洋葱箱" }, { id: "ingredient-potato", label: "土豆箱" }, { id: "ingredient-carrot", label: "胡萝卜箱" },
  { id: "ingredient-egg", label: "鸡蛋箱" }, { id: "ingredient-flour", label: "面粉箱" }, { id: "ingredient-meat", label: "肉箱" },
  { id: "ingredient-cheese", label: "芝士箱" }, { id: "ingredient-chocolate", label: "巧克力箱" }, { id: "ingredient-burger-bun", label: "面包胚箱" },
];
const playerTools = [{ id: "player-1", label: "玩家 1" }, { id: "player-2", label: "玩家 2" }];
const panelEntries: Array<{ id: EditorPanelId; title: string }> = [
  { id: "basic-settings", title: "基础设置" },
  { id: "score-target", title: "目标分数" },
  { id: "toolbox", title: "工具面板" },
  { id: "order-pool", title: "订单池" },
  { id: "validation", title: "校验结果" },
  { id: "properties", title: "属性面板" },
];

// 页面壳层只负责装配拆分后的编辑器控制器，避免再次堆积业务细节。
const mapStage = ref<HTMLElement | null>(null);
const gameHost = ref<HTMLElement | null>(null);
const minimapSurface = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
// Phaser 场景实例需要保持类实例语义，避免被 Vue 的 ref 展开后丢失精确类型。
const sceneRef = shallowRef<LevelEditorScene | null>(null);
const viewport = reactive({ width: window.innerWidth, height: window.innerHeight });
const mapViewMode = ref<MapViewMode>("fit");
const cameraState = reactive<EditorCameraState>(createCenteredCameraState({
  worldWidth: getDefaultLevelConfig().map.width * 48,
  worldHeight: getDefaultLevelConfig().map.height * 48,
  viewportWidth: viewport.width,
  viewportHeight: viewport.height,
  zoom: 1,
}));
const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;

const {
  activeTool,
  recipeOptions,
  validation,
  status,
  toolOptions,
  form,
  selectedObject,
  selectedTitle,
  selectedFields,
  onSceneConfigChanged,
  onSceneSelectionChanged,
  updateName,
  updateDescription,
  updateGameType,
  updateDuration,
  updateMapWidth,
  updateMapHeight,
  updateScore,
  updateMaxActiveOrders,
  updateSpawnInterval,
  updateConveyorDirection,
  updateConveyorSpeed,
  toggleTool,
  toggleRecipe,
  patchSelected,
  deleteSelection,
  createNewLevel,
  downloadJson,
  copyJson,
  openImportDialog,
  handleImport,
} = useLevelEditorState({
  sceneRef,
  fileInput,
});

/**
 * 同步场景侧视图模式变更到 Vue 状态，保证工具栏按钮高亮正确。
 */
function onSceneViewModeChanged(mode: MapViewMode) {
  mapViewMode.value = mode;
}

/**
 * 用场景最新的相机状态覆盖本地响应式对象，驱动 HUD 与小地图更新。
 */
function onSceneCameraChanged(payload: EditorCameraState) {
  Object.assign(cameraState, payload);
}

const {
  panelLayouts,
  draggingPanelId,
  startPanelDrag,
  togglePanelMinimize,
  getPanelStyle,
  normalizePanelsForViewport,
} = useEditorPanelLayout({
  panelEntries,
  viewport,
  sceneRef,
});

const {
  zoomPercent,
  minimapViewportStyle,
  startMinimapDrag,
  changeZoomBy,
  updateZoomSlider,
  updateZoomInput,
} = useLevelEditorMinimap({
  sceneRef,
  cameraState,
  minimapSurface,
  minimapWidth: MINIMAP_WIDTH,
  minimapHeight: MINIMAP_HEIGHT,
});

useLevelEditorPhaserBridge({
  mapStage,
  gameHost,
  sceneRef,
  viewport,
  cameraState,
  mapViewMode,
  toolOptions,
  onSceneConfigChanged,
  onSceneSelectionChanged,
  onSceneViewModeChanged,
  onSceneCameraChanged,
  normalizePanelsForViewport,
});

/**
 * 切换相机视图模式，并把当前选择同步给场景。
 */
function setMapViewMode(mode: MapViewMode) {
  mapViewMode.value = mode;
  sceneRef.value?.setMapViewMode(mode);
}

/**
 * 请求场景恢复当前视图模式下的默认相机位置和缩放。
 */
function resetCameraView() {
  sceneRef.value?.resetCameraView();
}
</script>

<style scoped>
.editor-root {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at top, rgba(14, 165, 233, .12), transparent 35%), linear-gradient(180deg, #0f172a 0%, #020617 100%);
}

.game-host {
  width: 100%;
  height: 100%;
}

.top-toolbar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 120;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid rgba(51, 65, 85, .95);
  background: rgba(15, 23, 42, .92);
  color: #e2e8f0;
  backdrop-filter: blur(12px);
  box-shadow: 0 16px 48px rgba(2, 6, 23, .45);
}

.toolbar-group {
  display: flex;
  gap: 8px;
}

.toolbar-group button {
  border-radius: 10px;
  border: 1px solid #475569;
  background: #0f172a;
  color: inherit;
  padding: 8px 12px;
  cursor: pointer;
}

.toolbar-group button.active {
  background: #1d4ed8;
}

.status-banner {
  position: absolute;
  top: 76px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 119;
  padding: 10px 14px;
  border-radius: 12px;
}

.status-banner.ok {
  background: rgba(34, 197, 94, .15);
  color: #bbf7d0;
}

.status-banner.bad {
  background: rgba(239, 68, 68, .15);
  color: #fecaca;
}

.status-banner.warn,
.status-banner.info {
  background: rgba(14, 165, 233, .15);
  color: #bae6fd;
}

.panel-layer {
  position: absolute;
  inset: 0;
  z-index: 110;
  pointer-events: none;
}

.viewport-hud {
  position: absolute;
  inset: 0;
  z-index: 105;
  pointer-events: none;
}

.scrollbar {
  position: absolute;
  pointer-events: auto;
  accent-color: #38bdf8;
}

.scrollbar-x {
  left: 24px;
  right: 244px;
  bottom: 18px;
}

.scrollbar-y {
  top: 96px;
  right: 18px;
  width: 18px;
  height: 220px;
  writing-mode: vertical-lr;
  direction: rtl;
}

.minimap-panel {
  position: absolute;
  right: 24px;
  bottom: 24px;
  width: 216px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(51, 65, 85, .95);
  background: rgba(15, 23, 42, .92);
  box-shadow: 0 16px 48px rgba(2, 6, 23, .45);
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

.minimap-surface {
  position: relative;
  width: 180px;
  height: 120px;
  margin: 0 auto 12px;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(51, 65, 85, .95), rgba(30, 41, 59, .95));
  cursor: grab;
}

.minimap-world {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(148, 163, 184, .16) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, .16) 1px, transparent 1px);
  background-size: 12px 12px;
}

.minimap-viewport {
  position: absolute;
  border: 2px solid #38bdf8;
  background: rgba(56, 189, 248, .18);
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .16);
}

.zoom-controls {
  display: grid;
  grid-template-columns: 32px 1fr 32px 58px 20px;
  gap: 8px;
  align-items: center;
}

.zoom-controls button,
.zoom-input {
  border-radius: 8px;
  border: 1px solid #475569;
  background: #0f172a;
  color: #e2e8f0;
  height: 32px;
}

.zoom-controls button {
  cursor: pointer;
}

.zoom-slider {
  width: 100%;
  accent-color: #38bdf8;
}

.zoom-input {
  text-align: center;
  padding: 0 6px;
}

.zoom-unit {
  color: #cbd5e1;
  font-size: 13px;
  text-align: center;
}

.hidden {
  display: none;
}

@media (max-width: 960px) {
  .top-toolbar {
    max-width: calc(100vw - 24px);
    flex-wrap: wrap;
    justify-content: center;
  }

  .status-banner {
    width: min(320px, calc(100vw - 24px));
    text-align: center;
  }

  .scrollbar-x {
    right: 24px;
    bottom: 216px;
  }

  .scrollbar-y {
    top: 132px;
  }

  .minimap-panel {
    width: 200px;
  }

  .minimap-surface {
    width: 168px;
    height: 112px;
  }
}
</style>
