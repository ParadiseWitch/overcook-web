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
        <button type="button" :class="{ active: mapViewMode === 'browse' }" @click="setMapViewMode('browse')">浏览视图</button>
        <button type="button" @click="resetCameraView">重置视角</button>
      </div>
    </div>

    <p v-if="status.message" :class="['status-banner', status.tone]">{{ status.message }}</p>

    <div class="panel-layer">
      <EditorFloatingPanel
        v-for="panel in panelEntries"
        :key="panel.id"
        :title="panel.title"
        :state="panelLayouts[panel.id]"
        :style-object="getPanelStyle(panel.id)"
        :minimized="panelLayouts[panel.id].minimized"
        :dragging="draggingPanelId === panel.id"
        @drag-start="startPanelDrag(panel.id, $event)"
        @toggle-minimize="togglePanelMinimize(panel.id)"
      >
        <BasicSettingsPanel
          v-if="panel.id === 'basic-settings'"
          :form="form"
          @update:name="updateName"
          @update:description="updateDescription"
          @update:game-type="updateGameType"
          @update:duration="updateDuration"
          @update:width="updateMapWidth"
          @update:height="updateMapHeight"
        />

        <ScoreTargetPanel
          v-else-if="panel.id === 'score-target'"
          :scores="form.scoreTarget"
          @update:score="updateScore"
        />

        <ToolboxPanel
          v-else-if="panel.id === 'toolbox'"
          :active-tool="activeTool"
          :conveyor-direction="toolOptions.conveyorDirection"
          :conveyor-speed="toolOptions.conveyorSpeed"
          :canvas-tools="canvasTools"
          :floor-tools="floorTools"
          :station-tools="stationTools"
          :player-tools="playerTools"
          @toggle-tool="toggleTool"
          @update:direction="updateConveyorDirection"
          @update:speed="updateConveyorSpeed"
        />

        <OrderPoolPanel
          v-else-if="panel.id === 'order-pool'"
          :recipe-options="recipeOptions"
          :recipes="form.orderPool.recipes"
          :max-active-orders="form.orderPool.maxActiveOrders"
          :spawn-interval="form.orderPool.spawnInterval"
          @toggle-recipe="toggleRecipe"
          @update:max-active="updateMaxActiveOrders"
          @update:spawn-interval="updateSpawnInterval"
        />

        <ValidationPanel
          v-else-if="panel.id === 'validation'"
          :validation="validation"
        />

        <PropertiesPanel
          v-else-if="panel.id === 'properties'"
          :selected-object="selectedObject"
          :selected-title="selectedTitle"
          :selected-fields="selectedFields"
          @patch="patchSelected"
          @delete-selection="deleteSelection"
        />
      </EditorFloatingPanel>
    </div>

    <div class="viewport-hud">
      <input
        class="scrollbar scrollbar-x"
        type="range"
        min="0"
        :max="scrollRange.maxScrollX"
        :step="1"
        :value="cameraState.scrollX"
        :disabled="scrollRange.maxScrollX === 0"
        @input="updateHorizontalScroll"
      >

      <input
        class="scrollbar scrollbar-y"
        type="range"
        min="0"
        :max="scrollRange.maxScrollY"
        :step="1"
        :value="cameraState.scrollY"
        :disabled="scrollRange.maxScrollY === 0"
        @input="updateVerticalScroll"
      >

      <section class="minimap-panel">
        <div
          ref="minimapSurface"
          class="minimap-surface"
          @pointerdown.prevent="startMinimapDrag"
        >
          <div class="minimap-world" />
          <div class="minimap-viewport" :style="minimapViewportStyle" />
        </div>

        <div class="zoom-controls">
          <button type="button" @click="changeZoomBy(-0.1)">-</button>
          <input
            class="zoom-slider"
            type="range"
            min="50"
            max="250"
            step="1"
            :value="zoomPercent"
            @input="updateZoomSlider"
          >
          <button type="button" @click="changeZoomBy(0.1)">+</button>
          <input
            class="zoom-input"
            type="number"
            min="50"
            max="250"
            step="1"
            :value="zoomPercent"
            @change="updateZoomInput"
          >
          <span class="zoom-unit">%</span>
        </div>
      </section>
    </div>

    <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="handleImport">
  </div>
