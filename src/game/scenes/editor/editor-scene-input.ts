import Phaser from "phaser";

import * as cameraModule from "./editor-scene-camera";
import * as configModule from "./editor-scene-config";
import * as selectionModule from "./editor-scene-selection";
import {
  panCameraByScreenDelta,
  screenToWorld,
  setCameraZoom as updateCameraZoom,
  type EditorCameraState,
} from "../../editor/editor-camera";
import type { EditorSelection } from "../../editor/level-editor-utils";
import type { FloorConfig, PlayerSpawn, StationConfig } from "../../types/level-config";

// 负责平移、缩放和对象编辑相关的指针/键盘状态切换。
export interface EditorSceneInputContext {
  input: Phaser.Input.InputPlugin;
  selectedTool: string | null;
  interactionBlocked: boolean;
  spacePressed: boolean;
  suppressCanvasPlacement: boolean;
  tileSize: number;
  panThreshold: number;
  gridWidth: number;
  gridHeight: number;
  isPanning: boolean;
  isZoomDragging: boolean;
  isDraggingObject: boolean;
  panStartPointer: { x: number; y: number } | null;
  panStartCenter: { x: number; y: number } | null;
  pendingPanStart: { x: number; y: number } | null;
  zoomDragOriginY: number;
  zoomDragStartZoom: number;
  objectDragSelection: EditorSelection | null;
  selectedObject: EditorSelection | null;
  cameraState: EditorCameraState;
  cameraContext: cameraModule.EditorSceneCameraContext;
  selectionContext: selectionModule.EditorSceneSelectionContext;
  configContext: configModule.EditorSceneConfigContext;
  setCurrentCursor: () => void;
}

/**
 * 注册编辑器场景所需的全部指针与键盘输入事件。
 */
export function setupInputEvents(scene: EditorSceneInputContext) {
  scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    if (scene.interactionBlocked) {
      return;
    }

    const worldPoint = screenToWorld(scene.cameraState, { x: pointer.x, y: pointer.y });
    if (!worldPoint.insideCanvas) {
      if (scene.selectedTool === null) {
        selectionModule.clearSelection(scene.selectionContext);
      }
      return;
    }

    if (scene.selectedTool === "hand-tool" || scene.spacePressed) {
      beginCameraPan(scene, pointer);
      return;
    }

    if (scene.selectedTool === "zoom-tool") {
      beginZoomDrag(scene, pointer);
      return;
    }

    if (scene.suppressCanvasPlacement) {
      scene.suppressCanvasPlacement = false;
      return;
    }

    const gridX = Math.floor((worldPoint.x ?? 0) / scene.tileSize);
    const gridY = Math.floor((worldPoint.y ?? 0) / scene.tileSize);

    if (!isInBounds(scene, gridX, gridY)) {
      selectionModule.clearSelection(scene.selectionContext);
      return;
    }

    if (!scene.selectedTool) {
      beginPotentialPan(scene, pointer);
      return;
    }

    configModule.placeObjectAt(scene.configContext, gridX, gridY);
  });

  scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
    if (scene.isDraggingObject) {
      return;
    }

    promotePendingPan(scene, pointer);

    if (!scene.isPanning || !scene.panStartPointer || !scene.panStartCenter) {
      if (scene.isZoomDragging) {
        updateZoomDrag(scene, pointer);
      }
      return;
    }

    const nextState = panCameraByScreenDelta(scene.cameraState, {
      deltaX: pointer.x - scene.panStartPointer.x,
      deltaY: pointer.y - scene.panStartPointer.y,
    });

    cameraModule.setCameraCenter(scene.cameraContext, nextState.centerX, nextState.centerY);
  });

  scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
    if (scene.isDraggingObject) {
      finishObjectDrag(scene, pointer);
    }

    if (scene.pendingPanStart && !scene.isPanning && scene.selectedTool === null) {
      selectionModule.clearSelection(scene.selectionContext);
    }

    scene.pendingPanStart = null;
    stopPanning(scene);
    stopZoomDrag(scene);
  });

  scene.input.on(
    "wheel",
    (
      pointer: Phaser.Input.Pointer,
      _gameObjects: Phaser.GameObjects.GameObject[],
      _deltaX: number,
      deltaY: number,
    ) => {
      if (scene.interactionBlocked) {
        return;
      }

      const worldPoint = screenToWorld(scene.cameraState, { x: pointer.x, y: pointer.y });
      if (!worldPoint.insideCanvas) {
        return;
      }

      cameraModule.setCameraZoom(scene.cameraContext, scene.cameraState.zoom * (deltaY > 0 ? 0.9 : 1.1));
    },
  );

  scene.input.keyboard?.on("keydown-SPACE", () => {
    scene.spacePressed = true;
    if (!scene.interactionBlocked) {
      scene.setCurrentCursor();
    }
  });
  scene.input.keyboard?.on("keyup-SPACE", () => {
    scene.spacePressed = false;
    stopPanning(scene);
    if (!scene.interactionBlocked) {
      scene.setCurrentCursor();
    }
  });

  scene.input.keyboard?.on("keydown-DELETE", () => {
    if (!scene.interactionBlocked) {
      configModule.deleteSelectedObject(scene.configContext);
    }
  });
  scene.input.keyboard?.on("keydown-BACKSPACE", () => {
    if (!scene.interactionBlocked) {
      configModule.deleteSelectedObject(scene.configContext);
    }
  });
}

