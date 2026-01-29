import { DEPTH, LEVEL_MAP, TILE_SIZE, WORLD_H, WORLD_W } from "../config";
import { Player } from "../player";
import { createPlayer } from "./player-manager";
import { createStation } from "./station-manager";

// 根据 LEVEL_MAP 创建游戏地图和工作站
export const createMap = (scene: Phaser.Scene) => {
  // 1. 地板
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      if (LEVEL_MAP[y][x] !== "X") {
        scene.add
          .image(x * TILE_SIZE + 24, y * TILE_SIZE + 24, "floor")
          .setDepth(DEPTH.FLOOR);
      }
    }
  }

  // 2. 实体对象 (工作站和玩家出生点)
  for (let y = 0; y < LEVEL_MAP.length; y++) {
    for (let x = 0; x < LEVEL_MAP[y].length; x++) {
      const char = LEVEL_MAP[y][x];
      if (char === " " || char === "X") continue; // 跳过地板和墙壁

      const px = x * TILE_SIZE + 24; // 计算中心X坐标
      const py = y * TILE_SIZE + 24; // 计算中心Y坐标

      // 在玩家出生点创建角色
      if (char === "1") {
        const p1 = new Player(scene, 0, px, py, 0x4da6ff, {
          up: "W",
          down: "S",
          left: "A",
          right: "D",
          pick: "E",
          work: "R",
          throw: "SPACE",
          dash: "SHIFT",
        });

        createPlayer(p1);
        continue;
      }
      if (char === "2") {
        const p2 = new Player(scene, 0, px, py, 0xff4444, {
          up: "UP",
          down: "DOWN",
          left: "LEFT",
          right: "RIGHT",
          pick: "O",
          work: "P",
          throw: "L",
          dash: "ENTER",
        });
        createPlayer(p2);
        continue;
      }

      createStation(scene, char, px, py);
    }
  }
};
