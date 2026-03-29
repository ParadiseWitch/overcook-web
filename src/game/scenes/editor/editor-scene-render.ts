import Phaser from "phaser";

import * as inputModule from "./editor-scene-input";
import { cloneLevelConfig } from "../../editor/level-editor-utils";
import {
  buildRenderableFloors,
  getFloorRenderSpec,
  getIngredientLabel,
  getStationTextureKey as resolveStationTextureKey,
} from "../../editor/editor-render";
import type {
  ConveyorFloor,
  FloorConfig,
  LevelConfig,
  PlayerSpawn,
  StationConfig,
} from "../../types/level-config";
import { getDefaultLevelConfig } from "../../types/level-config";

// 负责渲染编辑器中的网格内容和可交互对象。
export interface EditorSceneRenderContext {
  add: Phaser.GameObjects.GameObjectFactory;
  gridGroup: Phaser.GameObjects.Group;
  objectGroup: Phaser.GameObjects.Group;
  tileSize: number;
  levelConfigManager: { getConfig: () => LevelConfig };
  inputContext: inputModule.EditorSceneInputContext;
}

/**
 * 重建编辑器网格层。
 */
export function createGrid(scene: EditorSceneRenderContext) {
  scene.gridGroup.clear(true, true);
}

/**
 * 按当前关卡配置重绘所有地板、工作站和玩家出生点。
 */
export function renderLevelObjects(scene: EditorSceneRenderContext) {
  scene.objectGroup.clear(true, true);

  const config = scene.levelConfigManager.getConfig();
  buildRenderableFloors(config).forEach((floor) => renderFloor(scene, floor));
  config.stations.forEach((station) => renderStation(scene, station));
  config.players.forEach((player) => renderPlayer(scene, player));
}

/**
 * 渲染单个地板对象，并在需要时附加额外标记。
 */
export function renderFloor(scene: EditorSceneRenderContext, floor: FloorConfig) {
  const { centerX, centerY } = toWorldPosition(scene, floor.x, floor.y);
  const renderSpec = getFloorRenderSpec(floor);
  const tile = scene.add.image(centerX, centerY, renderSpec.textureKey);
  tile.setDisplaySize(scene.tileSize, scene.tileSize);
  tile.setDepth(renderSpec.depth);
  tile.setAngle(renderSpec.angle);
  tile.setInteractive();
  tile.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    inputModule.handleObjectPointerDown(
      scene.inputContext,
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
 * 渲染单个工作站对象及其覆盖层信息。
 */
export function renderStation(scene: EditorSceneRenderContext, station: StationConfig) {
  const { centerX, centerY } = toWorldPosition(scene, station.x, station.y);
  const textureKey = resolveStationTextureKey(station);
  const stationSprite = scene.add.image(centerX, centerY, textureKey);
  stationSprite.setDisplaySize(scene.tileSize, scene.tileSize);
  stationSprite.setDepth(10);
  stationSprite.setInteractive();
  stationSprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    inputModule.handleObjectPointerDown(
      scene.inputContext,
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

/**
 * 渲染单个玩家出生点。
 */
export function renderPlayer(scene: EditorSceneRenderContext, player: PlayerSpawn) {
  const { centerX, centerY } = toWorldPosition(scene, player.x, player.y);
  const sprite = scene.add.image(centerX, centerY, "player");
  sprite.setDisplaySize(30, 30);
  sprite.setDepth(30);
  sprite.setTint(player.color ?? (player.id === 1 ? 0x4da6ff : 0xff4444));
  sprite.setInteractive();
  sprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    inputModule.handleObjectPointerDown(
      scene.inputContext,
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
export function toWorldPosition(scene: Pick<EditorSceneRenderContext, "tileSize">, x: number, y: number) {
  return {
    centerX: x * scene.tileSize + scene.tileSize / 2,
    centerY: y * scene.tileSize + scene.tileSize / 2,
  };
}

/**
 * 判断给定网格坐标是否仍在地图范围内。
 */
export function isInBounds(scene: { gridWidth: number; gridHeight: number }, x: number, y: number) {
  return x >= 0 && y >= 0 && x < scene.gridWidth && y < scene.gridHeight;
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
function renderStationOverlay(scene: EditorSceneRenderContext, station: StationConfig, centerX: number, centerY: number) {
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
