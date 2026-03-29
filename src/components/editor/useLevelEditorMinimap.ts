import { computed, onMounted, onUnmounted, reactive, type Ref, type ShallowRef } from "vue";

import {
  computeMinimapViewportRect,
  computeScrollRange,
  normalizeZoomPercent,
  computeViewportCenterFromMinimap,
} from "@/game/editor/editor-camera";
import type { EditorCameraState, LevelEditorScene } from "@/game/scenes/editor/level-editor-scene";
type SceneRef<T> = Ref<T> | ShallowRef<T>;

// 将小地图拖拽和相机 HUD 控制从表单状态里独立出来，降低耦合。
/**
 * 创建小地图控制器，负责拖拽、滚动条和缩放输入的相机联动。
 */
export function createLevelEditorMinimapController(input: {
  sceneRef: SceneRef<LevelEditorScene | {
    setInteractionBlocked?: (blocked: boolean) => void;
    setCameraCenter?: (x: number, y: number) => void;
    setCameraScroll?: (x: number, y: number) => void;
    setCameraZoom?: (zoom: number) => void;
  } | null>;
  cameraState: EditorCameraState;
  minimapSurface: Ref<HTMLElement | null>;
  minimapWidth: number;
  minimapHeight: number;
}) {
  const minimapDrag = reactive({
    active: false,
  });

  const zoomPercent = computed(() => Math.round(input.cameraState.zoom * 100));

  const minimapViewportStyle = computed(() => {
    const rect = computeMinimapViewportRect({
      worldWidth: input.cameraState.worldWidth,
      worldHeight: input.cameraState.worldHeight,
      visibleWidth: input.cameraState.visibleWidth,
      visibleHeight: input.cameraState.visibleHeight,
      scrollX: Math.max(0, input.cameraState.scrollX),
      scrollY: Math.max(0, input.cameraState.scrollY),
      minimapWidth: input.minimapWidth,
      minimapHeight: input.minimapHeight,
    });

    return {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${Math.max(18, rect.width)}px`,
      height: `${Math.max(18, rect.height)}px`,
    };
  });

  const handleWindowPointerMove = (event: PointerEvent) => {
    updateMinimapDrag(event);
  };
  const handleWindowPointerUp = () => {
    stopMinimapDrag();
  };

  /**
   * 开始一次小地图拖拽，并临时阻塞场景交互避免状态冲突。
   */
  function startMinimapDrag(event: PointerEvent) {
    minimapDrag.active = true;
    input.sceneRef.value?.setInteractionBlocked?.(true);
    updateMinimapDrag(event);
  }

  /**
   * 把小地图上的指针位置换算成世界中心点，并同步到场景相机。
   */
  function updateMinimapDrag(event: PointerEvent) {
    if (!minimapDrag.active || !input.minimapSurface.value) {
      return;
    }
    const rect = input.minimapSurface.value.getBoundingClientRect();
    const pointerX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const pointerY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    // 小地图拖拽始终转换为“视口中心点”变化，避免和滚动条逻辑分叉。
    const nextCenter = computeViewportCenterFromMinimap({
      pointerX,
      pointerY,
      worldWidth: input.cameraState.worldWidth,
      worldHeight: input.cameraState.worldHeight,
      minimapWidth: rect.width,
      minimapHeight: rect.height,
    });
    input.sceneRef.value?.setCameraCenter?.(nextCenter.centerX, nextCenter.centerY);
  }

  /**
   * 结束小地图拖拽并恢复场景交互。
   */
  function stopMinimapDrag() {
    if (!minimapDrag.active) {
      return;
    }
    minimapDrag.active = false;
    input.sceneRef.value?.setInteractionBlocked?.(false);
  }


  /**
   * 以增量方式调整相机缩放，供缩放按钮复用。
   */
  function changeZoomBy(delta: number) {
    input.sceneRef.value?.setCameraZoom?.(input.cameraState.zoom + delta);
  }

  /**
   * 把缩放滑杆值换算成真实 zoom，并同步到场景相机。
   */
  function updateZoomSlider(event: Event) {
    input.sceneRef.value?.setCameraZoom?.(normalizeZoomPercent(Number((event.target as HTMLInputElement).value)));
  }

  /**
   * 把数值输入框中的缩放百分比同步到场景相机。
   */
  function updateZoomInput(event: Event) {
    input.sceneRef.value?.setCameraZoom?.(normalizeZoomPercent(Number((event.target as HTMLInputElement).value)));
  }

  /**
   * 绑定窗口级拖拽监听，让小地图拖拽不受元素边界影响。
   */
  function bindGlobalPointerEvents() {
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
  }

  /**
   * 卸载窗口级拖拽监听，避免组件卸载后残留事件。
   */
  function unbindGlobalPointerEvents() {
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("pointerup", handleWindowPointerUp);
  }

  return {
    minimapDrag,
    zoomPercent,
    minimapViewportStyle,
    startMinimapDrag,
    stopMinimapDrag,
    changeZoomBy,
    updateZoomSlider,
    updateZoomInput,
    bindGlobalPointerEvents,
    unbindGlobalPointerEvents,
  };
}

/**
 * 在组件生命周期内接管小地图控制器的全局事件绑定与解绑。
 */
export function useLevelEditorMinimap(input: {
  sceneRef: SceneRef<LevelEditorScene | null>;
  cameraState: EditorCameraState;
  minimapSurface: Ref<HTMLElement | null>;
  minimapWidth: number;
  minimapHeight: number;
}) {
  const controller = createLevelEditorMinimapController(input);

  onMounted(() => {
    controller.bindGlobalPointerEvents();
  });

  onUnmounted(() => {
    controller.unbindGlobalPointerEvents();
  });

  return controller;
}
