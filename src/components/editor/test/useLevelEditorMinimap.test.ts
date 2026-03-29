import { reactive, ref } from "vue";

import { createLevelEditorMinimapController } from "../useLevelEditorMinimap";
import type { EditorCameraState } from "@/game/scenes/editor/level-editor-scene";

/**
 * 测试对象：createLevelEditorMinimapController。
 * 测试用例：开始并结束一次小地图拖拽。
 * 测试目标：验证控制器会转发相机更新，并在拖拽期间临时阻塞场景交互。
 * 期望：拖拽开始时交互被阻塞，视口中心被更新，释放后交互恢复。
 */
/**
 * 创建一份稳定的测试相机状态，用于驱动小地图控制器断言。
 */
function createCameraState(): EditorCameraState {
  return {
    zoom: 1.25,
    centerX: 440,
    centerY: 320,
    sceneWidth: 1600,
    sceneHeight: 1200,
    canvasLeft: 20,
    canvasTop: 10,
    canvasWidth: 960,
    canvasHeight: 720,
    viewportLeft: 0,
    viewportTop: 0,
    viewportWidth: 1280,
    viewportHeight: 960,
  };
}

describe("useLevelEditorMinimap", () => {
  it("drags the minimap viewport and restores interaction on release", () => {
    const sceneRef = ref({
      setInteractionBlocked: vi.fn(),
      setCameraCenter: vi.fn(),
      setCameraScroll: vi.fn(),
      setCameraZoom: vi.fn(),
    });
    const cameraState = reactive(createCameraState());
    const minimapSurface = ref({
      getBoundingClientRect: () => ({
        left: 10,
        top: 20,
        width: 180,
        height: 120,
      }),
    } as unknown as HTMLElement);
    const controller = createLevelEditorMinimapController({
      sceneRef,
      cameraState,
      minimapSurface,
      minimapWidth: 180,
      minimapHeight: 120,
    });

    controller.startMinimapDrag(new PointerEvent("pointerdown", {
      clientX: 100,
      clientY: 70,
    }));
    controller.stopMinimapDrag();

    expect(sceneRef.value.setInteractionBlocked).toHaveBeenNthCalledWith(1, true);
    expect(sceneRef.value.setCameraCenter).toHaveBeenCalledTimes(1);
    expect(sceneRef.value.setInteractionBlocked).toHaveBeenNthCalledWith(2, false);
  });
});
