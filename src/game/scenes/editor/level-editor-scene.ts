import Phaser from "phaser";

import {
  type EditorSelection,
  type FloorToolOptions,
} from "../../editor/level-editor-utils";
import { ensureEditorPreviewTextures } from "../../editor/editor-preview-textures";
import { LevelConfigManager } from "../../manager/level-config-manager";
import type { LevelConfig } from "../../types/level-config";
import { getDefaultLevelConfig } from "../../types/level-config";
import * as renderModule from "./editor-scene-render";
import * as selectionModule from "./editor-scene-selection";
import * as configModule from "./editor-scene-config";
import { useCoordinateSystem } from "@/game/helper/use-coordinate-system";

// 作为编辑器场景的编排层，保留对 Vue 壳层稳定的公共 API。
export class LevelEditorScene extends Phaser.Scene {
  public coord: ReturnType<typeof useCoordinateSystem>
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
  // public cameraState = createCenteredCameraState({
  //   worldWidth: this.gridWidth * this.tileSize,
  //   worldHeight: this.gridHeight * this.tileSize,
  //   viewportWidth: this.canvasContainerWidth,
  //   viewportHeight: this.canvasContainerHeight,
  //   zoom: 1,
  // });
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

  constructor() {
    super({ key: "LevelEditorScene" });
  }

  /**
   * 根据传入关卡配置初始化编辑器场景。
   */
  init(data?: { levelConfig?: LevelConfig }) {
    const initialConfig = data?.levelConfig ?? getDefaultLevelConfig();
    this.levelConfigManager = new LevelConfigManager(initialConfig);
    this.syncGridSizeFromConfig();
    // this.cameraState = createCenteredCameraState({
    // worldWidth: this.gridWidth * this.tileSize,
    // worldHeight: this.gridHeight * this.tileSize,
    // viewportWidth: this.canvasContainerWidth,
    // viewportHeight: this.canvasContainerHeight,
    // zoom: 1,
    // });
  }

  /**
   * 创建编辑器场景的显示对象、输入和首帧相机状态。
   */
  create() {
    // 坐标系
    this.coord = useCoordinateSystem(this, {
      originX: 0,
      originY: 0,
      gridSize: 48,
      fixedToCamera: false
    });
    this.coord.show();
    ensureEditorPreviewTextures(this);
    this.gridGroup = this.add.group();
    this.objectGroup = this.add.group();
    // cameraModule.initializeCameraViewport(this);
    // 测试相机
    const camera = this.cameras.main;
    const gridCenter = this.getGridCenter();
    camera.centerOn(gridCenter[0], gridCenter[1]);
    camera.setZoom(1.1)
    camera.setBackgroundColor(0x20242b);
    this.updateWorldBoundsFromGrid();
    renderModule.renderLevelObjects(this);
    // inputModule.setupInputEvents(this);
    // this.emitConfigChangedEvent();
    // selectionModule.emitSelectionChanged(this);
  }

  /**
   * 重置相机到默认中心和缩放。
   */
  resetCamera() {
    const camera = this.cameras.main;
    const gridCenter = this.getGridCenter();
    camera.centerOn(gridCenter[0], gridCenter[1]);
    camera.setZoom(1.1)
  }

  getGridCenter(): number[] {
    return [this.gridWidth * this.tileSize / 2, this.gridHeight * this.tileSize / 2];
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
    // cameraModule.setCanvasSize(this, width, height);
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
    this.levelConfigManager.updateBasicInfo({ name });
    this.emitConfigChangedEvent();
  }

  /**
   * 更新关卡描述。
   */
  public updateLevelDescription(description: string) {
    this.levelConfigManager.updateBasicInfo({ description });
    this.emitConfigChangedEvent();
  }

  /**
   * 更新关卡模式。
   */
  public updateGameType(
    gameType: "local-coop" | "local-versus" | "online-coop" | "online-versus",
  ) {
    this.levelConfigManager.updateBasicInfo({ gameType });
    this.emitConfigChangedEvent();
  }

  /**
   * 更新关卡时长。
   */
  public updateDuration(duration: number) {
    this.levelConfigManager.updateBasicInfo({ duration });
    this.emitConfigChangedEvent();
  }

  /**
   * 更新目标分数配置。
   */
  public updateScoreTarget(target: Partial<LevelConfig["scoreTarget"]>) {
    this.levelConfigManager.updateScoreTarget(target);
    this.emitConfigChangedEvent();
  }

  /**
   * 更新订单池配置。
   */
  public updateOrderPool(orderPool: Partial<LevelConfig["orderPool"]>) {
    this.levelConfigManager.updateOrderPool(orderPool);
    this.emitConfigChangedEvent();
  }

  /**
   * 更新地图尺寸。
   */
  public updateMapSize(width: number, height: number) {
    this.levelConfigManager.updateMapSize(width, height);
    this.refreshSceneComposition();
  }

  /**
   * 更新当前选中对象的属性补丁。
   */
  public updateSelectedObject(patch: Record<string, unknown>) {
    configModule.updateSelectedObject(this, patch);
  }

  /**
   * 删除当前选中对象。
   */
  public deleteSelectedObject() {
    configModule.deleteSelectedObject(this);
  }

  /**
   * 创建一张新的空白关卡。
   */
  public createNewLevel() {
    this.levelConfigManager = new LevelConfigManager(getDefaultLevelConfig());
    this.selectedObject = null;
    this.refreshSceneComposition();
  }

  /**
   * 用指定配置替换当前场景内容。
   */
  public setLevelConfig(config: LevelConfig) {
    this.levelConfigManager = new LevelConfigManager(config);
    this.selectedObject = null;
    this.refreshSceneComposition();
  }

  /**
   * 导出当前关卡配置。
   */
  public exportLevelConfig(): LevelConfig {
    return this.levelConfigManager.getConfig();
  }

  /**
   * 从 JSON 文本导入关卡配置。
   */
  public importLevelConfig(jsonString: string) {
    return configModule.importLevelConfig(this, jsonString);
  }

  public refreshScene() {
    this.refreshSceneComposition();
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
    this.gridGroup.clear(true, true);
    // renderModule.createGrid(this);
    renderModule.renderLevelObjects(this);
    selectionModule.refreshSelectionMarker(this);
    cameraModule.refreshCameraView(this);
    this.emitConfigChangedEvent();
    selectionModule.emitSelectionChanged(this);
  }

  private emitConfigChangedEvent() {
    this.events.emit("config-changed", {
      config: this.levelConfigManager.getConfig(),
      validation: this.levelConfigManager.validate(),
    });
  }
}

export type { EditorCameraState };
