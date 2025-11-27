import * as Phaser from 'phaser';
import { LEVEL_MAP, TILE_SIZE, WORLD_H, WORLD_W, DEPTH } from '../config';

// 导入所有工作站类型
import { Station } from '../stations/Station';
import { CounterStation } from '../stations/CounterStation';
import { IngredientStation } from '../stations/IngredientStation';
import { CutStation } from '../stations/CuttingStation';
import { PotStation } from '../stations/PotStation';
import { SinkStation } from '../stations/SinkStation';
import { DeliveryStation } from '../stations/DeliveryStation';
import { TrashStation } from '../stations/TrashStation';
import { DirtyPlateStation } from '../stations/DirtyPlateStation';
import { Player } from '../objects/Player';
import playerManager from './PlayerManager';
import itemManager from './ItemManager';
import { Tomato } from '../objects/Tomato';


const stations: Station[] = []
let stationGroup: Phaser.Physics.Arcade.StaticGroup | null; // 静态工作站组

const init = (scene: Phaser.Scene) => {
  stationGroup = scene.physics.add.staticGroup({ classType: Phaser.Physics.Arcade.Sprite })
}

const createStation = (scene: Phaser.Scene, char: string, px: number, py: number) => {
  let station: Station | null = null;
  let initItemKey: string | null = null;

  // 根据地图字符创建不同类型的工作站
  switch (char) {
    // case 'X':
    //   // 虚无，悬崖
    //   stationGroup?.create(px, py, 'station_nothing').setDepth(DEPTH.STATION);
    //   continue;
    case '.':
      // textureKey = 'station_counter';
      station = new CounterStation(scene, px, py);
      break;
    case 'a':
      // textureKey = 'station_counter';
      station = new CounterStation(scene, px, py);
      initItemKey = 'item_plate'; // 初始物品为盘子
      break;
    case 'B':
      // textureKey = 'station_counter';
      station = new IngredientStation(scene, px, py, Tomato);
      break;
    case 'C': station = new CutStation(scene, px, py); break;
    case 'S': station = new PotStation(scene, px, py); break;
    case 'K': station = new SinkStation(scene, px, py); break;
    case 'D': station = new DeliveryStation(scene, px, py); break;
    case 'd': // 脏盘子生成点
      station = new DirtyPlateStation(scene, px, py);
      break;
    case 'T': station = new TrashStation(scene, px, py); break;
    default:
      new Station(scene, px, py, 'station_nothing');
  }

  if (station) {
    stations.push(station); // 将工作站添加到列表中
    if (initItemKey) {
      // 原始逻辑中，会设置物品的 homeStation 为工作站的精灵。
      const item = itemManager.spawnItemWorld(scene, initItemKey, px, py, station.getSprite());
      station.placeItem(item); // 将物品放置在工作站上
    }
  }
}

// 根据 LEVEL_MAP 创建游戏地图和工作站
const createMap = (scene: Phaser.Scene) => {
  // 1. 地板
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      if (LEVEL_MAP[y][x] !== 'X') {
        scene.add.image(x * TILE_SIZE + 24, y * TILE_SIZE + 24, 'floor').setDepth(DEPTH.FLOOR);
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

      // 在玩家出生点创建角色
      if (char === '1') {
        const p1 = new Player(scene, 0, px, py, 0x4da6ff, {
          up: 'W', down: 'S', left: 'A', right: 'D', pick: 'E', work: 'R', throw: 'SPACE', dash: 'SHIFT'
        });

        playerManager.createPlayer(p1)
        continue;
      }
      if (char === '2') {
        const p2 = new Player(scene, 0, px, py, 0xff4444, {
          up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', pick: 'O', work: 'P', throw: 'L', dash: 'ENTER'
        });
        playerManager.createPlayer(p2);
        continue;
      }

      createStation(scene, char, px, py);
    }
  }
}

const getAllStations = () => {
  return stations;
}


const updateStations = (delta: number) => {
  stations.forEach(s => s.update(delta));
}


// 根据坐标获取工作站
const getStationAt: (x: number, y: number) => Station | undefined = (x, y) => {
  return stations.find(s => s.x === x && s.y === y);
}


// 根据类型获取工作站列表
const getStationsByType: (type: string) => Station[] = (type: string) => {
  return stations.filter(s => s.type === type);
}

export default {
  stations,
  init,
  createMap,
  getAllStations,
  updateStations,
  getStationAt,
  getStationsByType,
}