</template>

<script setup lang="ts">
import Phaser from "phaser";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";

import EditorFloatingPanel from "@/components/EditorFloatingPanel.vue";
import BasicSettingsPanel from "@/components/editor/BasicSettingsPanel.vue";
import OrderPoolPanel from "@/components/editor/OrderPoolPanel.vue";
import PropertiesPanel from "@/components/editor/PropertiesPanel.vue";
import ScoreTargetPanel from "@/components/editor/ScoreTargetPanel.vue";
import ToolboxPanel from "@/components/editor/ToolboxPanel.vue";
import ValidationPanel from "@/components/editor/ValidationPanel.vue";
import {
  computeMinimapViewportRect,
  computeScrollRange,
  createCenteredCameraState,
  computeViewportCenterFromMinimap,
  normalizeZoomPercent,
} from "@/game/editor/editor-camera";
import {
  EDITOR_LAYOUT_STORAGE_KEY,
  clampFloatingPosition,
  getDockedPanelIds,
  getExpandedDockPanel,
  getNextDockOrder,
  restoreEditorLayout,
  type DockedEdge,
  type EditorLayoutState,
  type EditorPanelId,
} from "@/game/editor/editor-layout";
import { getAllRecipeOptions, type RecipeOption, type ValidationResult } from "@/game/editor/level-editor-utils";
import { LevelEditorScene, type EditorCameraState, type MapViewMode } from "@/game/scenes/level-editor-scene";
import type { IngredientType, LevelConfig } from "@/game/types/level-config";
import { getDefaultLevelConfig } from "@/game/types/level-config";

type SelectionPayload = { kind: "floor" | "station" | "player"; object: Record<string, unknown> } | null;
type EditableField = {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "select" | "color";
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string | number }>;
};

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
const ingredientOptions: Array<{ label: string; value: IngredientType }> = [
  { label: "番茄", value: "tomato" }, { label: "生菜", value: "lettuce" }, { label: "米", value: "rice" }, { label: "鱼", value: "fish" },
  { label: "紫菜", value: "seaweed" }, { label: "洋葱", value: "onion" }, { label: "土豆", value: "potato" }, { label: "胡萝卜", value: "carrot" },
  { label: "鸡蛋", value: "egg" }, { label: "面粉", value: "flour" }, { label: "肉", value: "meat" }, { label: "芝士", value: "cheese" },
  { label: "巧克力", value: "chocolate" }, { label: "汉堡面包胚", value: "burger-bun" },
];
const panelEntries: Array<{ id: EditorPanelId; title: string }> = [
  { id: "basic-settings", title: "基础设置" },
  { id: "score-target", title: "目标分数" },
  { id: "toolbox", title: "工具面板" },
  { id: "order-pool", title: "订单池" },
  { id: "validation", title: "校验结果" },
  { id: "properties", title: "属性面板" },
];

const typeLabelMap: Record<string, string> = {
  normal: "普通地板", wall: "墙壁", conveyor: "传送带", counter: "空柜台", "plate-counter": "盘子柜台", cut: "切菜板", pot: "锅",
  sink: "洗碗池", delivery: "上菜口", "dirty-plate": "脏盘子点", trash: "垃圾桶", "fire-extinguisher": "灭火器", mixer: "搅拌器", ingredient: "食材箱",
};

const mapStage = ref<HTMLElement | null>(null);
const gameHost = ref<HTMLElement | null>(null);
const minimapSurface = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const sceneRef = ref<LevelEditorScene | null>(null);
const selectedObject = ref<SelectionPayload>(null);
const activeTool = ref<string | null>(null);
const recipeOptions = ref<RecipeOption[]>(getAllRecipeOptions());
const validation = ref<ValidationResult>({ valid: false, errors: [], warnings: [] });
const status = reactive({ message: "", tone: "info" });
const toolOptions = reactive({ conveyorDirection: "right", conveyorSpeed: 100 });
const viewport = reactive({ width: window.innerWidth, height: window.innerHeight });
const form = reactive(createForm(getDefaultLevelConfig()));
const panelLayouts = reactive<EditorLayoutState>(restoreEditorLayout(readStoredLayout()));
const mapViewMode = ref<MapViewMode>("fit");
const cameraState = reactive<EditorCameraState>(createCenteredCameraState({
  worldWidth: form.map.width * 48,
  worldHeight: form.map.height * 48,
  viewportWidth: viewport.width,
  viewportHeight: viewport.height,
  zoom: 1,
}));
const draggingPanelId = ref<EditorPanelId | null>(null);
const dragState = reactive({
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
  sourceDockedEdge: null as DockedEdge,
  sourceDockOrder: -1,
});
const minimapDrag = reactive({
  active: false,
});
let gameInstance: Phaser.Game | null = null;
let resizeObserver: ResizeObserver | null = null;
const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;

