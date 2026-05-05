import { vi } from "vitest";

import {
  createViewportResizeScheduler,
  isValidViewportSize,
} from "../level-editor-resize";

describe("level-editor-resize", () => {
  it("rejects non-positive viewport dimensions", () => {
    expect(isValidViewportSize({ width: 0, height: 480 })).toBe(false);
    expect(isValidViewportSize({ width: 640, height: -1 })).toBe(false);
    expect(isValidViewportSize({ width: 640, height: 480 })).toBe(true);
  });

  it("coalesces consecutive resize notifications into the latest viewport", () => {
    let frameCallback: FrameRequestCallback | null = null;
    const onResize = vi.fn();
    const request = vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 7;
    });
    const cancel = vi.fn();

    const scheduler = createViewportResizeScheduler(onResize, { request, cancel });

    scheduler.schedule({ width: 800, height: 600 });
    scheduler.schedule({ width: 1024, height: 768 });

    expect(request).toHaveBeenCalledTimes(1);
    expect(onResize).not.toHaveBeenCalled();

    frameCallback?.(0);

    expect(onResize).toHaveBeenCalledWith({ width: 1024, height: 768 });
  });

  it("ignores invalid resize notifications without scheduling work", () => {
    const onResize = vi.fn();
    const request = vi.fn((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    const scheduler = createViewportResizeScheduler(onResize, {
      request,
      cancel: vi.fn(),
    });

    scheduler.schedule({ width: 0, height: 600 });

    expect(request).not.toHaveBeenCalled();
    expect(onResize).not.toHaveBeenCalled();
  });

  it("cancels pending resize work", () => {
    let frameCallback: FrameRequestCallback | null = null;
    const onResize = vi.fn();
    const cancel = vi.fn();
    const scheduler = createViewportResizeScheduler(onResize, {
      request: (callback) => {
        frameCallback = callback;
        return 3;
      },
      cancel,
    });

    scheduler.schedule({ width: 800, height: 600 });
    scheduler.cancel();
    frameCallback?.(0);

    expect(cancel).toHaveBeenCalledWith(3);
    expect(onResize).not.toHaveBeenCalled();
  });

  it("calls the default frame API with the window binding", () => {
    const originalWindowRequest = window.requestAnimationFrame;
    const originalWindowCancel = window.cancelAnimationFrame;
    const originalGlobalRequest = globalThis.requestAnimationFrame;
    const originalGlobalCancel = globalThis.cancelAnimationFrame;
    let frameCallback: FrameRequestCallback | null = null;
    const request = vi.fn(function (this: Window, callback: FrameRequestCallback) {
      expect(this).toBe(window);
      frameCallback = callback;
      return 11;
    });
    const cancel = vi.fn(function (this: Window) {
      expect(this).toBe(window);
    });

    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: request,
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: cancel,
    });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      value: request,
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
      configurable: true,
      value: cancel,
    });

    try {
      const onResize = vi.fn();
      const scheduler = createViewportResizeScheduler(onResize);

      scheduler.schedule({ width: 800, height: 600 });
      frameCallback?.(0);
      scheduler.schedule({ width: 1024, height: 768 });
      scheduler.cancel();

      expect(onResize).toHaveBeenCalledWith({ width: 800, height: 600 });
      expect(cancel).toHaveBeenCalledWith(11);
    } finally {
      Object.defineProperty(window, "requestAnimationFrame", {
        configurable: true,
        value: originalWindowRequest,
      });
      Object.defineProperty(window, "cancelAnimationFrame", {
        configurable: true,
        value: originalWindowCancel,
      });
      Object.defineProperty(globalThis, "requestAnimationFrame", {
        configurable: true,
        value: originalGlobalRequest,
      });
      Object.defineProperty(globalThis, "cancelAnimationFrame", {
        configurable: true,
        value: originalGlobalCancel,
      });
    }
  });
});
