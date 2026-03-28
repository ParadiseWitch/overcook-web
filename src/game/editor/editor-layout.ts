export type EditorPanelId =
  | "basic-settings"
  | "score-target"
  | "toolbox"
  | "order-pool"
  | "validation"
  | "properties";

export type DockedEdge = "left" | "right" | "top" | "bottom" | null;

export interface PanelSize {
  width: number;
  height: number;
}

export interface PanelPosition {
  x: number;
  y: number;
}

export interface EditorPanelState {
  dockedEdge: DockedEdge;
  dockOrder: number;
  minimized: boolean;
  position: PanelPosition | null;
  size: PanelSize;
  zIndex: number;
}

export type EditorLayoutState = Record<EditorPanelId, EditorPanelState>;

export const EDITOR_LAYOUT_STORAGE_KEY = "level-editor-layout-v1";

export const DEFAULT_PANEL_SPECS: Record<
  EditorPanelId,
  { dockedEdge: Exclude<DockedEdge, null>; dockOrder: number; size: PanelSize }
> = {
  "basic-settings": {
    dockedEdge: "left",
    dockOrder: 0,
    size: { width: 320, height: 260 },
  },
  "score-target": {
    dockedEdge: "left",
    dockOrder: 1,
    size: { width: 320, height: 220 },
  },
  toolbox: {
    dockedEdge: "left",
    dockOrder: 2,
    size: { width: 320, height: 420 },
  },
  "order-pool": {
    dockedEdge: "left",
    dockOrder: 3,
    size: { width: 320, height: 320 },
  },
  properties: {
    dockedEdge: "right",
    dockOrder: 0,
    size: { width: 360, height: 360 },
  },
  validation: {
    dockedEdge: "right",
    dockOrder: 1,
    size: { width: 360, height: 240 },
  },
};

const PANEL_IDS = Object.keys(DEFAULT_PANEL_SPECS) as EditorPanelId[];

export function createDefaultEditorLayout(): EditorLayoutState {
  return PANEL_IDS.reduce(
    (layout, id, index) => {
      const spec = DEFAULT_PANEL_SPECS[id];
      layout[id] = {
        dockedEdge: spec.dockedEdge,
        dockOrder: spec.dockOrder,
        minimized: false,
        position: null,
        size: spec.size,
        zIndex: 10 + index,
      };
      return layout;
    },
    {} as EditorLayoutState,
  );
}

export function restoreEditorLayout(
  rawLayout: unknown,
  fallback = createDefaultEditorLayout(),
): EditorLayoutState {
  if (!rawLayout || typeof rawLayout !== "object") {
    return fallback;
  }

  const restored = createDefaultEditorLayout();

  PANEL_IDS.forEach((id) => {
    const state = (rawLayout as Record<string, unknown>)[id];
    if (!state || typeof state !== "object") {
      return;
    }

    const next = state as Partial<EditorPanelState>;
    restored[id] = {
      ...restored[id],
      dockedEdge: isDockedEdge(next.dockedEdge) ? next.dockedEdge : restored[id].dockedEdge,
      dockOrder: typeof next.dockOrder === "number" ? next.dockOrder : restored[id].dockOrder,
      minimized: typeof next.minimized === "boolean" ? next.minimized : restored[id].minimized,
      position: isPanelPosition(next.position) ? next.position : restored[id].position,
      size: isPanelSize(next.size) ? next.size : restored[id].size,
      zIndex: typeof next.zIndex === "number" ? next.zIndex : restored[id].zIndex,
    };
  });

  return restored;
}

export function dockPanel(
  layout: EditorLayoutState,
  id: EditorPanelId,
  edge: Exclude<DockedEdge, null>,
  dockOrder: number,
): EditorLayoutState {
  return {
    ...layout,
    [id]: {
      ...layout[id],
      dockedEdge: edge,
      dockOrder,
      position: null,
    },
  };
}

export function getDockedPanelIds(
  layout: EditorLayoutState,
  edge: Exclude<DockedEdge, null>,
): EditorPanelId[] {
  return PANEL_IDS
    .filter((id) => layout[id].dockedEdge === edge)
    .sort((a, b) => layout[a].dockOrder - layout[b].dockOrder);
}

export function getNextDockOrder(
  layout: EditorLayoutState,
  id: EditorPanelId,
  edge: Exclude<DockedEdge, null>,
): number {
  const current = layout[id];
  if (current.dockedEdge === edge) {
    return current.dockOrder;
  }

  return getDockedPanelIds(layout, edge).filter((panelId) => panelId !== id).length;
}

export function getExpandedDockPanel(
  layout: EditorLayoutState,
): EditorPanelId | null {
  return (
    PANEL_IDS
      .filter((id) => layout[id].dockedEdge !== null && !layout[id].minimized)
      .sort((a, b) => layout[b].zIndex - layout[a].zIndex)[0] ?? null
  );
}

export function clampFloatingPosition(
  position: PanelPosition,
  size: PanelSize,
  viewport: { width: number; height: number },
): PanelPosition {
  return {
    x: Math.min(Math.max(position.x, 0), Math.max(0, viewport.width - size.width)),
    y: Math.min(Math.max(position.y, 0), Math.max(0, viewport.height - size.height)),
  };
}

function isDockedEdge(value: unknown): value is DockedEdge {
  return (
    value === "left" ||
    value === "right" ||
    value === "top" ||
    value === "bottom" ||
    value === null
  );
}

function isPanelSize(value: unknown): value is PanelSize {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as PanelSize).width === "number" &&
    typeof (value as PanelSize).height === "number"
  );
}

function isPanelPosition(value: unknown): value is PanelPosition {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as PanelPosition).x === "number" &&
    typeof (value as PanelPosition).y === "number"
  );
}
