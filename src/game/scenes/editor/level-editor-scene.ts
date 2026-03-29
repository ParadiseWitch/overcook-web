import Phaser from "phaser";

import {
  createCenteredCameraState,
  type EditorCameraState,
} from "../../editor/editor-camera";
import {
  type EditorSelection,
  type FloorToolOptions,
} from "../../editor/level-editor-utils";
import { ensureEditorPreviewTextures } from "../../editor/editor-preview-textures";
import { LevelConfigManager } from "../../manager/level-config-manager";
import type { LevelConfig } from "../../types/level-config";
import { getDefaultLevelConfig } from "../../types/level-config";
import * as cameraModule from "./editor-scene-camera";
import * as renderModule from "./editor-scene-render";
import * as selectionModule from "./editor-scene-selection";
import * as configModule from "./editor-scene-config";
import * as inputModule from "./editor-scene-input";

// 作为编辑器场景的编排层，保留对 Vue 壳层稳定的公共 API。
export class LevelEditorScene extends Phaser.Scene {
  public levelConfigManager = new LevelConfigManager(getDefaultLevelConfig());
  public selectedTool: string | null = null;
  public toolOptions: FloorToolOptions = {
    conveyorDirection: "right",
    conveyorSpeed: 100,
  };
  public gridWidth = 17;
  public gridHeight = 13;
  public readonly tileSize = 48;
  public readonly panThreshold = 6;
  public canvasContainerWidth = 1280;
  public canvasContainerHeight = 720;
  public cameraState = createCenteredCameraState({
    worldWidth: this.gridWidth * this.tileSize,
    worldHeight: this.gridHeight * this.tileSize,
    viewportWidth: this.canvasContainerWidth,
    viewportHeight: this.canvasContainerHeight,
    zoom: 1,
  });
  public interactionBlocked = false;
  public isPanning = false;
  public isZoomDragging = false;
  public isDraggingObject = false;
  public spacePressed = false;
  public panStartPointer: { x: number; y: number } | null = null;
  public panStartCenter: { x: number; y: number } | null = null;
  public pendingPanStart: { x: number; y: number } | null = null;
  public zoomDragOriginY = 0;
  public zoomDragStartZoom = 1;
  public objectDragSelection: EditorSelection | null = null;
  public gridGroup!: Phaser.GameObjects.Group;
  public objectGroup!: Phaser.GameObjects.Group;
  public selectionMarker: Phaser.GameObjects.Rectangle | null = null;
  public selectedObject: EditorSelection | null = null;
  public suppressCanvasPlacement = false;

  public readonly editorSceneCameraContext: cameraModule.EditorSceneCameraContext;
  public readonly editorSceneRenderContext: renderModule.EditorSceneRenderContext;
  public readonly editorSceneSelectionContext: selectionModule.EditorSceneSelectionContext;
  public readonly editorSceneConfigContext: configModule.EditorSceneConfigContext;
  public readonly editorSceneInputContext: inputModule.EditorSceneInputContext;

  constructor() {
    super({ key: "LevelEditorScene" });
    this.editorSceneCameraContext = this.createCameraContext();
    this.editorSceneRenderContext = this.createRenderContext();
    this.editorSceneSelectionContext = this.createSelectionContext();
    this.editorSceneConfigContext = this.createConfigContext();
    this.editorSceneInputContext = this.createInputContext();
  }

  /**
   * 根据传入关卡配置初始化编辑器场景。
   */
  init(data?: { levelConfig?: LevelConfig }) {
    const initialConfig = data?.levelConfig ?? getDefaultLevelConfig();
    this.levelConfigManager = new LevelConfigManager(initialConfig);
    this.syncGridSizeFromConfig();
    this.cameraState = createCenteredCameraState({
      worldWidth: this.gridWidth * this.tileSize,
      worldHeight: this.gridHeight * this.tileSize,
      viewportWidth: this.canvasContainerWidth,
      viewportHeight: this.canvasContainerHeight,
      zoom: 1,
    });
  }

  /**
   * 创建编辑器场景的显示对象、输入和首帧相机状态。
   */
  create() {
    ensureEditorPreviewTextures(this);
    this.gridGroup = this.add.group();
    this.objectGroup = this.add.group();
    cameraModule.initializeCameraViewport(this.editorSceneCameraContext);
    this.updateWorldBoundsFromGrid();
    renderModule.createGrid(this.editorSceneRenderContext);
    renderModule.renderLevelObjects(this.editorSceneRenderContext);
    inputModule.setupInputEvents(this.editorSceneInputContext);
    cameraModule.refreshCameraView(this.editorSceneCameraContext);
    this.emitConfigChangedEvent();
    selectionModule.emitSelectionChanged(this.editorSceneSelectionContext);
  }

