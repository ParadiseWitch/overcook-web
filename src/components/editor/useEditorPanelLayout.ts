import { onMounted, onUnmounted, reactive, ref, type Ref, type ShallowRef } from "vue";

import {
  EDITOR_LAYOUT_STORAGE_KEY,
  clampFloatingPosition,
  getDockedPanelIds,
  getExpandedDockPanel,
  getNextDockOrder,
  restoreEditorLayout,
  type DockedEdge,
  type EditorLayoutState,
  type EditorPanelId,
} from "@/game/editor/editor-layout";
import type { LevelEditorScene } from "@/game/scenes/editor/level-editor-scene";

type PanelEntry = { id: EditorPanelId; title: string };
type Viewport = { width: number; height: number };
type SceneRef<T> = Ref<T> | ShallowRef<T>;

// 统一管理浮动面板的拖拽、吸附、紧凑布局规则和持久化状态。
/**
 * 创建面板布局控制器，集中处理拖拽、吸附、折叠和持久化行为。
 */
export function createPanelLayoutController(input: {
  panelEntries: PanelEntry[];
  viewport: Viewport;
  sceneRef: SceneRef<LevelEditorScene | { setInteractionBlocked?: (blocked: boolean) => void } | null>;
}) {
  const panelLayouts = reactive<EditorLayoutState>(restoreEditorLayout(readStoredLayout()));
  const draggingPanelId = ref<EditorPanelId | null>(null);
  const dragState = reactive({
    offsetX: 0,
    offsetY: 0,
    width: 0,
    height: 0,
    sourceDockedEdge: null as DockedEdge,
    sourceDockOrder: -1,
  });

  const handleWindowPointerMove = (event: PointerEvent) => {
    handlePointerMove(event);
  };
  const handleWindowPointerUp = () => {
    stopPanelDrag();
  };

  /**
   * 进入面板拖拽状态，并记录拖拽起点与原始吸附信息。
   */
  function startPanelDrag(id: EditorPanelId, event: PointerEvent) {
    const panel = panelLayouts[id];
    const metrics = panelMetrics(id);

    draggingPanelId.value = id;
    input.sceneRef.value?.setInteractionBlocked?.(true);
    bringToFront(id);

    dragState.offsetX = event.clientX - metrics.left;
    dragState.offsetY = event.clientY - metrics.top;
    dragState.width = metrics.width;
    dragState.height = metrics.height;
    dragState.sourceDockedEdge = panel.dockedEdge;
    dragState.sourceDockOrder = panel.dockOrder;

    panel.position = { x: metrics.left, y: metrics.top };
    panel.dockedEdge = null;
    panel.minimized = false;
  }

  /**
   * 在拖拽过程中更新浮动面板位置，并限制在当前视口内。
   */
  function handlePointerMove(event: PointerEvent) {
    if (!draggingPanelId.value) {
      return;
    }

    const id = draggingPanelId.value;
    panelLayouts[id].position = clampFloatingPosition(
      { x: event.clientX - dragState.offsetX, y: event.clientY - dragState.offsetY },
      { width: dragState.width, height: dragState.height },
      input.viewport,
    );
  }

  /**
   * 结束面板拖拽，按最终位置决定是否吸附，并恢复场景交互。
   */
  function stopPanelDrag() {
    if (!draggingPanelId.value) {
      return;
    }

    const id = draggingPanelId.value;
    const panel = panelLayouts[id];
    const position = panel.position ?? { x: 0, y: 0 };
    const edge = detectDockEdge(position.x, position.y, {
      width: dragState.width || getPanelDimensions(id).width,
      height: dragState.height || getPanelDimensions(id).height,
    });

    if (edge) {
      // 拖拽结束时根据最终位置决定是否吸附到视口边缘。
      panel.dockedEdge = edge;
      panel.position = null;
      panel.dockOrder = dragState.sourceDockedEdge === edge
        ? dragState.sourceDockOrder
        : getNextDockOrder(panelLayouts, id, edge);
      if (isCompactViewport()) {
        minimizeSiblingPanels(id, edge);
      }
    }

    draggingPanelId.value = null;
    dragState.offsetX = 0;
    dragState.offsetY = 0;
    dragState.width = 0;
    dragState.height = 0;
    dragState.sourceDockedEdge = null;
    dragState.sourceDockOrder = -1;
    input.sceneRef.value?.setInteractionBlocked?.(false);
    persistLayout();
  }

  /**
   * 切换面板最小化状态，并在紧凑布局下折叠同侧兄弟面板。
   */
  function togglePanelMinimize(id: EditorPanelId) {
    const panel = panelLayouts[id];
    if (!panel.minimized) {
      const edge = panel.dockedEdge ?? detectDockEdgeFromMetrics(id) ?? "left";
      panel.dockedEdge = edge;
      panel.position = null;
      panel.dockOrder = getNextDockOrder(panelLayouts, id, edge);
      panel.minimized = true;
    } else {
      panel.minimized = false;
      if (isCompactViewport()) {
        minimizeSiblingPanels(id, panel.dockedEdge);
      }
    }
    persistLayout();
  }

  /**
   * 计算单个面板在当前布局下的内联样式。
   */
  function getPanelStyle(id: EditorPanelId) {
    const panel = panelLayouts[id];
    const metrics = panelMetrics(id);
    return {
      left: `${metrics.left}px`,
      top: `${metrics.top}px`,
      width: `${metrics.width}px`,
      height: `${metrics.height}px`,
      zIndex: `${panel.zIndex}`,
    };
  }

  /**
   * 在小视口下只保留一个展开的吸附面板，避免遮挡编辑区域。
   */
  function normalizePanelsForViewport() {
    if (!isCompactViewport()) {
      return;
    }
    const expandedDocked = input.panelEntries
      .map((panel) => panel.id)
      .filter((id) => panelLayouts[id].dockedEdge !== null && !panelLayouts[id].minimized);
    const keep = getExpandedDockPanel(panelLayouts) ?? "toolbox";
    expandedDocked
      .filter((id) => id !== keep)
      .forEach((id) => {
        panelLayouts[id].minimized = true;
      });
  }

  /**
   * 绑定窗口级拖拽事件，确保指针离开面板后仍能持续更新。
   */
  function bindGlobalPointerEvents() {
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
  }

  /**
   * 解绑窗口级拖拽事件，避免组件销毁后残留监听器。
   */
  function unbindGlobalPointerEvents() {
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("pointerup", handleWindowPointerUp);
  }

  /**
   * 计算面板当前的尺寸和屏幕位置，兼容浮动与吸附两种模式。
   */
  function panelMetrics(id: EditorPanelId) {
    const panel = panelLayouts[id];
    const spacing = 16;
    const { width: panelWidth, height: panelHeight } = getPanelDimensions(id);
    const clampedPosition = clampFloatingPosition(
      {
        x: panel.position?.x ?? spacing,
        y: panel.position?.y ?? spacing + 80,
      },
      { width: panelWidth, height: panelHeight },
      input.viewport,
    );
    if (!panel.dockedEdge) {
      return {
        left: clampedPosition.x,
        top: clampedPosition.y,
        width: panelWidth,
        height: panelHeight,
      };
    }

    const siblings = dockedPanels(panel.dockedEdge);
    let stackOffset = spacing;
    for (const siblingId of siblings) {
      if (siblingId === id) {
        break;
      }
      stackOffset += getPanelDimensions(siblingId).height + spacing;
    }

    if (panel.dockedEdge === "left") {
      return { left: spacing, top: stackOffset, width: panelWidth, height: panelHeight };
    }
    if (panel.dockedEdge === "right") {
      return {
        left: input.viewport.width - panelWidth - spacing,
        top: stackOffset,
        width: panelWidth,
        height: panelHeight,
      };
    }
    if (panel.dockedEdge === "top") {
      return {
        left: spacing + siblings.indexOf(id) * (panelWidth + spacing),
        top: spacing,
        width: panelWidth,
        height: panelHeight,
      };
    }
    return {
      left: spacing + siblings.indexOf(id) * (panelWidth + spacing),
      top: input.viewport.height - panelHeight - spacing,
      width: panelWidth,
      height: panelHeight,
    };
  }

  /**
   * 返回指定边缘上按顺序排列的吸附面板列表。
   */
  function dockedPanels(edge: Exclude<DockedEdge, null>) {
    return getDockedPanelIds(panelLayouts, edge);
  }

  /**
   * 基于当前面板矩形反推它最接近的吸附边缘。
   */
  function detectDockEdgeFromMetrics(id: EditorPanelId) {
    const metrics = panelMetrics(id);
    return detectDockEdge(metrics.left, metrics.top, { width: metrics.width, height: metrics.height });
  }

  /**
   * 根据面板矩形是否靠近视口边缘，判断应吸附到哪一侧。
   */
  function detectDockEdge(left: number, top: number, size: { width: number; height: number }): Exclude<DockedEdge, null> | null {
    const threshold = 24;
    if (left <= threshold) {
      return "left";
    }
    if (left + size.width >= input.viewport.width - threshold) {
      return "right";
    }
    if (top <= threshold) {
      return "top";
    }
    if (top + size.height >= input.viewport.height - threshold) {
      return "bottom";
    }
    return null;
  }

  /**
   * 提升指定面板的层级，保证当前交互面板总在最上层。
   */
  function bringToFront(id: EditorPanelId) {
    panelLayouts[id].zIndex = Math.max(...input.panelEntries.map((panel) => panelLayouts[panel.id].zIndex)) + 1;
  }

  /**
   * 把当前布局序列化到本地存储，用于下次恢复。
   */
  function persistLayout() {
    localStorage.setItem(EDITOR_LAYOUT_STORAGE_KEY, JSON.stringify(panelLayouts));
  }

  /**
   * 判断当前视口是否需要启用更激进的紧凑布局规则。
   */
  function isCompactViewport() {
    return input.viewport.width < 1180 || input.viewport.height < 760;
  }

  /**
   * 计算面板在当前视口和折叠状态下的实际宽高。
   */
  function getPanelDimensions(id: EditorPanelId) {
    const panel = panelLayouts[id];
    const compact = isCompactViewport();
    const floatingWidth = Math.min(panel.size.width, Math.max(260, input.viewport.width - 48));
    const dockedWidth = compact
      ? Math.min(panel.size.width, Math.max(240, input.viewport.width - 96))
      : Math.min(panel.size.width, Math.max(220, input.viewport.width - 48));

    return {
      width: panel.minimized
        ? panel.dockedEdge === "top" || panel.dockedEdge === "bottom"
          ? 132
          : 44
        : panel.dockedEdge
          ? dockedWidth
          : floatingWidth,
      height: panel.minimized
        ? panel.dockedEdge === "top" || panel.dockedEdge === "bottom"
          ? 44
          : 120
        : Math.min(panel.size.height, input.viewport.height - (compact ? 120 : 48)),
    };
  }

  /**
   * 在紧凑布局下折叠同边或同屏的其他面板，优先让当前面板可用。
   */
  function minimizeSiblingPanels(activeId: EditorPanelId, edge: DockedEdge) {
    const sameEdge = edge ? dockedPanels(edge).filter((id) => id !== activeId) : [];
    sameEdge.forEach((id) => {
      panelLayouts[id].minimized = true;
    });
    if (input.viewport.width < 980) {
      input.panelEntries
        .map((panel) => panel.id)
        .filter((id) => id !== activeId && panelLayouts[id].dockedEdge !== null)
        .forEach((id) => {
          panelLayouts[id].minimized = true;
        });
    }
  }

  return {
    panelLayouts,
    draggingPanelId,
    startPanelDrag,
    stopPanelDrag,
    togglePanelMinimize,
    getPanelStyle,
    normalizePanelsForViewport,
    bindGlobalPointerEvents,
    unbindGlobalPointerEvents,
  };
}

/**
 * 把布局控制器接入组件生命周期，自动管理全局拖拽事件。
 */
export function useEditorPanelLayout(input: {
  panelEntries: PanelEntry[];
  viewport: Viewport;
  sceneRef: SceneRef<LevelEditorScene | null>;
}) {
  const controller = createPanelLayoutController(input);

  onMounted(() => {
    controller.bindGlobalPointerEvents();
  });

  onUnmounted(() => {
    controller.unbindGlobalPointerEvents();
  });

  return controller;
}

/**
 * 从本地存储读取上次保存的布局；读取失败时回退到默认布局。
 */
function readStoredLayout() {
  try {
    const raw = localStorage.getItem(EDITOR_LAYOUT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
