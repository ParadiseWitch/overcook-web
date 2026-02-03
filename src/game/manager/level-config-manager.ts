/**
 * 关卡配置管理器
 * 管理关卡配置数据的创建、修改、验证和导出
 */

import { LevelConfig, getDefaultLevelConfig, FloorConfig, StationConfig, PlayerSpawn } from '@/game/types/level-config';

export class LevelConfigManager {
  private config: LevelConfig;

  constructor(initialConfig?: LevelConfig) {
    this.config = initialConfig ? { ...initialConfig } : getDefaultLevelConfig();
  }

  /**
   * 更新基础信息
   */
  updateBasicInfo(info: Partial<Pick<LevelConfig, 'id' | 'name' | 'description' | 'gameType' | 'duration'>>) {
    this.config = {
      ...this.config,
      ...info
    };
  }

  /**
   * 更新目标分数
   */
  updateScoreTarget(target: Partial<LevelConfig['scoreTarget']>) {
    this.config.scoreTarget = {
      ...this.config.scoreTarget,
      ...target
    };
  }

  /**
   * 更新地图尺寸
   */
  updateMapSize(width: number, height: number) {
    this.config.map.width = width;
    this.config.map.height = height;
  }

  /**
   * 添加地板
   */
  addFloor(floor: FloorConfig): boolean {
    // 检查是否已存在相同坐标的地板
    const existingIndex = this.config.map.floors.findIndex(f => f.x === floor.x && f.y === floor.y);
    
    if (existingIndex !== -1) {
      // 替换已存在的地板
      this.config.map.floors[existingIndex] = floor;
    } else {
      // 添加新的地板
      this.config.map.floors.push(floor);
    }
    
    return true;
  }

  /**
   * 删除地板
   */
  removeFloor(x: number, y: number): boolean {
    const index = this.config.map.floors.findIndex(f => f.x === x && f.y === y);
    if (index !== -1) {
      this.config.map.floors.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 添加工作站
   */
  addStation(station: StationConfig): boolean {
    // 检查是否已存在相同坐标的站点
    const existingIndex = this.config.stations.findIndex(s => s.x === station.x && s.y === station.y);
    
    if (existingIndex !== -1) {
      // 替换已存在的站点
      this.config.stations[existingIndex] = station;
    } else {
      // 添加新的站点
      this.config.stations.push(station);
    }
    
    return true;
  }

  /**
   * 删除工作站
   */
  removeStation(x: number, y: number): boolean {
    const index = this.config.stations.findIndex(s => s.x === x && s.y === y);
    if (index !== -1) {
      this.config.stations.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 添加玩家
   */
  addPlayer(player: PlayerSpawn): boolean {
    // 检查是否已存在相同ID的玩家
    const existingIndex = this.config.players.findIndex(p => p.id === player.id);
    
    if (existingIndex !== -1) {
      // 替换已存在的玩家
      this.config.players[existingIndex] = player;
    } else {
      // 添加新的玩家
      this.config.players.push(player);
    }
    
    return true;
  }

  /**
   * 删除玩家
   */
  removePlayer(id: number): boolean {
    const index = this.config.players.findIndex(p => p.id === id);
    if (index !== -1) {
      this.config.players.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 设置订单池
   */
  setOrderPool(orderPool: LevelConfig['orderPool']) {
    this.config.orderPool = { ...orderPool };
  }

  /**
   * 获取当前配置
   */
  getConfig(): LevelConfig {
    return { ...this.config }; // 返回副本防止意外修改
  }

  /**
   * 设置配置
   */
  setConfig(newConfig: LevelConfig) {
    this.config = { ...newConfig };
  }

  /**
   * 导出为JSON字符串
   */
  exportJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 从JSON字符串导入
   */
  importJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (this.isValidLevelConfig(parsed)) {
        this.config = parsed;
        return true;
      }
      console.error('Invalid level configuration:', parsed);
      return false;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return false;
    }
  }

  /**
   * 验证配置是否有效
   */
  private isValidLevelConfig(config: any): config is LevelConfig {
    // 基本结构验证
    if (!config || typeof config !== 'object') {
      return false;
    }

    // 必需字段验证
    if (!config.id || !config.name || !config.version) {
      return false;
    }

    // 地图验证
    if (!config.map || typeof config.map !== 'object' || 
        typeof config.map.width !== 'number' || typeof config.map.height !== 'number' ||
        !Array.isArray(config.map.floors)) {
      return false;
    }

    // 玩家验证
    if (!Array.isArray(config.players)) {
      return false;
    }

    // 工作站验证
    if (!Array.isArray(config.stations)) {
      return false;
    }

    // 订单池验证
    if (!config.orderPool || typeof config.orderPool !== 'object' ||
        !Array.isArray(config.orderPool.recipes)) {
      return false;
    }

    return true;
  }

  /**
   * 验证关卡配置的有效性
   */
  validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查是否至少有一个玩家
    if (this.config.players.length === 0) {
      errors.push('关卡必须至少有一个玩家出生点');
    }

    // 检查是否至少有一个上菜口
    const hasDelivery = this.config.stations.some(s => s.type === 'delivery');
    if (!hasDelivery) {
      errors.push('关卡必须至少有一个上菜口');
    }

    // 检查地图尺寸是否合理
    if (this.config.map.width < 5 || this.config.map.width > 50) {
      errors.push('地图宽度必须在5到50之间');
    }
    if (this.config.map.height < 5 || this.config.map.height > 50) {
      errors.push('地图高度必须在5到50之间');
    }

    // 检查是否有盘子来源
    const hasPlateSource = this.config.stations.some(s => 
      s.type === 'plate-counter' || s.type === 'delivery'
    );
    if (!hasPlateSource) {
      warnings.push('关卡没有盘子来源，玩家可能无法获得盘子');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}