  /**
   * 设置当前激活工具，并同步更新鼠标光标。
   */
  public setSelectedTool(tool: string | null) {
    this.selectedTool = tool;
    if (!this.interactionBlocked) {
      this.setCurrentCursor();
    }
  }

  /**
   * 更新当前工具的附加配置。
   */
  public setToolOptions(options: Partial<FloorToolOptions>) {
    this.toolOptions = {
      ...this.toolOptions,
      ...options,
    };
  }

  /**
   * 更新编辑器容器尺寸。
   */
  public setCanvasSize(width: number, height: number) {
    cameraModule.setCanvasSize(this.editorSceneCameraContext, width, height);
  }

  /**
   * 重置相机到默认中心和缩放。
   */
  public resetCamera() {
    cameraModule.resetCamera(this.editorSceneCameraContext);
  }

  /**
   * 获取当前相机状态快照。
   */
  public getCameraState(): EditorCameraState {
    return this.cameraState;
  }

  /**
   * 直接设置相机中心点。
   */
  public setCameraCenter(centerX: number, centerY: number) {
    cameraModule.setCameraCenter(this.editorSceneCameraContext, centerX, centerY);
  }

  /**
   * 直接设置相机缩放值。
   */
  public setCameraZoom(zoom: number) {
    cameraModule.setCameraZoom(this.editorSceneCameraContext, zoom);
  }

  /**
   * 统一控制场景交互是否被外部面板操作暂时阻塞。
   */
  public setInteractionBlocked(blocked: boolean) {
    this.interactionBlocked = blocked;
    if (blocked) {
      this.isPanning = false;
      this.isZoomDragging = false;
      this.isDraggingObject = false;
      this.panStartPointer = null;
      this.panStartCenter = null;
      this.pendingPanStart = null;
      this.objectDragSelection = null;
      return;
    }

    this.setCurrentCursor();
  }

  /**
   * 更新关卡名称。
   */
  public updateLevelName(name: string) {
    configModule.updateLevelName(this.editorSceneConfigContext, name);
  }

  /**
   * 更新关卡描述。
   */
  public updateLevelDescription(description: string) {
    configModule.updateLevelDescription(this.editorSceneConfigContext, description);
  }

  /**
   * 更新关卡模式。
   */
  public updateGameType(
    gameType: "local-coop" | "local-versus" | "online-coop" | "online-versus",
  ) {
    configModule.updateGameType(this.editorSceneConfigContext, gameType);
  }

  /**
   * 更新关卡时长。
   */
  public updateDuration(duration: number) {
    configModule.updateDuration(this.editorSceneConfigContext, duration);
  }

  /**
   * 更新目标分数配置。
   */
  public updateScoreTarget(target: Partial<LevelConfig["scoreTarget"]>) {
    configModule.updateScoreTarget(this.editorSceneConfigContext, target);
  }

  /**
   * 更新订单池配置。
   */
  public updateOrderPool(orderPool: Partial<LevelConfig["orderPool"]>) {
    configModule.updateOrderPool(this.editorSceneConfigContext, orderPool);
  }

  /**
   * 更新地图尺寸。
   */
  public updateMapSize(width: number, height: number) {
    configModule.updateMapSize(this.editorSceneConfigContext, width, height);
  }

  /**
   * 更新当前选中对象的属性补丁。
   */
  public updateSelectedObject(patch: Record<string, unknown>) {
    configModule.updateSelectedObject(this.editorSceneConfigContext, patch);
  }

  /**
   * 删除当前选中对象。
   */
  public deleteSelectedObject() {
    configModule.deleteSelectedObject(this.editorSceneConfigContext);
  }

  /**
   * 创建一张新的空白关卡。
   */
  public createNewLevel() {
    this.levelConfigManager = new LevelConfigManager(getDefaultLevelConfig());
    configModule.createNewLevel(this.editorSceneConfigContext);
  }

  /**
   * 用指定配置替换当前场景内容。
   */
  public setLevelConfig(config: LevelConfig) {
    this.levelConfigManager = new LevelConfigManager(config);
    configModule.setLevelConfig(this.editorSceneConfigContext, config);
  }

