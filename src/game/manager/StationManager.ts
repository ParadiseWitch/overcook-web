import * as Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import { LEVEL_MAP, TILE_SIZE, WORLD_H, WORLD_W, DEPTH } from '../config';

// 导入所有工作站类型
import { Station } from '../stations/Station';
import { CounterStation } from '../stations/CounterStation';
import { CrateStation } from '../stations/CrateStation';
import { CuttingStation } from '../stations/CuttingStation';
import { PotStation } from '../stations/PotStation';
import { SinkStation } from '../stations/SinkStation';
import { DeliveryStation } from '../stations/DeliveryStation';
import { TrashStation } from '../stations/TrashStation';
import { DirtyPlateStation } from '../stations/DirtyPlateStation';

export class StationManager {
  private scene: GameScene; // 游戏场景实例
  public stations: Station[] = []; // 场景中的所有工作站实例
  public playerSpawnPoints: { [key: string]: { x: number, y: number } } = {}; // 玩家出生点

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  // 根据 LEVEL_MAP 创建游戏地图和工作站
  createMap() {
    // 1. 地板
    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        if (LEVEL_MAP[y][x] !== 'X') {
          this.scene.add.image(x * TILE_SIZE + 24, y * TILE_SIZE + 24, 'floor').setDepth(DEPTH.FLOOR);
        }
      }
    }

    // 2. 实体对象 (工作站和玩家出生点)
    for (let y = 0; y < LEVEL_MAP.length; y++) {
      for (let x = 0; x < LEVEL_MAP[y].length; x++) {
        const char = LEVEL_MAP[y][x];
        if (char === 'F' || char === ' ') continue; // 跳过地板和空地

        const px = x * TILE_SIZE + 24; // 计算中心X坐标
        const py = y * TILE_SIZE + 24; // 计算中心Y坐标

        // 玩家出生点 (非工作站)
        if (char === '1') {
          this.playerSpawnPoints['P1'] = { x: px, y: py };
          continue;
        }
        if (char === '2') {
          this.playerSpawnPoints['P2'] = { x: px, y: py };
          continue;
        }

        let station: Station | null = null;
        let initItemKey: string | null = null;

        // 根据地图字符创建不同类型的工作站
        switch (char) {
          case 'X':
            // 虚无，悬崖
            this.scene.stations.create(px, py, 'station_nothing').setDepth(DEPTH.STATION);
            continue;
          case '.': station = new CounterStation(this.scene, px, py, 'station_counter'); break;
          case 'a':
            station = new CounterStation(this.scene, px, py, 'station_counter');
            initItemKey = 'item_plate'; // 初始物品为盘子
            break;
          case 'B': station = new CrateStation(this.scene, px, py, 'station_crate', 'item_tomato'); break;
          case 'C': station = new CuttingStation(this.scene, px, py, 'station_cut'); break;
          case 'S': station = new PotStation(this.scene, px, py, 'station_pot'); break;
          case 'K': station = new SinkStation(this.scene, px, py, 'station_sink'); break;
          case 'D': station = new DeliveryStation(this.scene, px, py, 'station_delivery'); break;
          case 'd': // 脏盘子生成点
            station = new DirtyPlateStation(this.scene, px, py, 'station_dirty_spawn');
            break;
          case 'T': station = new TrashStation(this.scene, px, py, 'station_trash'); break;
        }

        if (station) {
          this.stations.push(station); // 将工作站添加到列表中
          if (initItemKey) {
            // 原始逻辑中，会设置物品的 homeStation 为工作站的精灵。
            const item = this.scene.itemMgr.spawnItemWorld(initItemKey, px, py, station.getSprite());
            station.placeItem(item); // 将物品放置在工作站上
          }
        }
      }
    }
  }

  // 根据类型获取工作站列表
  getStationsByType(type: string): Station[] {
    return this.stations.filter(s => s.type === type);
  }

  // 根据坐标获取工作站
  getStationAt(x: number, y: number): Station | undefined {
    return this.stations.find(s => s.x === x && s.y === y);
  }

  // 每帧更新所有工作站状态
  update(delta: number) {
    this.stations.forEach(s => s.update(delta));
  }
}
