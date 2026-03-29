import Phaser from "phaser";

import { clampSceneZoom, computeCameraCenterWorldPoint, computeScrollForViewportCenter } from "../../editor/map-view";
import type { EditorSelection } from "../../editor/level-editor-utils";
import type { FloorConfig, PlayerSpawn, StationConfig } from "../../types/level-config";

// 负责平移、缩放和对象编辑相关的指针/键盘状态切换。
export interface EditorSceneInputContext {
  input: Phaser.Input.InputPlugin;
  cameras: { main: Phaser.Cameras.Scene2D.Camera };
  selectedTool: string | null;
  interactionBlocked: boolean;
  spacePressed: boolean;
  suppressCanvasPlacement: boolean;
  tileSize: number;
  panThreshold: number;
  fitPadding: number;
  viewportWidth: number;
  viewportHeight: number;
  gridWidth: number;
  gridHeight: number;
  isPanning: boolean;
  isZoomDragging: boolean;
  isDraggingObject: boolean;
  panStartPointer: { x: number; y: number } | null;
  panStartScroll: { x: number; y: number } | null;
  pendingPanStart: { x: number; y: number } | null;
  zoomDragOriginY: number;
  zoomDragStartZoom: number;
  objectDragSelection: EditorSelection | null;
  selectedObject: EditorSelection | null;
  clampCameraPosition: () => void;
  emitCameraChanged: () => void;
  clearSelection: () => void;
  placeObjectAt: (x: number, y: number) => void;
  updateSelectedObject: (patch: Record<string, unknown>) => void;
  ensureBrowseMode: () => void;
  emitViewModeChanged: () => void;
  setCurrentCursor: () => void;
  isInBounds: (x: number, y: number) => boolean;
  handleObjectPointerDown: (
    pointer: Phaser.Input.Pointer,
    selection: EditorSelection,
    object: FloorConfig | StationConfig | PlayerSpawn,
  ) => void;
  deleteSelectedObject: () => void;
}

/**
 * 注册编辑器场景所需的全部指针与键盘输入事件。
 */
export function setupInputEvents(scene: EditorSceneInputContext) {
  scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    if (scene.interactionBlocked) {
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

    const gridX = Math.floor(pointer.worldX / scene.tileSize);
    const gridY = Math.floor(pointer.worldY / scene.tileSize);

    if (!scene.isInBounds(gridX, gridY)) {
      scene.clearSelection();
      return;
    }

    if (!scene.selectedTool) {
      beginPotentialPan(scene, pointer);
      return;
    }

    scene.placeObjectAt(gridX, gridY);
  });

  scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
    if (scene.isDraggingObject) {
      return;
    }

    promotePendingPan(scene, pointer);

    if (!scene.isPanning || !scene.panStartPointer || !scene.panStartScroll) {
      if (scene.isZoomDragging) {
        updateZoomDrag(scene, pointer);
      }
      return;
    }

    const camera = scene.cameras.main;
    camera.setScroll(
      scene.panStartScroll.x - (pointer.x - scene.panStartPointer.x) / camera.zoom,
      scene.panStartScroll.y - (pointer.y - scene.panStartPointer.y) / camera.zoom,
    );
    scene.clampCameraPosition();
    scene.emitCameraChanged();
  });

  scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
    if (scene.isDraggingObject) {
      finishObjectDrag(scene, pointer);
    }

    if (scene.pendingPanStart && !scene.isPanning && scene.selectedTool === null) {
      scene.clearSelection();
    }

    scene.pendingPanStart = null;
    stopPanning(scene);
    stopZoomDrag(scene);
  });

  scene.input.on(
    "wheel",
    (
      _pointer: Phaser.Input.Pointer,
      _gameObjects: Phaser.GameObjects.GameObject[],
      _deltaX: number,
      deltaY: number,
    ) => {
      if (scene.interactionBlocked) {
        return;
      }

      scene.ensureBrowseMode();
      const camera = scene.cameras.main;
      const nextZoom = clampSceneZoom({
        zoom: camera.zoom * (deltaY > 0 ? 0.9 : 1.1),
        viewportWidth: scene.viewportWidth,
        viewportHeight: scene.viewportHeight,
        worldWidth: scene.gridWidth * scene.tileSize,
        worldHeight: scene.gridHeight * scene.tileSize,
        padding: scene.fitPadding,
      });
      const center = computeCameraCenterWorldPoint({
        scrollX: camera.scrollX,
        scrollY: camera.scrollY,
        cameraWidth: camera.width,
        cameraHeight: camera.height,
        zoom: camera.zoom,
      });
      camera.setZoom(nextZoom);
      const nextScroll = computeScrollForViewportCenter({
        centerX: center.centerX,
        centerY: center.centerY,
        viewportWidth: camera.width,
        viewportHeight: camera.height,
        zoom: nextZoom,
      });
      camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
      scene.clampCameraPosition();
      scene.emitCameraChanged();
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
      scene.deleteSelectedObject();
    }
  });
  scene.input.keyboard?.on("keydown-BACKSPACE", () => {
    if (!scene.interactionBlocked) {
      scene.deleteSelectedObject();
    }
  });
}