const selectedTitle = computed(() => {
  if (!selectedObject.value) return "";
  if (selectedObject.value.kind === "player") return `玩家 ${selectedObject.value.object.id}`;
  return typeLabelMap[String(selectedObject.value.object.type ?? "")] ?? String(selectedObject.value.object.type ?? "");
});

const selectedFields = computed<EditableField[]>(() => {
  if (!selectedObject.value) return [];
  const fields: EditableField[] = [
    { key: "x", label: "网格 X", type: "number", min: 0, max: form.map.width - 1 },
    { key: "y", label: "网格 Y", type: "number", min: 0, max: form.map.height - 1 },
  ];
  if (selectedObject.value.kind === "player") return [...fields, { key: "color", label: "颜色", type: "color" }];
  if (selectedObject.value.kind === "floor" && selectedObject.value.object.type === "conveyor") {
    return [...fields, { key: "direction", label: "方向", type: "select", options: [{ label: "向右", value: "right" }, { label: "向左", value: "left" }, { label: "向上", value: "up" }, { label: "向下", value: "down" }] }, { key: "speed", label: "速度", type: "number", min: 1, max: 500, step: 10 }];
  }
  fields.push({ key: "rotation", label: "旋转角度", type: "number", min: 0, max: 360, step: 5 });
  switch (selectedObject.value.object.type) {
    case "ingredient": fields.push({ key: "ingredientType", label: "食材类型", type: "select", options: ingredientOptions }, { key: "infinite", label: "无限供应", type: "checkbox" }, { key: "maxCount", label: "最大数量", type: "number", min: 1 }); break;
    case "plate-counter": fields.push({ key: "infinite", label: "无限供应", type: "checkbox" }, { key: "maxPlates", label: "最大盘子数", type: "number", min: 1 }); break;
    case "cut": fields.push({ key: "cutSpeed", label: "切割速度", type: "number", min: 0.1, step: 0.1 }); break;
    case "pot": fields.push({ key: "cookSpeed", label: "烹饪速度", type: "number", min: 0.1, step: 0.1 }, { key: "canBurn", label: "允许烧焦", type: "checkbox" }, { key: "canFire", label: "允许着火", type: "checkbox" }); break;
    case "sink": fields.push({ key: "washSpeed", label: "清洗速度", type: "number", min: 0.1, step: 0.1 }); break;
    case "delivery": fields.push({ key: "deliveryTime", label: "上菜动画时长", type: "number", min: 100, step: 100 }); break;
    case "dirty-plate": fields.push({ key: "spawnInterval", label: "生成间隔", type: "number", min: 1 }, { key: "maxPlates", label: "最大脏盘数", type: "number", min: 1 }); break;
    case "fire-extinguisher": fields.push({ key: "infinite", label: "无限使用", type: "checkbox" }, { key: "capacity", label: "容量", type: "number", min: 1 }); break;
    case "mixer": fields.push({ key: "mixSpeed", label: "搅拌速度", type: "number", min: 0.1, step: 0.1 }); break;
  }
  return fields;
});
const scrollRange = computed(() =>
  computeScrollRange({
    worldWidth: cameraState.worldWidth,
    worldHeight: cameraState.worldHeight,
    visibleWidth: cameraState.visibleWidth,
    visibleHeight: cameraState.visibleHeight,
  }),
);
const zoomPercent = computed(() => Math.round(cameraState.zoom * 100));
const minimapViewportStyle = computed(() => {
  const rect = computeMinimapViewportRect({
    worldWidth: cameraState.worldWidth,
    worldHeight: cameraState.worldHeight,
    visibleWidth: cameraState.visibleWidth,
    visibleHeight: cameraState.visibleHeight,
    scrollX: Math.max(0, cameraState.scrollX),
    scrollY: Math.max(0, cameraState.scrollY),
    minimapWidth: MINIMAP_WIDTH,
    minimapHeight: MINIMAP_HEIGHT,
  });

  return {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${Math.max(18, rect.width)}px`,
    height: `${Math.max(18, rect.height)}px`,
  };
});

onMounted(() => {
  initializeGame();
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", stopPanelDrag);
});

onUnmounted(() => {
  sceneRef.value?.events.off("config-changed", onSceneConfigChanged);
  sceneRef.value?.events.off("object-selected", onSceneSelectionChanged);
  sceneRef.value?.events.off("view-mode-changed", onSceneViewModeChanged);
  sceneRef.value?.events.off("camera-changed", onSceneCameraChanged);
  resizeObserver?.disconnect();
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", stopPanelDrag);
  gameInstance?.destroy(true);
});

function initializeGame() {
  const updateViewport = () => {
    const rect = mapStage.value?.getBoundingClientRect();
    viewport.width = Math.max(320, Math.floor(rect?.width ?? window.innerWidth));
    viewport.height = Math.max(240, Math.floor(rect?.height ?? window.innerHeight));
    gameInstance?.scale.resize(viewport.width, viewport.height);
    sceneRef.value?.setViewportSize(viewport.width, viewport.height);
    normalizePanelsForViewport();
  };
  updateViewport();
  if (!gameHost.value) return;
  gameInstance = new Phaser.Game({ type: Phaser.AUTO, width: viewport.width, height: viewport.height, parent: gameHost.value, backgroundColor: "#020617", physics: { default: "arcade", arcade: { debug: false, gravity: { y: 0 } } }, scene: [LevelEditorScene] });
  resizeObserver = new ResizeObserver(updateViewport);
  resizeObserver.observe(gameHost.value);
  attachSceneWhenReady();
}

function attachSceneWhenReady(attempt = 0) {
  if (!gameInstance) return;
  const scene = gameInstance.scene.getScene("LevelEditorScene") as LevelEditorScene | null;
  if (!scene || !scene.sys.isActive()) {
    if (attempt < 20) {
      window.setTimeout(() => attachSceneWhenReady(attempt + 1), 50);
    }
    return;
  }

  sceneRef.value = scene;
  scene.setToolOptions({ ...toolOptions });
  scene.setViewportSize(viewport.width, viewport.height);
  scene.setMapViewMode(mapViewMode.value);
  scene.resetCameraView();
  scene.events.on("config-changed", onSceneConfigChanged);
  scene.events.on("object-selected", onSceneSelectionChanged);
  scene.events.on("view-mode-changed", onSceneViewModeChanged);
  scene.events.on("camera-changed", onSceneCameraChanged);
  onSceneCameraChanged(scene.getCameraState());
}

function onSceneConfigChanged(payload: { config: LevelConfig; validation: ValidationResult }) {
  Object.assign(form, createForm(payload.config));
  validation.value = payload.validation;
}
function onSceneSelectionChanged(payload: SelectionPayload) { selectedObject.value = payload ? clone(payload) : null; }
function onSceneViewModeChanged(mode: MapViewMode) { mapViewMode.value = mode; }
function onSceneCameraChanged(payload: EditorCameraState) { Object.assign(cameraState, payload); }
function updateName(value: string) { sceneRef.value?.updateLevelName(value); }
function updateDescription(value: string) { sceneRef.value?.updateLevelDescription(value); }
function updateGameType(value: string) { sceneRef.value?.updateGameType(value as LevelConfig["gameType"]); }
function updateDuration(value: string) { sceneRef.value?.updateDuration(parseNumber(value, 300)); }
function updateMapWidth(value: string) { form.map.width = parseNumber(value, form.map.width); sceneRef.value?.updateMapSize(form.map.width, form.map.height); }
function updateMapHeight(value: string) { form.map.height = parseNumber(value, form.map.height); sceneRef.value?.updateMapSize(form.map.width, form.map.height); }
function updateScore(key: "star1" | "star2" | "star3" | "star4", value: string) { sceneRef.value?.updateScoreTarget({ [key]: parseNumber(value, 0) }); }
function updateMaxActiveOrders(value: string) { sceneRef.value?.updateOrderPool({ maxActiveOrders: parseNumber(value, 1) }); }
function updateSpawnInterval(value: string) { sceneRef.value?.updateOrderPool({ spawnInterval: parseNumber(value, 1) }); }
function updateConveyorDirection(value: string) { toolOptions.conveyorDirection = value; sceneRef.value?.setToolOptions({ conveyorDirection: value as "up" | "down" | "left" | "right" }); }
function updateConveyorSpeed(value: string) { toolOptions.conveyorSpeed = parseNumber(value, 100); sceneRef.value?.setToolOptions({ conveyorSpeed: toolOptions.conveyorSpeed }); }
function toggleTool(toolId: string) { activeTool.value = activeTool.value === toolId ? null : toolId; sceneRef.value?.setSelectedTool(activeTool.value); }
function toggleRecipe(recipeId: string, checked: boolean) { const recipes = new Set(form.orderPool.recipes); checked ? recipes.add(recipeId) : recipes.delete(recipeId); sceneRef.value?.updateOrderPool({ recipes: [...recipes] }); }
function patchSelected(field: EditableField, raw: unknown) { if (!sceneRef.value) return; let value = raw; if (field.type === "number") value = parseNumber(String(raw), Number(raw || 0)); if (field.type === "color") value = Number.parseInt(String(raw).replace("#", ""), 16); sceneRef.value.updateSelectedObject({ [field.key]: value }); }
function deleteSelection() { sceneRef.value?.deleteSelectedObject(); setStatus("已删除当前选中对象。", "info"); }
function createNewLevel() { sceneRef.value?.createNewLevel(); activeTool.value = null; sceneRef.value?.setSelectedTool(null); setStatus("已创建新的空白关卡。", "ok"); }
function setMapViewMode(mode: MapViewMode) { mapViewMode.value = mode; sceneRef.value?.setMapViewMode(mode); }
function resetCameraView() { sceneRef.value?.resetCameraView(); }
function updateHorizontalScroll(event: Event) { sceneRef.value?.setCameraScroll(Number((event.target as HTMLInputElement).value), cameraState.scrollY); }
function updateVerticalScroll(event: Event) { sceneRef.value?.setCameraScroll(cameraState.scrollX, Number((event.target as HTMLInputElement).value)); }
function changeZoomBy(delta: number) { sceneRef.value?.setCameraZoom(cameraState.zoom + delta); }
function updateZoomSlider(event: Event) { sceneRef.value?.setCameraZoom(normalizeZoomPercent(Number((event.target as HTMLInputElement).value))); }
function updateZoomInput(event: Event) { sceneRef.value?.setCameraZoom(normalizeZoomPercent(Number((event.target as HTMLInputElement).value))); }
function startMinimapDrag(event: PointerEvent) {
  minimapDrag.active = true;
  sceneRef.value?.setInteractionBlocked(true);
  updateMinimapDrag(event);
}
function updateMinimapDrag(event: PointerEvent) {
  if (!minimapDrag.active || !minimapSurface.value) return;
  const rect = minimapSurface.value.getBoundingClientRect();
  const pointerX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
  const pointerY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
  const nextCenter = computeViewportCenterFromMinimap({
    pointerX,
    pointerY,
    worldWidth: cameraState.worldWidth,
    worldHeight: cameraState.worldHeight,
    minimapWidth: rect.width,
    minimapHeight: rect.height,
  });
  sceneRef.value?.setCameraCenter(nextCenter.centerX, nextCenter.centerY);
}
function downloadJson() { if (!sceneRef.value) return; const config = sceneRef.value.exportLevelConfig(); const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${config.name || "level"}.json`; a.click(); URL.revokeObjectURL(url); setStatus("已下载关卡 JSON 文件。", "ok"); }
async function copyJson() { if (!sceneRef.value) return; try { await navigator.clipboard.writeText(JSON.stringify(sceneRef.value.exportLevelConfig(), null, 2)); setStatus("已将关卡 JSON 复制到剪贴板。", "ok"); } catch { setStatus("复制失败，请重试。", "warn"); } }
function openImportDialog() { fileInput.value?.click(); }
async function handleImport(event: Event) { const target = event.target as HTMLInputElement; const file = target.files?.[0]; if (!file || !sceneRef.value) return; const text = await file.text(); const result = sceneRef.value.importLevelConfig(text); setStatus(result.success ? `已导入 ${file.name}。` : (result.error ?? "导入失败。"), result.success ? "ok" : "bad"); target.value = ""; }

function startPanelDrag(id: EditorPanelId, event: PointerEvent) {
  const panel = panelLayouts[id];
  const metrics = panelMetrics(id);

  draggingPanelId.value = id;
  sceneRef.value?.setInteractionBlocked(true);
  bringToFront(id);

  dragState.offsetX = event.clientX - metrics.left;
  dragState.offsetY = event.clientY - metrics.top;
  dragState.width = metrics.width;
  dragState.height = metrics.height;
  dragState.sourceDockedEdge = panel.dockedEdge;
  dragState.sourceDockOrder = panel.dockOrder;

  panel.position = { x: metrics.left, y: metrics.top };
  panel.dockedEdge = null;
  panel.minimized = false;
}
function handlePointerMove(event: PointerEvent) {
  if (minimapDrag.active) {
    updateMinimapDrag(event);
    return;
  }
  if (!draggingPanelId.value) return;

  const id = draggingPanelId.value;
  panelLayouts[id].position = clampFloatingPosition(
    { x: event.clientX - dragState.offsetX, y: event.clientY - dragState.offsetY },
    { width: dragState.width, height: dragState.height },
    viewport,
  );
}
function stopPanelDrag() {
  if (minimapDrag.active) {
    minimapDrag.active = false;
    sceneRef.value?.setInteractionBlocked(false);
    return;
  }
  if (!draggingPanelId.value) return;

  const id = draggingPanelId.value;
  const panel = panelLayouts[id];
  const position = panel.position ?? { x: 0, y: 0 };
  const edge = detectDockEdge(position.x, position.y, {
    width: dragState.width || getPanelDimensions(id).width,
    height: dragState.height || getPanelDimensions(id).height,
  });

  if (edge) {
    panel.dockedEdge = edge;
    panel.position = null;
    panel.dockOrder = dragState.sourceDockedEdge === edge
      ? dragState.sourceDockOrder
      : getNextDockOrder(panelLayouts, id, edge);
    if (isCompactViewport()) {
      minimizeSiblingPanels(id, edge);
    }
  }

  draggingPanelId.value = null;
  dragState.offsetX = 0;
  dragState.offsetY = 0;
  dragState.width = 0;
  dragState.height = 0;
  dragState.sourceDockedEdge = null;
  dragState.sourceDockOrder = -1;
  sceneRef.value?.setInteractionBlocked(false);
  persistLayout();
}
function togglePanelMinimize(id: EditorPanelId) {
  const panel = panelLayouts[id];
  if (!panel.minimized) {
    const edge = panel.dockedEdge ?? detectDockEdgeFromMetrics(id) ?? "left";
    panel.dockedEdge = edge;
    panel.position = null;
    panel.dockOrder = getNextDockOrder(panelLayouts, id, edge);
    panel.minimized = true;
  } else {
    panel.minimized = false;
    if (isCompactViewport()) {
      minimizeSiblingPanels(id, panel.dockedEdge);
    }
  }
  persistLayout();
}
function getPanelStyle(id: EditorPanelId) {
  const panel = panelLayouts[id];
  const metrics = panelMetrics(id);
  return {
    left: `${metrics.left}px`,
    top: `${metrics.top}px`,
    width: `${metrics.width}px`,
    height: `${metrics.height}px`,
    zIndex: `${panel.zIndex}`,
  };
}
function panelMetrics(id: EditorPanelId) {
  const panel = panelLayouts[id];
  const spacing = 16;
  const compact = isCompactViewport();
  const { width: panelWidth, height: panelHeight } = getPanelDimensions(id);
  const clampedPosition = clampFloatingPosition(
    {
      x: panel.position?.x ?? spacing,
      y: panel.position?.y ?? spacing + 80,
    },
    { width: panelWidth, height: panelHeight },
    viewport,
  );
  if (!panel.dockedEdge) {
    return {
      left: clampedPosition.x,
      top: clampedPosition.y,
      width: panelWidth,
      height: panelHeight,
    };
  }

  const siblings = dockedPanels(panel.dockedEdge);
  let stackOffset = spacing;
  for (const siblingId of siblings) {
    if (siblingId === id) {
      break;
    }
    stackOffset += getPanelDimensions(siblingId).height + spacing;
  }

  if (panel.dockedEdge === "left") {
    return { left: spacing, top: stackOffset, width: panelWidth, height: panelHeight };
  }
  if (panel.dockedEdge === "right") {
    return { left: viewport.width - panelWidth - spacing, top: stackOffset, width: panelWidth, height: panelHeight };
  }
  if (panel.dockedEdge === "top") {
    return { left: spacing + siblings.indexOf(id) * (panelWidth + spacing), top: spacing, width: panelWidth, height: panelHeight };
  }
  return {
    left: spacing + siblings.indexOf(id) * (panelWidth + spacing),
    top: viewport.height - panelHeight - spacing,
    width: panelWidth,
    height: panelHeight,
  };
}
function dockedPanels(edge: Exclude<DockedEdge, null>) {
  return getDockedPanelIds(panelLayouts, edge);
}
function detectDockEdgeFromMetrics(id: EditorPanelId) {
  const metrics = panelMetrics(id);
  return detectDockEdge(metrics.left, metrics.top, { width: metrics.width, height: metrics.height });
}
function detectDockEdge(left: number, top: number, size: { width: number; height: number }): Exclude<DockedEdge, null> | null { const t = 24; if (left <= t) return "left"; if (left + size.width >= viewport.width - t) return "right"; if (top <= t) return "top"; if (top + size.height >= viewport.height - t) return "bottom"; return null; }
function bringToFront(id: EditorPanelId) { panelLayouts[id].zIndex = Math.max(...panelEntries.map((panel) => panelLayouts[panel.id].zIndex)) + 1; }
function persistLayout() { localStorage.setItem(EDITOR_LAYOUT_STORAGE_KEY, JSON.stringify(panelLayouts)); }
function readStoredLayout() { try { const raw = localStorage.getItem(EDITOR_LAYOUT_STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function setStatus(message: string, tone: string) { status.message = message; status.tone = tone; }
function isCompactViewport() { return viewport.width < 1180 || viewport.height < 760; }
function getPanelDimensions(id: EditorPanelId) {
  const panel = panelLayouts[id];
  const compact = isCompactViewport();
  const floatingWidth = Math.min(panel.size.width, Math.max(260, viewport.width - 48));
  const dockedWidth = compact
    ? Math.min(panel.size.width, Math.max(240, viewport.width - 96))
    : Math.min(panel.size.width, Math.max(220, viewport.width - 48));

  return {
    width: panel.minimized
      ? panel.dockedEdge === "top" || panel.dockedEdge === "bottom"
        ? 132
        : 44
      : panel.dockedEdge
        ? dockedWidth
        : floatingWidth,
    height: panel.minimized
      ? panel.dockedEdge === "top" || panel.dockedEdge === "bottom"
        ? 44
        : 120
      : Math.min(panel.size.height, viewport.height - (compact ? 120 : 48)),
  };
}
function minimizeSiblingPanels(activeId: EditorPanelId, edge: DockedEdge) {
  const sameEdge = edge ? dockedPanels(edge).filter((id) => id !== activeId) : [];
  sameEdge.forEach((id) => {
    panelLayouts[id].minimized = true;
  });
  if (viewport.width < 980) {
    panelEntries
      .map((panel) => panel.id)
      .filter((id) => id !== activeId && panelLayouts[id].dockedEdge !== null)
      .forEach((id) => {
        panelLayouts[id].minimized = true;
      });
  }
}
function normalizePanelsForViewport() {
  if (!isCompactViewport()) {
    return;
  }
  const expandedDocked = panelEntries
    .map((panel) => panel.id)
    .filter((id) => panelLayouts[id].dockedEdge !== null && !panelLayouts[id].minimized);
  const keep = getExpandedDockPanel(panelLayouts) ?? "toolbox";
  expandedDocked
    .filter((id) => id !== keep)
    .forEach((id) => {
      panelLayouts[id].minimized = true;
    });
}
function createForm(config: LevelConfig) { return { name: config.name, description: config.description ?? "", gameType: config.gameType, duration: config.duration, map: { width: config.map.width, height: config.map.height }, scoreTarget: { star1: config.scoreTarget.star1, star2: config.scoreTarget.star2, star3: config.scoreTarget.star3, star4: config.scoreTarget.star4 ?? 0 }, orderPool: { recipes: [...config.orderPool.recipes], maxActiveOrders: config.orderPool.maxActiveOrders, spawnInterval: config.orderPool.spawnInterval } }; }
function parseNumber(value: string, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function clone<T>(value: T): T { return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value)) as T; }
</script>

<style scoped>
.editor-root { position: relative; width: 100%; height: 100vh; overflow: hidden; background: radial-gradient(circle at top, rgba(14,165,233,.12), transparent 35%), linear-gradient(180deg, #0f172a 0%, #020617 100%); }
.game-host { width: 100%; height: 100%; }
.top-toolbar { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); z-index: 120; display: flex; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 999px; border: 1px solid rgba(51,65,85,.95); background: rgba(15,23,42,.92); color: #e2e8f0; backdrop-filter: blur(12px); box-shadow: 0 16px 48px rgba(2,6,23,.45); }
.toolbar-group { display: flex; gap: 8px; }
.toolbar-group button { border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: inherit; padding: 8px 12px; cursor: pointer; }
.toolbar-group button.active { background: #1d4ed8; }
.status-banner { position: absolute; top: 76px; left: 50%; transform: translateX(-50%); z-index: 119; padding: 10px 14px; border-radius: 12px; }
.status-banner.ok { background: rgba(34,197,94,.15); color: #bbf7d0; }
.status-banner.bad { background: rgba(239,68,68,.15); color: #fecaca; }
.status-banner.warn, .status-banner.info { background: rgba(14,165,233,.15); color: #bae6fd; }
.panel-layer { position: absolute; inset: 0; z-index: 110; pointer-events: none; }
.viewport-hud { position: absolute; inset: 0; z-index: 105; pointer-events: none; }
.scrollbar { position: absolute; pointer-events: auto; accent-color: #38bdf8; }
.scrollbar-x { left: 24px; right: 244px; bottom: 18px; }
.scrollbar-y { top: 96px; right: 18px; width: 18px; height: 220px; writing-mode: vertical-lr; direction: rtl; }
.minimap-panel { position: absolute; right: 24px; bottom: 24px; width: 216px; padding: 12px; border-radius: 16px; border: 1px solid rgba(51,65,85,.95); background: rgba(15,23,42,.92); box-shadow: 0 16px 48px rgba(2,6,23,.45); backdrop-filter: blur(12px); pointer-events: auto; }
.minimap-surface { position: relative; width: 180px; height: 120px; margin: 0 auto 12px; border-radius: 10px; overflow: hidden; background: linear-gradient(180deg, rgba(51,65,85,.95), rgba(30,41,59,.95)); cursor: grab; }
.minimap-world { position: absolute; inset: 0; background-image: linear-gradient(rgba(148,163,184,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.16) 1px, transparent 1px); background-size: 12px 12px; }
.minimap-viewport { position: absolute; border: 2px solid #38bdf8; background: rgba(56,189,248,.18); border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.16); }
.zoom-controls { display: grid; grid-template-columns: 32px 1fr 32px 58px 20px; gap: 8px; align-items: center; }
.zoom-controls button, .zoom-input { border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #e2e8f0; height: 32px; }
.zoom-controls button { cursor: pointer; }
.zoom-slider { width: 100%; accent-color: #38bdf8; }
.zoom-input { text-align: center; padding: 0 6px; }
.zoom-unit { color: #cbd5e1; font-size: 13px; text-align: center; }
.hidden { display: none; }
@media (max-width: 960px) { .top-toolbar { max-width: calc(100vw - 24px); flex-wrap: wrap; justify-content: center; } .status-banner { width: min(320px, calc(100vw - 24px)); text-align: center; } .scrollbar-x { right: 24px; bottom: 216px; } .scrollbar-y { top: 132px; } .minimap-panel { width: 200px; } .minimap-surface { width: 168px; height: 112px; } }
</style>
