import Phaser from "phaser";

import { useCoordinateSystem } from "@/game/helper/use-coordinate-system";
import { LevelConfigManager } from "@/game/manager/level-config-manager";
import { preloadTextures } from "@/game/textures";
import { getDefaultLevelConfig, type LevelConfig } from "@/game/types/level-config";
import {
  clampSceneCamera,
  getGridCenter,
  resetLevelEditorCamera,
  zoomSceneCamera,
} from "./level-editor-camera";
import {
  createEditorCameraPanSession,
  getPanCameraCenter,
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

    this.debugCoord = useCoordinateSystem(this, {
      originX: 0,
      originY: 0,
      minX: -this.scale.width,
      maxX: worldWidth + this.scale.width,
      minY: -this.scale.height,
      maxY: worldHeight + this.scale.height,
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
    resetLevelEditorCamera(this, this.gridWidth, this.gridHeight, this.tileSize);
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
      });
      keyboard.on("keyup-SPACE", () => {
        this.panSession.spaceDown = false;
        this.stopPanGesture();
      });
    }

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.panSession.pointerDown = true;
      this.lastPointerPosition = { x: pointer.x, y: pointer.y };

      if (this.panSession.spaceDown) {
        this.panSession.active = true;
      }
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

      clampSceneCamera(this, nextCenter);
      this.lastPointerPosition = { x: pointer.x, y: pointer.y };
    });

    this.input.on("pointerup", () => {
      this.panSession.pointerDown = false;
      this.stopPanGesture();
    });

    this.input.on("pointerupoutside", () => {
      this.panSession.pointerDown = false;
      this.stopPanGesture();
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
        zoomSceneCamera(this, deltaY);
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
}
