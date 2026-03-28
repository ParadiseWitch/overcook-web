import Phaser from "phaser";

import {
  buildDefaultFloorForTool,
  buildDefaultPlayerForTool,
  buildDefaultStationForTool,
  cloneLevelConfig,
  type EditorSelection,
  type FloorToolOptions,
} from "../editor/level-editor-utils";
import {
  buildRenderableFloors,
  getFloorRenderSpec,
  getIngredientLabel,
  getStationTextureKey as resolveStationTextureKey,
} from "../editor/editor-render";
import { ensureEditorPreviewTextures } from "../editor/editor-preview-textures";
import {
  clampSceneZoom,
  clampCameraScroll,
  computeScrollForViewportCenter,
  computeZoomScrollFromViewportCenter,
  computeFitView,
  normalizeZoom,
} from "../editor/map-view";
import { LevelConfigManager } from "../manager/level-config-manager";
import type {
  ConveyorFloor,
  FloorConfig,
  LevelConfig,
  PlayerSpawn,
  StationConfig,
} from "../types/level-config";
import { getDefaultLevelConfig } from "../types/level-config";

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

type SelectionPayload =
  | { kind: "floor"; object: FloorConfig }
  | { kind: "station"; object: StationConfig }
  | { kind: "player"; object: PlayerSpawn }
  | null;

export class LevelEditorScene extends Phaser.Scene {
  private levelConfigManager = new LevelConfigManager(getDefaultLevelConfig());
  private selectedTool: string | null = null;
  private toolOptions: FloorToolOptions = {
    conveyorDirection: "right",
    conveyorSpeed: 100,
  };
  private gridWidth = 17;
  private gridHeight = 13;
  private readonly tileSize = 48;
  private readonly fitPadding = 0;
  private readonly browseZoomDefault = 1;
  private readonly panThreshold = 6;
  private viewportWidth = 1280;
  private viewportHeight = 720;
  private mapViewMode: MapViewMode = "fit";
  private interactionBlocked = false;
  private isPanning = false;
  private isZoomDragging = false;
  private isDraggingObject = false;
  private spacePressed = false;
  private panStartPointer: { x: number; y: number } | null = null;
  private panStartScroll: { x: number; y: number } | null = null;
  private pendingPanStart: { x: number; y: number } | null = null;
  private zoomDragOriginY = 0;
  private zoomDragStartZoom = 1;
  private objectDragSelection: EditorSelection | null = null;
  private gridGroup!: Phaser.GameObjects.Group;
  private objectGroup!: Phaser.GameObjects.Group;
  private selectionMarker: Phaser.GameObjects.Rectangle | null = null;
  private selectedObject: EditorSelection | null = null;
  private suppressCanvasPlacement = false;

  constructor() {
    super({ key: "LevelEditorScene" });
  }

  init(data?: { levelConfig?: LevelConfig }) {
    const initialConfig = data?.levelConfig ?? getDefaultLevelConfig();
    this.levelConfigManager = new LevelConfigManager(initialConfig);
    this.syncGridSize();
  }

  create() {
    ensureEditorPreviewTextures(this);
    this.gridGroup = this.add.group();
    this.objectGroup = this.add.group();

    this.cameras.main.setBackgroundColor(0x20242b);
    this.updateWorldBounds();
    this.createGrid();
    this.renderLevelObjects();
    this.setupInputEvents();
    this.refreshCameraView();
    this.emitConfigChanged();
    this.emitSelectionChanged();
  }

  public setSelectedTool(tool: string | null) {
    this.selectedTool = tool;
    if (this.interactionBlocked) {
      return;
    }

    if (tool === "hand-tool") {
      this.input.setDefaultCursor("grab");
      return;
    }

    if (tool === "move-tool") {
      this.input.setDefaultCursor("move");
      return;
    }

    if (tool === "zoom-tool") {
      this.input.setDefaultCursor("zoom-in");
      return;
    }

    this.input.setDefaultCursor("default");
  }

  public setToolOptions(options: Partial<FloorToolOptions>) {
    this.toolOptions = {
      ...this.toolOptions,
      ...options,
    };
  }

