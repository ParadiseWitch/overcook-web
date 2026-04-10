import Phaser from "phaser";

import * as inputModule from "./editor-scene-input";
import { cloneLevelConfig } from "../../editor/level-editor-utils";
import type {
  ConveyorFloor,
  FloorConfig,
  IngredientType,
  PlayerSpawn,
  StationConfig,
} from "../../types/level-config";
import { getDefaultLevelConfig } from "../../types/level-config";
import { LevelEditorScene } from "./level-editor-scene";

// 负责渲染编辑器中的网格内容和可交互对象。

interface FloorRenderSpec {
  textureKey: string;
  angle: number;
  depth: number;
}

/**
 * 按当前关卡配置重绘所有地板、工作站和玩家出生点。
 */
export function renderLevelObjects(scene: LevelEditorScene) {
  scene.objectGroup.clear(true, true);
  renderFloors(scene);
  // renderStations(scene);
  // renderPlayers(scene);
}

/**
 * 渲染地板
 */
function renderFloors(scene: LevelEditorScene) {
  const config = scene.levelConfigManager.getConfig();
  const overrides = new Map(
    config.map.floors.map((floor) => [`${floor.x},${floor.y}`, floor] as const),
  );

  const floors: FloorConfig[] = [];
  for (let y = 0; y < config.map.height; y += 1) {
    for (let x = 0; x < config.map.width; x += 1) {
      const defaultFloorConfig: FloorConfig = { type: "normal", x, y };
      const floorConfig = overrides.get(`${x},${y}`) ?? defaultFloorConfig;
      renderFloor(scene, floorConfig)
    }
  }
  return floors;
}

/**
 * 渲染单个地板对象，并在需要时附加额外标记。
 */
function renderFloor(scene: LevelEditorScene, floor: FloorConfig) {
  const { centerX, centerY } = toWorldPosition(scene, floor.x, floor.y);
  const renderSpec = getFloorRenderSpec(floor);
  const tile = scene.add.image(centerX, centerY, renderSpec.textureKey);
  tile.setDisplaySize(scene.tileSize, scene.tileSize);
  tile.setDepth(renderSpec.depth);
  tile.setAngle(renderSpec.angle);
  tile.setInteractive();
  tile.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    inputModule.handleObjectPointerDown(
      scene,
      pointer,
      { kind: "floor", x: floor.x, y: floor.y },
      cloneLevelConfig({
        ...getDefaultLevelConfig(),
        map: {
          width: 1,
          height: 1,
          floors: [floor],
        },
        players: [],
        stations: [],
      }).map.floors[0],
    );
  });
  scene.objectGroup.add(tile);

  if (floor.type !== "conveyor") {
    return;
  }

  // 传送带额外叠加方向标记，方便在编辑器里快速辨认。
  const label = scene.add.text(
    centerX,
    centerY,
    getDirectionGlyph(floor.direction),
    {
      fontSize: "18px",
      color: "#111827",
      fontStyle: "bold",
    },
  );
  label.setOrigin(0.5);
  label.setDepth(2);
  scene.objectGroup.add(label);
}


/**
 * 把地板配置转换成编辑器预览所需的贴图和角度信息。
 */
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


/**
 * 计算传送带地板在编辑器中的旋转角度。
 */
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

function renderStations(scene: LevelEditorScene) {
  const config = scene.levelConfigManager.getConfig();
  config.stations.forEach((station) => renderStation(scene, station));
}

/**
 * 渲染单个工作站对象及其覆盖层信息。
 */
function renderStation(scene: LevelEditorScene, station: StationConfig) {
  const { centerX, centerY } = toWorldPosition(scene, station.x, station.y);
  const textureKey = resolveStationTextureKey(station);
  const stationSprite = scene.add.image(centerX, centerY, textureKey);
  stationSprite.setDisplaySize(scene.tileSize, scene.tileSize);
  stationSprite.setDepth(10);
  stationSprite.setInteractive();
  stationSprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    inputModule.handleObjectPointerDown(
      scene,
      pointer,
      { kind: "station", x: station.x, y: station.y },
      cloneLevelConfig({
        ...getDefaultLevelConfig(),
        stations: [station],
        players: [],
        map: { width: 1, height: 1, floors: [] },
      }).stations[0],
    );
  });
  scene.objectGroup.add(stationSprite);
  renderStationOverlay(scene, station, centerX, centerY);
}


