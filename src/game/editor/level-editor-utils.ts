import {
  ALL_RECIPES,
  getRecipeById,
} from "../recipe/recipes";
import {
  isFoodDef,
  isIngredientDef,
  type FoodDef,
  type IngredientDef,
} from "../recipe/types";
import type {
  ConveyorFloor,
  FloorConfig,
  IngredientType,
  LevelConfig,
  PlayerSpawn,
  StationConfig,
} from "../types/level-config";

export type EditorSelection =
  | { kind: "floor"; x: number; y: number }
  | { kind: "station"; x: number; y: number }
  | { kind: "player"; id: number };

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RecipeOption {
  id: string;
  label: string;
}

export interface FloorToolOptions {
  conveyorDirection?: ConveyorFloor["direction"];
  conveyorSpeed?: number;
}

const INGREDIENT_TOOL_PREFIX = "ingredient-";

const STATION_TOOL_MAP: Record<string, StationConfig["type"]> = {
  counter: "counter",
  "plate-counter": "plate-counter",
  cut: "cut",
  pot: "pot",
  sink: "sink",
  delivery: "delivery",
  "dirty-plate": "dirty-plate",
  trash: "trash",
  "fire-extinguisher": "fire-extinguisher",
  mixer: "mixer",
};

export function cloneLevelConfig(config: LevelConfig): LevelConfig {
  if (typeof structuredClone === "function") {
    return structuredClone(config);
  }

  return JSON.parse(JSON.stringify(config)) as LevelConfig;
}

export function getAllRecipeOptions(): RecipeOption[] {
  return ALL_RECIPES.map((recipe) => ({
    id: recipe.id,
    label: recipe.displayName,
  }));
}

export function buildDefaultFloorForTool(
  tool: string,
  x: number,
  y: number,
  options: FloorToolOptions = {},
): FloorConfig | null {
  switch (tool) {
    case "normal-floor":
      return { type: "normal", x, y };
    case "wall-floor":
      return { type: "wall", x, y };
    case "conveyor-floor":
      return {
        type: "conveyor",
        x,
        y,
        direction: options.conveyorDirection ?? "right",
        speed: options.conveyorSpeed ?? 100,
      };
    default:
      return null;
  }
}

export function buildDefaultStationForTool(
  tool: string,
  x: number,
  y: number,
): StationConfig | null {
  if (tool.startsWith(INGREDIENT_TOOL_PREFIX)) {
    return {
      type: "ingredient",
      x,
      y,
      ingredientType: tool.slice(INGREDIENT_TOOL_PREFIX.length) as IngredientType,
      infinite: true,
    };
  }

  const stationType = STATION_TOOL_MAP[tool];
  if (!stationType) {
    return null;
  }

  return { type: stationType, x, y } as StationConfig;
}

export function buildDefaultPlayerForTool(
  tool: string,
  x: number,
  y: number,
): PlayerSpawn | null {
  switch (tool) {
    case "player-1":
      return { id: 1, x, y, color: 0x4da6ff };
    case "player-2":
      return { id: 2, x, y, color: 0xff4444 };
    default:
      return null;
  }
}

export function updateSelectedObject(
  config: LevelConfig,
  selection: EditorSelection,
  patch: Record<string, unknown>,
): LevelConfig {
  const nextConfig = cloneLevelConfig(config);

  if (selection.kind === "floor") {
    const index = nextConfig.map.floors.findIndex(
      (floor) => floor.x === selection.x && floor.y === selection.y,
    );
    if (index >= 0) {
      nextConfig.map.floors[index] = {
        ...nextConfig.map.floors[index],
        ...patch,
      } as FloorConfig;
    }
    return nextConfig;
  }

  if (selection.kind === "station") {
    const index = nextConfig.stations.findIndex(
      (station) => station.x === selection.x && station.y === selection.y,
    );
    if (index >= 0) {
      nextConfig.stations[index] = {
        ...nextConfig.stations[index],
        ...patch,
      } as StationConfig;
    }
    return nextConfig;
  }

  const index = nextConfig.players.findIndex((player) => player.id === selection.id);
  if (index >= 0) {
    nextConfig.players[index] = {
      ...nextConfig.players[index],
      ...patch,
    };
  }

  return nextConfig;
}

export function validateLevelConfig(config: LevelConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.duration <= 0) {
    errors.push("游戏时长必须大于 0 秒。");
  }

  if (config.map.width < 5 || config.map.width > 50) {
    errors.push("地图宽度必须在 5 到 50 之间。");
  }

  if (config.map.height < 5 || config.map.height > 50) {
    errors.push("地图高度必须在 5 到 50 之间。");
  }

  if (config.players.length === 0) {
    errors.push("关卡至少需要一个玩家出生点。");
  }

  const hasDelivery = config.stations.some((station) => station.type === "delivery");
  if (!hasDelivery) {
    errors.push("关卡至少需要一个上菜口。");
  }

  const hasPlateSource = config.stations.some((station) =>
    station.type === "plate-counter" || station.type === "delivery",
  );
  if (!hasPlateSource) {
    warnings.push("当前关卡没有盘子来源，玩家可能无法完成上菜。");
  }

  if (config.orderPool.maxActiveOrders <= 0) {
    errors.push("最大同时订单数必须大于 0。");
  }

  if (config.orderPool.spawnInterval <= 0) {
    errors.push("订单生成间隔必须大于 0。");
  }

  const availableIngredients = new Set(
    config.stations
      .filter((station) => station.type === "ingredient")
      .map((station) => station.ingredientType),
  );

  config.orderPool.recipes.forEach((recipeId) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) {
      warnings.push(`订单池中的菜谱 "${recipeId}" 不存在。`);
      return;
    }

    const missingIngredients = collectRequiredIngredientTypes(recipe.targetFood)
      .filter((ingredient) => !availableIngredients.has(ingredient as IngredientType));

    if (missingIngredients.length > 0) {
      warnings.push(
        `菜谱“${recipe.displayName}”缺少可用食材：${missingIngredients.join("、")}。`,
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function clampMapObjects(config: LevelConfig): LevelConfig {
  const nextConfig = cloneLevelConfig(config);
  const isInBounds = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < nextConfig.map.width &&
    y < nextConfig.map.height;

  nextConfig.map.floors = nextConfig.map.floors.filter((floor) =>
    isInBounds(floor.x, floor.y),
  );
  nextConfig.stations = nextConfig.stations.filter((station) =>
    isInBounds(station.x, station.y),
  );
  nextConfig.players = nextConfig.players.filter((player) =>
    isInBounds(player.x, player.y),
  );

  return nextConfig;
}

function collectRequiredIngredientTypes(definition: FoodDef | IngredientDef): string[] {
  if (isIngredientDef(definition)) {
    return [definition.type];
  }

  if (!isFoodDef(definition)) {
    return [];
  }

  const ingredientTypes = definition.components.flatMap((component) =>
    collectRequiredIngredientTypes(component),
  );

  return [...new Set(ingredientTypes)];
}
