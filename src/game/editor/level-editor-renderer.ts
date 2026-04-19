import type Phaser from "phaser";

import type { ConveyorFloor, FloorConfig, LevelConfig } from "@/game/types/level-config";

export interface FloorRenderSpec {
  textureKey: string;
  angle: number;
  depth: number;
}

export interface LevelEditorRenderer {
  clear: () => void;
  render: () => void;
}

export interface CreateLevelEditorRendererOptions {
  canHandlePointerDown?: () => boolean;
}

const FLOOR_DEPTH = 0;

export function getFloorRenderSpec(floor: FloorConfig): FloorRenderSpec {
  switch (floor.type) {
    case "wall":
      return {
        textureKey: floor.texture ?? "wall",
        angle: 0,
        depth: FLOOR_DEPTH,
      };
    case "conveyor":
      return {
        textureKey: floor.texture ?? "conveyor",
        angle: getConveyorAngle(floor),
        depth: FLOOR_DEPTH,
      };
    case "normal":
    default:
      return {
        textureKey: floor.texture ?? "floor",
        angle: 0,
        depth: FLOOR_DEPTH,
      };
  }
}

export function createLevelEditorRenderer(
  scene: Phaser.Scene,
  levelConfig: LevelConfig,
  options: CreateLevelEditorRendererOptions = {},
): LevelEditorRenderer {
  const tileSize = levelConfig.map.tileSize;
  const mapWidth = levelConfig.map.width;
  const mapHeight = levelConfig.map.height;
  const renderedObjects: Phaser.GameObjects.GameObject[] = [];

  function clear() {
    while (renderedObjects.length > 0) {
      renderedObjects.pop()?.destroy();
    }
  }

  function render() {
    clear();
    renderFloors();
  }

  function renderFloors() {
    const overrides = new Map(
      levelConfig.map.floors.map((floor) => [`${floor.x},${floor.y}`, floor] as const),
    );

    for (let y = 0; y < mapHeight; y += 1) {
      for (let x = 0; x < mapWidth; x += 1) {
        renderFloor(overrides.get(`${x},${y}`) ?? { type: "normal", x, y, texture: "floor" });
      }
    }
  }

  function renderFloor(floorConfig: FloorConfig) {
    const { centerX, centerY } = toWorldPosition(floorConfig.x, floorConfig.y);
    const renderSpec = getFloorRenderSpec(floorConfig);
    const tile = scene.add.image(centerX, centerY, renderSpec.textureKey);
    tile.setDisplaySize(tileSize, tileSize);
    tile.setAngle(renderSpec.angle);
    tile.setDepth(renderSpec.depth);
    tile.setInteractive();
    tile.on("pointerdown", () => {
      if (options.canHandlePointerDown?.() === false) {
        return;
      }
    });
    renderedObjects.push(tile);
  }

  function toWorldPosition(x: number, y: number) {
    return {
      centerX: x * tileSize + tileSize / 2,
      centerY: y * tileSize + tileSize / 2,
    };
  }

  return {
    render,
    clear,
  };
}

function getConveyorAngle(floor: ConveyorFloor) {
  switch (floor.direction) {
    case "down":
      return 90;
    case "left":
      return 180;
    case "up":
      return 270;
    case "right":
    default:
      return 0;
  }
}
