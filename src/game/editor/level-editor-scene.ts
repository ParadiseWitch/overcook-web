import Phaser from "phaser";

import { useCoordinateSystem } from "@/game/helper/use-coordinate-system";
import { LevelConfigManager } from "@/game/manager/level-config-manager";
import { preloadTextures } from "@/game/textures";
import { getDefaultLevelConfig, type LevelConfig } from "@/game/types/level-config";
import {
  createCanvasBoundsFromView,
  clampSceneCamera,
  getGridCenter,
  getCameraStateAfterViewportResize,
  type CanvasBounds,
  LEVEL_EDITOR_ZOOM,
  resetLevelEditorCamera,
  type ViewportSize,
  zoomSceneCamera,
} from "./level-editor-camera";
import {
  createEditorCameraPanSession,
  getPanCameraCenter,
  getPanCursor,
} from "./level-editor-camera-pan";
import { createLevelEditorRenderer } from "./level-editor-renderer";

export class LevelEditorScene extends Phaser.Scene {
  public debugCoord: ReturnType<typeof useCoordinateSystem>;
  public levelConfigManager = new LevelConfigManager(getDefaultLevelConfig());
  public gridWidth = 17;
  public gridHeight = 13;
  public tileSize = 48;

  private render: () => void = () => {};
  private clear: () => void = () => {};
  private panSession = createEditorCameraPanSession();
  private lastPointerPosition: { x: number; y: number } | null = null;
  private canvasBounds: CanvasBounds | null = null;

  constructor() {
    super({ key: "LevelEditorScene" });
  }

  init(data?: { levelConfig?: LevelConfig }) {
    const levelConfig = data?.levelConfig ?? getDefaultLevelConfig();
    this.levelConfigManager = new LevelConfigManager(levelConfig);
    this.gridWidth = levelConfig.map.width;
    this.gridHeight = levelConfig.map.height;
    this.tileSize = levelConfig.map.tileSize || 48;

    const renderer = createLevelEditorRenderer(this, levelConfig, {
      canHandlePointerDown: () => !this.isPanGestureActive(),
    });

    this.render = renderer.render;
    this.clear = renderer.clear;
  }

  create() {
    const worldWidth = this.gridWidth * this.tileSize;
    const worldHeight = this.gridHeight * this.tileSize;
    const initialCenter = getGridCenter(this.gridWidth, this.gridHeight, this.tileSize);
    const initialZoom = LEVEL_EDITOR_ZOOM.default;

    this.cameras.main.setZoom(initialZoom);
    this.cameras.main.centerOn(initialCenter.x, initialCenter.y);
    this.canvasBounds = createCanvasBoundsFromView(
      initialCenter,
      {
        width: this.scale.width,
        height: this.scale.height,
      },
      initialZoom,
    );

    this.debugCoord = useCoordinateSystem(this, {
      originX: 0,
      originY: 0,
      minX: this.canvasBounds.left,
      maxX: this.canvasBounds.right,
      minY: this.canvasBounds.top,
      maxY: this.canvasBounds.bottom,
      gridSize: 48,
      fixedToCamera: false,
    });
    this.debugCoord.show();

    preloadTextures(this);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.resetCamera();
    this.registerPanControls();
    this.registerZoomControls();

    this.clear();
    this.render();
  }

  resetCamera() {
    if (!this.canvasBounds) {
      return;
    }

    resetLevelEditorCamera(this, this.canvasBounds);
  }

  resizeViewport(viewport: ViewportSize) {
    if (viewport.width <= 0 || viewport.height <= 0 || !this.canvasBounds) {
      return;
    }

    const camera = this.cameras.main;
    const current = {
      center: { x: camera.midPoint.x, y: camera.midPoint.y },
      zoom: camera.zoom,
    };
    camera.setSize(viewport.width, viewport.height);
    const next = getCameraStateAfterViewportResize(
      current,
      this.canvasBounds,
      viewport,
    );

    camera.setZoom(next.zoom);
    camera.centerOn(next.center.x, next.center.y);
  }

  getGridCenter(): number[] {
    const center = getGridCenter(this.gridWidth, this.gridHeight, this.tileSize);
    return [center.x, center.y];
  }

  private registerPanControls() {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.on("keydown-SPACE", () => {
        this.panSession.spaceDown = true;
        this.updateCanvasCursor();
      });
      keyboard.on("keyup-SPACE", () => {
        this.panSession.spaceDown = false;
        this.stopPanGesture();
        this.updateCanvasCursor();
      });
    }

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.isPrimaryPointer(pointer)) {
        return;
      }

      this.panSession.pointerDown = true;
      this.lastPointerPosition = { x: pointer.x, y: pointer.y };

      if (this.panSession.spaceDown) {
        this.panSession.active = true;
      }

      this.updateCanvasCursor();
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.lastPointerPosition) {
        this.lastPointerPosition = { x: pointer.x, y: pointer.y };
      }

      if (!this.isPanGestureActive()) {
        return;
      }

      const nextCenter = getPanCameraCenter(
        { x: this.cameras.main.midPoint.x, y: this.cameras.main.midPoint.y },
        {
          x: pointer.x - this.lastPointerPosition.x,
          y: pointer.y - this.lastPointerPosition.y,
        },
        this.cameras.main.zoom,
      );

      if (!this.canvasBounds) {
        return;
      }

      clampSceneCamera(this, nextCenter, this.canvasBounds);
      this.lastPointerPosition = { x: pointer.x, y: pointer.y };
    });

    this.input.on("pointerup", () => {
      this.panSession.pointerDown = false;
      this.stopPanGesture();
      this.updateCanvasCursor();
    });

    this.input.on("pointerupoutside", () => {
      this.panSession.pointerDown = false;
      this.stopPanGesture();
      this.updateCanvasCursor();
    });
  }

  private registerZoomControls() {
    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
      ) => {
        if (!this.canvasBounds) {
          return;
        }

        zoomSceneCamera(this, deltaY, this.canvasBounds);
      },
    );
  }

  private isPanGestureActive() {
    return this.panSession.active && this.panSession.pointerDown && this.panSession.spaceDown;
  }

  private stopPanGesture() {
    this.panSession.active = false;
    this.lastPointerPosition = null;
  }

  private updateCanvasCursor() {
    const canvas = this.game.canvas as HTMLCanvasElement | undefined;
    if (!canvas) {
      return;
    }

    canvas.style.cursor = getPanCursor(this.panSession);
  }

  private isPrimaryPointer(pointer: Phaser.Input.Pointer) {
    if (typeof pointer.button === "number") {
      return pointer.button === 0;
    }

    return true;
  }
}
