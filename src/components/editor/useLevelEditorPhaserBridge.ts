import Phaser from "phaser";
import { onMounted, onUnmounted, type Ref, type ShallowRef } from "vue";

import { createCenteredCameraState } from "@/game/editor/editor-camera";
import type { FloorToolOptions } from "@/game/editor/level-editor-utils";
import { LevelEditorScene, type EditorCameraState } from "@/game/scenes/editor/level-editor-scene";
type SceneRef<T> = Ref<T> | ShallowRef<T>;

// 负责把 Vue 生命周期和 Phaser 场景生命周期桥接起来，并同步场景事件。
/**
 * 创建 Vue 与 Phaser 编辑器场景之间的桥接层。
 */
export function useLevelEditorPhaserBridge(input: {
  mapStage: Ref<HTMLElement | null>;
  gameHost: Ref<HTMLElement | null>;
  sceneRef: SceneRef<LevelEditorScene | null>;
  viewport: { width: number; height: number };
  cameraState: EditorCameraState;
  toolOptions: FloorToolOptions;
  onSceneConfigChanged: (payload: any) => void;
  onSceneSelectionChanged: (payload: any) => void;
  onSceneCameraChanged: (payload: EditorCameraState) => void;
  normalizePanelsForViewport: () => void;
}) {
  let gameInstance: Phaser.Game | null = null;
  let resizeObserver: ResizeObserver | null = null;

  onMounted(() => {
    initializeGame();
  });

  onUnmounted(() => {
    detachSceneEvents();
    resizeObserver?.disconnect();
    gameInstance?.destroy(true);
  });

  /**
   * 初始化 Phaser 实例，并把容器尺寸同步到编辑器场景。
   */
  function initializeGame() {
    const updateViewport = () => {
      const rect = input.mapStage.value?.getBoundingClientRect();
      input.viewport.width = Math.max(320, Math.floor(rect?.width ?? window.innerWidth));
      input.viewport.height = Math.max(240, Math.floor(rect?.height ?? window.innerHeight));
      gameInstance?.scale.resize(input.viewport.width, input.viewport.height);
      input.sceneRef.value?.setCanvasSize(input.viewport.width, input.viewport.height);
      input.normalizePanelsForViewport();
    };

    updateViewport();
    if (!input.gameHost.value) {
      return;
    }

    gameInstance = new Phaser.Game({
      type: Phaser.AUTO,
      width: input.viewport.width,
      height: input.viewport.height,
      parent: input.gameHost.value,
      backgroundColor: "#020617",
      physics: {
        default: "arcade",
        arcade: { debug: false, gravity: { x: 0, y: 0 } },
      },
      scene: [LevelEditorScene],
    });
    resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(input.gameHost.value);
    attachSceneWhenReady();
  }

  /**
   * 等待编辑器场景真正激活后，再绑定事件和初始状态。
   */
  function attachSceneWhenReady(attempt = 0) {
    if (!gameInstance) {
      return;
    }
    const scene = gameInstance.scene.getScene("LevelEditorScene") as LevelEditorScene | null;
    if (!scene || !scene.sys.isActive()) {
      if (attempt < 20) {
        // Phaser 场景激活存在异步窗口，短轮询可以避免把初始化顺序散落到外层。
        window.setTimeout(() => attachSceneWhenReady(attempt + 1), 50);
      }
      return;
    }

    detachSceneEvents();
    input.sceneRef.value = scene;
    scene.setToolOptions({ ...input.toolOptions });
    scene.setCanvasSize(input.viewport.width, input.viewport.height);
    scene.resetCamera();
    scene.events.on("config-changed", input.onSceneConfigChanged);
    scene.events.on("object-selected", input.onSceneSelectionChanged);
    scene.events.on("camera-changed", input.onSceneCameraChanged);
    input.onSceneCameraChanged(scene.getCameraState());
  }

  /**
   * 解绑当前场景上注册的所有事件监听，避免重复订阅。
   */
  function detachSceneEvents() {
    input.sceneRef.value?.events.off("config-changed", input.onSceneConfigChanged);
    input.sceneRef.value?.events.off("object-selected", input.onSceneSelectionChanged);
    input.sceneRef.value?.events.off("camera-changed", input.onSceneCameraChanged);
  }

  return {
    /**
     * 根据当前视口创建一个居中的初始相机状态对象。
     */
    createInitialCameraState(worldWidth: number, worldHeight: number) {
      return createCenteredCameraState({
        worldWidth,
        worldHeight,
        viewportWidth: input.viewport.width,
        viewportHeight: input.viewport.height,
        zoom: 1,
      });
    },
  };
}
