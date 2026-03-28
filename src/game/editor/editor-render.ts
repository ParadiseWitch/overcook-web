import type {
  ConveyorFloor,
  FloorConfig,
  IngredientType,
  LevelConfig,
  StationConfig,
} from "../types/level-config";

export interface FloorRenderSpec {
  textureKey: string;
  angle: number;
  depth: number;
}

export function buildRenderableFloors(config: LevelConfig): FloorConfig[] {
  const overrides = new Map(
    config.map.floors.map((floor) => [`${floor.x},${floor.y}`, floor] as const),
  );
  const floors: FloorConfig[] = [];

  for (let y = 0; y < config.map.height; y += 1) {
    for (let x = 0; x < config.map.width; x += 1) {
      floors.push(overrides.get(`${x},${y}`) ?? { type: "normal", x, y });
    }
  }

  return floors;
}

export function getFloorRenderSpec(floor: FloorConfig): FloorRenderSpec {
  switch (floor.type) {
    case "wall":
      return {
        textureKey: floor.texture || "wall",
        angle: 0,
        depth: 0,
      };
    case "conveyor":
      return {
        textureKey: floor.texture || "conveyor",
        angle: getConveyorAngle(floor),
        depth: 0,
      };
    default:
      return {
        textureKey: floor.texture || "floor",
        angle: 0,
        depth: 0,
      };
  }
}

export function getStationTextureKey(station: StationConfig) {
  switch (station.type) {
    case "counter":
    case "plate-counter":
    case "fire-extinguisher":
    case "mixer":
      return "station_counter";
    case "cut":
      return "station_cut";
    case "pot":
      return "station_pot";
    case "sink":
      return "station_sink";
    case "delivery":
      return "station_delivery";
    case "dirty-plate":
      return "station_dirty_plate";
    case "trash":
      return "station_trash";
    case "ingredient":
      return "station_crate";
    default:
      return "station_counter";
  }
}

export function getIngredientLabel(ingredientType: IngredientType) {
  const labelMap: Record<IngredientType, string> = {
    tomato: "番茄",
    lettuce: "生菜",
    rice: "米",
    fish: "鱼",
    seaweed: "紫菜",
    onion: "洋葱",
    potato: "土豆",
    carrot: "胡萝卜",
    egg: "鸡蛋",
    flour: "面粉",
    meat: "肉",
    cheese: "芝士",
    chocolate: "巧克力",
    "burger-bun": "面包胚",
  };

  return labelMap[ingredientType];
}

function getConveyorAngle(floor: ConveyorFloor) {
  switch (floor.direction) {
    case "up":
      return -90;
    case "down":
      return 90;
    case "left":
      return 180;
    default:
      return 0;
  }
}
