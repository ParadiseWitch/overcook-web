import Phaser from "phaser";

import {
  type EditorSelection,
  type FloorToolOptions,
} from "../../editor/level-editor-utils";
import { ensureEditorPreviewTextures } from "../../editor/editor-preview-textures";
import { LevelConfigManager } from "../../manager/level-config-manager";
import type { FloorConfig, LevelConfig, PlayerSpawn, StationConfig } from "../../types/level-config";
import { getDefaultLevelConfig } from "../../types/level-config";
import * as cameraModule from "./editor-scene-camera";
import * as renderModule from "./editor-scene-render";
import * as selectionModule from "./editor-scene-selection";
import * as configModule from "./editor-scene-config";
import * as inputModule from "./editor-scene-input";

export type MapViewMode = "fit" | "browse";
export interface EditorCameraState {
  scrollX: number;
  scrollY: number;
  zoom: number;
  visibleWidth: number;
  visibleHeight: number;
  worldWidth: number;
  worldHeight: number;
  centerX: number;
  centerY: number;
}

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
  public readonly fitPadding = 0;
  public readonly browseZoomDefault = 1;
  public readonly panThreshold = 6;
  public viewportWidth = 1280;
  public viewportHeight = 720;
  public mapViewMode: MapViewMode = "fit";
  public interactionBlocked = false;
  public isPanning = false;
  public isZoomDragging = false;
  public isDraggingObject = false;
  public spacePressed = false;
  public panStartPointer: { x: number; y: number } | null = null;
  public panStartScroll: { x: number; y: number } | null = null;
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
    this.syncGridSize();
  }

  /**
   * 创建编辑器场景的显示对象、输入和首帧相机状态。
   */
  create() {
    ensureEditorPreviewTextures(this);
    this.gridGroup = this.add.group();
    this.objectGroup = this.add.group();
    // 先初始化相机视口，再生成网格和对象，避免首帧继续使用默认尺寸。
    cameraModule.initializeCameraViewport(this as unknown as cameraModule.EditorSceneCameraContext);
    this.updateWorldBounds();
    this.createGrid();
    this.renderLevelObjects();
    this.setupInputEvents();
    this.refreshCameraView();
    this.emitConfigChanged();
    this.emitSelectionChanged();
  }

  /**
   * 设置当前激活工具，并同步更新鼠标光标。
   */
  public setSelectedTool(tool: string | null) {
    this.selectedTool = tool;
    if (this.interactionBlocked) {
      return;
    }
    this.setCurrentCursor();
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
   * 更新编辑器视口尺寸。
   */
  public setViewportSize(width: number, height: number) {
    cameraModule.setViewportSize(this as unknown as cameraModule.EditorSceneCameraContext, width, height);
  }

  /**
   * 切换编辑器视图模式。
   */
  public setMapViewMode(mode: MapViewMode) {
    cameraModule.setMapViewMode(this as unknown as cameraModule.EditorSceneCameraContext, mode);
  }

  /**
   * 按当前模式重置相机视图。
   */
  public resetCameraView() {
    cameraModule.resetCameraView(this as unknown as cameraModule.EditorSceneCameraContext);
  }

  /**
   * 获取当前相机状态快照。
   */
  public getCameraState(): EditorCameraState {
    return cameraModule.getCameraState(this as unknown as cameraModule.EditorSceneCameraContext);
  }

  /**
   * 直接设置相机滚动值。
   */
  public setCameraScroll(scrollX: number, scrollY: number) {
    cameraModule.setCameraScroll(this as unknown as cameraModule.EditorSceneCameraContext, scrollX, scrollY);
  }

  /**
   * 直接设置相机中心点。
   */
  public setCameraCenter(centerX: number, centerY: number) {
    cameraModule.setCameraCenter(this as unknown as cameraModule.EditorSceneCameraContext, centerX, centerY);
  }

  /**
   * 直接设置相机缩放值。
   */
  public setCameraZoom(zoom: number) {
    cameraModule.setCameraZoom(
      this as unknown as cameraModule.EditorSceneCameraContext,
      zoom,
      () => this.ensureBrowseMode(),
    );
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
      this.panStartScroll = null;
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
    configModule.updateLevelName(this as unknown as configModule.EditorSceneConfigContext, name);
  }

  /**
   * 更新关卡描述。
   */
  public updateLevelDescription(description: string) {
    configModule.updateLevelDescription(this as unknown as configModule.EditorSceneConfigContext, description);
  }

  /**
   * 更新关卡模式。
   */
  public updateGameType(
    gameType: "local-coop" | "local-versus" | "online-coop" | "online-versus",
  ) {
    configModule.updateGameType(this as unknown as configModule.EditorSceneConfigContext, gameType);
  }

  /**
   * 更新关卡时长。
   */
  public updateDuration(duration: number) {
    configModule.updateDuration(this as unknown as configModule.EditorSceneConfigContext, duration);
  }

  /**
   * 更新目标分数配置。
   */
  public updateScoreTarget(target: Partial<LevelConfig["scoreTarget"]>) {
    configModule.updateScoreTarget(this as unknown as configModule.EditorSceneConfigContext, target);
  }

  /**
   * 更新订单池配置。
   */
  public updateOrderPool(orderPool: Partial<LevelConfig["orderPool"]>) {
    configModule.updateOrderPool(this as unknown as configModule.EditorSceneConfigContext, orderPool);
  }

  /**
   * 更新地图尺寸。
   */
  public updateMapSize(width: number, height: number) {
    configModule.updateMapSize(this as unknown as configModule.EditorSceneConfigContext, width, height);
  }

  /**
   * 更新当前选中对象的属性补丁。
   */
  public updateSelectedObject(patch: Record<string, unknown>) {
    configModule.updateSelectedObject(this as unknown as configModule.EditorSceneConfigContext, patch);
  }

  /**
   * 删除当前选中对象。
   */
  public deleteSelectedObject() {
    configModule.deleteSelectedObject(this as unknown as configModule.EditorSceneConfigContext);
  }

  /**
   * 清空当前选中对象。
   */
  public clearSelection() {
    selectionModule.clearSelection(this as unknown as selectionModule.EditorSceneSelectionContext);
  }

  /**
   * 创建一张新的空白关卡。
   */
  public createNewLevel() {
    this.levelConfigManager = new LevelConfigManager(getDefaultLevelConfig());
    configModule.createNewLevel(this as unknown as configModule.EditorSceneConfigContext);
  }

  /**
   * 获取当前完整关卡配置。
   */
  public getLevelConfig(): LevelConfig {
    return configModule.getLevelConfig(this as unknown as configModule.EditorSceneConfigContext);
  }

  /**
   * 用指定配置替换当前场景内容。
   */
  public setLevelConfig(config: LevelConfig) {
    this.levelConfigManager = new LevelConfigManager(config);
    configModule.setLevelConfig(this as unknown as configModule.EditorSceneConfigContext, config);
  }

  /**
   * 导出当前关卡配置。
   */
  public exportLevelConfig(): LevelConfig {
    return configModule.exportLevelConfig(this as unknown as configModule.EditorSceneConfigContext);
  }

  /**
   * 从 JSON 文本导入关卡配置。
   */
  public importLevelConfig(jsonString: string) {
    return configModule.importLevelConfig(this as unknown as configModule.EditorSceneConfigContext, jsonString);
  }

  /**
   * 刷新编辑器场景中的网格、对象、选中框和相机状态。
   */
  public refreshScene() {
    this.syncGridSize();
    this.updateWorldBounds();
    this.createGrid();
    this.renderLevelObjects();
    this.refreshSelectionMarker();
    this.refreshCameraView();
    this.emitConfigChanged();
    this.emitSelectionChanged();
    this.emitCameraChanged();
  }

  /**
   * 根据配置同步地图网格尺寸缓存。
   */
  public syncGridSize() {
    const config = this.levelConfigManager.getConfig();
    this.gridWidth = config.map.width;
    this.gridHeight = config.map.height;
  }

  /**
   * 依据网格尺寸更新物理世界边界。
   */
  public updateWorldBounds() {
    const worldWidth = this.gridWidth * this.tileSize;
    const worldHeight = this.gridHeight * this.tileSize;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  }

  /**
   * 刷新当前相机视图。
   */
  public refreshCameraView() {
    cameraModule.refreshCameraView(this as unknown as cameraModule.EditorSceneCameraContext);
  }

  /**
   * 应用适配视图模式。
   */
  public applyFitView() {
    cameraModule.applyFitView(this as unknown as cameraModule.EditorSceneCameraContext);
  }

  /**
   * 把相机移动到地图中心。
   */
  public centerCamera() {
    cameraModule.centerCamera(this as unknown as cameraModule.EditorSceneCameraContext);
  }

  /**
   * 钳制相机位置，避免越出合法边界。
   */
  public clampCameraPosition() {
    cameraModule.clampCameraPosition(this as unknown as cameraModule.EditorSceneCameraContext);
  }

  /**
   * 重建编辑器网格层。
   */
  public createGrid() {
    renderModule.createGrid(this as unknown as renderModule.EditorSceneRenderContext);
  }

  /**
   * 重绘全部关卡对象。
   */
  public renderLevelObjects() {
    renderModule.renderLevelObjects(this as unknown as renderModule.EditorSceneRenderContext);
  }

  /**
   * 渲染单个地板对象。
   */
  public renderFloor(floor: FloorConfig) {
    renderModule.renderFloor(this as unknown as renderModule.EditorSceneRenderContext, floor);
  }

  /**
   * 渲染单个工作站对象。
   */
  public renderStation(station: StationConfig) {
    renderModule.renderStation(this as unknown as renderModule.EditorSceneRenderContext, station);
  }

  /**
   * 渲染单个玩家出生点。
   */
  public renderPlayer(player: PlayerSpawn) {
    renderModule.renderPlayer(this as unknown as renderModule.EditorSceneRenderContext, player);
  }

  /**
   * 注册编辑器输入事件。
   */
  public setupInputEvents() {
    inputModule.setupInputEvents(this as unknown as inputModule.EditorSceneInputContext);
  }

  /**
   * 结束平移动作。
   */
  public stopPanning() {
    inputModule.stopPanning(this as unknown as inputModule.EditorSceneInputContext);
  }

  /**
   * 结束缩放拖拽。
   */
  public stopZoomDrag() {
    inputModule.stopZoomDrag(this as unknown as inputModule.EditorSceneInputContext);
  }

  /**
   * 在指定网格坐标放置当前工具对应的对象。
   */
  public placeObjectAt(x: number, y: number) {
    configModule.placeObjectAt(this as unknown as configModule.EditorSceneConfigContext & { selectedTool: string | null }, x, y);
  }

  /**
   * 选中一个对象并同步对外事件。
   */
  public selectObject(
    selection: EditorSelection,
    object: FloorConfig | StationConfig | PlayerSpawn,
  ) {
    selectionModule.selectObject(
      this as unknown as selectionModule.EditorSceneSelectionContext,
      selection,
      object,
    );
  }

  /**
   * 刷新选中框显示。
   */
  public refreshSelectionMarker() {
    selectionModule.refreshSelectionMarker(this as unknown as selectionModule.EditorSceneSelectionContext);
  }

  /**
   * 对外发出配置变更事件。
   */
  public emitConfigChanged() {
    this.events.emit("config-changed", {
      config: this.levelConfigManager.getConfig(),
      validation: this.levelConfigManager.validate(),
    });
  }

  /**
   * 对外发出选中对象变更事件。
   */
  public emitSelectionChanged() {
    selectionModule.emitSelectionChanged(this as unknown as selectionModule.EditorSceneSelectionContext);
  }

  /**
   * 获取当前选中的真实配置对象。
   */
  public getSelectedConfigObject(): FloorConfig | StationConfig | PlayerSpawn | null {
    return selectionModule.getSelectedConfigObject(this as unknown as selectionModule.EditorSceneSelectionContext);
  }

  /**
   * 获取当前选中对象用于绘制选中框的目标坐标。
   */
  public getSelectionTarget() {
    return selectionModule.getSelectionTarget(this as unknown as selectionModule.EditorSceneSelectionContext);
  }

  /**
   * 判断网格坐标是否在地图边界内。
   */
  public isInBounds(x: number, y: number) {
    return renderModule.isInBounds(this, x, y);
  }

  /**
   * 把网格坐标转换成世界坐标中心点。
   */
  public toWorldPosition(x: number, y: number) {
    return renderModule.toWorldPosition(this, x, y);
  }

  /**
   * 处理对象上的按下事件，决定选中或拖拽逻辑。
   */
  public handleObjectPointerDown(
    pointer: Phaser.Input.Pointer,
    selection: EditorSelection,
    object: FloorConfig | StationConfig | PlayerSpawn,
  ) {
    inputModule.handleObjectPointerDown(
      this as unknown as inputModule.EditorSceneInputContext,
      pointer,
      selection,
      object,
      (nextSelection, nextObject) => this.selectObject(nextSelection, nextObject),
    );
  }

  /**
   * 判断当前是否处于手形工具模式。
   */
  public isHandToolActive() {
    return this.selectedTool === "hand-tool";
  }

  /**
   * 记录一次待定平移起点。
   */
  public beginPotentialPan(pointer: Phaser.Input.Pointer) {
    inputModule.beginPotentialPan(this as unknown as inputModule.EditorSceneInputContext, pointer);
  }

  /**
   * 把待定平移升级为真正的平移操作。
   */
  public promotePendingPan(pointer: Phaser.Input.Pointer) {
    inputModule.promotePendingPan(this as unknown as inputModule.EditorSceneInputContext, pointer);
  }

  /**
   * 开始相机平移。
   */
  public beginCameraPan(pointer: Phaser.Input.Pointer) {
    inputModule.beginCameraPan(this as unknown as inputModule.EditorSceneInputContext, pointer);
  }

  /**
   * 开始相机缩放拖拽。
   */
  public beginZoomDrag(pointer: Phaser.Input.Pointer) {
    inputModule.beginZoomDrag(this as unknown as inputModule.EditorSceneInputContext, pointer);
  }

  /**
   * 根据拖拽位移更新缩放值。
   */
  public updateZoomDrag(pointer: Phaser.Input.Pointer) {
    inputModule.updateZoomDrag(this as unknown as inputModule.EditorSceneInputContext, pointer);
  }

  /**
   * 完成对象拖拽。
   */
  public finishObjectDrag(pointer: Phaser.Input.Pointer) {
    inputModule.finishObjectDrag(this as unknown as inputModule.EditorSceneInputContext, pointer);
  }

  /**
   * 如有需要，把编辑器从适配视图切换到浏览视图。
   */
  public ensureBrowseMode() {
    if (this.mapViewMode === "browse") {
      return;
    }

    this.mapViewMode = "browse";
    this.emitViewModeChanged();
  }

  /**
   * 对外发出视图模式变更事件。
   */
  public emitViewModeChanged() {
    this.events.emit("view-mode-changed", this.mapViewMode);
  }

  /**
   * 对外发出相机状态变更事件。
   */
  public emitCameraChanged() {
    this.events.emit("camera-changed", this.getCameraState());
  }

  /**
   * 根据当前工具和按键状态更新画布默认光标。
   */
  public setCurrentCursor() {
    this.input.setDefaultCursor(
      this.isHandToolActive() || this.spacePressed
        ? "grab"
        : this.selectedTool === "move-tool"
          ? "move"
          : this.selectedTool === "zoom-tool"
            ? "zoom-in"
            : "default",
    );
  }

}
