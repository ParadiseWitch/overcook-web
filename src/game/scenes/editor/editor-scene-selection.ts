import Phaser from "phaser";

import type { EditorSelection } from "../../editor/level-editor-utils";
import type { FloorConfig, PlayerSpawn, StationConfig } from "../../types/level-config";

type SelectionPayload =
  | { kind: "floor"; object: FloorConfig }
  | { kind: "station"; object: StationConfig }
  | { kind: "player"; object: PlayerSpawn }
  | null;

export interface EditorSceneSelectionContext {
  add: Phaser.GameObjects.GameObjectFactory;
  events: Phaser.Events.EventEmitter;
  tileSize: number;
  selectedObject: EditorSelection | null;
  selectionMarker: Phaser.GameObjects.Rectangle | null;
  levelConfigManager: {
    getConfig: () => {
      map: { floors: FloorConfig[] };
      stations: StationConfig[];
      players: PlayerSpawn[];
    };
  };
  toWorldPosition: (x: number, y: number) => { centerX: number; centerY: number };
}

// 统一维护选中状态、选中框渲染和对外事件载荷。
/**
 * 清空当前选中对象，并同步刷新选中框和事件。
 */
export function clearSelection(scene: EditorSceneSelectionContext) {
  scene.selectedObject = null;
  refreshSelectionMarker(scene);
  emitSelectionChanged(scene);
}

/**
 * 选中指定对象，并向外发出结构化选中事件。
 */
export function selectObject(
  scene: EditorSceneSelectionContext,
  selection: EditorSelection,
  object: FloorConfig | StationConfig | PlayerSpawn,
) {
  scene.selectedObject = selection;
  refreshSelectionMarker(scene);

  if (selection.kind === "floor") {
    scene.events.emit("object-selected", {
      kind: "floor",
      object: object as FloorConfig,
    } satisfies Exclude<SelectionPayload, null>);
    return;
  }

  if (selection.kind === "station") {
    scene.events.emit("object-selected", {
      kind: "station",
      object: object as StationConfig,
    } satisfies Exclude<SelectionPayload, null>);
    return;
  }

  scene.events.emit("object-selected", {
    kind: "player",
    object: object as PlayerSpawn,
  } satisfies Exclude<SelectionPayload, null>);
}

/**
 * 根据当前选中对象重绘选中框。
 */
export function refreshSelectionMarker(scene: EditorSceneSelectionContext) {
  scene.selectionMarker?.destroy();
  scene.selectionMarker = null;

  const target = getSelectionTarget(scene);
  if (!target) {
    return;
  }

  const { centerX, centerY } = scene.toWorldPosition(target.x, target.y);
  scene.selectionMarker = scene.add.rectangle(
    centerX,
    centerY,
    scene.tileSize - 4,
    scene.tileSize - 4,
    0x22c55e,
    0.14,
  );
  scene.selectionMarker.setStrokeStyle(2, 0x22c55e);
}

/**
 * 把当前选中对象重新编码成对外事件载荷并发出。
 */
export function emitSelectionChanged(scene: EditorSceneSelectionContext) {
  if (!scene.selectedObject) {
    scene.events.emit("object-selected", null satisfies SelectionPayload);
    return;
  }

  const selection = getSelectedConfigObject(scene);
  if (!selection) {
    scene.events.emit("object-selected", null satisfies SelectionPayload);
    return;
  }

  selectObject(scene, scene.selectedObject, selection);
}

/**
 * 从当前关卡配置中取回真正被选中的对象。
 */
export function getSelectedConfigObject(scene: EditorSceneSelectionContext): FloorConfig | StationConfig | PlayerSpawn | null {
  const config = scene.levelConfigManager.getConfig();
  const selection = scene.selectedObject;
  if (!selection) {
    return null;
  }

  if (selection.kind === "floor") {
    return config.map.floors.find(
      (floor) => floor.x === selection.x && floor.y === selection.y,
    ) ?? null;
  }

  if (selection.kind === "station") {
    return config.stations.find(
      (station) => station.x === selection.x && station.y === selection.y,
    ) ?? null;
  }

  return config.players.find((player) => player.id === selection.id) ?? null;
}

/**
 * 提取当前选中对象用于绘制选中框的网格坐标。
 */
export function getSelectionTarget(scene: EditorSceneSelectionContext) {
  const selection = scene.selectedObject;
  if (!selection) {
    return null;
  }

  if (selection.kind === "player") {
    const player = scene.levelConfigManager.getConfig().players.find(
      (entry) => entry.id === selection.id,
    );
    return player ? { x: player.x, y: player.y } : null;
  }

  return { x: selection.x, y: selection.y };
}