  public setViewportSize(width: number, height: number) {
    const camera = this.cameras.main;
    const centerX = camera.scrollX + this.viewportWidth / camera.zoom / 2;
    const centerY = camera.scrollY + this.viewportHeight / camera.zoom / 2;

    this.viewportWidth = Math.max(320, Math.floor(width));
    this.viewportHeight = Math.max(240, Math.floor(height));

    if (this.sys.isActive()) {
      this.scale.resize(this.viewportWidth, this.viewportHeight);
      const nextScroll = computeScrollForViewportCenter({
        centerX,
        centerY,
        viewportWidth: this.viewportWidth,
        viewportHeight: this.viewportHeight,
        zoom: camera.zoom,
      });
      camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
      this.clampCameraPosition();
      this.emitCameraChanged();
    }
  }

  public setMapViewMode(mode: MapViewMode) {
    this.mapViewMode = mode;

    if (!this.sys.isActive()) {
      return;
    }

    if (mode === "fit") {
      this.applyFitView();
      this.emitViewModeChanged();
      return;
    }

    this.cameras.main.setZoom(this.browseZoomDefault);
    this.clampCameraPosition();
    this.emitViewModeChanged();
    this.emitCameraChanged();
  }

  public resetCameraView() {
    if (!this.sys.isActive()) {
      return;
    }

    if (this.mapViewMode === "fit") {
      this.applyFitView();
      return;
    }

    this.cameras.main.setZoom(this.browseZoomDefault);
    this.centerCamera();
    this.clampCameraPosition();
    this.emitCameraChanged();
  }

  public getCameraState(): EditorCameraState {
    const camera = this.cameras.main;
    return {
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      zoom: camera.zoom,
      visibleWidth: this.viewportWidth / camera.zoom,
      visibleHeight: this.viewportHeight / camera.zoom,
      worldWidth: this.gridWidth * this.tileSize,
      worldHeight: this.gridHeight * this.tileSize,
      centerX: camera.scrollX + this.viewportWidth / camera.zoom / 2,
      centerY: camera.scrollY + this.viewportHeight / camera.zoom / 2,
    };
  }

  public setCameraScroll(scrollX: number, scrollY: number) {
    const camera = this.cameras.main;
    camera.setScroll(scrollX, scrollY);
    this.clampCameraPosition();
    this.emitCameraChanged();
  }

  public setCameraCenter(centerX: number, centerY: number) {
    const camera = this.cameras.main;
    const nextScroll = computeScrollForViewportCenter({
      centerX,
      centerY,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      zoom: camera.zoom,
    });
    camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
    this.clampCameraPosition();
    this.emitCameraChanged();
  }

