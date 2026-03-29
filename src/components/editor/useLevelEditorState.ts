import { computed, reactive, ref, type Ref, type ShallowRef } from "vue";

import { getAllRecipeOptions, type FloorToolOptions, type RecipeOption, type ValidationResult } from "@/game/editor/level-editor-utils";
import type { IngredientType, LevelConfig } from "@/game/types/level-config";
import { getDefaultLevelConfig } from "@/game/types/level-config";
import type { LevelEditorScene } from "@/game/scenes/editor/level-editor-scene";

export type SelectionPayload = { kind: "floor" | "station" | "player"; object: Record<string, unknown> } | null;
export type EditableField = {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "select" | "color";
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string | number }>;
};

const ingredientOptions: Array<{ label: string; value: IngredientType }> = [
  { label: "番茄", value: "tomato" }, { label: "生菜", value: "lettuce" }, { label: "米", value: "rice" }, { label: "鱼", value: "fish" },
  { label: "紫菜", value: "seaweed" }, { label: "洋葱", value: "onion" }, { label: "土豆", value: "potato" }, { label: "胡萝卜", value: "carrot" },
  { label: "鸡蛋", value: "egg" }, { label: "面粉", value: "flour" }, { label: "肉", value: "meat" }, { label: "芝士", value: "cheese" },
  { label: "巧克力", value: "chocolate" }, { label: "汉堡面包胚", value: "burger-bun" },
];

const typeLabelMap: Record<string, string> = {
  normal: "普通地板", wall: "墙壁", conveyor: "传送带", counter: "空柜台", "plate-counter": "盘子柜台", cut: "切菜板", pot: "锅",
  sink: "洗碗池", delivery: "上菜口", "dirty-plate": "脏盘子点", trash: "垃圾桶", "fire-extinguisher": "灭火器", mixer: "搅拌器", ingredient: "食材箱",
};

type SceneRef = Ref<LevelEditorScene | null> | ShallowRef<LevelEditorScene | null>;

// 负责编辑器表单状态、选中对象派生字段以及导入导出动作。
/**
 * 创建编辑器状态控制器，管理表单、选中对象和导入导出行为。
 */