  /**
   * 导出当前关卡配置。
   */
  public exportLevelConfig(): LevelConfig {
    return configModule.exportLevelConfig(this.editorSceneConfigContext);
  }

  /**
   * 从 JSON 文本导入关卡配置。
   */
  public importLevelConfig(jsonString: string) {
    return configModule.importLevelConfig(this.editorSceneConfigContext, jsonString);
  }

  /**
   * 根据当前工具和按键状态更新画布默认光标。
   */
  public setCurrentCursor() {
    this.input.setDefaultCursor(
      this.selectedTool === "hand-tool" || this.spacePressed
        ? "grab"
        : this.selectedTool === "move-tool"
          ? "move"
          : this.selectedTool === "zoom-tool"
            ? "zoom-in"
            : "default",
    );
  }

  private createCameraContext(): cameraModule.EditorSceneCameraContext {
    const scene = this;
    return {
      cameras: scene.cameras,
      scale: scene.scale,
      sys: scene.sys,
      get canvasContainerWidth() {
        return scene.canvasContainerWidth;
      },
      set canvasContainerWidth(value: number) {
        scene.canvasContainerWidth = value;
      },
      get canvasContainerHeight() {
        return scene.canvasContainerHeight;
      },
      set canvasContainerHeight(value: number) {
        scene.canvasContainerHeight = value;
      },
      get gridWidth() {
        return scene.gridWidth;
      },
      get gridHeight() {
        return scene.gridHeight;
      },
      get tileSize() {
        return scene.tileSize;
      },
      get cameraState() {
        return scene.cameraState;
      },
      set cameraState(value: EditorCameraState) {
        scene.cameraState = value;
      },
      emitCameraChanged: () => {
        scene.events.emit("camera-changed", scene.cameraState);
      },
    };
  }

  private createRenderContext(): renderModule.EditorSceneRenderContext {
    const scene = this;
    return {
      add: scene.add,
      get gridGroup() {
        return scene.gridGroup;
      },
      get objectGroup() {
        return scene.objectGroup;
      },
      get tileSize() {
        return scene.tileSize;
      },
      levelConfigManager: {
        getConfig: () => scene.levelConfigManager.getConfig(),
      },
      get inputContext() {
        return scene.editorSceneInputContext;
      },
    };
  }

  private createSelectionContext(): selectionModule.EditorSceneSelectionContext {
    const scene = this;
    return {
      add: scene.add,
      events: scene.events,
      get tileSize() {
        return scene.tileSize;
      },
      get selectedObject() {
        return scene.selectedObject;
      },
      set selectedObject(value: EditorSelection | null) {
        scene.selectedObject = value;
      },
      get selectionMarker() {
        return scene.selectionMarker;
      },
      set selectionMarker(value: Phaser.GameObjects.Rectangle | null) {
        scene.selectionMarker = value;
      },
      levelConfigManager: {
        getConfig: () => scene.levelConfigManager.getConfig(),
      },
      toWorldPosition: (x, y) => renderModule.toWorldPosition(scene.editorSceneRenderContext, x, y),
    };
  }

  private createConfigContext(): configModule.EditorSceneConfigContext {
    const scene = this;
    return {
      levelConfigManager: {
        updateBasicInfo: (patch) => scene.levelConfigManager.updateBasicInfo(patch),
        updateScoreTarget: (target) => scene.levelConfigManager.updateScoreTarget(target),
        updateOrderPool: (orderPool) => scene.levelConfigManager.updateOrderPool(orderPool),
        updateMapSize: (width, height) => scene.levelConfigManager.updateMapSize(width, height),
        getConfig: () => scene.levelConfigManager.getConfig(),
        addFloor: (floor) => scene.levelConfigManager.addFloor(floor),
        removeFloor: (x, y) => scene.levelConfigManager.removeFloor(x, y),
        addStation: (station) => scene.levelConfigManager.addStation(station),
        removeStation: (x, y) => scene.levelConfigManager.removeStation(x, y),
        addPlayer: (player) => scene.levelConfigManager.addPlayer(player),
        removePlayer: (id) => scene.levelConfigManager.removePlayer(id),
        importJSON: (jsonString) => scene.levelConfigManager.importJSON(jsonString),
        validate: () => scene.levelConfigManager.validate(),
      },
      get selectedObject() {
        return scene.selectedObject;
      },
      set selectedObject(value: EditorSelection | null) {
        scene.selectedObject = value;
      },
      get selectedTool() {
        return scene.selectedTool;
      },
      get toolOptions() {
        return scene.toolOptions;
      },
      emitConfigChanged: () => {
        scene.emitConfigChangedEvent();
      },
      refreshScene: () => {
        scene.refreshSceneComposition();
      },
    };
  }

