import { vi } from "vitest";

export const createMockScene = () => ({
  add: {
    particles: vi.fn().mockReturnValue({
      stop: vi.fn(),
      start: vi.fn(),
      setConfig: vi.fn(),
      destroy: vi.fn(),
      setDepth: vi.fn().mockReturnThis(),
      setPosition: vi.fn().mockReturnThis(),
      startFollow: vi.fn().mockReturnThis(),
      emitting: false,
    }),
    rectangle: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      width: 0,
      x: 0,
      y: 0,
    }),
    text: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setName: vi.fn().mockReturnThis(),
      setText: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      setStyle: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      text: "",
      visible: true,
    }),
    existing: vi.fn().mockImplementation((obj) => obj),
    container: vi.fn().mockReturnValue({
      setDepth: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      visible: false,
    }),
  },
  physics: {
    add: {
      existing: vi.fn().mockImplementation((obj) => obj),
      group: vi.fn().mockReturnValue({
        add: vi.fn(),
        remove: vi.fn(),
      }),
      staticGroup: vi.fn(),
    },
    world: {
      setBounds: vi.fn(),
    },
  },
  input: {
    keyboard: {
      addKeys: vi.fn().mockReturnValue({
        up: { isDown: false },
        down: { isDown: false },
        left: { isDown: false },
        right: { isDown: false },
        pick: { isDown: false },
        throw: { isDown: false },
        work: { isDown: false },
        dash: { isDown: false },
      }),
      on: vi.fn(),
    },
    gamepad: {
      on: vi.fn(),
      gamepads: [],
    },
  },
  scale: { width: 800, height: 600 },
  cameras: {
    main: { width: 800, height: 600 },
  },
  time: {
    delayedCall: vi.fn(),
  },
  textures: {
    exists: vi.fn().mockReturnValue(true),
  },
  scene: {
    restart: vi.fn(),
  },
});

class MockSprite {
  scene: any;
  x: number;
  y: number;
  texture: { key: string };
  body: any = null;
  depth: number = 0;
  heldBy: any = null;
  station: any = null;
  isFlying: boolean = false;
  thrower: any = null;
  flyEmitter: any = { start: vi.fn(), stop: vi.fn() };

  constructor(scene: any, x: number, y: number, texture: string) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.texture = { key: texture };
  }

  setDepth = vi.fn().mockImplementation((d: number) => {
    this.depth = d;
    return this;
  });
  setTint = vi.fn().mockReturnThis();
  clearTint = vi.fn().mockReturnThis();
  setVisible = vi.fn().mockReturnThis();
  setVelocity = vi.fn().mockReturnThis();
  setTexture = vi.fn().mockImplementation((key: string) => {
    this.texture = { key };
    return this;
  });
  setCircle = vi.fn().mockReturnThis();
  setCollideWorldBounds = vi.fn().mockReturnThis();
  setRotation = vi.fn().mockReturnThis();
  destroy = vi.fn();
  getBounds = vi.fn().mockReturnValue({ x: 0, y: 0, width: 48, height: 48 });
}

class MockStaticGroup {
  scene: any;
  world: any;
  children: any[] = [];

  constructor(world: any, scene: any) {
    this.world = world;
    this.scene = scene;
  }

  create = vi.fn().mockImplementation((x: number, y: number, texture: string) => {
    const sprite = new MockSprite(this.scene, x, y, texture);
    sprite.setData = vi.fn();
    this.children.push(sprite);
    return sprite;
  });

  getChildren = vi.fn().mockImplementation(() => this.children);
}

export const MockPhaser = {
  Scene: class {
    add: any;
    physics: any;
    input: any;
    scale: any;
    cameras: any;
    time: any;
    scene: any;
  },
  Physics: {
    Arcade: {
      Sprite: MockSprite,
      StaticGroup: MockStaticGroup,
    },
  },
  Math: {
    Vector2: class {
      x: number;
      y: number;
      constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
      }
      set(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
      }
      normalize() {
        const len = Math.sqrt(this.x * this.x + this.y * this.y);
        if (len > 0) {
          this.x /= len;
          this.y /= len;
        }
        return this;
      }
      angle() {
        return Math.atan2(this.y, this.x);
      }
      clone() {
        return new MockPhaser.Math.Vector2(this.x, this.y);
      }
      scale(s: number) {
        this.x *= s;
        this.y *= s;
        return this;
      }
    },
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) =>
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    },
    Between: (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min,
    RadToDeg: (rad: number) => rad * (180 / Math.PI),
  },
  Input: {
    Keyboard: {
      JustDown: vi.fn().mockReturnValue(false),
    },
  },
  GameObjects: {
    Particles: {
      ParticleEmitter: class {},
    },
    Rectangle: class {},
    Text: class {},
    Container: class {},
  },
};

export default MockPhaser;