  public setCameraZoom(zoom: number) {
    this.ensureBrowseMode();
    const camera = this.cameras.main;
    const nextZoom = clampSceneZoom({
      zoom,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      worldWidth: this.gridWidth * this.tileSize,
      worldHeight: this.gridHeight * this.tileSize,
      padding: this.fitPadding,
    });
    const nextScroll = computeZoomScrollFromViewportCenter({
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      currentZoom: camera.zoom,
      nextZoom,
    });
    camera.setZoom(nextZoom);
    camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
    this.clampCameraPosition();
    this.emitCameraChanged();
  }

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
    }
  }

  public updateLevelName(name: string) {
    this.levelConfigManager.updateBasicInfo({ name });
    this.emitConfigChanged();
  }

  public updateLevelDescription(description: string) {
    this.levelConfigManager.updateBasicInfo({ description });
    this.emitConfigChanged();
  }

  public updateGameType(
    gameType: "local-coop" | "local-versus" | "online-coop" | "online-versus",
  ) {
    this.levelConfigManager.updateBasicInfo({ gameType });
    this.emitConfigChanged();
  }

  public updateDuration(duration: number) {
    this.levelConfigManager.updateBasicInfo({ duration });
    this.emitConfigChanged();
  }

  public updateScoreTarget(target: Partial<LevelConfig["scoreTarget"]>) {
    this.levelConfigManager.updateScoreTarget(target);
    this.emitConfigChanged();
  }

  public updateOrderPool(orderPool: Partial<LevelConfig["orderPool"]>) {
    this.levelConfigManager.updateOrderPool(orderPool);
    this.emitConfigChanged();
  }

  public updateMapSize(width: number, height: number) {
    this.levelConfigManager.updateMapSize(width, height);
    this.refreshScene();
  }

  public updateSelectedObject(patch: Record<string, unknown>) {
    if (!this.selectedObject) {
      return;
    }

    const config = this.levelConfigManager.getConfig();

    if (this.selectedObject.kind === "floor") {
      const current = config.map.floors.find(
        (floor) =>
          floor.x === this.selectedObject?.x &&
          floor.y === this.selectedObject?.y,
      );
      if (!current) {
        return;
      }

      this.levelConfigManager.removeFloor(current.x, current.y);
      const nextFloor = { ...current, ...patch } as FloorConfig;
      this.levelConfigManager.addFloor(nextFloor);
      this.selectedObject = {
        kind: "floor",
        x: nextFloor.x,
        y: nextFloor.y,
      };
      this.refreshScene();
      return;
    }

    if (this.selectedObject.kind === "station") {
      const current = config.stations.find(
        (station) =>
          station.x === this.selectedObject?.x &&
          station.y === this.selectedObject?.y,
      );
      if (!current) {
        return;
      }

      this.levelConfigManager.removeStation(current.x, current.y);
      const nextStation = { ...current, ...patch } as StationConfig;
      this.levelConfigManager.addStation(nextStation);
      this.selectedObject = {
        kind: "station",
        x: nextStation.x,
        y: nextStation.y,
      };
      this.refreshScene();
      return;
    }

    const current = config.players.find(
      (player) => player.id === this.selectedObject?.id,
    );
    if (!current) {
      return;
    }

    this.levelConfigManager.removePlayer(current.id);
    const nextPlayer = { ...current, ...patch } as PlayerSpawn;
    this.levelConfigManager.addPlayer(nextPlayer);
    this.selectedObject = {
      kind: "player",
      id: nextPlayer.id,
    };
    this.refreshScene();
  }

  public deleteSelectedObject() {
    if (!this.selectedObject) {
      return;
    }

    if (this.selectedObject.kind === "floor") {
      this.levelConfigManager.removeFloor(
        this.selectedObject.x,
        this.selectedObject.y,
      );
    } else if (this.selectedObject.kind === "station") {
      this.levelConfigManager.removeStation(
        this.selectedObject.x,
        this.selectedObject.y,
      );
    } else {
      this.levelConfigManager.removePlayer(this.selectedObject.id);
    }

    this.selectedObject = null;
    this.refreshScene();
  }

  public clearSelection() {
    this.selectedObject = null;
    this.refreshSelectionMarker();
    this.emitSelectionChanged();
  }

  public createNewLevel() {
    this.levelConfigManager = new LevelConfigManager(getDefaultLevelConfig());
    this.selectedObject = null;
    this.mapViewMode = "fit";
    this.refreshScene();
    this.emitViewModeChanged();
  }

  public getLevelConfig(): LevelConfig {
    return this.levelConfigManager.getConfig();
  }

  public setLevelConfig(config: LevelConfig) {
    this.levelConfigManager = new LevelConfigManager(config);
    this.selectedObject = null;
    this.mapViewMode = "fit";
    this.refreshScene();
    this.emitViewModeChanged();
  }

  public exportLevelConfig(): LevelConfig {
    return this.levelConfigManager.getConfig();
  }

  public importLevelConfig(jsonString: string) {
    const success = this.levelConfigManager.importJSON(jsonString);
    if (!success) {
      return {
        success: false,
        error: "导入失败，所选文件不是有效的关卡配置。",
      };
    }

    this.selectedObject = null;
    this.mapViewMode = "fit";
    this.refreshScene();
    this.emitViewModeChanged();
    return { success: true };
  }

  private refreshScene() {
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

  private syncGridSize() {
    const config = this.levelConfigManager.getConfig();
    this.gridWidth = config.map.width;
    this.gridHeight = config.map.height;
  }

  private updateWorldBounds() {
    const worldWidth = this.gridWidth * this.tileSize;
    const worldHeight = this.gridHeight * this.tileSize;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
  }

  private refreshCameraView() {
    if (!this.sys.isActive()) {
      return;
    }

    if (this.mapViewMode === "fit") {
      this.applyFitView();
      return;
    }

    this.clampCameraPosition();
  }

  private applyFitView() {
    const camera = this.cameras.main;
    const result = computeFitView({
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      worldWidth: this.gridWidth * this.tileSize,
      worldHeight: this.gridHeight * this.tileSize,
      padding: this.fitPadding,
    });

    camera.setZoom(normalizeZoom(result.zoom));
    const nextScroll = computeScrollForViewportCenter({
      centerX: result.centerX,
      centerY: result.centerY,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      zoom: camera.zoom,
    });
    camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
    this.clampCameraPosition();
    this.emitCameraChanged();
  }

  private centerCamera() {
    const camera = this.cameras.main;
    const nextScroll = computeScrollForViewportCenter({
      centerX: (this.gridWidth * this.tileSize) / 2,
      centerY: (this.gridHeight * this.tileSize) / 2,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      zoom: camera.zoom,
    });
    camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
  }

  private clampCameraPosition() {
    const camera = this.cameras.main;
    const next = clampCameraScroll({
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      zoom: camera.zoom,
      worldWidth: this.gridWidth * this.tileSize,
      worldHeight: this.gridHeight * this.tileSize,
    });

    camera.setScroll(next.scrollX, next.scrollY);
  }

  private createGrid() {
    this.gridGroup.clear(true, true);
  }

  private renderLevelObjects() {
    this.objectGroup.clear(true, true);

    const config = this.levelConfigManager.getConfig();
    buildRenderableFloors(config).forEach((floor) => this.renderFloor(floor));
    config.stations.forEach((station) => this.renderStation(station));
    config.players.forEach((player) => this.renderPlayer(player));
  }

  private renderFloor(floor: FloorConfig) {
    const { centerX, centerY } = this.toWorldPosition(floor.x, floor.y);
    const renderSpec = getFloorRenderSpec(floor);
    const tile = this.add.image(centerX, centerY, renderSpec.textureKey);
    tile.setDisplaySize(this.tileSize, this.tileSize);
    tile.setDepth(renderSpec.depth);
    tile.setAngle(renderSpec.angle);
    tile.setInteractive();
    tile.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handleObjectPointerDown(
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
    this.objectGroup.add(tile);

    if (floor.type !== "conveyor") {
      return;
    }

    const label = this.add.text(
      centerX,
      centerY,
      this.getDirectionGlyph(floor.direction),
      {
        fontSize: "18px",
        color: "#111827",
        fontStyle: "bold",
      },
    );
    label.setOrigin(0.5);
    label.setDepth(2);
    this.objectGroup.add(label);
  }

  private renderStation(station: StationConfig) {
    const { centerX, centerY } = this.toWorldPosition(station.x, station.y);
    const textureKey = resolveStationTextureKey(station);
    const stationSprite = this.add.image(
      centerX,
      centerY,
      textureKey,
    );
    stationSprite.setDisplaySize(this.tileSize, this.tileSize);
    stationSprite.setDepth(10);
    stationSprite.setInteractive();
    stationSprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handleObjectPointerDown(
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
    this.objectGroup.add(stationSprite);

    this.renderStationOverlay(station, centerX, centerY);
  }

  private renderPlayer(player: PlayerSpawn) {
    const { centerX, centerY } = this.toWorldPosition(player.x, player.y);
    const sprite = this.add.image(
      centerX,
      centerY,
      "player",
    );
    sprite.setDisplaySize(30, 30);
    sprite.setDepth(30);
    sprite.setTint(player.color ?? (player.id === 1 ? 0x4da6ff : 0xff4444));
    sprite.setInteractive();
    sprite.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handleObjectPointerDown(pointer, { kind: "player", id: player.id }, { ...player });
    });
    this.objectGroup.add(sprite);

    const label = this.add.text(centerX, centerY + 2, `P${player.id}`, {
      fontSize: "10px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    label.setOrigin(0.5);
    label.setDepth(31);
    this.objectGroup.add(label);
  }

  private setupInputEvents() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.interactionBlocked) {
        return;
      }

      if (this.selectedTool === "hand-tool" || this.spacePressed) {
        this.beginCameraPan(pointer);
        return;
      }

      if (this.selectedTool === "zoom-tool") {
        this.beginZoomDrag(pointer);
        return;
      }

      if (this.suppressCanvasPlacement) {
        this.suppressCanvasPlacement = false;
        return;
      }

      const gridX = Math.floor(pointer.worldX / this.tileSize);
      const gridY = Math.floor(pointer.worldY / this.tileSize);

      if (!this.isInBounds(gridX, gridY)) {
        this.clearSelection();
        return;
      }

      if (!this.selectedTool) {
        this.beginPotentialPan(pointer);
        return;
      }

      this.placeObjectAt(gridX, gridY);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingObject) {
        return;
      }

      this.promotePendingPan(pointer);

      if (!this.isPanning || !this.panStartPointer || !this.panStartScroll) {
        if (this.isZoomDragging) {
          this.updateZoomDrag(pointer);
        }
        return;
      }

      const camera = this.cameras.main;
      camera.setScroll(
        this.panStartScroll.x - (pointer.x - this.panStartPointer.x) / camera.zoom,
        this.panStartScroll.y - (pointer.y - this.panStartPointer.y) / camera.zoom,
      );
      this.clampCameraPosition();
      this.emitCameraChanged();
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingObject) {
        this.finishObjectDrag(pointer);
      }

      if (this.pendingPanStart && !this.isPanning && this.selectedTool === null) {
        this.clearSelection();
      }

      this.pendingPanStart = null;
      this.stopPanning();
      this.stopZoomDrag();
    });

    this.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
      ) => {
        if (this.interactionBlocked) {
          return;
        }

        this.ensureBrowseMode();
        const camera = this.cameras.main;
        const nextZoom = clampSceneZoom({
          zoom: camera.zoom * (deltaY > 0 ? 0.9 : 1.1),
          viewportWidth: this.viewportWidth,
          viewportHeight: this.viewportHeight,
          worldWidth: this.gridWidth * this.tileSize,
          worldHeight: this.gridHeight * this.tileSize,
          padding: this.fitPadding,
        });
        const nextScroll = computeZoomScrollFromViewportCenter({
          scrollX: camera.scrollX,
          scrollY: camera.scrollY,
          viewportWidth: this.viewportWidth,
          viewportHeight: this.viewportHeight,
          currentZoom: camera.zoom,
          nextZoom,
        });
        camera.setZoom(nextZoom);
        camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
        this.clampCameraPosition();
        this.emitCameraChanged();
      },
    );

    this.input.keyboard?.on("keydown-SPACE", () => {
      this.spacePressed = true;
      if (this.mapViewMode === "browse" && !this.interactionBlocked) {
        this.input.setDefaultCursor("grab");
      }
    });
    this.input.keyboard?.on("keyup-SPACE", () => {
      this.spacePressed = false;
      this.stopPanning();
      if (!this.interactionBlocked) {
        this.input.setDefaultCursor("default");
      }
    });

    this.input.keyboard?.on("keydown-DELETE", () => {
      if (!this.interactionBlocked) {
        this.deleteSelectedObject();
      }
    });
    this.input.keyboard?.on("keydown-BACKSPACE", () => {
      if (!this.interactionBlocked) {
        this.deleteSelectedObject();
      }
    });
  }

  private stopPanning() {
    this.isPanning = false;
    this.panStartPointer = null;
    this.panStartScroll = null;
    this.pendingPanStart = null;
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

  private stopZoomDrag() {
    this.isZoomDragging = false;
  }

  private placeObjectAt(x: number, y: number) {
    const floor = buildDefaultFloorForTool(
      this.selectedTool ?? "",
      x,
      y,
      this.toolOptions,
    );
    if (floor) {
      this.levelConfigManager.addFloor(floor);
      this.selectedObject = { kind: "floor", x, y };
      this.refreshScene();
      return;
    }

    const station = buildDefaultStationForTool(this.selectedTool ?? "", x, y);
    if (station) {
      this.levelConfigManager.addStation(station);
      this.selectedObject = { kind: "station", x, y };
      this.refreshScene();
      return;
    }

    const player = buildDefaultPlayerForTool(this.selectedTool ?? "", x, y);
    if (player) {
      this.levelConfigManager.addPlayer(player);
      this.selectedObject = { kind: "player", id: player.id };
      this.refreshScene();
    }
  }

  private selectObject(
    selection: EditorSelection,
    object: FloorConfig | StationConfig | PlayerSpawn,
  ) {
    this.selectedObject = selection;
    this.refreshSelectionMarker();

    if (selection.kind === "floor") {
      this.events.emit("object-selected", {
        kind: "floor",
        object,
      } satisfies Exclude<SelectionPayload, null>);
      return;
    }

    if (selection.kind === "station") {
      this.events.emit("object-selected", {
        kind: "station",
        object,
      } satisfies Exclude<SelectionPayload, null>);
      return;
    }

    this.events.emit("object-selected", {
      kind: "player",
      object,
    } satisfies Exclude<SelectionPayload, null>);
  }

  private refreshSelectionMarker() {
    this.selectionMarker?.destroy();
    this.selectionMarker = null;

    const target = this.getSelectionTarget();
    if (!target) {
      return;
    }

    const { centerX, centerY } = this.toWorldPosition(target.x, target.y);
    this.selectionMarker = this.add.rectangle(
      centerX,
      centerY,
      this.tileSize - 4,
      this.tileSize - 4,
      0x22c55e,
      0.14,
    );
    this.selectionMarker.setStrokeStyle(2, 0x22c55e);
  }

  private emitConfigChanged() {
    this.events.emit("config-changed", {
      config: this.levelConfigManager.getConfig(),
      validation: this.levelConfigManager.validate(),
    });
  }

  private emitSelectionChanged() {
    if (!this.selectedObject) {
      this.events.emit("object-selected", null satisfies SelectionPayload);
      return;
    }

    const selection = this.getSelectedConfigObject();
    if (!selection) {
      this.events.emit("object-selected", null satisfies SelectionPayload);
      return;
    }

    this.selectObject(this.selectedObject, selection);
  }

  private getSelectedConfigObject(): FloorConfig | StationConfig | PlayerSpawn | null {
    const config = this.levelConfigManager.getConfig();

    if (!this.selectedObject) {
      return null;
    }

    if (this.selectedObject.kind === "floor") {
      return (
        config.map.floors.find(
          (floor) =>
            floor.x === this.selectedObject?.x &&
            floor.y === this.selectedObject?.y,
        ) ?? null
      );
    }

    if (this.selectedObject.kind === "station") {
      return (
        config.stations.find(
          (station) =>
            station.x === this.selectedObject?.x &&
            station.y === this.selectedObject?.y,
        ) ?? null
      );
    }

    return (
      config.players.find((player) => player.id === this.selectedObject?.id) ?? null
    );
  }

  private getSelectionTarget() {
    if (!this.selectedObject) {
      return null;
    }

    if (this.selectedObject.kind === "player") {
      const player = this.levelConfigManager
        .getConfig()
        .players.find((entry) => entry.id === this.selectedObject?.id);
      return player ? { x: player.x, y: player.y } : null;
    }

    return { x: this.selectedObject.x, y: this.selectedObject.y };
  }

  private getFloorColor(floor: FloorConfig) {
    switch (floor.type) {
      case "wall":
        return 0x64748b;
      case "conveyor":
        return 0xfacc15;
      default:
        return 0xe2e8f0;
    }
  }

  private getStationColor(station: StationConfig) {
    switch (station.type) {
      case "delivery":
        return 0x4ade80;
      case "plate-counter":
        return 0x93c5fd;
      case "cut":
        return 0xfda4af;
      case "pot":
        return 0xfb923c;
      case "sink":
        return 0x67e8f9;
      case "dirty-plate":
        return 0x94a3b8;
      case "trash":
        return 0x9ca3af;
      case "fire-extinguisher":
        return 0xf87171;
      case "mixer":
        return 0xc084fc;
      case "ingredient":
        return this.getIngredientColor(station.ingredientType);
      default:
        return 0xd6d3d1;
    }
  }

  private getIngredientColor(ingredientType: string) {
    const colorMap: Record<string, number> = {
      tomato: 0xfb7185,
      lettuce: 0x86efac,
      rice: 0xfef3c7,
      fish: 0x7dd3fc,
      seaweed: 0x6ee7b7,
      onion: 0xe9d5ff,
      potato: 0xfdba74,
      carrot: 0xfb923c,
      egg: 0xfef08a,
      flour: 0xe7e5e4,
      meat: 0xfca5a5,
      cheese: 0xfde047,
      chocolate: 0xa16207,
      "burger-bun": 0xf5d0a9,
    };

    return colorMap[ingredientType] ?? 0xd4d4d8;
  }

  private getStationLabel(station: StationConfig) {
    switch (station.type) {
      case "counter":
        return "柜台";
      case "plate-counter":
        return "盘子";
      case "cut":
        return "切菜";
      case "pot":
        return "锅";
      case "sink":
        return "洗碗";
      case "delivery":
        return "上菜";
      case "dirty-plate":
        return "脏盘";
      case "trash":
        return "垃圾";
      case "fire-extinguisher":
        return "灭火";
      case "mixer":
        return "搅拌";
      case "ingredient":
        return this.getIngredientLabel(station.ingredientType);
      default:
        return station.type;
    }
  }

  private getIngredientLabel(ingredientType: string) {
    const labelMap: Record<string, string> = {
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

    return labelMap[ingredientType] ?? ingredientType;
  }

  private getDirectionGlyph(direction: ConveyorFloor["direction"]) {
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

  private isInBounds(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.gridWidth && y < this.gridHeight;
  }

  private toWorldPosition(x: number, y: number) {
    return {
      centerX: x * this.tileSize + this.tileSize / 2,
      centerY: y * this.tileSize + this.tileSize / 2,
    };
  }

  private handleObjectPointerDown(
    pointer: Phaser.Input.Pointer,
    selection: EditorSelection,
    object: FloorConfig | StationConfig | PlayerSpawn,
  ) {
    this.suppressCanvasPlacement = true;
    this.selectObject(selection, object);

    if (this.selectedTool === "move-tool") {
      this.objectDragSelection = selection;
      this.isDraggingObject = true;
      this.input.setDefaultCursor("grabbing");
    }

    if (this.selectedTool === "hand-tool") {
      this.beginCameraPan(pointer);
    }
  }

  private isHandToolActive() {
    return this.selectedTool === "hand-tool";
  }

  private beginPotentialPan(pointer: Phaser.Input.Pointer) {
    this.pendingPanStart = { x: pointer.x, y: pointer.y };
    this.panStartScroll = {
      x: this.cameras.main.scrollX,
      y: this.cameras.main.scrollY,
    };
  }

  private promotePendingPan(pointer: Phaser.Input.Pointer) {
    if (!this.pendingPanStart || this.isPanning || !this.panStartScroll) {
      return;
    }

    const deltaX = pointer.x - this.pendingPanStart.x;
    const deltaY = pointer.y - this.pendingPanStart.y;
    if (Math.hypot(deltaX, deltaY) < this.panThreshold) {
      return;
    }

    this.ensureBrowseMode();
    this.isPanning = true;
    this.panStartPointer = { ...this.pendingPanStart };
    this.input.setDefaultCursor("grabbing");
  }

  private beginCameraPan(pointer: Phaser.Input.Pointer) {
    this.ensureBrowseMode();
    this.isPanning = true;
    this.pendingPanStart = null;
    this.panStartPointer = { x: pointer.x, y: pointer.y };
    this.panStartScroll = {
      x: this.cameras.main.scrollX,
      y: this.cameras.main.scrollY,
    };
    this.input.setDefaultCursor("grabbing");
  }

  private beginZoomDrag(pointer: Phaser.Input.Pointer) {
    this.ensureBrowseMode();
    this.isZoomDragging = true;
    this.zoomDragOriginY = pointer.y;
    this.zoomDragStartZoom = this.cameras.main.zoom;
    this.input.setDefaultCursor("ns-resize");
  }

  private updateZoomDrag(pointer: Phaser.Input.Pointer) {
    const delta = (this.zoomDragOriginY - pointer.y) / 240;
    const camera = this.cameras.main;
    const nextZoom = clampSceneZoom({
      zoom: this.zoomDragStartZoom + delta,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      worldWidth: this.gridWidth * this.tileSize,
      worldHeight: this.gridHeight * this.tileSize,
      padding: this.fitPadding,
    });
    const nextScroll = computeZoomScrollFromViewportCenter({
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      currentZoom: camera.zoom,
      nextZoom,
    });
    camera.setZoom(nextZoom);
    camera.setScroll(nextScroll.scrollX, nextScroll.scrollY);
    this.clampCameraPosition();
    this.emitCameraChanged();
  }

  private finishObjectDrag(pointer: Phaser.Input.Pointer) {
    if (!this.objectDragSelection) {
      return;
    }

    const gridX = Math.floor(pointer.worldX / this.tileSize);
    const gridY = Math.floor(pointer.worldY / this.tileSize);

    this.isDraggingObject = false;
    this.objectDragSelection = null;
    this.input.setDefaultCursor(this.isHandToolActive() ? "grab" : "default");

    if (!this.isInBounds(gridX, gridY)) {
      return;
    }

    if (this.selectedObject?.kind === "player") {
      this.updateSelectedObject({ x: gridX, y: gridY });
      return;
    }

    if (
      this.selectedObject &&
      "x" in this.selectedObject &&
      "y" in this.selectedObject &&
      this.selectedObject.x === gridX &&
      this.selectedObject.y === gridY
    ) {
      return;
    }

    this.updateSelectedObject({ x: gridX, y: gridY });
  }

  private ensureBrowseMode() {
    if (this.mapViewMode === "browse") {
      return;
    }

    this.mapViewMode = "browse";
    this.emitViewModeChanged();
  }

  private emitViewModeChanged() {
    this.events.emit("view-mode-changed", this.mapViewMode);
  }

  private emitCameraChanged() {
    this.events.emit("camera-changed", this.getCameraState());
  }

  private getStationTextureKey(station: StationConfig) {
    return resolveStationTextureKey(station);
  }

  private renderStationOverlay(
    station: StationConfig,
    centerX: number,
    centerY: number,
  ) {
    if (station.type === "plate-counter") {
      const plate = this.add.image(centerX, centerY, "item_plate");
      plate.setDisplaySize(28, 28);
      plate.setDepth(11);
      this.objectGroup.add(plate);
      return;
    }

    if (station.type === "pot") {
      const pot = this.add.image(centerX, centerY, "item_pot");
      pot.setDisplaySize(28, 28);
      pot.setDepth(11);
      this.objectGroup.add(pot);
      return;
    }

    if (station.type === "fire-extinguisher") {
      const extinguisher = this.add.image(centerX, centerY, "item_fire_extinguisher");
      extinguisher.setDisplaySize(22, 22);
      extinguisher.setDepth(11);
      this.objectGroup.add(extinguisher);
      return;
    }

    if (station.type === "ingredient") {
      const badge = this.add.text(
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
      this.objectGroup.add(badge);
      return;
    }

    if (station.type === "mixer") {
      const badge = this.add.text(centerX, centerY + 16, "搅拌", {
        fontSize: "8px",
        color: "#f8fafc",
        backgroundColor: "#0f172a",
        padding: { left: 4, right: 4, top: 1, bottom: 1 },
      });
      badge.setOrigin(0.5);
      badge.setDepth(12);
      this.objectGroup.add(badge);
    }
  }
}