/**
 * 结束平移状态并恢复默认光标。
 */
export function stopPanning(scene: EditorSceneInputContext) {
  scene.isPanning = false;
  scene.panStartPointer = null;
  scene.panStartCenter = null;
  scene.pendingPanStart = null;
  scene.setCurrentCursor();
}

/**
 * 结束缩放拖拽状态。
 */
export function stopZoomDrag(scene: EditorSceneInputContext) {
  scene.isZoomDragging = false;
}

/**
 * 记录一次可能的平移起点，等待位移超过阈值后再升级为拖拽。
 */
export function beginPotentialPan(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  scene.pendingPanStart = { x: pointer.x, y: pointer.y };
  scene.panStartCenter = {
    x: scene.cameraState.centerX,
    y: scene.cameraState.centerY,
  };
}

/**
 * 在位移超过阈值后把待定平移升级为真正的平移动作。
 */
export function promotePendingPan(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  if (!scene.pendingPanStart || scene.isPanning || !scene.panStartCenter) {
    return;
  }

  const deltaX = pointer.x - scene.pendingPanStart.x;
  const deltaY = pointer.y - scene.pendingPanStart.y;
  if (Math.hypot(deltaX, deltaY) < scene.panThreshold) {
    return;
  }

  scene.isPanning = true;
  scene.panStartPointer = { ...scene.pendingPanStart };
  scene.input.setDefaultCursor("grabbing");
}

/**
 * 立刻进入相机平移状态，供手形工具和空格拖拽复用。
 */
export function beginCameraPan(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  scene.isPanning = true;
  scene.pendingPanStart = null;
  scene.panStartPointer = { x: pointer.x, y: pointer.y };
  scene.panStartCenter = {
    x: scene.cameraState.centerX,
    y: scene.cameraState.centerY,
  };
  scene.input.setDefaultCursor("grabbing");
}

/**
 * 开始一次基于垂直拖拽的缩放操作。
 */
export function beginZoomDrag(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  scene.isZoomDragging = true;
  scene.zoomDragOriginY = pointer.y;
  scene.zoomDragStartZoom = scene.cameraState.zoom;
  scene.input.setDefaultCursor("ns-resize");
}

/**
 * 根据当前拖拽位移更新缩放值，并保持视口中心稳定。
 */
export function updateZoomDrag(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  const delta = (scene.zoomDragOriginY - pointer.y) / 240;
  const nextState = updateCameraZoom(scene.cameraState, scene.zoomDragStartZoom + delta);
  cameraModule.setCameraZoom(scene.cameraContext, nextState.zoom);
}

/**
 * 完成对象拖拽放置，并按最终位置更新配置或恢复原状。
 */
export function finishObjectDrag(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  if (!scene.objectDragSelection) {
    return;
  }

  const worldPoint = screenToWorld(scene.cameraState, { x: pointer.x, y: pointer.y });

  scene.isDraggingObject = false;
  scene.objectDragSelection = null;
  scene.setCurrentCursor();

  if (!worldPoint.insideCanvas) {
    return;
  }

  const gridX = Math.floor((worldPoint.x ?? 0) / scene.tileSize);
  const gridY = Math.floor((worldPoint.y ?? 0) / scene.tileSize);

  if (!isInBounds(scene, gridX, gridY)) {
    return;
  }

  if (scene.selectedObject?.kind === "player") {
    configModule.updateSelectedObject(scene.configContext, { x: gridX, y: gridY });
    return;
  }

  if (
    scene.selectedObject &&
    "x" in scene.selectedObject &&
    "y" in scene.selectedObject &&
    scene.selectedObject.x === gridX &&
    scene.selectedObject.y === gridY
  ) {
    return;
  }

  configModule.updateSelectedObject(scene.configContext, { x: gridX, y: gridY });
}

/**
 * 处理对象上的 pointerdown，按当前工具决定选中还是开始拖拽。
 */
export function handleObjectPointerDown(
  scene: EditorSceneInputContext,
  pointer: Phaser.Input.Pointer,
  selection: EditorSelection,
  object: FloorConfig | StationConfig | PlayerSpawn,
) {
  scene.suppressCanvasPlacement = true;
  selectionModule.selectObject(scene.selectionContext, selection, object);

  if (scene.selectedTool === "move-tool") {
    scene.objectDragSelection = selection;
    scene.isDraggingObject = true;
    scene.input.setDefaultCursor("grabbing");
  }

  if (scene.selectedTool === "hand-tool") {
    beginCameraPan(scene, pointer);
  }
}

function isInBounds(scene: Pick<EditorSceneInputContext, "gridWidth" | "gridHeight">, x: number, y: number) {
  return x >= 0 && y >= 0 && x < scene.gridWidth && y < scene.gridHeight;
}
