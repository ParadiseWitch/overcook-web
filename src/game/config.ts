// config.ts
export const TILE_SIZE = 48;
export const WORLD_W = 17;
export const WORLD_H = 13;
export const SPEED_WALK = 180;
export const SPEED_DASH = 550;
export const DASH_TIME = 250;
export const LEVEL_MAP = [
  "XXTXXXXXXXXDXXTXX",
  "X               X",
  "X . ..S   S.. . X",
  "X . .       . . X",
  "X .           . X",
  "X               X",
  "B   1 a...a 2 KdX",
  "X               X",
  "X C           C X",
  "X .           . X",
  "X . ..B   B.. . X",
  "X               X",
  "XXXXXXXXXXXXXXXXX"
];
export const DEPTH = {
  FLOOR: 0,
  STATION: 10,
  ITEM: 20,
  PLAYER: 30,
  UI: 100
};


const config = {
  TILE_SIZE,
  WORLD_W,
  WORLD_H,
  SPEED_WALK,
  SPEED_DASH,
  DASH_TIME,
  LEVEL_MAP,
  DEPTH
};

export default config;