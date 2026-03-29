import { buildDefaultFloorForTool, buildDefaultPlayerForTool, buildDefaultStationForTool } from "../../editor/level-editor-utils";
import type { FloorToolOptions } from "../../editor/level-editor-utils";
import type { FloorConfig, LevelConfig, PlayerSpawn, StationConfig } from "../../types/level-config";
import type { EditorSelection } from "../../editor/level-editor-utils";

// 承接关卡配置变更，并在每次编辑后统一刷新场景。
export interface EditorSceneConfigContext {
  levelConfigManager: {
    getConfig: () => LevelConfig;
    addFloor: (floor: FloorConfig) => void;
    removeFloor: (x: number, y: number) => void;
    addStation: (station: StationConfig) => void;
    removeStation: (x: number, y: number) => void;
    addPlayer: (player: PlayerSpawn) => void;
    removePlayer: (id: number) => void;
    importJSON: (jsonString: string) => boolean;
  };
  selectedObject: EditorSelection | null;
  selectedTool: string | null;
  toolOptions: FloorToolOptions;
  refreshScene: () => void;
}

/**
 * 把补丁应用到当前选中对象，并保持选中状态跟随新对象。
 */
export function updateSelectedObject(scene: EditorSceneConfigContext, patch: Record<string, unknown>) {
  const selection = scene.selectedObject;
  if (!selection) {
    return;
  }

  const config = scene.levelConfigManager.getConfig();

  if (selection.kind === "floor") {
    const current = config.map.floors.find(
      (floor) => floor.x === selection.x && floor.y === selection.y,
    );
    if (!current) {
      return;
    }

    // 先删除再重建，保证带判别字段的对象仍走统一的 manager 约束。
    scene.levelConfigManager.removeFloor(current.x, current.y);
    const nextFloor = { ...current, ...patch } as FloorConfig;
    scene.levelConfigManager.addFloor(nextFloor);
    scene.selectedObject = {
      kind: "floor",
      x: nextFloor.x,
      y: nextFloor.y,
    };
    scene.refreshScene();
    return;
  }

  if (selection.kind === "station") {
    const current = config.stations.find(
      (station) => station.x === selection.x && station.y === selection.y,
    );
    if (!current) {
      return;
    }

    scene.levelConfigManager.removeStation(current.x, current.y);
    const nextStation = { ...current, ...patch } as StationConfig;
    scene.levelConfigManager.addStation(nextStation);
    scene.selectedObject = {
      kind: "station",
      x: nextStation.x,
      y: nextStation.y,
    };
    scene.refreshScene();
    return;
  }

  const current = config.players.find((player) => player.id === selection.id);
  if (!current) {
    return;
  }

  scene.levelConfigManager.removePlayer(current.id);
  const nextPlayer = { ...current, ...patch } as PlayerSpawn;
  scene.levelConfigManager.addPlayer(nextPlayer);
  scene.selectedObject = {
    kind: "player",
    id: nextPlayer.id,
  };
  scene.refreshScene();
}

/**
 * 删除当前选中对象，并刷新场景与选中状态。
 */
export function deleteSelectedObject(scene: EditorSceneConfigContext) {
  const selection = scene.selectedObject;
  if (!selection) {
    return;
  }

  if (selection.kind === "floor") {
    scene.levelConfigManager.removeFloor(selection.x, selection.y);
  } else if (selection.kind === "station") {
    scene.levelConfigManager.removeStation(selection.x, selection.y);
  } else {
    scene.levelConfigManager.removePlayer(selection.id);
  }

  scene.selectedObject = null;
  scene.refreshScene();
}

/**
 * 从 JSON 字符串导入关卡配置，并返回导入结果。
 */
export function importLevelConfig(scene: EditorSceneConfigContext, jsonString: string) {
  const success = scene.levelConfigManager.importJSON(jsonString);
  if (!success) {
    return {
      success: false,
      error: "导入失败，所选文件不是有效的关卡配置。",
    };
  }

  scene.selectedObject = null;
  scene.refreshScene();
  return { success: true };
}

/**
 * 根据当前激活工具在指定网格位置放置对象。
 */
export function placeObjectAt(
  scene: Pick<
    EditorSceneConfigContext,
    "levelConfigManager" | "selectedObject" | "selectedTool" | "toolOptions" | "refreshScene"
  >,
  x: number,
  y: number,
) {
  const floor = buildDefaultFloorForTool(scene.selectedTool ?? "", x, y, scene.toolOptions);
  if (floor) {
    scene.levelConfigManager.addFloor(floor);
    scene.selectedObject = { kind: "floor", x, y };
    scene.refreshScene();
    return;
  }

  const station = buildDefaultStationForTool(scene.selectedTool ?? "", x, y);
  if (station) {
    scene.levelConfigManager.addStation(station);
    scene.selectedObject = { kind: "station", x, y };
    scene.refreshScene();
    return;
  }

  const player = buildDefaultPlayerForTool(scene.selectedTool ?? "", x, y);
  if (player) {
    scene.levelConfigManager.addPlayer(player);
    scene.selectedObject = { kind: "player", id: player.id };
    scene.refreshScene();
  }
}