  private createInputContext(): inputModule.EditorSceneInputContext {
    const scene = this;
    return {
      input: scene.input,
      get selectedTool() {
        return scene.selectedTool;
      },
      get interactionBlocked() {
        return scene.interactionBlocked;
      },
      get spacePressed() {
        return scene.spacePressed;
      },
      set spacePressed(value: boolean) {
        scene.spacePressed = value;
      },
      get suppressCanvasPlacement() {
        return scene.suppressCanvasPlacement;
      },
      set suppressCanvasPlacement(value: boolean) {
        scene.suppressCanvasPlacement = value;
      },
      get tileSize() {
        return scene.tileSize;
      },
      get gridWidth() {
        return scene.gridWidth;
      },
      get gridHeight() {
        return scene.gridHeight;
      },
      get panThreshold() {
        return scene.panThreshold;
      },
      get isPanning() {
        return scene.isPanning;
      },
      set isPanning(value: boolean) {
        scene.isPanning = value;
      },
      get isZoomDragging() {
        return scene.isZoomDragging;
      },
      set isZoomDragging(value: boolean) {
        scene.isZoomDragging = value;
      },
      get isDraggingObject() {
        return scene.isDraggingObject;
      },
      set isDraggingObject(value: boolean) {
        scene.isDraggingObject = value;
      },
      get panStartPointer() {
        return scene.panStartPointer;
      },
      set panStartPointer(value: { x: number; y: number } | null) {
        scene.panStartPointer = value;
      },
      get panStartCenter() {
        return scene.panStartCenter;
      },
      set panStartCenter(value: { x: number; y: number } | null) {
        scene.panStartCenter = value;
      },
      get pendingPanStart() {
        return scene.pendingPanStart;
      },
      set pendingPanStart(value: { x: number; y: number } | null) {
        scene.pendingPanStart = value;
      },
      get zoomDragOriginY() {
        return scene.zoomDragOriginY;
      },
      set zoomDragOriginY(value: number) {
        scene.zoomDragOriginY = value;
      },
      get zoomDragStartZoom() {
        return scene.zoomDragStartZoom;
      },
      set zoomDragStartZoom(value: number) {
        scene.zoomDragStartZoom = value;
      },
      get objectDragSelection() {
        return scene.objectDragSelection;
      },
      set objectDragSelection(value: EditorSelection | null) {
        scene.objectDragSelection = value;
      },
      get selectedObject() {
        return scene.selectedObject;
      },
      get cameraState() {
        return scene.cameraState;
      },
      get cameraContext() {
        return scene.editorSceneCameraContext;
      },
      get selectionContext() {
        return scene.editorSceneSelectionContext;
      },
      get configContext() {
        return scene.editorSceneConfigContext;
      },
      setCurrentCursor: () => {
        scene.setCurrentCursor();
      },
    };
  }

  private syncGridSizeFromConfig() {
    const config = this.levelConfigManager.getConfig();
    this.gridWidth = config.map.width;
    this.gridHeight = config.map.height;
  }

  private updateWorldBoundsFromGrid() {
    const worldWidth = this.gridWidth * this.tileSize;
    const worldHeight = this.gridHeight * this.tileSize;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  }

  private refreshSceneComposition() {
    this.syncGridSizeFromConfig();
    this.updateWorldBoundsFromGrid();
    renderModule.createGrid(this.editorSceneRenderContext);
    renderModule.renderLevelObjects(this.editorSceneRenderContext);
    selectionModule.refreshSelectionMarker(this.editorSceneSelectionContext);
    cameraModule.refreshCameraView(this.editorSceneCameraContext);
    this.emitConfigChangedEvent();
    selectionModule.emitSelectionChanged(this.editorSceneSelectionContext);
  }

  private emitConfigChangedEvent() {
    this.events.emit("config-changed", {
      config: this.levelConfigManager.getConfig(),
      validation: this.levelConfigManager.validate(),
    });
  }
}

export type { EditorCameraState };
