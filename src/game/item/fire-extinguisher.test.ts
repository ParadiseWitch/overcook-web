import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FireExtinguisher } from './fire-extinguisher';

vi.mock('phaser', () => ({
  default: {
    Math: {
      RadToDeg: (rad: number) => rad * (180 / Math.PI)
    }
  },
  Math: {
    RadToDeg: (rad: number) => rad * (180 / Math.PI)
  }
}));

const createMockScene = () => {
  const mockEmitter = {
    stop: vi.fn(),
    start: vi.fn(),
    setConfig: vi.fn(),
    destroy: vi.fn(),
    setDepth: vi.fn(),
    setPosition: vi.fn(),
    emitting: false,
    particleAngle: null as any
  };

  return {
    add: {
      particles: vi.fn().mockReturnValue(mockEmitter)
    },
    physics: {
      add: {
        existing: vi.fn()
      }
    },
    mockEmitter
  };
};

vi.mock('./index', () => ({
  Item: class MockItem {
    scene: any;
    x: number;
    y: number;
    texture: string;
    heldBy: any = null;

    constructor(scene: any, x: number, y: number, texture: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
      this.texture = texture;
    }

    update(_delta: number) {}
    destroy() {}
  }
}));

describe('FireExtinguisher', () => {
  let fireExtinguisher: FireExtinguisher;
  let mockScene: ReturnType<typeof createMockScene>;

  beforeEach(() => {
    mockScene = createMockScene();
    fireExtinguisher = new FireExtinguisher(mockScene as any, 100, 100);
  });

  describe('constructor', () => {
    it('should create a fire extinguisher at the specified position', () => {
      expect(fireExtinguisher.x).toBe(100);
      expect(fireExtinguisher.y).toBe(100);
    });
  });

  describe('progress', () => {
    it('should have initial progress of 0', () => {
      expect(fireExtinguisher.getProgress()).toBe(0);
    });

    it('should update progress', () => {
      fireExtinguisher.setProgress(50);
      expect(fireExtinguisher.getProgress()).toBe(50);
    });
  });

  describe('spray', () => {
    const mockPlayer = { x: 100, y: 100, facing: { angle: () => 0, x: 1, y: 0 } };

    it('should not be spraying initially', () => {
      expect(fireExtinguisher.isCurrentlySpraying()).toBe(false);
    });

    it('should start spraying when startSpray is called', () => {
      fireExtinguisher.heldBy = mockPlayer as any;
      const direction = { angle: () => 0, x: 1, y: 0 };
      fireExtinguisher.startSpray(direction as any);
      
      expect(fireExtinguisher.isCurrentlySpraying()).toBe(true);
      expect(mockScene.add.particles).toHaveBeenCalled();
    });

    it('should not start spraying when not held by player', () => {
      const direction = { angle: () => 0, x: 1, y: 0 };
      fireExtinguisher.startSpray(direction as any);
      
      expect(fireExtinguisher.isCurrentlySpraying()).toBe(false);
    });

    it('should stop spraying when stopSpray is called', () => {
      fireExtinguisher.heldBy = mockPlayer as any;
      const direction = { angle: () => 0, x: 1, y: 0 };
      fireExtinguisher.startSpray(direction as any);
      fireExtinguisher.stopSpray();
      
      expect(fireExtinguisher.isCurrentlySpraying()).toBe(false);
    });
  });

  describe('getSprayRange', () => {
    it('should return the spray range', () => {
      expect(fireExtinguisher.getSprayRange()).toBe(100);
    });
  });

  describe('getSprayAngle', () => {
    it('should return the spray angle', () => {
      expect(fireExtinguisher.getSprayAngle()).toBe(Math.PI / 6);
    });
  });

  describe('destroy', () => {
    it('should destroy the emitter', () => {
      fireExtinguisher.heldBy = { x: 100, y: 100, facing: { angle: () => 0, x: 1, y: 0 } } as any;
      fireExtinguisher.startSpray({ angle: () => 0, x: 1, y: 0 } as any);
      fireExtinguisher.destroy();
      expect(mockScene.mockEmitter.destroy).toHaveBeenCalled();
    });
  });
});