export function useLevelEditorState(input: {
  sceneRef: SceneRef;
  fileInput: Ref<HTMLInputElement | null>;
}) {
  const selectedObject = ref<SelectionPayload>(null);
  const activeTool = ref<string | null>(null);
  const recipeOptions = ref<RecipeOption[]>(getAllRecipeOptions());
  const validation = ref<ValidationResult>({ valid: false, errors: [], warnings: [] });
  const status = reactive({ message: "", tone: "info" });
  const toolOptions = reactive<Required<FloorToolOptions>>({
    conveyorDirection: "right",
    conveyorSpeed: 100,
  });
  const form = reactive(createForm(getDefaultLevelConfig()));

  const selectedTitle = computed(() => {
    if (!selectedObject.value) {
      return "";
    }
    if (selectedObject.value.kind === "player") {
      return `玩家 ${selectedObject.value.object.id}`;
    }
    return typeLabelMap[String(selectedObject.value.object.type ?? "")] ?? String(selectedObject.value.object.type ?? "");
  });

  const selectedFields = computed<EditableField[]>(() => {
    if (!selectedObject.value) {
      return [];
    }
    const fields: EditableField[] = [
      { key: "x", label: "网格 X", type: "number", min: 0, max: form.map.width - 1 },
      { key: "y", label: "网格 Y", type: "number", min: 0, max: form.map.height - 1 },
    ];
    if (selectedObject.value.kind === "player") {
      return [...fields, { key: "color", label: "颜色", type: "color" }];
    }
    if (selectedObject.value.kind === "floor" && selectedObject.value.object.type === "conveyor") {
      // 传送带是编辑器里唯一依赖额外方向和速度字段的地板类型。
      return [
        ...fields,
        {
          key: "direction",
          label: "方向",
          type: "select",
          options: [
            { label: "向右", value: "right" },
            { label: "向左", value: "left" },
            { label: "向上", value: "up" },
            { label: "向下", value: "down" },
          ],
        },
        { key: "speed", label: "速度", type: "number", min: 1, max: 500, step: 10 },
      ];
    }
    fields.push({ key: "rotation", label: "旋转角度", type: "number", min: 0, max: 360, step: 5 });
    switch (selectedObject.value.object.type) {
      case "ingredient":
        fields.push(
          { key: "ingredientType", label: "食材类型", type: "select", options: ingredientOptions },
          { key: "infinite", label: "无限供应", type: "checkbox" },
          { key: "maxCount", label: "最大数量", type: "number", min: 1 },
        );
        break;
      case "plate-counter":
        fields.push(
          { key: "infinite", label: "无限供应", type: "checkbox" },
          { key: "maxPlates", label: "最大盘子数", type: "number", min: 1 },
        );
        break;
      case "cut":
        fields.push({ key: "cutSpeed", label: "切割速度", type: "number", min: 0.1, step: 0.1 });
        break;
      case "pot":
        fields.push(
          { key: "cookSpeed", label: "烹饪速度", type: "number", min: 0.1, step: 0.1 },
          { key: "canBurn", label: "允许烧焦", type: "checkbox" },
          { key: "canFire", label: "允许着火", type: "checkbox" },
        );
        break;
      case "sink":
        fields.push({ key: "washSpeed", label: "清洗速度", type: "number", min: 0.1, step: 0.1 });
        break;
      case "delivery":
        fields.push({ key: "deliveryTime", label: "上菜动画时长", type: "number", min: 100, step: 100 });
        break;
      case "dirty-plate":
        fields.push(
          { key: "spawnInterval", label: "生成间隔", type: "number", min: 1 },
          { key: "maxPlates", label: "最大脏盘数", type: "number", min: 1 },
        );
        break;
      case "fire-extinguisher":
        fields.push(
          { key: "infinite", label: "无限使用", type: "checkbox" },
          { key: "capacity", label: "容量", type: "number", min: 1 },
        );
        break;
      case "mixer":
        fields.push({ key: "mixSpeed", label: "搅拌速度", type: "number", min: 0.1, step: 0.1 });
        break;
    }
    return fields;
  });

  /**
   * 用场景最新配置覆盖本地表单和校验结果。
   */
  function onSceneConfigChanged(payload: { config: LevelConfig; validation: ValidationResult }) {
    Object.assign(form, createForm(payload.config));
    validation.value = payload.validation;
  }

  /**
   * 同步场景当前选中对象到属性面板状态。
   */
  function onSceneSelectionChanged(payload: SelectionPayload) {
    selectedObject.value = payload ? clone(payload) : null;
  }

  /**
   * 更新状态横幅文案和语气，统一反馈给用户。
   */
  function setStatus(message: string, tone: string) {
    status.message = message;
    status.tone = tone;
  }

  /**
   * 更新关卡名称。
   */
  function updateName(value: string) {
    input.sceneRef.value?.updateLevelName(value);
  }

  /**
   * 更新关卡描述。
   */
  function updateDescription(value: string) {
    input.sceneRef.value?.updateLevelDescription(value);
  }

  /**
   * 更新关卡模式。
   */
  function updateGameType(value: string) {
    input.sceneRef.value?.updateGameType(value as LevelConfig["gameType"]);
  }

  /**
   * 更新关卡时长。
   */
  function updateDuration(value: string) {
    input.sceneRef.value?.updateDuration(parseNumber(value, 300));
  }

  /**
   * 更新地图宽度，并同步给场景。
   */
  function updateMapWidth(value: string) {
    form.map.width = parseNumber(value, form.map.width);
    input.sceneRef.value?.updateMapSize(form.map.width, form.map.height);
  }

  /**
   * 更新地图高度，并同步给场景。
   */
  function updateMapHeight(value: string) {
    form.map.height = parseNumber(value, form.map.height);
    input.sceneRef.value?.updateMapSize(form.map.width, form.map.height);
  }

  /**
   * 更新星级目标分数。
   */
  function updateScore(key: "star1" | "star2" | "star3" | "star4", value: string) {
    input.sceneRef.value?.updateScoreTarget({ [key]: parseNumber(value, 0) });
  }

  /**
   * 更新订单池允许同时存在的最大订单数。
   */
  function updateMaxActiveOrders(value: string) {
    input.sceneRef.value?.updateOrderPool({ maxActiveOrders: parseNumber(value, 1) });
  }

  /**
   * 更新订单池生成间隔。
   */
  function updateSpawnInterval(value: string) {
    input.sceneRef.value?.updateOrderPool({ spawnInterval: parseNumber(value, 1) });
  }

  /**
   * 更新传送带工具的默认方向，并同步给场景工具选项。
   */
  function updateConveyorDirection(value: string) {
    const direction = value as NonNullable<FloorToolOptions["conveyorDirection"]>;
    toolOptions.conveyorDirection = direction;
    input.sceneRef.value?.setToolOptions({ conveyorDirection: direction });
  }

  /**
   * 更新传送带工具的默认速度，并同步给场景工具选项。
   */
  function updateConveyorSpeed(value: string) {
    toolOptions.conveyorSpeed = parseNumber(value, 100);
    input.sceneRef.value?.setToolOptions({ conveyorSpeed: toolOptions.conveyorSpeed });
  }

  /**
   * 在工具栏里切换当前激活工具。
   */
  function toggleTool(toolId: string) {
    activeTool.value = activeTool.value === toolId ? null : toolId;
    input.sceneRef.value?.setSelectedTool(activeTool.value);
  }

  /**
   * 切换订单池中某个配方是否启用。
   */
  function toggleRecipe(recipeId: string, checked: boolean) {
    const recipes = new Set(form.orderPool.recipes);
    if (checked) {
      recipes.add(recipeId);
    } else {
      recipes.delete(recipeId);
    }
    input.sceneRef.value?.updateOrderPool({ recipes: [...recipes] });
  }

  /**
   * 把属性面板里的字段改动补丁到当前选中对象上。
   */
  function patchSelected(field: EditableField, raw: unknown) {
    if (!input.sceneRef.value) {
      return;
    }
    let value = raw;
    if (field.type === "number") {
      value = parseNumber(String(raw), Number(raw || 0));
    }
    if (field.type === "color") {
      value = Number.parseInt(String(raw).replace("#", ""), 16);
    }
    input.sceneRef.value.updateSelectedObject({ [field.key]: value });
  }

  /**
   * 删除当前选中的编辑器对象。
   */
  function deleteSelection() {
    input.sceneRef.value?.deleteSelectedObject();
    setStatus("已删除当前选中对象。", "info");
  }

  /**
   * 创建一张全新的空白关卡，并重置当前工具状态。
   */
  function createNewLevel() {
    input.sceneRef.value?.createNewLevel();
    activeTool.value = null;
    input.sceneRef.value?.setSelectedTool(null);
    setStatus("已创建新的空白关卡。", "ok");
  }

  /**
   * 把当前关卡配置导出为 JSON 文件下载。
   */
  function downloadJson() {
    if (!input.sceneRef.value) {
      return;
    }
    const config = input.sceneRef.value.exportLevelConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${config.name || "level"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("已下载关卡 JSON 文件。", "ok");
  }

  /**
   * 把当前关卡配置复制到剪贴板，便于快速分享或调试。
   */
  async function copyJson() {
    if (!input.sceneRef.value) {
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(input.sceneRef.value.exportLevelConfig(), null, 2));
      setStatus("已将关卡 JSON 复制到剪贴板。", "ok");
    } catch {
      setStatus("复制失败，请重试。", "warn");
    }
  }

  /**
   * 打开文件选择器，让用户导入关卡 JSON。
   */
  function openImportDialog() {
    input.fileInput.value?.click();
  }

  /**
   * 读取并导入用户选择的关卡文件，同时反馈导入结果。
   */
  async function handleImport(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || !input.sceneRef.value) {
      return;
    }
    const text = await file.text();
    const result = input.sceneRef.value.importLevelConfig(text);
    setStatus(result.success ? `已导入 ${file.name}。` : (result.error ?? "导入失败。"), result.success ? "ok" : "bad");
    target.value = "";
  }

  return {
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
    setStatus,
  };
}

/**
 * 把关卡配置转换成适合表单双向绑定的响应式结构。
 */
function createForm(config: LevelConfig) {
  return {
    name: config.name,
    description: config.description ?? "",
    gameType: config.gameType,
    duration: config.duration,
    map: { width: config.map.width, height: config.map.height },
    scoreTarget: {
      star1: config.scoreTarget.star1,
      star2: config.scoreTarget.star2,
      star3: config.scoreTarget.star3,
      star4: config.scoreTarget.star4 ?? 0,
    },
    orderPool: {
      recipes: [...config.orderPool.recipes],
      maxActiveOrders: config.orderPool.maxActiveOrders,
      spawnInterval: config.orderPool.spawnInterval,
    },
  };
}

/**
 * 把字符串安全地解析成数字，失败时回退到给定默认值。
 */
function parseNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * 通过结构化克隆复制一份简单对象，避免直接共享引用。
 */
function clone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)) as T;
}
