import { vi, beforeEach } from "vitest";

class MockSprite {
  scene: any;
  x: number = 0;
  y: number = 0;
  depth: number = 0;
  texture: { key: string } = { key: "" };
  heldBy: any = null;
  station: any = null;
  isFlying: boolean = false;
  body: any = { enable: true };

  constructor(scene: any, x: number, y: number, texture: string) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.texture = { key: texture };
  }

  setDepth(d: number) {
    this.depth = d;
    return this;
  }
  setTexture(key: string) {
    this.texture = { key };
    return this;
  }
  setTint() {
    return this;
  }
  clearTint() {
    return this;
  }
  setVisible() {
    return this;
  }
  setVelocity() {
    return this;
  }
  setCircle() {
    return this;
  }
  setCollideWorldBounds() {
    return this;
  }
  destroy() {}
  getBounds() {
    return { x: this.x, y: this.y, width: 48, height: 48 };
  }
}

class MockStaticGroup {
  scene: any;
  world: any;
  children: any[] = [];

  constructor(world: any, scene: any) {
    this.world = world;
    this.scene = scene;
  }

  create(x: number, y: number, texture: string) {
    const sprite = new MockSprite(this.scene, x, y, texture);
    (sprite as any).setData = vi.fn();
    this.children.push(sprite);
    return sprite;
  }

  getChildren() {
    return this.children;
  }
}

const MockPhaser = {
  Scene: class {},
  Physics: {
    Arcade: {
      Sprite: MockSprite,
      StaticGroup: MockStaticGroup,
      Body: class {
        enable = true;
        setVelocity() {}
      },
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
        return new (MockPhaser.Math.Vector2 as any)(this.x, this.y);
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

(globalThis as any).Phaser = MockPhaser;

vi.mock("phaser", () => ({
  default: MockPhaser,
  ...MockPhaser,
}));

beforeEach(() => {
  vi.clearAllMocks();
});