import type { CameraCenter } from "./level-editor-camera";

export interface DragDelta {
  x: number;
  y: number;
}

export interface EditorCameraPanSession {
  active: boolean;
  pointerDown: boolean;
  spaceDown: boolean;
}

export function createEditorCameraPanSession(): EditorCameraPanSession {
  return {
    active: false,
    pointerDown: false,
    spaceDown: false,
  };
}

export function getPanCameraCenter(
  center: CameraCenter,
  delta: DragDelta,
  zoom: number,
): CameraCenter {
  const scale = zoom <= 0 ? 1 : zoom;

  return {
    x: center.x - delta.x / scale,
    y: center.y - delta.y / scale,
  };
}