/**
 * 结束平移状态并恢复默认光标。
 */
export function stopPanning(scene: EditorSceneInputContext) {
  scene.isPanning = false;
  scene.panStartPointer = null;
  scene.panStartScroll = null;
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
  scene.panStartScroll = {
    x: scene.cameras.main.scrollX,
    y: scene.cameras.main.scrollY,
  };
}

/**
 * 在位移超过阈值后把待定平移升级为真正的平移动作。
 */
export function promotePendingPan(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  if (!scene.pendingPanStart || scene.isPanning || !scene.panStartScroll) {
    return;
  }

  const deltaX = pointer.x - scene.pendingPanStart.x;
  const deltaY = pointer.y - scene.pendingPanStart.y;
  if (Math.hypot(deltaX, deltaY) < scene.panThreshold) {
    return;
  }

  // 超过阈值后才提升为真正的平移，避免普通点击误触发拖动画布。
  scene.ensureBrowseMode();
  scene.isPanning = true;
  scene.panStartPointer = { ...scene.pendingPanStart };
  scene.input.setDefaultCursor("grabbing");
}

/**
 * 立刻进入相机平移状态，供手形工具和空格拖拽复用。
 */
export function beginCameraPan(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  scene.ensureBrowseMode();
  scene.isPanning = true;
  scene.pendingPanStart = null;
  scene.panStartPointer = { x: pointer.x, y: pointer.y };
  scene.panStartScroll = {
    x: scene.cameras.main.scrollX,
    y: scene.cameras.main.scrollY,
  };
  scene.input.setDefaultCursor("grabbing");
}

/**
 * 开始一次基于垂直拖拽的缩放操作。
 */
export function beginZoomDrag(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  scene.ensureBrowseMode();
  scene.isZoomDragging = true;
  scene.zoomDragOriginY = pointer.y;
  scene.zoomDragStartZoom = scene.cameras.main.zoom;
  scene.input.setDefaultCursor("ns-resize");
}

/**
 * 根据当前拖拽位移更新缩放值，并保持视口中心稳定。
 */
export function updateZoomDrag(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  const delta = (scene.zoomDragOriginY - pointer.y) / 240;
  const camera = scene.cameras.main;
  const nextZoom = clampSceneZoom({
    zoom: scene.zoomDragStartZoom + delta,
    viewportWidth: scene.viewportWidth,
    viewportHeight: scene.viewportHeight,
    worldWidth: scene.gridWidth * scene.tileSize,
    worldHeight: scene.gridHeight * scene.tileSize,
    padding: scene.fitPadding,
  });
  const center = computeCameraCenterWorldPoint({
    scrollX: camera.scrollX,
    scrollY: camera.scrollY,
    cameraWidth: camera.width,
    cameraHeight: camera.height,
    zoom: camera.zoom,
  });
  camera.setZoom(nextZoom);
  const nextScroll = computeScrollForViewportCenter({
    centerX: center.centerX,
    centerY: center.centerY,
    viewportWidth: camera.width,
    viewportHeight: camera.height,
    zoom: nextZoom,
  });
  camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
  scene.clampCameraPosition();
  scene.emitCameraChanged();
}

/**
 * 完成对象拖拽放置，并按最终位置更新配置或恢复原状。
 */
export function finishObjectDrag(scene: EditorSceneInputContext, pointer: Phaser.Input.Pointer) {
  if (!scene.objectDragSelection) {
    return;
  }

  const gridX = Math.floor(pointer.worldX / scene.tileSize);
  const gridY = Math.floor(pointer.worldY / scene.tileSize);

  scene.isDraggingObject = false;
  scene.objectDragSelection = null;
  scene.setCurrentCursor();

  if (!scene.isInBounds(gridX, gridY)) {
    return;
  }

  if (scene.selectedObject?.kind === "player") {
    scene.updateSelectedObject({ x: gridX, y: gridY });
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

  scene.updateSelectedObject({ x: gridX, y: gridY });
}

/**
 * 处理对象上的 pointerdown，按当前工具决定选中还是开始拖拽。
 */
export function handleObjectPointerDown(
  scene: EditorSceneInputContext,
  pointer: Phaser.Input.Pointer,
  selection: EditorSelection,
  object: FloorConfig | StationConfig | PlayerSpawn,
  selectObject: (
    selection: EditorSelection,
    object: FloorConfig | StationConfig | PlayerSpawn,
  ) => void,
) {
  scene.suppressCanvasPlacement = true;
  selectObject(selection, object);

  if (scene.selectedTool === "move-tool") {
    scene.objectDragSelection = selection;
    scene.isDraggingObject = true;
    scene.input.setDefaultCursor("grabbing");
  }

  if (scene.selectedTool === "hand-tool") {
    beginCameraPan(scene, pointer);
  }
}
