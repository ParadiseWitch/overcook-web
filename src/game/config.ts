// config.ts
export const TILE_SIZE = 48;
export const WORLD_W = 17;
export const WORLD_H = 13;
export const SPEED_WALK = 180;
export const SPEED_DASH = 750;
export const DASH_TIME = 250;

/**
 * 地图配置
 * 
 * 字符对照表：
 * 
 * === 基础设施 ===
 * X - 墙壁/边界
 * (空格) - 地板
 * 
 * === 工作站 ===
 * . - 空柜台
 * a - 带空盘子的柜台
 * C - 切菜板
 * S - 炒锅/煮锅（带锅）
 * K - 洗碗池
 * D - 上菜口
 * d - 脏盘子生成点
 * T - 垃圾桶
 * E - 灭火器位置
 * M - 搅拌器位置（暂时用空柜台代替，待实现）
 * 
 * === 食材箱 ===
 * B - 番茄箱（用于番茄汤、番茄沙拉）
 * L - 生菜箱（用于生菜沙拉、生菜番茄沙拉）
 * R - 米箱（用于鱼寿司）
 * F - 鱼箱（用于鱼寿司、鱼刺身）
 * N - 紫菜箱（用于鱼寿司）
 * O - 洋葱箱（用于洋葱土豆胡萝卜汤）
 * G - 土豆箱（用于洋葱土豆胡萝卜汤）
 * P - 胡萝卜箱（用于洋葱土豆胡萝卜汤）
 * Q - 鸡蛋箱（用于清蛋糕）
 * (面粉箱暂未放置，待添加)
 * 
 * === 角色出生点 ===
 * 1 - 玩家1出生点
 * 2 - 玩家2出生点
 * 
 * === 示例菜品制作流程 ===
 * - 生菜番茄沙拉：从L取生菜、从B取番茄 → 在C切好 → 组合在盘子上
 * - 鱼寿司：从F取鱼在C切好、从R取米在S煮好、从N取紫菜 → 组合在盘子上
 * - 洋葱土豆胡萝卜汤：从O取洋葱、从G取土豆、从P取胡萝卜 → 在C切好 → 放入S炒锅煮制
 * - 清蛋糕：从Q取鸡蛋、取面粉 → 在M搅拌 → 在S煎制
 */
export const LEVEL_MAP = [
  "                 ",
  "  T   D     T    ",
  "                 ",
  "   ..S...S...    ",
  "    L     R   M  ",
  "    C     C   C  ",
  " T  1 a...a 2  E ",
  "                 ",
  "  C  F  N  O  C  ",
  "  B  G  P  Q     ",
  "   C.T   S.C  Kd ",
  "                 ",
  "                 ",
];
export const DEPTH = {
  FLOOR: 0,
  STATION: 10,
  ITEM: 20,
  PLAYER: 30,
  FX: 40,
  UI_TIP: 50,
  UI: 100,
};

const config = {
  TILE_SIZE,
  WORLD_W,
  WORLD_H,
  SPEED_WALK,
  SPEED_DASH,
  DASH_TIME,
  LEVEL_MAP,
  DEPTH,
};

export default config;