function renderPlayers(scene: LevelEditorScene) {
  const config = scene.levelConfigManager.getConfig();
  config.players.forEach((player) => renderPlayer(scene, player));
}

/**
 * 渲染单个玩家出生点。
 */
function renderPlayer(scene: LevelEditorScene, player: PlayerSpawn) {
  const { centerX, centerY } = toWorldPosition(scene, player.x, player.y);
  const sprite = scene.add.image(centerX, centerY, "player");
  sprite.setDisplaySize(30, 30);
  sprite.setDepth(30);
  sprite.setTint(player.color ?? (player.id === 1 ? 0x4da6ff : 0xff4444));
  sprite.setInteractive();
  sprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    inputModule.handleObjectPointerDown(
      scene,
      pointer,
      { kind: "player", id: player.id },
      { ...player },
    );
  });
  scene.objectGroup.add(sprite);

  const label = scene.add.text(centerX, centerY + 2, `P${player.id}`, {
    fontSize: "10px",
    color: "#ffffff",
    fontStyle: "bold",
  });
  label.setOrigin(0.5);
  label.setDepth(31);
  scene.objectGroup.add(label);
}

/**
 * 把网格坐标转换成世界空间中心点坐标。
 */
function toWorldPosition(scene: Pick<LevelEditorScene, "tileSize">, x: number, y: number) {
  return {
    centerX: x * scene.tileSize + scene.tileSize / 2,
    centerY: y * scene.tileSize + scene.tileSize / 2,
  };
}

/**
 * 把传送带方向转换成编辑器里显示的箭头字符。
 */
function getDirectionGlyph(direction: ConveyorFloor["direction"]) {
  switch (direction) {
    case "up":
      return "↑";
    case "down":
      return "↓";
    case "left":
      return "←";
    default:
      return "→";
  }
}

/**
 * 为部分工作站渲染附加图标或文字徽标。
 */
function renderStationOverlay(scene: LevelEditorScene, station: StationConfig, centerX: number, centerY: number) {
  if (station.type === "plate-counter") {
    const plate = scene.add.image(centerX, centerY, "item_plate");
    plate.setDisplaySize(28, 28);
    plate.setDepth(11);
    scene.objectGroup.add(plate);
    return;
  }

  if (station.type === "pot") {
    const pot = scene.add.image(centerX, centerY, "item_pot");
    pot.setDisplaySize(28, 28);
    pot.setDepth(11);
    scene.objectGroup.add(pot);
    return;
  }

  if (station.type === "fire-extinguisher") {
    const extinguisher = scene.add.image(centerX, centerY, "item_fire_extinguisher");
    extinguisher.setDisplaySize(22, 22);
    extinguisher.setDepth(11);
    scene.objectGroup.add(extinguisher);
    return;
  }

  if (station.type === "ingredient") {
    const badge = scene.add.text(
      centerX,
      centerY + 16,
      getIngredientLabel(station.ingredientType),
      {
        fontSize: "8px",
        color: "#f8fafc",
        backgroundColor: "#0f172a",
        padding: { left: 4, right: 4, top: 1, bottom: 1 },
      },
    );
    badge.setOrigin(0.5);
    badge.setDepth(12);
    scene.objectGroup.add(badge);
    return;
  }

  if (station.type === "mixer") {
    const badge = scene.add.text(centerX, centerY + 16, "Mix", {
      fontSize: "8px",
      color: "#f8fafc",
      backgroundColor: "#0f172a",
      padding: { left: 4, right: 4, top: 1, bottom: 1 },
    });
    badge.setOrigin(0.5);
    badge.setDepth(12);
    scene.objectGroup.add(badge);
  }
}


/**
 * 根据工作站类型返回编辑器预览使用的贴图 key。
 */
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

/**
 * 把食材类型转换成小型文字标签，便于编辑器里快速辨认。
 */
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
