import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockScene } from "../../__mocks__/phaser";

vi.mock("../config", () => ({
  DEPTH: { PLAYER: 10, ITEM: 20, STATION: 5 },
}));

vi.mock("../player", () => ({
  Player: class MockPlayer {},
}));

vi.mock("../stations/station", () => ({
  Station: class MockStation {},
}));

import { Item } from "./index";

class TestItem extends Item {
  private _progress: number = 0;

  getProgress(): number {
    return this._progress;
  }

  setProgress(value: number): void {
    this._progress = value;
  }
}

describe("Item", () => {
  let mockScene: ReturnType<typeof createMockScene>;
  let mockFlyEmitter: any;

  beforeEach(() => {
    mockFlyEmitter = {
      setConfig: vi.fn().mockReturnThis(),
      startFollow: vi.fn().mockReturnThis(),
      stop: vi.fn(),
      destroy: vi.fn(),
    };
    mockScene = createMockScene();
    (mockScene.add as any).particles = vi.fn().mockReturnValue(mockFlyEmitter);
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct position", () => {
      const item = new TestItem(mockScene as any, 100, 200, "test_texture");

      expect(item.x).toBe(100);
      expect(item.y).toBe(200);
    });

    it("should initialize with isFlying false", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");

      expect(item.isFlying).toBe(false);
    });

    it("should initialize with heldBy null", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");

      expect(item.heldBy).toBeNull();
    });

    it("should initialize with thrower null", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");

      expect(item.thrower).toBeNull();
    });

    it("should create fly emitter", () => {
      new TestItem(mockScene as any, 100, 100, "test_texture");

      expect((mockScene.add as any).particles).toHaveBeenCalled();
      expect(mockFlyEmitter.setConfig).toHaveBeenCalled();
      expect(mockFlyEmitter.startFollow).toHaveBeenCalled();
      expect(mockFlyEmitter.stop).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should do nothing when not flying", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");
      item.isFlying = false;

      item.update(16);

      expect(item.isFlying).toBe(false);
    });

    it("should stop flying when velocity is zero", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");
      item.isFlying = true;
      item.thrower = { name: "player" } as any;
      (item as any).body = { velocity: { x: 0, y: 0 } };

      item.update(16);

      expect(item.isFlying).toBe(false);
      expect(item.thrower).toBeNull();
      expect(mockFlyEmitter.stop).toHaveBeenCalled();
    });

    it("should stop flying when body has no velocity", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");
      item.isFlying = true;
      item.thrower = { name: "player" } as any;
      (item as any).body = { velocity: null };

      item.update(16);

      expect(item.isFlying).toBe(false);
      expect(item.thrower).toBeNull();
    });

    it("should continue flying when velocity is non-zero", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");
      item.isFlying = true;
      item.thrower = { name: "player" } as any;
      (item as any).body = { velocity: { x: 100, y: 50 } };

      item.update(16);

      expect(item.isFlying).toBe(true);
      expect(item.thrower).not.toBeNull();
    });
  });

  describe("destroy", () => {
    it("should destroy fly emitter", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");

      item.destroy();

      expect(mockFlyEmitter.destroy).toHaveBeenCalled();
    });

    it("should pass fromScene parameter to fly emitter destroy", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");

      item.destroy(true);

      expect(mockFlyEmitter.destroy).toHaveBeenCalledWith(true);
    });
  });

  describe("getProgress / setProgress", () => {
    it("should return initial progress as 0", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");

      expect(item.getProgress()).toBe(0);
    });

    it("should set and get progress", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");

      item.setProgress(50);

      expect(item.getProgress()).toBe(50);
    });
  });

  describe("flyEmitter emitCallback", () => {
    it("should configure emitCallback that sets particle velocity", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");
      (item as any).body = { velocity: { x: 100, y: 50 } };

      const configCall = mockFlyEmitter.setConfig.mock.calls[0][0];
      expect(configCall.emitCallback).toBeDefined();

      const mockParticle = { velocityX: 0, velocityY: 0 };
      configCall.emitCallback.call(item, mockParticle);

      expect(typeof mockParticle.velocityX).toBe("number");
      expect(typeof mockParticle.velocityY).toBe("number");
    });

    it("should not set particle velocity when body has no velocity", () => {
      const item = new TestItem(mockScene as any, 100, 100, "test_texture");
      (item as any).body = null;

      const configCall = mockFlyEmitter.setConfig.mock.calls[0][0];
      const mockParticle = { velocityX: 0, velocityY: 0 };

      configCall.emitCallback.call(item, mockParticle);

      expect(mockParticle.velocityX).toBe(0);
      expect(mockParticle.velocityY).toBe(0);
    });
  });
});