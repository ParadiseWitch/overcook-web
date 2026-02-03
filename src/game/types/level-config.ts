/**
 * 关卡配置数据结构定义
 * 根据 docs/关卡编辑器设计文档.md 定义
 */

// ==================== 玩家配置 ====================

export interface PlayerSpawn {
  id: number;                    // 玩家编号（1或2）
  x: number;                     // X坐标（格子）
  y: number;                     // Y坐标（格子）
  color?: number;                // 玩家颜色（可选，16进制）
}

// ==================== 地板配置 ====================

// 地板配置（基类）
export interface BaseFloorConfig {
  type: FloorType;               // 地板类型
  x: number;                     // X坐标（格子）
  y: number;                     // Y坐标（格子）
}

// 地板类型
export type FloorType = 
  | 'normal'                     // 普通地板
  | 'wall'                       // 墙壁（不可通行）
  | 'conveyor';                  // 传送带

// 联合类型：所有地板配置
export type FloorConfig = NormalFloor | WallFloor | ConveyorFloor;

// 普通地板
export interface NormalFloor extends BaseFloorConfig {
  type: 'normal';
  texture?: string;              // 自定义纹理key（可选）
}

// 墙壁
export interface WallFloor extends BaseFloorConfig {
  type: 'wall';
  texture?: string;              // 自定义纹理key（可选）
}

// 传送带地板
export interface ConveyorFloor extends BaseFloorConfig {
  type: 'conveyor';
  direction: 'up' | 'down' | 'left' | 'right';  // 传送方向
  speed: number;                 // 传送速度（像素/秒）
  texture?: string;              // 自定义纹理key（可选）
}

// ==================== 工作站配置 ====================

// 工作站配置（基类）
export interface BaseStationConfig {
  type: StationType;             // 工作站类型
  x: number;                     // X坐标（格子）
  y: number;                     // Y坐标（格子）
  rotation?: number;             // 旋转角度（度数，可选）
}

// 工作站类型枚举
export type StationType = 
  | 'counter'                    // 空柜台
  | 'plate-counter'              // 带盘子的柜台
  | 'cut'                        // 切菜板
  | 'pot'                        // 炒锅/煮锅
  | 'sink'                       // 洗碗池
  | 'delivery'                   // 上菜口
  | 'dirty-plate'                // 脏盘子生成点
  | 'trash'                      // 垃圾桶
  | 'fire-extinguisher'          // 灭火器
  | 'mixer'                      // 搅拌器
  | 'ingredient';                // 食材箱

// 联合类型：所有工作站配置
export type StationConfig = 
  | CounterStation
  | PlateCounterStation
  | CutStation
  | PotStation
  | SinkStation
  | DeliveryStation
  | DirtyPlateStation
  | TrashStation
  | FireExtinguisherStation
  | MixerStation
  | IngredientStation;

// 空柜台
export interface CounterStation extends BaseStationConfig {
  type: 'counter';
}

// 带盘子的柜台
export interface PlateCounterStation extends BaseStationConfig {
  type: 'plate-counter';
  infinite?: boolean;            // 是否无限供应盘子（默认true）
  maxPlates?: number;            // 最大盘子数（如果infinite为false）
}

// 切菜板
export interface CutStation extends BaseStationConfig {
  type: 'cut';
  cutSpeed?: number;             // 切割速度倍率（默认1.0）
}

// 炒锅/煮锅
export interface PotStation extends BaseStationConfig {
  type: 'pot';
  cookSpeed?: number;            // 烹饪速度倍率（默认1.0）
  canBurn?: boolean;             // 是否会烧焦（默认true）
  canFire?: boolean;             // 是否会着火（默认true）
}

// 洗碗池
export interface SinkStation extends BaseStationConfig {
  type: 'sink';
  washSpeed?: number;            // 清洗速度倍率（默认1.0）
}

// 上菜口
export interface DeliveryStation extends BaseStationConfig {
  type: 'delivery';
  deliveryTime?: number;         // 上菜动画时间（毫秒，默认500）
}

// 脏盘子生成点
export interface DirtyPlateStation extends BaseStationConfig {
  type: 'dirty-plate';
  spawnInterval?: number;        // 生成间隔（秒，默认10）
  maxPlates?: number;            // 最大脏盘子数（默认3）
}

// 垃圾桶
export interface TrashStation extends BaseStationConfig {
  type: 'trash';
}

// 灭火器
export interface FireExtinguisherStation extends BaseStationConfig {
  type: 'fire-extinguisher';
  infinite?: boolean;            // 是否无限使用（默认true）
  capacity?: number;             // 容量（如果infinite为false）
}

// 搅拌器
export interface MixerStation extends BaseStationConfig {
  type: 'mixer';
  mixSpeed?: number;             // 搅拌速度倍率（默认1.0）
}

// 食材箱
export interface IngredientStation extends BaseStationConfig {
  type: 'ingredient';
  ingredientType: IngredientType; // 食材类型
  infinite?: boolean;             // 是否无限供应（默认true）
  maxCount?: number;              // 最大数量（如果infinite为false）
}

// 食材类型
export type IngredientType = 
  | 'tomato'                     // 番茄
  | 'lettuce'                    // 生菜
  | 'rice'                       // 米
  | 'fish'                       // 鱼
  | 'seaweed'                    // 紫菜
  | 'onion'                      // 洋葱
  | 'potato'                     // 土豆
  | 'carrot'                     // 胡萝卜
  | 'egg'                        // 鸡蛋
  | 'flour'                      // 面粉
  | 'meat'                       // 肉
  | 'cheese'                     // 芝士
  | 'chocolate'                  // 巧克力
  | 'burger-bun';                // 汉堡面包

// ==================== 关卡配置 ====================

export interface LevelConfig {
  // 基础信息
  id: string;                    // 关卡唯一ID
  name: string;                  // 关卡名称
  description?: string;          // 关卡描述
  version: string;               // 数据结构版本号（用于未来兼容）
  
  // 游戏设置
  gameType: 'local-coop' | 'local-versus' | 'online-coop' | 'online-versus';
  duration: number;              // 游戏时长（秒）
  
  // 目标分数（星级）
  scoreTarget: {
    star1: number;               // 1星分数
    star2: number;               // 2星分数
    star3: number;               // 3星分数
    star4?: number;              // 4星分数（可选）
  };
  
  // 地图配置
  map: {
    width: number;               // 地图宽度（格子数）
    height: number;              // 地图高度（格子数）
    floors: FloorConfig[];       // 地板配置列表
  };
  
  // 玩家配置
  players: PlayerSpawn[];
  
  // 工作站配置
  stations: StationConfig[];
  
  // 订单池配置
  orderPool: {
    recipes: string[];           // 可用菜谱ID列表
    maxActiveOrders: number;     // 最大同时订单数
    spawnInterval: number;       // 订单生成间隔（秒）
  };
}

// 默认的关卡配置
export const getDefaultLevelConfig = (): LevelConfig => ({
  id: `level-${Date.now()}`,
  name: '未命名关卡',
  version: '1.0',
  gameType: 'local-coop',
  duration: 300,
  scoreTarget: {
    star1: 100,
    star2: 200,
    star3: 300,
  },
  map: {
    width: 17,
    height: 13,
    floors: [],
  },
  players: [],
  stations: [],
  orderPool: {
    recipes: [],
    maxActiveOrders: 4,
    spawnInterval: 15,
  },
});