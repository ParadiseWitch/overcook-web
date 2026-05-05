import type { ViewportSize } from "./level-editor-camera";

export interface ViewportResizeScheduler {
  schedule: (viewport: ViewportSize) => void;
  cancel: () => void;
}

export interface ViewportResizeFrameApi {
  request: (callback: FrameRequestCallback) => number;
  cancel: (handle: number) => void;
}

export function getElementViewportSize(element: HTMLElement): ViewportSize {
  return {
    width: Math.floor(element.clientWidth),
    height: Math.floor(element.clientHeight),
  };
}

export function isValidViewportSize(viewport: ViewportSize): boolean {
  return (
    Number.isFinite(viewport.width) &&
    Number.isFinite(viewport.height) &&
    viewport.width > 0 &&
    viewport.height > 0
  );
}

export function createViewportResizeScheduler(
  onResize: (viewport: ViewportSize) => void,
  frameApi: ViewportResizeFrameApi = createDefaultFrameApi(),
): ViewportResizeScheduler {
  let pendingViewport: ViewportSize | null = null;
  let frameHandle: number | null = null;

  const flush = () => {
    frameHandle = null;
    const nextViewport = pendingViewport;
    pendingViewport = null;

    if (!nextViewport) {
      return;
    }

    onResize(nextViewport);
  };

  return {
    schedule(viewport) {
      if (!isValidViewportSize(viewport)) {
        return;
      }

      pendingViewport = viewport;

      if (frameHandle !== null) {
        return;
      }

      frameHandle = frameApi.request(flush);
    },
    cancel() {
      pendingViewport = null;

      if (frameHandle === null) {
        return;
      }

      frameApi.cancel(frameHandle);
      frameHandle = null;
    },
  };
}

function createDefaultFrameApi(): ViewportResizeFrameApi {
  return {
    request: (callback) => window.requestAnimationFrame(callback),
    cancel: (handle) => window.cancelAnimationFrame(handle),
  };
}
